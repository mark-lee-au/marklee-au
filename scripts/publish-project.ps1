param(
    [string]$Remote = 'origin',
    [string]$ProductionBranch = 'main',
    [switch]$SkipArchive
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$archiveScript = Join-Path $repoRoot 'scripts\export-project-context.ps1'

function Write-Step {
    param([string]$Message)
    Write-Host ''
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Invoke-Checked {
    param(
        [string]$Command,
        [string[]]$Arguments,
        [string]$FailureMessage
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw $FailureMessage
    }
}

function Get-GitText {
    param([string[]]$Arguments)

    $output = & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Arguments -join ' ')"
    }

    return (($output | Out-String).Trim())
}

try {
    Set-Location $repoRoot

    if (-not (Test-Path (Join-Path $repoRoot '.git'))) {
        throw 'This helper must run from the marklee.au repository root.'
    }

    if ($null -eq (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git was not found in PATH.'
    }

    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($null -eq $npmCommand) {
        $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
    }
    if ($null -eq $npmCommand) {
        throw 'npm was not found in PATH.'
    }

    $branch = Get-GitText @('branch', '--show-current')
    if ([string]::IsNullOrWhiteSpace($branch)) {
        throw 'The repository is in detached HEAD state. Switch to a branch before publishing.'
    }

    $headCommit = Get-GitText @('rev-parse', 'HEAD')

    Write-Host ''
    Write-Host 'marklee.au publish helper' -ForegroundColor Green
    Write-Host "Repository: $repoRoot"
    Write-Host "Branch:     $branch"
    Write-Host "Commit:     $headCommit"
    Write-Host "Target:     $Remote/$ProductionBranch"

    Write-Step 'Checking remote state'
    Invoke-Checked 'git' @('remote', 'get-url', $Remote) "Git remote '$Remote' does not exist."
    Invoke-Checked 'git' @('fetch', '--prune', $Remote) "Could not fetch '$Remote'. No commit or push was attempted."

    & git show-ref --verify --quiet "refs/remotes/$Remote/$ProductionBranch"
    if ($LASTEXITCODE -ne 0) {
        throw "Remote branch '$Remote/$ProductionBranch' was not found."
    }

    & git merge-base --is-ancestor "$Remote/$ProductionBranch" HEAD
    if ($LASTEXITCODE -ne 0) {
        throw "The current branch is not based on the latest $Remote/$ProductionBranch. Nothing was committed or pushed. Integrate the latest production branch first, then run this helper again."
    }

    & git show-ref --verify --quiet "refs/heads/$ProductionBranch"
    $localProductionExists = ($LASTEXITCODE -eq 0)

    if ($branch -ne $ProductionBranch -and $localProductionExists) {
        & git merge-base --is-ancestor $ProductionBranch HEAD
        if ($LASTEXITCODE -ne 0) {
            throw "Local '$ProductionBranch' contains history that is not in '$branch'. Nothing was committed or pushed. Review the branches manually before publishing."
        }
    }

    Write-Step 'Current working tree'
    & git status --short --branch
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read Git status.'
    }

    $workingChanges = @(git status --porcelain=v1)
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read the working tree changes.'
    }
    $hasWorkingChanges = ($workingChanges.Count -gt 0)

    $commitMessage = $null
    if ($hasWorkingChanges) {
        $defaultCommitMessage = 'Publish current project checkpoint'
        $enteredMessage = Read-Host "Commit message [$defaultCommitMessage]"
        if ([string]::IsNullOrWhiteSpace($enteredMessage)) {
            $commitMessage = $defaultCommitMessage
        }
        else {
            $commitMessage = $enteredMessage.Trim()
        }
    }
    else {
        Write-Host ''
        Write-Host 'Working tree is clean. No new commit is needed.' -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host 'This will:'
    if ($hasWorkingChanges) {
        Write-Host '  1. Archive the current local project state when the archive helper is installed.'
        Write-Host '  2. Run npm run build and Git whitespace checks.'
        Write-Host '  3. Stage ALL current non-ignored project changes and commit them.'
        Write-Host "  4. Fast-forward '$ProductionBranch' to this branch."
        Write-Host "  5. Push '$Remote/$ProductionBranch'."
    }
    else {
        Write-Host '  1. Archive the current local project state when the archive helper is installed.'
        Write-Host '  2. Run npm run build.'
        Write-Host "  3. Fast-forward '$ProductionBranch' to this branch if needed."
        Write-Host "  4. Push '$Remote/$ProductionBranch'."
    }

    $confirmation = Read-Host 'Publish this current project state? [y/N]'
    if ($confirmation -notmatch '^(?i:y|yes)$') {
        Write-Host ''
        Write-Host 'Cancelled. Nothing was committed or pushed.' -ForegroundColor Yellow
        return
    }

    if (-not $SkipArchive) {
        Write-Step 'Creating safety archive'
        if (Test-Path -LiteralPath $archiveScript -PathType Leaf) {
            & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $archiveScript
            if ($LASTEXITCODE -ne 0) {
                throw 'The safety archive failed. Nothing was committed or pushed.'
            }
        }
        else {
            Write-Warning 'Archive helper not found. Continuing without a new archive.'
        }
    }

    Write-Step 'Building site'
    & $npmCommand.Source run build
    if ($LASTEXITCODE -ne 0) {
        throw 'npm run build failed. Nothing was committed or pushed.'
    }

    if ($hasWorkingChanges) {
        Write-Step 'Staging and checking changes'
        Invoke-Checked 'git' @('add', '-A') 'git add failed. Nothing was committed or pushed.'

        & git diff --cached --check
        if ($LASTEXITCODE -ne 0) {
            throw 'Git found whitespace errors in the staged changes. Nothing was committed or pushed.'
        }

        & git status --short
        if ($LASTEXITCODE -ne 0) {
            throw 'Could not display the staged changes.'
        }

        Write-Step 'Creating commit'
        Invoke-Checked 'git' @('commit', '-m', $commitMessage) 'Git commit failed. Nothing was pushed.'
    }

    $releaseCommit = Get-GitText @('rev-parse', 'HEAD')
    $sourceBranch = $branch

    Write-Step "Updating $ProductionBranch"
    if ($sourceBranch -ne $ProductionBranch) {
        if ($localProductionExists) {
            Invoke-Checked 'git' @('switch', $ProductionBranch) "Could not switch to '$ProductionBranch'. Your source commit is safe on '$sourceBranch'."
        }
        else {
            Invoke-Checked 'git' @('switch', '-c', $ProductionBranch, '--track', "$Remote/$ProductionBranch") "Could not create local '$ProductionBranch'. Your source commit is safe on '$sourceBranch'."
        }

        try {
            Invoke-Checked 'git' @('merge', '--ff-only', "$Remote/$ProductionBranch") "Local '$ProductionBranch' could not fast-forward to '$Remote/$ProductionBranch'."
            Invoke-Checked 'git' @('merge', '--ff-only', $sourceBranch) "'$ProductionBranch' could not fast-forward to '$sourceBranch'."
        }
        catch {
            Write-Warning "Publication stopped before push. The commit remains safe on '$sourceBranch'."
            & git switch $sourceBranch | Out-Null
            throw
        }
    }

    Write-Step 'Pushing production branch'
    & git push $Remote $ProductionBranch
    if ($LASTEXITCODE -ne 0) {
        throw "Push failed. No force push was attempted. Your commit is safe locally at $releaseCommit. The remote may have changed since the initial fetch."
    }

    Write-Step 'Verifying GitHub branch'
    & git fetch $Remote $ProductionBranch
    if ($LASTEXITCODE -eq 0) {
        $localProductionCommit = Get-GitText @('rev-parse', $ProductionBranch)
        $remoteProductionCommit = Get-GitText @('rev-parse', "$Remote/$ProductionBranch")

        if ($localProductionCommit -ne $remoteProductionCommit) {
            throw "Push completed, but local '$ProductionBranch' and '$Remote/$ProductionBranch' do not match after verification. Check GitHub before making further changes."
        }
    }
    else {
        Write-Warning 'Push succeeded, but the final fetch used for verification failed. Check GitHub manually.'
    }

    Write-Host ''
    Write-Host 'PUBLISH COMPLETE' -ForegroundColor Green
    Write-Host "Commit: $releaseCommit"
    Write-Host "Branch: $ProductionBranch"
    Write-Host "Remote: $Remote/$ProductionBranch"
    Write-Host ''
    Write-Host 'The Git production branch is updated. The existing Cloudflare integration should deploy from main.'
    Write-Host 'Verify the deployment, then check:'
    Write-Host '  https://marklee.au/'
    Write-Host '  https://marklee.au/games/'
    Write-Host '  https://marklee.au/projects/ascend/'
    Write-Host '  https://marklee.au/projects/formula-daily/'
    Write-Host ''
    Write-Host "You are now on local branch '$ProductionBranch'."
}
catch {
    Write-Host ''
    Write-Host 'PUBLISH STOPPED' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ''
    Write-Host 'Review the message above. The helper never force-pushes.'
    return
}

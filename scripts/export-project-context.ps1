param(
    [string]$OutputPath,
    [string]$ArchiveDirectory
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (-not (Test-Path (Join-Path $repoRoot '.git'))) {
    throw "This script must run from the marklee.au repository."
}

Push-Location $repoRoot
try {
    $branch = (git branch --show-current).Trim()
    $commit = (git rev-parse HEAD).Trim()
    $shortCommit = (git rev-parse --short=8 HEAD).Trim()
    $statusLines = @(git status --short)
    $repoFiles = @(git ls-files --cached --others --exclude-standard)

    if ($LASTEXITCODE -ne 0) {
        throw "Git could not read the repository state."
    }
}
finally {
    Pop-Location
}

if ([string]::IsNullOrWhiteSpace($branch)) {
    $branch = 'detached-head'
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    if ([string]::IsNullOrWhiteSpace($ArchiveDirectory)) {
        $repoParent = Split-Path $repoRoot -Parent
        $ArchiveDirectory = Join-Path $repoParent 'marklee-au-archives'
    }

    $safeBranch = $branch -replace '[\\/:*?"<>|]', '-'
    $safeBranch = $safeBranch -replace '-+', '-'
    $timestamp = [DateTime]::Now.ToString('yyyyMMdd-HHmmss-fff')
    $state = if ($statusLines.Count -eq 0) { 'clean' } else { 'dirty' }
    $fileName = "marklee-au-context-$timestamp-$safeBranch-$shortCommit-$state.zip"
    $OutputPath = Join-Path $ArchiveDirectory $fileName
}

$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path $outputFullPath -Parent
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("marklee-context-" + [guid]::NewGuid().ToString('N'))
$stagingPath = Join-Path $tempRoot 'context'

try {
    New-Item -ItemType Directory -Path $stagingPath -Force | Out-Null

    $repoFiles = $repoFiles | Where-Object {
        $path = $_ -replace '\\', '/'

        $isExcludedDirectory = $path -match '(^|/)(node_modules|\.git|\.astro|dist|\.wrangler|coverage|\.cache|\.parcel-cache|\.turbo|tmp|temp|marklee-au-archives)(/|$)'
        $isSecret = $path -match '(^|/)(\.env($|\.)|\.dev\.vars($|\.))'
        $isArchive = $path -match '\.(zip|7z|rar|tar|gz)$'
        $isNoise = $path -match '(^|/)(Thumbs\.db|\.DS_Store)$'
        $isGeneratedSnapshot = $path -eq '_PROJECT_SNAPSHOT.md'
        $isLocalData = ($path -match '^data/(raw|processed)/') -and ($path -notmatch '^data/(raw|processed)/README\.md$')

        $path -and
        -not $isExcludedDirectory -and
        -not $isSecret -and
        -not $isArchive -and
        -not $isNoise -and
        -not $isGeneratedSnapshot -and
        -not $isLocalData
    }

    foreach ($relativePath in $repoFiles) {
        $sourcePath = Join-Path $repoRoot $relativePath
        if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
            continue
        }

        $destinationPath = Join-Path $stagingPath $relativePath
        $destinationDirectory = Split-Path $destinationPath -Parent
        New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
    }

    $statusText = if ($statusLines.Count -eq 0) {
        'Clean'
    }
    else {
        $statusLines -join [Environment]::NewLine
    }

    $snapshotLines = @(
        '# Project Context Snapshot',
        '',
        "Created local: $([DateTime]::Now.ToString('yyyy-MM-ddTHH:mm:ssK'))",
        '',
        "Created UTC: $([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))",
        '',
        "Branch: $branch",
        '',
        "Commit: $commit",
        '',
        '## Working tree',
        '',
        '```text',
        $statusText,
        '```',
        '',
        'This archive is a read context for ChatGPT. Do not extract it over the repository.',
        'It includes tracked files plus relevant untracked files from the current working tree.',
        'It excludes Git history, dependencies, generated output, local raw/intermediate data, archives and common environment-secret files.'
    )

    Set-Content -LiteralPath (Join-Path $stagingPath '_PROJECT_SNAPSHOT.md') -Value $snapshotLines -Encoding utf8

    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

    if (Test-Path -LiteralPath $outputFullPath) {
        throw "Archive already exists: $outputFullPath"
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $stagingPath,
        $outputFullPath,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $false
    )

    Write-Host ""
    Write-Host "Created project archive:"
    Write-Host "  $outputFullPath"
    Write-Host ""
    Write-Host "Branch:  $branch"
    Write-Host "Commit:  $commit"
    Write-Host "State:   $(if ($statusLines.Count -eq 0) { 'clean' } else { 'dirty' })"
    Write-Host "Files:   $($repoFiles.Count + 1)"
}
finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}

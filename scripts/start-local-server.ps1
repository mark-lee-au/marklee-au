Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Stop-WithMessage {
    param([Parameter(Mandatory = $true)][string]$Message)

    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to close" | Out-Null
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "package.json"))) {
    Stop-WithMessage "package.json was not found. Keep this launcher inside the marklee-au repository."
}

$npm = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
if (-not $npm) {
    Stop-WithMessage "npm.cmd was not found. Install or repair Node.js, then run the launcher again."
}

$astroExecutable = Join-Path $repoRoot "node_modules\.bin\astro.cmd"
if (-not (Test-Path -LiteralPath $astroExecutable)) {
    Write-Host "Project dependencies are missing. Running npm ci once..." -ForegroundColor Yellow
    & $npm.Source ci
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "npm ci failed with exit code $LASTEXITCODE."
    }
}

Write-Host ""
Write-Host "marklee.au local development server" -ForegroundColor Cyan
Write-Host "Repository: $repoRoot"
Write-Host ""
Write-Host "Your default browser will open automatically."
Write-Host "Keep this window open while you work. Press Ctrl+C here to stop the server."
Write-Host ""

& $npm.Source run dev -- --open

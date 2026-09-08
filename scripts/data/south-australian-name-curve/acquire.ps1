param(
  [string]$Destination = "data/raw/south-australian-name-curve"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../../..")
$target = Join-Path $repoRoot $Destination
$manifestPath = Join-Path $PSScriptRoot "source-manifest.json"
$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json

New-Item -ItemType Directory -Force -Path $target | Out-Null

$catalogueUrl = "https://data.sa.gov.au/data/api/3/action/package_show?id=$($manifest.datasetId)"
$cataloguePath = Join-Path $target "catalogue.json"
Invoke-RestMethod -Uri $catalogueUrl | Select-Object -ExpandProperty result |
  ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $cataloguePath -Encoding utf8

foreach ($resource in $manifest.resources) {
  $filename, $url, $expectedSha = $resource
  $path = Join-Path $target $filename
  Invoke-WebRequest -Uri $url -OutFile $path
  $actualSha = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualSha -ne $expectedSha) {
    throw "SHA-256 mismatch for $filename. Expected $expectedSha but received $actualSha."
  }
  Write-Host "Verified $filename"
}

$zipPath = Join-Path $target "26-baby-names-1944-2013.zip"
$historicalPath = Join-Path $target "historical"
New-Item -ItemType Directory -Force -Path $historicalPath | Out-Null
Expand-Archive -LiteralPath $zipPath -DestinationPath $historicalPath -Force
Write-Host "Raw snapshot ready at $target"

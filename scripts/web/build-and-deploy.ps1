param(
  [switch]$Force,
  [switch]$SkipGit,
  [switch]$NoPush,
  [switch]$Push,
  [string]$CommitMessage = "fix: automated build sync"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

$logDir = Join-Path $projectRoot "scripts/build-scripts/logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$pushEnabled = $true
if ($NoPush) { $pushEnabled = $false }
if ($SkipGit) { $pushEnabled = $false }
if ($Push) { $pushEnabled = $true }

if (-not $Force) {
  Write-Host "================================================" -ForegroundColor Cyan
  Write-Host "  FracturedEarth - Build and Deploy" -ForegroundColor Cyan
  Write-Host "================================================" -ForegroundColor Cyan
  Write-Host "This script will:" -ForegroundColor Yellow
  Write-Host "- Run clean + verbose Gradle builds" -ForegroundColor Yellow
  Write-Host "- Build debug APK, release APK, and release AAB" -ForegroundColor Yellow
  Write-Host "- Save detailed logs to scripts/build-scripts/logs" -ForegroundColor Yellow
  Write-Host "- Commit changes" -ForegroundColor Yellow
  if ($pushEnabled) {
    Write-Host "- Push to origin/main" -ForegroundColor Yellow
  }
  else {
    Write-Host "- Skip push (local-safe mode)" -ForegroundColor Yellow
  }
  $confirm = Read-Host "Continue? (Y/N)"
  if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "[FRACTURED EARTH] Build cancelled by user."
    exit 0
  }
}

Write-Host "[FRACTURED EARTH] Build options: PUSH_ENABLED=$pushEnabled, COMMIT_MESSAGE='$CommitMessage'"
Write-Host "[FRACTURED EARTH] Logging to $logDir"

function Invoke-LoggedGradle {
  param(
    [string]$Task,
    [string]$Label,
    [string]$LogFile
  )

  Write-Host "[FRACTURED EARTH] $Label"
  & ./gradlew $Task --stacktrace --info --debug --warning-mode all 2>&1 | Tee-Object -FilePath (Join-Path $logDir $LogFile)
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle task failed: $Task"
  }
}

Invoke-LoggedGradle -Task "clean" -Label "Starting clean build..." -LogFile "clean.log"
Invoke-LoggedGradle -Task ":android-app:assembleDebug" -Label "Building debug APK..." -LogFile "assembleDebug.log"
Invoke-LoggedGradle -Task ":android-app:assembleRelease" -Label "Building release APK..." -LogFile "assembleRelease.log"
Invoke-LoggedGradle -Task ":android-app:bundleRelease" -Label "Building release AAB..." -LogFile "bundleRelease.log"

Write-Host "[FRACTURED EARTH] Staging git changes..."
& git add .
if ($LASTEXITCODE -ne 0) {
  throw "git add failed"
}

& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "[FRACTURED EARTH] No changes to commit."
}
else {
  Write-Host "[FRACTURED EARTH] Committing changes..."
  & git commit -m $CommitMessage
  if ($LASTEXITCODE -ne 0) {
    throw "git commit failed"
  }
}

if ($pushEnabled) {
  Write-Host "[FRACTURED EARTH] Pushing to origin/main using upstream mode (no force push)..."
  & git push -u origin main
  if ($LASTEXITCODE -ne 0) {
    throw "git push failed"
  }
}
else {
  Write-Host "[FRACTURED EARTH] SkipGit/NoPush mode enabled. Skipping git push."
}

Write-Host "[FRACTURED EARTH] Build workflow complete."

param(
  [switch]$NoPush,
  [switch]$Push,
  [string]$CommitMessage = "fix: automated build sync"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$logDir = Join-Path $projectRoot "build-scripts/logs"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$pushEnabled = $true
if ($NoPush) { $pushEnabled = $false }
if ($Push) { $pushEnabled = $true }

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
  Write-Host "[FRACTURED EARTH] Pushing to origin/main..."
  & git push -u origin main
  if ($LASTEXITCODE -ne 0) {
    throw "git push failed"
  }
}
else {
  Write-Host "[FRACTURED EARTH] -NoPush enabled. Skipping git push."
}

Write-Host "[FRACTURED EARTH] Build workflow complete."

param(
  [switch]$Force,
  [switch]$SkipGit,
  [switch]$NoPush,
  [switch]$Push,
  [switch]$VerboseBuild,
  [switch]$DebugBuild,
  [switch]$SkipVercelEnvSync,
  [string]$CommitMessage = "fix: automated build sync"
)

Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$ErrorActionPreference = "Stop"

function Write-Status {
  param(
    [string]$Message,
    [string]$Type = "INFO"
  )

  $color = switch ($Type) {
    "SUCCESS" { "Green" }
    "ERROR" { "Red" }
    "WARNING" { "Yellow" }
    "INFO" { "Cyan" }
    default { "White" }
  }

  Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Show-Step {
  param([string]$Title)
  Write-Host ""
  Write-Host "================================================" -ForegroundColor Cyan
  Write-Host "  $Title" -ForegroundColor Cyan
  Write-Host "================================================" -ForegroundColor Cyan
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

$buildOutputDir = Join-Path $projectRoot "build"
$backupDir = Join-Path $buildOutputDir "backup"
$logDir = Join-Path $buildOutputDir "logs"
New-Item -ItemType Directory -Path $buildOutputDir -Force | Out-Null
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

$pushEnabled = $true
if ($NoPush) { $pushEnabled = $false }
if ($SkipGit) { $pushEnabled = $false }
if ($Push) { $pushEnabled = $true }

if (-not $Force) {
  Write-Host "================================================" -ForegroundColor Cyan
  Write-Host "  FracturedEarth - Build and Deploy" -ForegroundColor Cyan
  Write-Host "================================================" -ForegroundColor Cyan
  Write-Host "This script will:" -ForegroundColor Yellow
  Write-Host "- Build debug APK, release APK, and release AAB" -ForegroundColor Yellow
  Write-Host "- Copy artifacts to build/ at repo root" -ForegroundColor Yellow
  Write-Host "- Backup previous artifacts in build/backup" -ForegroundColor Yellow
  Write-Host "- Save organized logs in build/logs" -ForegroundColor Yellow
  Write-Host "- Commit and push (unless SkipGit/NoPush)" -ForegroundColor Yellow
  $confirm = Read-Host "Continue? (Y/N)"
  if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Status "Build cancelled by user." "WARNING"
    exit 0
  }
}

Write-Status "Build started at $timestamp" "INFO"
Write-Status "Root directory: $projectRoot" "INFO"
Write-Status "Artifacts directory: $buildOutputDir" "INFO"

function Sync-VercelRedisEnv {
  if ($SkipVercelEnvSync) {
    Write-Status "SkipVercelEnvSync enabled. Not syncing Vercel env vars." "INFO"
    return
  }

  if (-not $env:REDIS_URL) {
    Write-Status "REDIS_URL not set in local environment. Skipping Vercel env sync." "WARNING"
    return
  }

  $vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
  if (-not $vercelCmd) {
    Write-Status "Vercel CLI not found. Skipping env sync." "WARNING"
    return
  }

  Show-Step "STEP 1: VERCEL ENV SYNC"
  Write-Status "Syncing REDIS_URL to Vercel development/preview/production" "INFO"

  foreach ($target in @("development", "preview", "production")) {
    & vercel env rm REDIS_URL $target --yes *> $null
    if ($LASTEXITCODE -ne 0) {
      $LASTEXITCODE = 0
    }

    $env:REDIS_URL | vercel env add REDIS_URL $target *> $null
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to set REDIS_URL for Vercel environment: $target"
    }

    Write-Status "REDIS_URL synced for: $target" "SUCCESS"
  }
}

function Invoke-LoggedGradle {
  param(
    [string]$Task,
    [string]$Label,
    [string]$LogFile,
    [string[]]$Args
  )

  Write-Status $Label "INFO"
  $logPath = Join-Path $logDir $LogFile
  Write-Status "Task: $Task" "INFO"
  Write-Status "Log file: $logPath" "INFO"

  & ./gradlew $Task @Args 2>&1 | Tee-Object -FilePath $logPath
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle task failed: $Task"
  }
}

function Assert-Artifact {
  param(
    [string]$Path,
    [string]$Label
  )

  if (-not (Test-Path $Path)) {
    throw "Expected artifact missing: $Label at $Path"
  }

  $item = Get-Item $Path
  $sizeMB = [Math]::Round($item.Length / 1MB, 2)
  Write-Status "$Label ready: $Path ($sizeMB MB)" "SUCCESS"
}

function Backup-AndCopyArtifact {
  param(
    [string]$Source,
    [string]$OutputName,
    [string]$Label
  )

  $destination = Join-Path $buildOutputDir $OutputName
  if (Test-Path $destination) {
    $backupName = "{0}-{1}{2}" -f [IO.Path]::GetFileNameWithoutExtension($OutputName), $timestamp, [IO.Path]::GetExtension($OutputName)
    $backupPath = Join-Path $backupDir $backupName
    Copy-Item $destination $backupPath -Force
    Write-Status "Backed up previous $Label to $backupPath" "INFO"
  }

  Copy-Item $Source $destination -Force
  Write-Status "Copied $Label to $destination" "SUCCESS"
}

Sync-VercelRedisEnv

$gradleArgs = @("--stacktrace", "--warning-mode", "summary", "--console", "plain")
if ($DebugBuild) {
  $gradleArgs += "--debug"
  Write-Status "Debug mode enabled. Use only for local troubleshooting; logs can expose sensitive details." "WARNING"
}
elseif ($VerboseBuild) {
  $gradleArgs += "--info"
}

Write-Status "Gradle log mode: $(if ($DebugBuild) { 'DEBUG' } elseif ($VerboseBuild) { 'INFO' } else { 'SUMMARY' })" "INFO"

Show-Step "STEP 2: GRADLE BUILDS"
Invoke-LoggedGradle -Task "clean" -Label "Cleaning Gradle project..." -LogFile "clean.log" -Args $gradleArgs
Invoke-LoggedGradle -Task ":android-app:assembleDebug" -Label "Building debug APK..." -LogFile "assembleDebug.log" -Args $gradleArgs
Invoke-LoggedGradle -Task ":android-app:assembleRelease" -Label "Building release APK..." -LogFile "assembleRelease.log" -Args $gradleArgs
Invoke-LoggedGradle -Task ":android-app:bundleRelease" -Label "Building release AAB..." -LogFile "bundleRelease.log" -Args $gradleArgs

$debugApk = Join-Path $projectRoot "android-app/build/outputs/apk/debug/android-app-debug.apk"
$releaseApk = Join-Path $projectRoot "android-app/build/outputs/apk/release/android-app-release-unsigned.apk"
$releaseAab = Join-Path $projectRoot "android-app/build/outputs/bundle/release/android-app-release.aab"

Show-Step "STEP 3: VERIFYING ARTIFACTS"
Assert-Artifact -Path $debugApk -Label "Debug APK"
Assert-Artifact -Path $releaseApk -Label "Release APK"
Assert-Artifact -Path $releaseAab -Label "Release AAB"

Show-Step "STEP 4: COPYING TO REPO BUILD FOLDER"
Backup-AndCopyArtifact -Source $debugApk -OutputName "app-debug.apk" -Label "Debug APK"
Backup-AndCopyArtifact -Source $releaseApk -OutputName "app-release-unsigned.apk" -Label "Release APK"
Backup-AndCopyArtifact -Source $releaseAab -OutputName "app-release.aab" -Label "Release AAB"

$buildInfoPath = Join-Path $buildOutputDir "build-info.txt"
$buildInfo = @"
Build Information
================
Build Date: $timestamp
Output Directory: $buildOutputDir

Generated Files:
- app-debug.apk
- app-release-unsigned.apk
- app-release.aab
"@
Set-Content -Path $buildInfoPath -Value $buildInfo -Encoding UTF8
Write-Status "Build info written to $buildInfoPath" "SUCCESS"

Show-Step "STEP 5: GIT"
Write-Status "Staging git changes..." "INFO"
& git add .
if ($LASTEXITCODE -ne 0) {
  throw "git add failed"
}

& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Status "No changes to commit." "INFO"
}
else {
  Write-Status "Committing changes..." "INFO"
  & git commit -m $CommitMessage
  if ($LASTEXITCODE -ne 0) {
    throw "git commit failed"
  }
}

if ($pushEnabled) {
  Write-Status "Pushing to origin/main (upstream mode, no force push)..." "INFO"
  & git push -u origin main
  if ($LASTEXITCODE -ne 0) {
    throw "git push failed"
  }
  Write-Status "Push completed." "SUCCESS"
}
else {
  Write-Status "SkipGit/NoPush mode enabled. Skipping git push." "INFO"
}

Show-Step "BUILD SUMMARY"
Write-Status "Build completed successfully." "SUCCESS"
Write-Status "Artifacts available in: $buildOutputDir" "INFO"
Write-Status "  app-debug.apk" "INFO"
Write-Status "  app-release-unsigned.apk" "INFO"
Write-Status "  app-release.aab" "INFO"
Write-Status "Backup folder: $backupDir" "INFO"
Write-Status "Logs folder: $logDir" "INFO"

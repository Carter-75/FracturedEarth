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
  Write-Host "  FracturedEarth - Unified Build & Deploy" -ForegroundColor Cyan
  Write-Host "================================================" -ForegroundColor Cyan
  Write-Host "This script will:" -ForegroundColor Yellow
  Write-Host "0. Increment Android versionCode" -ForegroundColor Yellow
  Write-Host "1. Build Web Frontend (npm run build)" -ForegroundColor Yellow
  Write-Host "2. Build Android (Debug APK, Release APK, AAB)" -ForegroundColor Yellow
  Write-Host "3. Backup and Verify Artifacts" -ForegroundColor Yellow
  Write-Host "4. Commit and Push to Native Hub" -ForegroundColor Yellow
  $confirm = Read-Host "Continue? (Y/N)"
  if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Status "Build cancelled by user." "WARNING"
    exit 0
  }
}

function Update-VersionCode {
  Show-Step "STEP 0: VERSION INCREMENT"
  $gradleFile = Join-Path $projectRoot "android-app/build.gradle.kts"
  if (Test-Path $gradleFile) {
    $content = Get-Content $gradleFile -Raw
    if ($content -match "versionCode\s*=\s*(\d+)") {
      $currentVersion = [int]$matches[1]
      $newVersion = $currentVersion + 1
      $newContent = $content -replace "versionCode\s*=\s*\d+", "versionCode = $newVersion"
      Set-Content -Path $gradleFile -Value $newContent -Encoding UTF8
      Write-Status "Incremented versionCode: $currentVersion -> $newVersion" "SUCCESS"
    } else {
      Write-Status "Could not find versionCode in build.gradle.kts" "WARNING"
    }
  }
}

function Invoke-WebBuild {
  Show-Step "STEP 1: WEB FRONTEND BUILD"
  $webDir = Join-Path $projectRoot "src"
  Push-Location $webDir
  try {
    Write-Status "Running npm run build in $webDir..." "INFO"
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed" }
    Write-Status "Web build completed." "SUCCESS"
  } finally {
    Pop-Location
  }
}

function Sync-VercelEnv {
  Show-Step "STEP 1.5: VERCEL CONFIG SYNC"
  $vercelFile = Join-Path $projectRoot "vercel.json"
  if (Test-Path $vercelFile) {
    $config = Get-Content $vercelFile | ConvertFrom-Json
    if ($config.env.NEXT_PUBLIC_SITE_URL) {
      $env:LAN_ROOM_SERVER_URL = $config.env.NEXT_PUBLIC_SITE_URL
      Write-Status "Synced LAN_ROOM_SERVER_URL from vercel.json: $env:LAN_ROOM_SERVER_URL" "SUCCESS"
    }
  }
}

function Invoke-LoggedGradle {
  param([string]$Task, [string]$Label, [string]$LogFile, [string[]]$TaskArgs)
  Write-Status $Label "INFO"
  $logPath = Join-Path $logDir $LogFile
  & ./gradlew $Task @TaskArgs 2>&1 | Tee-Object -FilePath $logPath
  if ($LASTEXITCODE -ne 0) { throw "Gradle task failed: $Task" }
}

function Assert-Artifact {
  param([string]$Path, [string]$Label)
  if (-not (Test-Path $Path)) { throw "Missing artifact: $Label" }
  Write-Status "$Label ready: $Path" "SUCCESS"
}

function Backup-AndCopyArtifact {
  param([string]$Source, [string]$OutputName, [string]$Label)
  $destination = Join-Path $buildOutputDir $OutputName
  if (Test-Path $destination) {
    $backupPath = Join-Path $backupDir ("{0}-{1}{2}" -f [IO.Path]::GetFileNameWithoutExtension($OutputName), $timestamp, [IO.Path]::GetExtension($OutputName))
    Copy-Item $destination $backupPath -Force
  }
  Copy-Item $Source $destination -Force
}

# --- Execution ---
Update-VersionCode
Invoke-WebBuild
Sync-VercelEnv

$gradleArgs = @("--stacktrace", "--warning-mode", "summary", "--console", "plain")
if ($DebugBuild) { $gradleArgs += "--debug" }
elseif ($VerboseBuild) { $gradleArgs += "--info" }

Show-Step "STEP 2: GRADLE BUILDS"
Invoke-LoggedGradle -Task "clean" -Label "Cleaning..." -LogFile "clean.log" -Args $gradleArgs
Invoke-LoggedGradle -Task ":android-app:assembleDebug" -Label "Debug APK..." -LogFile "assembleDebug.log" -Args $gradleArgs
Invoke-LoggedGradle -Task ":android-app:assembleRelease" -Label "Release APK..." -LogFile "assembleRelease.log" -Args $gradleArgs
Invoke-LoggedGradle -Task ":android-app:bundleRelease" -Label "Release Bundle..." -LogFile "bundleRelease.log" -Args $gradleArgs

$debugApk = Get-ChildItem "android-app/build/outputs/apk/debug/*.apk" | Select-Object -First 1 -ExpandProperty FullName
$releaseApk = Get-ChildItem "android-app/build/outputs/apk/release/*.apk" | Select-Object -First 1 -ExpandProperty FullName
$releaseAab = Get-ChildItem "android-app/build/outputs/bundle/release/*.aab" | Select-Object -First 1 -ExpandProperty FullName

Show-Step "STEP 3: VERIFYING & COLLECTING"
Assert-Artifact $debugApk "Debug APK"
Assert-Artifact $releaseApk "Release APK"
Assert-Artifact $releaseAab "Release Bundle"

Backup-AndCopyArtifact $debugApk "app-debug.apk" "Debug APK"
Backup-AndCopyArtifact $releaseApk "app-release.apk" "Release APK"
Backup-AndCopyArtifact $releaseAab "app-release.aab" "Release Bundle"

Show-Step "STEP 4: GIT SYNC"
& git add .
& git commit -m "$CommitMessage [Build $timestamp]"
if ($pushEnabled) {
    & git push origin main
    Write-Status "Native sync completed." "SUCCESS"
}

Write-Status "UNIFIED BUILD COMPLETE" "SUCCESS"

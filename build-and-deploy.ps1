param(
  [switch]$Force,
  [switch]$SkipMigration,
  [switch]$SkipVercel,
  [switch]$SkipBuild,
  [switch]$SkipGit,
  [switch]$DebugBuild,
  [string]$CommitMessage = "feat: automated monorepo sync",
  [string]$Branch = "main"
)

Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
$ErrorActionPreference = "Stop"

# --- SECURE SENSITIVE CONFIGS ---
$MONGODB_URI = $env:MONGODB_URI
if (-not $MONGODB_URI) {
    $envFile = "$PSScriptRoot\apps\next-api\.env.local"
    if (Test-Path $envFile) {
        $msg = "Loading MONGODB_URI from local .env.local..."
        Write-Host "[$msg]" -ForegroundColor Gray
        $line = Get-Content $envFile | Select-String "MONGODB_URI=" | Select-Object -First 1
        if ($line) {
            $MONGODB_URI = ($line -split "MONGODB_URI=")[1].Trim().Trim('"').Trim("'")
        }
    }
}

if (-not $MONGODB_URI) {
    Write-Host "[ERROR] MONGODB_URI not found in Environment or apps/next-api/.env.local" -ForegroundColor Red
    Write-Host "Please set MONGODB_URI to continue." -ForegroundColor Red
    exit 1
}

function Write-Status {
  param([string]$Message, [string]$Type = "INFO")
  $color = switch ($Type) { "SUCCESS" {"Green"} "ERROR" {"Red"} "WARNING" {"Yellow"} default {"Cyan"} }
  Write-Host "[$Type] $Message" -ForegroundColor $color
}

function Show-Step {
  param([string]$Title)
  Write-Host "`n================================================" -ForegroundColor Cyan
  Write-Host "  $Title" -ForegroundColor Cyan
  Write-Host "================================================" -ForegroundColor Cyan
}

$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# --- STEP 0: VERCEL ENV CONFIG ---
if (-not $SkipVercel) {
  Show-Step "STEP 0: VERCEL ENVIRONMENT CONFIG"
  Write-Status "Setting MONGODB_URI on Vercel..." "INFO"
  Set-Location "apps/next-api"
  & vercel env add MONGODB_URI production --value "$MONGODB_URI" --force
  Set-Location $projectRoot
  Write-Status "Vercel environment updated." "SUCCESS"
}

# --- STEP 1: MONGODB MIGRATION ---
if (-not $SkipMigration) {
  Show-Step "STEP 1: DATABASE MIGRATION"
  Write-Status "Running Card Migration (JSON -> Atlas)..." "INFO"
  Set-Location "apps/next-api"
  & npx tsx scripts/migrate-cards.ts
  if ($LASTEXITCODE -ne 0) { throw "Migration failed" }
  Set-Location $projectRoot
  Write-Status "Database migration complete." "SUCCESS"
}

# --- STEP 1.5: AUTOMATIC VERSION INCREMENT ---
if (-not $SkipBuild) {
  Show-Step "STEP 1.5: INCREMENT VERSION CODE"
  $gradleFile = "$projectRoot\apps\angular-mobile\android\app\build.gradle"
  if (Test-Path $gradleFile) {
      $gradleContent = Get-Content $gradleFile
      $found = $false
      $newContent = $gradleContent | ForEach-Object {
          if ($_ -match 'versionCode\s+(\d+)') {
              $oldCode = [int]$matches[1]
              $newCode = $oldCode + 1
              $found = $true
              Write-Status "Incrementing versionCode: $oldCode -> $newCode" "INFO"
              $_ -replace "versionCode\s+\d+", "versionCode $newCode"
          } else {
              $_
          }
      }
      if ($found) {
          $newContent | Set-Content $gradleFile
          Write-Status "versionCode successfully updated in build.gradle." "SUCCESS"
      } else {
          Write-Status "versionCode not found in build.gradle." "WARNING"
      }
  } else {
      Write-Status "build.gradle not found at $gradleFile" "WARNING"
  }
}

# --- STEP 2: ANGULAR WEB BUILD ---
if (-not $SkipBuild) {
  Show-Step "STEP 2: ANGULAR CLIENT BUILD"
  Write-Status "Building Angular Mobile Client..." "INFO"
  Set-Location "apps/angular-mobile"
  & npm run build
  if ($LASTEXITCODE -ne 0) { throw "Angular build failed" }
  Set-Location $projectRoot
  Write-Status "Angular build complete." "SUCCESS"
}

# --- STEP 3: CAPACITOR SYNC & NATIVE BUILD ---
if (-not $SkipBuild) {
  Show-Step "STEP 3: CAPACITOR & ANDROID BUILD"
  Write-Status "Syncing assets to Android..." "INFO"
  Set-Location "apps/angular-mobile"
  & npx cap sync android
  if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }

  Write-Status "Building Android Binaries (Gradle)..." "INFO"
  Set-Location "android"
  $gradleArgs = @("assembleRelease", "bundleRelease", "--stacktrace")
  & ./gradlew @gradleArgs
  if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
  Set-Location $projectRoot
  Write-Status "Android artifacts generated." "SUCCESS"
}

Show-Step "FINAL: VERIFICATION"
$artifactsDir = Join-Path $projectRoot "build"
$backupDir = Join-Path $artifactsDir "backup"
if (-not (Test-Path $artifactsDir)) { New-Item -ItemType Directory -Path $artifactsDir }
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir }

# Backup existing files in the build folder
Get-ChildItem $artifactsDir -Include "*.apk", "*.aab" -File | ForEach-Object {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $newName = "$($_.BaseName)_$timestamp$($_.Extension)"
    Move-Item $_.FullName -Destination (Join-Path $backupDir $newName) -Force
    Write-Status "Archived existing artifact: $($_.Name) -> backup\$newName" "INFO"
}

# Find and move APK
$releaseApk = Get-ChildItem "apps/angular-mobile/android/app/build/outputs/apk/release/*.apk" | Select-Object -First 1
if ($releaseApk) {
    Move-Item $releaseApk.FullName -Destination $artifactsDir -Force
    Write-Status "Build Successful! Release APK moved to: build\$($releaseApk.Name)" "SUCCESS"
}

# Find and move AAB (Bundle)
$releaseAab = Get-ChildItem "apps/angular-mobile/android/app/build/outputs/bundle/release/*.aab" | Select-Object -First 1
if ($releaseAab) {
    Move-Item $releaseAab.FullName -Destination $artifactsDir -Force
    Write-Status "Build Successful! Release Bundle (AAB) moved to: build\$($releaseAab.Name)" "SUCCESS"
}

# --- STEP 4: GIT SYNCHRONIZATION ---
if (-not $SkipGit) {
    Show-Step "STEP 4: GIT SYNCHRONIZATION"
    Write-Status "Staging changes..." "INFO"
    & git add .
    if ($LASTEXITCODE -ne 0) { Write-Status "Git add failed" "WARNING" }

    Write-Status "Creating commit..." "INFO"
    $fullMessage = "$CommitMessage [Artifact VersionCode Sync]"
    & git commit -m "$fullMessage"
    if ($LASTEXITCODE -ne 0) { 
        Write-Status "Nothing to commit or commit failed." "WARNING" 
    } else {
        Write-Status "Pushing to origin $Branch..." "INFO"
        & git push origin $Branch
        if ($LASTEXITCODE -ne 0) { throw "Git push failed. Please check your credentials and connection." }
        Write-Status "Push successful." "SUCCESS"
    }
}

Write-Status "MEAN STACK UNIFIED DEPLOYMENT COMPLETE" "SUCCESS"

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
    $masterConfig = "$PSScriptRoot\local.properties"
    if (Test-Path $masterConfig) {
        $msg = "Loading sensitive configs from master local.properties..."
        Write-Host "[$msg]" -ForegroundColor Gray
        $cfg = Get-Content $masterConfig
        
        # Helper to extract value from properties
        function Get-Prop($key) {
            $line = $cfg | Select-String "$key=" | Select-Object -First 1
            if ($line) { return ($line -split "$key=")[1].Trim().Trim('"').Trim("'") }
            return $null
        }

        $MONGODB_URI = Get-Prop "MONGODB_URI"
        $ADMOB_APP_ID = Get-Prop "ADMOB_APP_ID"
        $REVENUECAT_PUBLIC_KEY = Get-Prop "REVENUECAT_PUBLIC_KEY"
        $REVENUECAT_ENTITLEMENT_ID = Get-Prop "REVENUECAT_ENTITLEMENT_ID"
        
        # New Ad IDs
        $ADMOB_BANNER_ID = Get-Prop "ADMOB_BANNER_ID"
        $ADMOB_INTERSTITIAL_ID = Get-Prop "ADMOB_INTERSTITIAL_ID"
        $ADSENSE_BANNER_ID = Get-Prop "ADSENSE_BANNER_ID"
        $ADSENSE_INTERSTITIAL_ID = Get-Prop "ADSENSE_INTERSTITIAL_ID"

        # Authentication & Webhooks
        $GOOGLE_CLIENT_ID = Get-Prop "GOOGLE_CLIENT_ID"
        $GOOGLE_CLIENT_SECRET = Get-Prop "GOOGLE_CLIENT_SECRET"
        $NEXTAUTH_SECRET = Get-Prop "NEXTAUTH_SECRET"
        $NEXTAUTH_URL = Get-Prop "NEXTAUTH_URL"
        $REVENUECAT_WEBHOOK_AUTH = Get-Prop "REVENUECAT_WEBHOOK_AUTH"
    }
}

if (-not $MONGODB_URI) {
    Write-Host "[ERROR] MONGODB_URI not found in Environment or local.properties" -ForegroundColor Red
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
}

$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# --- STEP 0: VERCEL ENV CONFIG ---
if (-not $SkipVercel) {
  Show-Step "STEP 0: VERCEL ENVIRONMENT CONFIG"
  Write-Status "Syncing Sensitive Keys to Vercel..." "INFO"
  Set-Location "apps/next-api"
  
  # Helper to set Vercel env
  function Set-VercelEnv($key, $val) {
      if ($val) {
          Write-Status "Setting $key on Vercel..." "INFO"
          & vercel env add $key production --value "$val" --force
      }
  }

  Set-VercelEnv "MONGODB_URI" $MONGODB_URI
  Set-VercelEnv "GOOGLE_CLIENT_ID" $GOOGLE_CLIENT_ID
  Set-VercelEnv "GOOGLE_CLIENT_SECRET" $GOOGLE_CLIENT_SECRET
  Set-VercelEnv "NEXTAUTH_SECRET" $NEXTAUTH_SECRET
  Set-VercelEnv "NEXTAUTH_URL" $NEXTAUTH_URL
  Set-VercelEnv "REVENUECAT_WEBHOOK_AUTH" $REVENUECAT_WEBHOOK_AUTH

  Set-Location $projectRoot
  Write-Status "Vercel environment synchronized." "SUCCESS"
}

# --- STEP 1: MONGODB MIGRATION ---
if (-not $SkipMigration) {
  Show-Step "STEP 1: DATABASE MIGRATION"
  Write-Status "Running Card Migration (JSON -> Atlas)..." "INFO"
  Set-Location "apps/next-api"
  $env:MONGODB_URI = $MONGODB_URI
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
      }
  }
}

# --- STEP 1.6: GENERATE ANGULAR CONFIG ---
if (-not $SkipBuild) {
  Show-Step "STEP 1.6: GENERATE ANGULAR CONFIG"
  Write-Status "Injecting sensitive keys into Angular..." "INFO"
  $configPath = "$projectRoot\apps\angular-mobile\src\app\config.ts"
  $configContent = @"
export const CONFIG = {
  revenueCat: {
    publicKey: '$REVENUECAT_PUBLIC_KEY',
    entitlementId: '$REVENUECAT_ENTITLEMENT_ID'
  },
  adMob: {
    bannerId: '$ADMOB_BANNER_ID',
    interstitialId: '$ADMOB_INTERSTITIAL_ID'
  },
  adSense: {
    bannerId: '$ADSENSE_BANNER_ID',
    interstitialId: '$ADSENSE_INTERSTITIAL_ID'
  }
};
"@
  $configContent | Set-Content $configPath
  Write-Status "config.ts updated at $configPath" "SUCCESS"
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
if (-not (Test-Path $artifactsDir)) { New-Item -ItemType Directory -Path $artifactsDir }

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
    & git add .
    & git commit -m "$CommitMessage [Artifact Sync]"
    & git push origin $Branch
}

Write-Status "MEAN STACK UNIFIED DEPLOYMENT COMPLETE" "SUCCESS"

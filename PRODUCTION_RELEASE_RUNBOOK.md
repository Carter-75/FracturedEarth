# Fractured Earth Production Release Runbook

This is the single source of truth for shipping a production Android build (ads + subscriptions + signing + deploy).

## 1) One-time setup

- Install Android SDK and JDK.
- Install Vercel CLI and login.
- Keep secrets local only (never commit real IDs/keys).

## 2) Required local files

### local.properties (The Absolute Master)
`local.properties` is the **single source of truth** for both Android and Web configurations. The `npm run build` command automatically synchronizes this file to:
- `src/.env.local` (for local web development)
- **Vercel Cloud** (automated environment variable mapping via CLI)

Required Keys for Android & Web:
- `ADMOB_APP_ID` / `ADMOB_APP_ID_RELEASE`
- `ADMOB_BANNER_AD_UNIT` / `ADMOB_BANNER_AD_UNIT_RELEASE`
- `ADMOB_INTERSTITIAL_AD_UNIT` / `ADMOB_INTERSTITIAL_AD_UNIT_RELEASE`
- `REVENUECAT_PUBLIC_KEY`
- `REDIS_URL` (Direct sync to Web)
- `GOOGLE_WEB_CLIENT_ID` (Mapped to `GOOGLE_CLIENT_ID`)
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL`

Notes:
- The `sync-config.js` script handles all mappings automatically.
- Running `npm run build` locally will attempt to push these values to Vercel so you don't have to use the web dashboard.

### keystore.properties
Create `keystore.properties` from `keystore.properties.example`.

Required keys:
- `storeFile`
- `storePassword`
- `keyAlias`
- `keyPassword`

Without this file, release artifacts may be produced without signing config.

## 3) RevenueCat dashboard requirements

- Add Android app in RevenueCat.
- Set Public SDK Key and place it in `REVENUECAT_PUBLIC_KEY`.
- Create entitlement with identifier matching `REVENUECAT_ADFREE_ENTITLEMENT` (recommended: `ad_free`).
- Create products:
  - `fracturedearth_adfree_monthly`
  - `fracturedearth_adfree_yearly`
  - `fracturedearth_adfree_lifetime`
- Add products to current offering so purchase screen can find them.

## 4) AdMob requirements

- Create Android app in AdMob.
- Set production values in `local.properties`:
  - `ADMOB_APP_ID_RELEASE`
  - `ADMOB_BANNER_AD_UNIT_RELEASE`
  - `ADMOB_INTERSTITIAL_AD_UNIT_RELEASE`
- Keep debug IDs as Google test IDs only.

- All required environment variables (Redis, Google, AdMob) are automatically synced from `local.properties` when you run `npm run build` locally.
- Ensure you have the Vercel CLI installed and are logged in for the cloud sync to succeed.

## 6) Build + artifact generation

Run from repo root:

```powershell
cd scripts/web
./build-and-deploy.ps1 -Force
```

Safe local-only build (no push):

```powershell
cd scripts/web
./build-and-deploy.ps1 -Force -NoPush -SkipVercelEnvSync
```

Expected output folder:
- `build/`

Expected artifact files in `build/`:
- `app-debug.apk`
- `app-release-unsigned.apk` (or signed release APK depending on signing output naming)
- `app-release.aab`

Logs:
- `build/logs/`

Backups of previous artifacts:
- `build/backup/`

## 7) Pre-release verification checklist

- [ ] Android debug build succeeds.
- [ ] Android release bundle task succeeds.
- [ ] `build/app-release.aab` exists.
- [ ] Subscription purchase flow works in internal testing.
- [ ] Restore purchases works.
- [ ] Ad-free entitlement hides banner/interstitial.
- [ ] Interstitial only appears at match boundary.
- [ ] Production ad units are used in release build.
- [ ] Keystore is configured and release signing is valid.
- [ ] Vercel production deploy is green.

## 8) Publish checklist

- [ ] Upload AAB to Play Console.
- [ ] Verify app signing/upload key setup.
- [ ] Configure subscription products in Play Console and activate.
- [ ] Confirm RevenueCat product mapping to Play products.
- [ ] Roll out to internal testing, then production.

## 9) Security checklist

- [ ] No raw secrets in git-tracked files.
- [ ] Rotate any key that was previously committed.
- [ ] Keep `local.properties` and `keystore.properties` out of source control.
- [ ] Avoid `-DebugBuild` except local troubleshooting.

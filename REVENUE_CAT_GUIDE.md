# RevenueCat Sync Guide - General Template

This guide covers every setting across Google Cloud, Google Play, and RevenueCat to ensure your subscription works perfectly for any Android app.

## 📋 Phase 1: Google Cloud Console (APIs & Security)
*   **Project**: Ensure you are in the correct Google Cloud Project.
*   **APIs**: Enable these three in the [API Library](https://console.cloud.google.com/apis/library):
    1.  `Google Play Android Developer API`
    2.  `Google Play Developer Reporting API`
    3.  `Cloud Pub/Sub API`
*   **Service Account Roles**: In [IAM & Admin](https://console.cloud.google.com/iam-admin/iam), ensure your RevenueCat Service Account has:
    *   `Pub/Sub Admin`
    *   `Monitoring Viewer`
    *   `Service Usage Consumer` (Required for API access)
*   **Pub/Sub Topic Permissions**: Go to your [Pub/Sub Topic](https://console.cloud.google.com/cloudpubsub/topic/list), click **Permissions**, and add `google-play-developer-notifications@system.gserviceaccount.com` as a **Pub/Sub Publisher**.

## 📋 Phase 2: Google Play Console (Linking)
*   **Permissions**: Link your service account email in [Users & Permissions](https://play.google.com/console/u/0/developers/users-and-permissions) with:
    *   `View app information`
    *   `View financial data`
    *   `Manage orders and subscriptions`

> [!IMPORTANT]
> Change the tab to **"Account permissions"** (next to "App permissions") and verify that `View financial data` is checked for the **entire account**.

*   **RTDN Notifications**: In **Monetization setup**, paste your Topic ID:
    `projects/[YOUR_PROJECT_ID]/topics/[YOUR_TOPIC_ID]`

## 📋 Phase 3: RevenueCat Dashboard
*   **Credentials**: Upload your latest JSON key file in **Project Settings > Google Play**.
*   **Validate**: Click the **"Validate"** button. All checks (Subscriptions, In-app products, RTDN) should turn **GREEN** ✅.

## 💻 Phase 4: Code Implementation (Capacitor/Ionic)
*   **API Key**: Use the Public API Key (starts with `goog_`) from RevenueCat dashboard.
*   **Identity**: Use `Purchases.logIn(uid)` to sync the user's login ID with their subscription.

---

## 🛠️ Troubleshooting "Authentication Error"
If RevenueCat shows a red "Authentication Error" or "Credentials need attention":
1.  **Re-generate Key**: Go to Google Cloud Service Accounts > Keys > Create New JSON Key.
2.  **Delete Old Key**: Delete the previous key in Google Cloud.
3.  **Clean Paste**: Upload the **NEW** JSON file to RevenueCat. This refreshes the OAuth tokens.
4.  **Wait**: It can take up to 36 hours for Google to propagate new permissions.

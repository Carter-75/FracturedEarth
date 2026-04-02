package com.fracturedearth.auth

import android.content.Context
import android.content.Intent
import com.fracturedearth.BuildConfig
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import timber.log.Timber

@Suppress("DEPRECATION")
class GoogleAuthManager(context: Context) {

    private val signInOptions = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).apply {
        if (BuildConfig.GOOGLE_WEB_CLIENT_ID.isNotBlank()) {
            requestIdToken(BuildConfig.GOOGLE_WEB_CLIENT_ID)
        } else {
            Timber.w("GOOGLE_WEB_CLIENT_ID is blank; requestIdToken skipped. Google login may not provide an ID token.")
        }
        requestEmail()
    }.build()

    private val client: GoogleSignInClient = GoogleSignIn.getClient(context, signInOptions)

    val currentAccount: GoogleSignInAccount?
        get() = GoogleSignIn.getLastSignedInAccount(client.applicationContext)

    fun signInIntent(): Intent = client.signInIntent

    fun handleSignInResult(task: Task<GoogleSignInAccount>): GoogleSignInAccount? {
        return try {
            task.getResult(ApiException::class.java)
        } catch (e: ApiException) {
            Timber.e(e, "Google Sign-In failed with status code: ${e.statusCode}")
            null
        }
    }

    fun signOut(onComplete: () -> Unit = {}) {
        client.signOut().addOnCompleteListener { onComplete() }
    }
}

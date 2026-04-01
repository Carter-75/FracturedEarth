package com.fracturedearth

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.badlogic.gdx.backends.android.AndroidFragmentApplication
import com.fracturedearth.auth.GoogleAuthManager
import com.fracturedearth.ui.AppRoot
import kotlinx.coroutines.flow.MutableStateFlow
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount

class MainActivity : FragmentActivity(), AndroidFragmentApplication.Callbacks {
    private lateinit var authManager: GoogleAuthManager
    private val currentUser = MutableStateFlow<GoogleSignInAccount?>(null)

    private val signInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        currentUser.value = authManager.handleSignInResult(task)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        authManager = GoogleAuthManager(this)
        currentUser.value = authManager.currentAccount

        enableEdgeToEdge()
        setContent {
            val userState = currentUser.collectAsStateWithLifecycle()
            AppRoot(
                currentUser = userState.value,
                onSignIn = { signInLauncher.launch(authManager.signInIntent()) },
                onSignOut = { 
                    authManager.signOut { currentUser.value = null }
                }
            )
        }
    }

    override fun exit() {
        // Required by AndroidFragmentApplication.Callbacks. We stay in Compose navigation.
    }
}

package com.fracturedearth

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.fragment.app.FragmentActivity
import com.badlogic.gdx.backends.android.AndroidFragmentApplication
import com.fracturedearth.ui.AppRoot

class MainActivity : FragmentActivity(), AndroidFragmentApplication.Callbacks {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppRoot()
        }
    }

    override fun exit() {
        // Required by AndroidFragmentApplication.Callbacks. We stay in Compose navigation.
    }
}

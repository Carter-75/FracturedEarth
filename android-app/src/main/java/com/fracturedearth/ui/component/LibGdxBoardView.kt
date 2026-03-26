package com.fracturedearth.ui.component

import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.commit
import com.fracturedearth.render.FracturedEarthBoardFragment

@Composable
fun LibGdxBoardView(modifier: Modifier = Modifier) {
    val context = LocalContext.current

    AndroidView(
        modifier = modifier,
        factory = {
            FrameLayout(it).apply {
                id = android.view.View.generateViewId()
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT,
                )

                val activity = context as? FragmentActivity
                if (activity != null && activity.supportFragmentManager.findFragmentByTag("fe_board") == null) {
                    activity.supportFragmentManager.commit {
                        replace(id, FracturedEarthBoardFragment(), "fe_board")
                    }
                }
            }
        },
    )

    DisposableEffect(Unit) {
        onDispose {
            val activity = context as? FragmentActivity
            val fragment = activity?.supportFragmentManager?.findFragmentByTag("fe_board")
            if (activity != null && fragment != null) {
                activity.supportFragmentManager.commit {
                    remove(fragment)
                }
            }
        }
    }
}

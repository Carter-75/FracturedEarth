package com.fracturedearth.render

import com.badlogic.gdx.backends.android.AndroidApplicationConfiguration
import com.badlogic.gdx.backends.android.AndroidFragmentApplication

class FracturedEarthBoardFragment : AndroidFragmentApplication() {
    override fun onCreateView(
        inflater: android.view.LayoutInflater,
        container: android.view.ViewGroup?,
        savedInstanceState: android.os.Bundle?,
    ): android.view.View {
        val config = AndroidApplicationConfiguration().apply {
            useImmersiveMode = false
            useCompass = false
            useAccelerometer = false
            useGyroscope = false
            useRotationVectorSensor = false
            numSamples = 2
        }
        return initializeForView(FracturedEarthBoardGame(), config)
    }
}

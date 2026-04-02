package com.fracturedearth.render

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.badlogic.gdx.backends.android.AndroidFragmentApplication
import com.badlogic.gdx.backends.android.AndroidApplicationConfiguration
import com.fracturedearth.core.model.GameState

class FracturedEarthBoardFragment : AndroidFragmentApplication() {
    private var game: FracturedEarthBoardGame? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val config = AndroidApplicationConfiguration().apply {
            useImmersiveMode = true
            useCompass = false
            useAccelerometer = false
            useGyroscope = false
            useRotationVectorSensor = false
            numSamples = 4
        }
        game = FracturedEarthBoardGame()
        return initializeForView(game, config)
    }

    fun updateState(state: GameState) {
        game?.updateState(state)
    }
}

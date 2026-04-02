package com.fracturedearth.render

import com.badlogic.gdx.Game
import com.fracturedearth.core.model.GameState

class FracturedEarthBoardGame : Game() {
    private var currentScreen: FracturedEarthBoardScreen? = null

    override fun create() {
        val screen = FracturedEarthBoardScreen()
        this.currentScreen = screen
        setScreen(screen)
    }

    fun updateState(state: GameState) {
        currentScreen?.updateState(state)
    }
}

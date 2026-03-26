package com.fracturedearth.render

import com.badlogic.gdx.Game

class FracturedEarthBoardGame : Game() {
    override fun create() {
        setScreen(FracturedEarthBoardScreen())
    }
}

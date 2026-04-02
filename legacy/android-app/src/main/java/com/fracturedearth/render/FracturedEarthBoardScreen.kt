package com.fracturedearth.render

import com.badlogic.gdx.Gdx
import com.badlogic.gdx.ScreenAdapter
import com.badlogic.gdx.graphics.Color
import com.badlogic.gdx.graphics.GL20
import com.badlogic.gdx.graphics.PerspectiveCamera
import com.badlogic.gdx.graphics.VertexAttributes
import com.badlogic.gdx.graphics.g3d.Environment
import com.badlogic.gdx.graphics.g3d.Material
import com.badlogic.gdx.graphics.g3d.Model
import com.badlogic.gdx.graphics.g3d.ModelBatch
import com.badlogic.gdx.graphics.g3d.ModelInstance
import com.badlogic.gdx.graphics.g3d.attributes.ColorAttribute
import com.badlogic.gdx.graphics.g3d.environment.DirectionalLight
import com.badlogic.gdx.graphics.g3d.utils.ModelBuilder
import kotlin.math.cos
import kotlin.math.sin

import com.fracturedearth.core.model.GameState

class FracturedEarthBoardScreen : ScreenAdapter() {
    private val batch = ModelBatch()
    private val camera = PerspectiveCamera(55f, Gdx.graphics.width.toFloat(), Gdx.graphics.height.toFloat())
    private val environment = Environment()
    private val modelBuilder = ModelBuilder()

    private lateinit var boardModel: Model
    private lateinit var cardModel: Model
    private val boardTiles = mutableListOf<ModelInstance>()
    private val cards = mutableListOf<ModelInstance>()

    private var t = 0f
    private var gameState: GameState? = null

    fun updateState(state: GameState) {
        this.gameState = state
        // We will refresh the board layout in the render loop if state changes significantly
    }

    override fun show() {
        camera.position.set(0f, 10.5f, 13.5f) // ~35 degree tilt framing
        camera.lookAt(0f, 0f, 0f)
        camera.near = 0.1f
        camera.far = 100f
        camera.update()

        environment.set(ColorAttribute(ColorAttribute.AmbientLight, 0.22f, 0.25f, 0.3f, 1f))
        environment.add(DirectionalLight().set(0.9f, 0.9f, 1f, -0.5f, -0.8f, -0.3f))

        boardModel = modelBuilder.createCylinder(
            2.4f,
            0.35f,
            2.4f,
            6,
            Material(ColorAttribute.createDiffuse(Color(0.13f, 0.17f, 0.23f, 1f))),
            (VertexAttributes.Usage.Position or VertexAttributes.Usage.Normal).toLong(),
        )

        cardModel = modelBuilder.createBox(
            1.2f,
            0.08f,
            1.6f,
            Material(ColorAttribute.createDiffuse(Color(0.2f, 0.28f, 0.36f, 1f))),
            (VertexAttributes.Usage.Position or VertexAttributes.Usage.Normal).toLong(),
        )

        // Island ring
        repeat(7) { i ->
            val angle = i * (360f / 7f)
            val rad = Math.toRadians(angle.toDouble())
            val x = (cos(rad) * 4.5).toFloat()
            val z = (sin(rad) * 4.5).toFloat()
            boardTiles += ModelInstance(boardModel).also { it.transform.setToTranslation(x, 0f, z) }
        }
        boardTiles += ModelInstance(boardModel).also { it.transform.setToTranslation(0f, -0.02f, 0f) }

        // Floating card planes
        repeat(5) { i ->
            val card = ModelInstance(cardModel)
            card.transform.setToTranslation(-3f + (i * 1.5f), 0.5f, 6f)
            cards += card
        }
    }

    override fun render(delta: Float) {
        t += delta

        val state = gameState
        if (state != null) {
            // Sync Tiles to Player Count
            if (boardTiles.size != state.players.size) {
                boardTiles.clear()
                state.players.forEachIndexed { i, _ ->
                    val angle = i * (360f / state.players.size.toFloat())
                    val rad = Math.toRadians(angle.toDouble())
                    val x = (com.badlogic.gdx.math.MathUtils.cos(rad.toFloat()) * 4.5f)
                    val z = (com.badlogic.gdx.math.MathUtils.sin(rad.toFloat()) * 4.5f)
                    boardTiles += ModelInstance(boardModel).also { it.transform.setToTranslation(x, 0f, z) }
                }
                // Center island
                boardTiles += ModelInstance(boardModel).also { it.transform.setToTranslation(0f, -0.02f, 0f) }
            }

            // Sync Cards to Draw Pile Size (Visual Stack up to 5)
            val visualDeckSize = minOf(5, state.drawPile.size)
            if (cards.size != visualDeckSize) {
                cards.clear()
                repeat(visualDeckSize) { i ->
                    cards += ModelInstance(cardModel).also {
                        it.transform.setToTranslation(-3f + (i * 1.5f), 0.5f, 6f)
                    }
                }
            }
        }

        Gdx.gl.glViewport(0, 0, Gdx.graphics.width, Gdx.graphics.height)
        Gdx.gl.glClearColor(0.04f, 0.06f, 0.09f, 1f)
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT or GL20.GL_DEPTH_BUFFER_BIT)

        // Subtle board motion
        boardTiles.forEachIndexed { i, tile ->
            val bob = sin((t * 1.3f) + i * 0.75f) * 0.03f
            val pos = com.badlogic.gdx.math.Vector3()
            tile.transform.getTranslation(pos)
            tile.transform.setToTranslation(pos.x, bob, pos.z)
        }

        // Float the deck
        cards.forEachIndexed { i, card ->
            val y = 0.48f + (sin((t * 2.0f) + i) * 0.03f)
            val offset = -3f + (i * 1.5f)
            card.transform.idt()
            card.transform.translate(offset, y, 6f)
            card.transform.rotate(0f, 1f, 0f, sin(t + i) * 5f)
        }

        batch.begin(camera)
        boardTiles.forEach { batch.render(it, environment) }
        cards.forEach { batch.render(it, environment) }
        batch.end()
    }

    override fun resize(width: Int, height: Int) {
        camera.viewportWidth = width.toFloat()
        camera.viewportHeight = height.toFloat()
        camera.update()
    }

    override fun dispose() {
        batch.dispose()
        boardModel.dispose()
        cardModel.dispose()
    }
}

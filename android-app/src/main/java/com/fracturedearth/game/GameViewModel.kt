package com.fracturedearth.game

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import com.fracturedearth.core.bot.BotStrategy
import com.fracturedearth.core.bot.CounterTraitStrategy
import com.fracturedearth.core.bot.RandomStrategy
import com.fracturedearth.core.bot.TargetLeaderStrategy
import com.fracturedearth.core.engine.GameEngine
import com.fracturedearth.core.model.Card
import com.fracturedearth.core.model.GameState
import com.fracturedearth.sync.SyncRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

enum class BotDifficulty { EASY, MEDIUM, HARD }

data class GameUiState(
    val round: Int = 1,
    val phaseLabel: String = "Normal Phase",
    val activePlayerLabel: String = "",
    val winnerLabel: String = "No winner yet",
    val cardsPlayedThisTurn: Int = 0,
    val humanHand: List<Card> = emptyList(),
    val humanTraits: List<Card> = emptyList(),
    val humanSurvivalPoints: Int = 0,
    val humanHealth: Int = 3,
    val isHumanTurn: Boolean = true,
    val playerSummaries: List<PlayerSummary> = emptyList(),
)

data class PlayerSummary(
    val id: String,
    val displayName: String,
    val survivalPoints: Int,
    val health: Int,
    val traitCount: Int,
    val handCount: Int,
    val isBot: Boolean,
)

class GameViewModel : ViewModel() {
    private val engine = GameEngine()
    private val syncRepo = SyncRepository()
    private val scope = CoroutineScope(Dispatchers.IO)
    private var gameState: GameState = engine.newMatch(humanName = "Player", botCount = 1)
    private var botStrategies: Map<String, BotStrategy> = emptyMap()
    private var cardsPlayedThisTurn = 0
    private var currentUserId: String = "anonymous"

    var uiState by mutableStateOf(gameState.toUi(cardsPlayedThisTurn))
        private set

    fun startMatch(userId: String = "anonymous", humanName: String, botCount: Int, difficulty: BotDifficulty = BotDifficulty.MEDIUM) {
        currentUserId = userId
        val clamped = botCount.coerceIn(1, 3)
        botStrategies = (0 until clamped).associate { i ->
            "bot_$i" to when (difficulty) {
                BotDifficulty.EASY   -> RandomStrategy()
                BotDifficulty.MEDIUM -> TargetLeaderStrategy()
                BotDifficulty.HARD   -> CounterTraitStrategy()
            }
        }
        gameState = engine.newMatch(humanName.ifBlank { "Player" }, clamped)
        cardsPlayedThisTurn = 0
        uiState = gameState.toUi(cardsPlayedThisTurn)
    }

    fun drawCard() {
        if (gameState.winnerId != null) return
        gameState = engine.drawForActivePlayer(gameState)
        uiState = gameState.toUi(cardsPlayedThisTurn)
    }

    fun playCard(card: Card, targetPlayerId: String? = null) {
        if (cardsPlayedThisTurn >= 3 || gameState.winnerId != null) return
        gameState = engine.playCard(gameState, card, targetPlayerId)
        cardsPlayedThisTurn++
        checkWinner()
        uiState = gameState.toUi(cardsPlayedThisTurn)
    }

    fun endTurn() {
        if (gameState.winnerId != null) return
        gameState = engine.advanceTurn(gameState)
        cardsPlayedThisTurn = 0
        executePendingBotTurns()
        uiState = gameState.toUi(cardsPlayedThisTurn)
    }

    /** Legacy single-action: draw + advance (used by the basic GameScreen button). */
    fun nextTurn() {
        if (gameState.winnerId != null) return
        gameState = engine.drawForActivePlayer(gameState)
        gameState = engine.advanceTurn(gameState)
        cardsPlayedThisTurn = 0
        checkWinner()
        executePendingBotTurns()
        uiState = gameState.toUi(cardsPlayedThisTurn)
    }

    fun reset() {
        gameState = engine.newMatch(humanName = "Player", botCount = 1)
        botStrategies = emptyMap()
        cardsPlayedThisTurn = 0
        uiState = gameState.toUi(cardsPlayedThisTurn)
    }

    private fun checkWinner() {
        val winner = engine.evaluateWinner(gameState)
        if (winner != null && gameState.winnerId == null) {
            gameState = gameState.copy(winnerId = winner)
            // Report result to Vercel
            val human = gameState.players.firstOrNull { !it.isBot }
            if (human != null) {
                scope.launch {
                    syncRepo.recordGameResult(
                        userId = currentUserId,
                        won = winner == human.id,
                        survivalPoints = human.survivalPoints
                    )
                }
            }
        }
    }

    private fun executePendingBotTurns() {
        while (gameState.winnerId == null) {
            val active = gameState.players[gameState.activePlayerIndex]
            if (!active.isBot) break
            val strategy = botStrategies[active.id] ?: RandomStrategy()
            gameState = engine.executeBotTurn(gameState, strategy)
            checkWinner()
        }
    }
}

private fun GameState.toUi(cardsPlayed: Int): GameUiState {
    val active = players[activePlayerIndex]
    val human = players.firstOrNull { !it.isBot }
    return GameUiState(
        round = round,
        phaseLabel = if (isGlobalDisasterPhase) "Global Disaster Phase" else "Normal Phase",
        activePlayerLabel = "Active: ${active.displayName}",
        winnerLabel = winnerId ?: "No winner yet",
        cardsPlayedThisTurn = cardsPlayed,
        humanHand = human?.hand ?: emptyList(),
        humanTraits = human?.traits ?: emptyList(),
        humanSurvivalPoints = human?.survivalPoints ?: 0,
        humanHealth = human?.health ?: 0,
        isHumanTurn = !active.isBot,
        playerSummaries = players.map {
            PlayerSummary(
                id = it.id,
                displayName = it.displayName,
                survivalPoints = it.survivalPoints,
                health = it.health,
                traitCount = it.traits.size,
                handCount = it.hand.size,
                isBot = it.isBot,
            )
        },
    )
}

package com.fracturedearth.core.engine

import com.fracturedearth.core.model.*
import kotlinx.serialization.json.*
import kotlin.random.Random

class GameEngine(
    private val random: Random = Random.Default,
) {
    private val INITIAL_HEALTH = 3
    private val WINNING_POINTS = 50
    private val MAX_HAND_SIZE = 7

    fun newMatch(humanName: String, botCount: Int): GameState {
        val clampedBots = botCount.coerceIn(1, 4)
        val deck = CardCatalog.starterDeck().shuffled(random)

        val players = mutableListOf<PlayerState>()
        players += PlayerState(
            id = "human_0",
            displayName = humanName,
            survivalPoints = 0,
            health = INITIAL_HEALTH,
            hand = deck.take(5),
            traits = emptyList(),
            powers = emptyList(),
            isBot = false,
        )

        repeat(clampedBots) { i ->
            val start = 5 + (i * 5)
            players += PlayerState(
                id = "bot_$i",
                displayName = "Bot ${i + 1}",
                survivalPoints = 0,
                health = INITIAL_HEALTH,
                hand = deck.drop(start).take(5),
                traits = emptyList(),
                powers = emptyList(),
                isBot = true,
            )
        }

        val usedCards = players.flatMap { it.hand }
        val drawPile = deck.filterNot { candidate -> usedCards.any { it.id == candidate.id } }

        return GameState(
            round = 1,
            activePlayerIndex = 0,
            players = players,
            drawPile = drawPile,
            discardPile = emptyList(),
            isGlobalDisasterPhase = false,
            winnerId = null,
        )
    }

    fun canPlayCard(state: GameState, card: Card): Boolean {
        val active = state.players[state.activePlayerIndex]
        if (active.hand.none { it.id == card.id }) return false

        // Mandatory Discard Cost check
        if (card.discardCost > 0 && active.hand.size - 1 < card.discardCost) return false

        return true
    }

    fun drawForActivePlayer(state: GameState): GameState {
        var drawPile = state.drawPile.toMutableList()
        var discardPile = state.discardPile.toMutableList()

        if (drawPile.isEmpty()) {
            if (discardPile.isEmpty()) return state
            drawPile = discardPile.shuffled(random).toMutableList()
            discardPile = mutableListOf()
        }

        val active = state.players[state.activePlayerIndex]
        
        // Trigger Check: PREVENT_OPPONENT_DRAW_1 or SKIP_NEXT_DRAW
        if (active.triggers.any { it.kind == "SKIP_NEXT_DRAW" || it.kind == "PREVENT_OPPONENT_DRAW_1" }) {
            val newTriggers = active.triggers.toMutableList()
            val toRemove = newTriggers.find { it.kind == "SKIP_NEXT_DRAW" || it.kind == "PREVENT_OPPONENT_DRAW_1" }
            newTriggers.remove(toRemove)
            val updated = active.copy(triggers = newTriggers)
            val players = state.players.toMutableList().also { it[state.activePlayerIndex] = updated }
            return state.copy(players = players)
        }

        val card = drawPile.removeAt(0)

        // TWIST and CATACLYSM are auto-played on draw in the full spec
        if (card.type == CardType.TWIST || card.type == CardType.CATACLYSM) {
            val postDraw = state.copy(drawPile = drawPile, discardPile = discardPile)
            return playCard(postDraw, card)
        }

        val updated = active.copy(hand = active.hand + card)
        val players = state.players.toMutableList().also { it[state.activePlayerIndex] = updated }
        return state.copy(players = players, drawPile = drawPile, discardPile = discardPile)
    }

    fun advanceTurn(state: GameState): GameState {
        val dir = state.turnDirection
        var nextIndex = (state.activePlayerIndex + dir + state.players.size) % state.players.size

        // SKIP_NEXT_TURN logic
        val nextP = state.players[nextIndex]
        if (nextP.triggers.any { it.kind == "SKIP_NEXT_TURN" }) {
            val newTriggers = nextP.triggers.filterNot { it.kind == "SKIP_NEXT_TURN" }
            val updatedNext = nextP.copy(triggers = newTriggers)
            val tempPlayers = state.players.toMutableList().also { it[nextIndex] = updatedNext }
            val tempState = state.copy(players = tempPlayers)
            nextIndex = (nextIndex + dir + state.players.size) % state.players.size
            return advanceTurn(tempState.copy(activePlayerIndex = nextIndex)) 
        }

        val wrapsRound = (dir == 1 && nextIndex == 0) || (dir == -1 && nextIndex == state.players.size - 1)
        val nextRound = if (wrapsRound) state.round + 1 else state.round
        
        // Process end-of-turn triggers for previous player
        val prevP = state.players[state.activePlayerIndex]
        var updatedPrev = prevP
        prevP.triggers.forEach { t ->
            updatedPrev = when (t.kind) {
                "LOSE_1_PT_PER_TURN_3" -> updatedPrev.copy(survivalPoints = (updatedPrev.survivalPoints - 1).coerceAtLeast(0))
                "LOSE_1_HEALTH_PER_TURN_2" -> updatedPrev.copy(health = (updatedPrev.health - 1).coerceAtLeast(0))
                "POINTS_PER_TURN_1" -> updatedPrev.copy(survivalPoints = updatedPrev.survivalPoints + 1)
                "HEAL_1_PER_TURN" -> updatedPrev.copy(health = (updatedPrev.health + 1).coerceAtMost(INITIAL_HEALTH))
                else -> updatedPrev
            }
        }
        // Duration cleanup
        updatedPrev = updatedPrev.copy(triggers = updatedPrev.triggers.filter { it.duration == "permanent" || it.duration == "round" })
        
        val players = state.players.toMutableList()
        players[state.activePlayerIndex] = updatedPrev

        return state.copy(
            players = players,
            activePlayerIndex = nextIndex,
            round = nextRound,
            isGlobalDisasterPhase = nextRound % 3 == 0 && wrapsRound,
            turnPile = emptyList()
        )
    }

    fun evaluateWinner(state: GameState): String? {
        val byScore = state.players.firstOrNull { it.survivalPoints >= WINNING_POINTS }?.id
        if (byScore != null) return byScore

        val alive = state.players.filter { it.health > 0 }
        return if (alive.size == 1) alive.first().id else null
    }

    fun playCard(state: GameState, card: Card, targetPlayerId: String? = null): GameState {
        if (!canPlayCard(state, card)) return state

        var current = state
        val activeIndex = current.activePlayerIndex
        val active = current.players[activeIndex]

        // 1. Mandatory Discard Cost
        if (card.discardCost > 0) {
            val toDiscard = active.hand.filter { it.id != card.id }.take(card.discardCost)
            val newHand = active.hand.filterNot { h -> toDiscard.any { it.id == h.id } || h.id == card.id }
            val updated = active.copy(hand = newHand)
            current = current.copy(
                players = current.players.toMutableList().also { it[activeIndex] = updated },
                discardPile = current.discardPile + toDiscard
            )
        } else {
            val newHand = active.hand.filterNot { it.id == card.id }
            val updated = active.copy(hand = newHand)
            current = current.copy(players = current.players.toMutableList().also { it[activeIndex] = updated })
        }

        // 2. Add to turn pile
        current = current.copy(turnPile = current.turnPile + card)

        // 3. Pinned vs Discarded
        val isPinned = card.type == CardType.POWER || card.type == CardType.ADAPT || card.type == CardType.ASCENDED
        if (isPinned) {
            val p = current.players[activeIndex]
            val updated = p.copy(powers = p.powers + card)
            current = current.copy(players = current.players.toMutableList().also { it[activeIndex] = updated })
        } else {
            current = current.copy(discardPile = current.discardPile + card)
        }

        // 4. Resolve Effects
        return resolveEffect(current, card, targetPlayerId)
    }

    private fun resolveEffect(state: GameState, card: Card, targetId: String?): GameState {
        val primitives = card.primitives ?: return state
        var current = state

        // Epicenter Scaling logic: If card is DISASTER/CATACLYSM and GLOBAL, penalized drawer more.
        val drawerID = current.players[current.activePlayerIndex].id
        
        fun getTargetIndices(targetStr: String): List<Int> {
            return when (targetStr) {
                "self" -> listOf(current.activePlayerIndex)
                "target_player", "target_opponent" -> {
                    val idx = current.players.indexOfFirst { it.id == targetId }
                    if (idx >= 0) listOf(idx) else emptyList()
                }
                "all" -> current.players.indices.toList()
                "all_opponents" -> current.players.indices.filter { it != current.activePlayerIndex }
                else -> emptyList()
            }
        }

        fun executeAtomic(type: String, params: JsonObject, targetIdx: Int) {
            val p = current.players[targetIdx]
            
            when (type) {
                "MODIFY_POINTS" -> {
                    var amt = params["amount"]?.jsonPrimitive?.int ?: 0
                    // Apply Epicenter Scaling: +1 penalty (more negative) to drawer
                    if (card.disasterKind == DisasterKind.GLOBAL && p.id == drawerID) {
                        if (amt < 0) amt -= 1 // Deal more point loss if applicable
                    }
                    val newPts = (p.survivalPoints + amt).coerceAtLeast(0)
                    val updated = p.copy(survivalPoints = newPts)
                    current = current.copy(players = current.players.toMutableList().also { it[targetIdx] = updated })
                }
                "MODIFY_HEALTH" -> {
                    var amt = params["amount"]?.jsonPrimitive?.int ?: 0
                    // Apply Epicenter Scaling: +1 penalty (more negative) to drawer
                    if (card.disasterKind == DisasterKind.GLOBAL && p.id == drawerID) {
                        if (amt < 0) amt -= 1
                    }
                    val newH = (p.health + amt).coerceIn(0, INITIAL_HEALTH)
                    val updated = p.copy(health = newH)
                    current = current.copy(players = current.players.toMutableList().also { it[targetIdx] = updated })
                }
                "DRAW_CARDS" -> {
                    val amt = params["amount"]?.jsonPrimitive?.int ?: 0
                    repeat(amt) {
                        // We must swap active player temporarily to use drawForActivePlayer
                        val oldIdx = current.activePlayerIndex
                        current = current.copy(activePlayerIndex = targetIdx)
                        current = drawForActivePlayer(current)
                        current = current.copy(activePlayerIndex = oldIdx)
                    }
                }
                "ADD_TRIGGER" -> {
                    val kind = params["triggerKind"]?.jsonPrimitive?.content ?: ""
                    val duration = params["duration"]?.jsonPrimitive?.content ?: "next_event"
                    val trigger = Trigger(
                        id = "trig_${random.nextInt()}",
                        kind = kind,
                        duration = duration,
                        sourceCardId = card.id
                    )
                    val updated = p.copy(triggers = p.triggers + trigger)
                    current = current.copy(players = current.players.toMutableList().also { it[targetIdx] = updated })
                }
                // Add more primitives as needed...
            }
        }

        primitives.forEach { element ->
            val prim = element.jsonObject
            val type = prim["type"]?.jsonPrimitive?.content ?: ""
            val params = prim["params"]?.jsonObject ?: buildJsonObject { }
            val targetStr = params["target"]?.jsonPrimitive?.content ?: "self"
            
            val targets = getTargetIndices(targetStr)
            targets.forEach { executeAtomic(type, params, it) }
        }

        return current
    }

    fun executeBotTurn(state: GameState, strategy: com.fracturedearth.core.bot.BotStrategy): GameState {
        var current = drawForActivePlayer(state)
        val botId = current.players[current.activePlayerIndex].id
        var cardsPlayed = 0
        while (cardsPlayed < 3 && current.winnerId == null) {
            val action = strategy.chooseAction(current, botId) ?: break
            current = playCard(current, action.card, action.targetPlayerId)
            cardsPlayed++
        }
        return advanceTurn(current)
    }
}

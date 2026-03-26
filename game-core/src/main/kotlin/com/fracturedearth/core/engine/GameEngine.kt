package com.fracturedearth.core.engine

import com.fracturedearth.core.model.Card
import com.fracturedearth.core.model.CardType
import com.fracturedearth.core.model.CardCatalog
import com.fracturedearth.core.model.DisasterKind
import com.fracturedearth.core.model.GameState
import com.fracturedearth.core.model.PlayerState
import com.fracturedearth.core.bot.BotStrategy
import kotlin.random.Random

class GameEngine(
    private val random: Random = Random.Default,
) {
    fun newMatch(humanName: String, botCount: Int): GameState {
        val clampedBots = botCount.coerceIn(1, 3)
        val deck = CardCatalog.starterDeck().shuffled(random)

        val players = mutableListOf<PlayerState>()
        players += PlayerState(
            id = "human_0",
            displayName = humanName,
            survivalPoints = 0,
            health = 3,
            hand = deck.take(5),
            traits = emptyList(),
            isBot = false,
        )

        repeat(clampedBots) { i ->
            val start = 5 + (i * 5)
            players += PlayerState(
                id = "bot_$i",
                displayName = "Bot ${i + 1}",
                survivalPoints = 0,
                health = 3,
                hand = deck.drop(start).take(5),
                traits = emptyList(),
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

    fun drawForActivePlayer(state: GameState): GameState {
        if (state.drawPile.isEmpty()) return state
        val active = state.players[state.activePlayerIndex]
        val card = state.drawPile.first()
        val updated = active.copy(hand = active.hand + card)
        val players = state.players.toMutableList().also { it[state.activePlayerIndex] = updated }
        return state.copy(players = players, drawPile = state.drawPile.drop(1))
    }

    fun advanceTurn(state: GameState): GameState {
        val nextIndex = (state.activePlayerIndex + 1) % state.players.size
        val wrapsRound = nextIndex == 0
        val nextRound = if (wrapsRound) state.round + 1 else state.round
        return state.copy(
            activePlayerIndex = nextIndex,
            round = nextRound,
            isGlobalDisasterPhase = nextRound % 3 == 0 && wrapsRound,
        )
    }

    fun evaluateWinner(state: GameState): String? {
        val byScore = state.players.firstOrNull { it.survivalPoints >= 50 }?.id
        if (byScore != null) return byScore

        val alive = state.players.filter { it.health > 0 }
        return if (alive.size == 1) alive.first().id else null
    }

    /**
     * Resolve a card played by the active player.
     * - SURVIVAL  → adds pointsDelta to active player's survivalPoints; optionally draws extra cards.
     * - DISASTER  → deals damage (pointsDelta, expected negative) to target(s); damage is blocked by
     *               matching TRAIT/ADAPT in the target's trait list (ADAPT is consumed on block).
     * - TRAIT     → adds card to active player's traits permanently.
     * - ADAPT     → adds card to active player's traits as a one-use disaster blocker.
     * - CHAOS     → active player gains pointsDelta survivalPoints; all other players lose 1 health.
     */
    fun playCard(state: GameState, card: Card, targetPlayerId: String? = null): GameState {
        val activeIndex = state.activePlayerIndex
        val active = state.players[activeIndex]
        val newHand = active.hand.filterNot { it.id == card.id }
        val newDiscard = state.discardPile + card

        return when (card.type) {
            CardType.SURVIVAL -> {
                val newPts = (active.survivalPoints + card.pointsDelta).coerceAtLeast(0)
                val updated = active.copy(hand = newHand, survivalPoints = newPts)
                val players = state.players.toMutableList().also { it[activeIndex] = updated }
                var next = state.copy(players = players, discardPile = newDiscard)
                repeat(card.drawCount) { next = drawForActivePlayer(next) }
                next
            }

            CardType.DISASTER -> {
                val updated = active.copy(hand = newHand)
                val players = state.players.toMutableList().also { it[activeIndex] = updated }
                val postPlay = state.copy(players = players, discardPile = newDiscard)
                val targets: List<PlayerState> = when {
                    card.disasterKind == DisasterKind.GLOBAL ->
                        postPlay.players.filterNot { it.id == active.id }
                    targetPlayerId != null ->
                        listOfNotNull(postPlay.players.firstOrNull { it.id == targetPlayerId })
                    else -> emptyList()
                }
                applyDisasterToTargets(postPlay, targets, card)
            }

            CardType.TRAIT -> {
                val updated = active.copy(hand = newHand, traits = active.traits + card)
                val players = state.players.toMutableList().also { it[activeIndex] = updated }
                state.copy(players = players, discardPile = newDiscard)
            }

            CardType.ADAPT -> {
                val updated = active.copy(hand = newHand, traits = active.traits + card)
                val players = state.players.toMutableList().also { it[activeIndex] = updated }
                state.copy(players = players, discardPile = newDiscard)
            }

            CardType.CHAOS -> {
                val newPts = (active.survivalPoints + card.pointsDelta).coerceAtLeast(0)
                val updatedActive = active.copy(hand = newHand, survivalPoints = newPts)
                val players = state.players.mapIndexed { i, p ->
                    if (i == activeIndex) updatedActive
                    else p.copy(health = (p.health - 1).coerceAtLeast(0))
                }
                state.copy(players = players, discardPile = newDiscard)
            }
        }
    }

    /** Execute a full bot turn: draw, play up to 3 cards via strategy, then advance turn. */
    fun executeBotTurn(state: GameState, strategy: BotStrategy): GameState {
        val bot = state.players[state.activePlayerIndex]
        check(bot.isBot) { "executeBotTurn called for non-bot player ${bot.id}" }
        var current = drawForActivePlayer(state)
        var cardsPlayed = 0
        while (cardsPlayed < 3 && current.winnerId == null) {
            val botNow = current.players.firstOrNull { it.id == bot.id } ?: break
            if (botNow.hand.isEmpty()) break
            val action = strategy.chooseAction(current, bot.id) ?: break
            if (!botNow.hand.any { it.id == action.card.id }) break
            current = playCard(current, action.card, action.targetPlayerId)
            cardsPlayed++
        }
        return advanceTurn(current)
    }

    private fun applyDisasterToTargets(
        state: GameState,
        targets: List<PlayerState>,
        disasterCard: Card,
    ): GameState {
        val kind = disasterCard.disasterKind ?: return state
        var current = state
        for (target in targets) {
            val idx = current.players.indexOfFirst { it.id == target.id }
            if (idx < 0) continue
            val t = current.players[idx]
            val blocker = t.traits.firstOrNull { it.blocksDisaster == kind }
            val updated = if (blocker != null) {
                // Consume ADAPT (one-use); TRAIT stays.
                val newTraits = if (blocker.type == CardType.ADAPT)
                    t.traits.filterNot { it.id == blocker.id }
                else
                    t.traits
                t.copy(traits = newTraits)
            } else {
                t.copy(health = (t.health + disasterCard.pointsDelta).coerceAtLeast(0))
            }
            val players = current.players.toMutableList().also { it[idx] = updated }
            current = current.copy(players = players)
        }
        return current
    }
}

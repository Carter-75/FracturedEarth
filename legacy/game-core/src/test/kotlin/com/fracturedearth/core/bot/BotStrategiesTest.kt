package com.fracturedearth.core.bot

import com.fracturedearth.core.engine.GameEngine
import com.fracturedearth.core.model.Card
import com.fracturedearth.core.model.CardType
import com.fracturedearth.core.model.DisasterKind
import com.fracturedearth.core.model.GameState
import com.fracturedearth.core.model.PlayerState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BotStrategiesTest {

    @Test
    fun randomStrategy_returnsPlayableCardAndOpponentTarget() {
        val botCard = card("bot_survival", CardType.SURVIVAL)
        val state = state(
            players = listOf(
                player("bot_0", isBot = true, hand = listOf(botCard)),
                player("human_0", isBot = false),
            ),
            activeIndex = 0,
        )

        val action = RandomStrategy(kotlin.random.Random(7)).chooseAction(state, "bot_0")

        assertNotNull(action)
        assertEquals(botCard.id, action!!.card.id)
        assertEquals("human_0", action.targetPlayerId)
    }

    @Test
    fun targetLeaderStrategy_targetsHighestSurvivalOpponent() {
        val state = state(
            players = listOf(
                player("bot_0", isBot = true, hand = listOf(card("c1", CardType.SURVIVAL))),
                player("p1", isBot = false, survival = 6),
                player("p2", isBot = false, survival = 12),
            ),
            activeIndex = 0,
        )

        val action = TargetLeaderStrategy().chooseAction(state, "bot_0")

        assertNotNull(action)
        assertEquals("p2", action!!.targetPlayerId)
    }

    @Test
    fun counterTraitStrategy_prefersDisasterAgainstTraitHeavyOpponent() {
        val disaster = card("disaster_1", CardType.DISASTER, kind = DisasterKind.PLAGUE)
        val state = state(
            players = listOf(
                player(
                    id = "bot_0",
                    isBot = true,
                    hand = listOf(disaster, card("fallback", CardType.SURVIVAL)),
                ),
                player("p1", isBot = false, traits = listOf(card("t1", CardType.ADAPT))),
                player(
                    "p2",
                    isBot = false,
                    traits = listOf(card("t2", CardType.ADAPT), card("t3", CardType.ADAPT)),
                ),
            ),
            activeIndex = 0,
        )

        val action = CounterTraitStrategy().chooseAction(state, "bot_0")

        assertNotNull(action)
        assertEquals(disaster.id, action!!.card.id)
        assertEquals("p2", action.targetPlayerId)
    }

    @Test
    fun executeBotTurn_advancesTurnAfterBotPlays() {
        val engine = GameEngine(kotlin.random.Random(3))
        val state = state(
            players = listOf(
                player("human_0", isBot = false),
                player("bot_0", isBot = true, hand = listOf(card("bot_play", CardType.SURVIVAL))),
            ),
            drawPile = listOf(card("draw_1", CardType.SURVIVAL)),
            activeIndex = 1,
        )

        val next = engine.executeBotTurn(state, TargetLeaderStrategy())

        assertEquals(0, next.activePlayerIndex)
        assertTrue(next.discardPile.any { it.id == "bot_play" })
    }

    private fun state(
        players: List<PlayerState>,
        drawPile: List<Card> = emptyList(),
        activeIndex: Int,
    ): GameState = GameState(
        round = 1,
        activePlayerIndex = activeIndex,
        players = players,
        drawPile = drawPile,
        discardPile = emptyList(),
        isGlobalDisasterPhase = false,
        winnerId = null,
    )

    private fun player(
        id: String,
        isBot: Boolean,
        hand: List<Card> = emptyList(),
        traits: List<Card> = emptyList(),
        survival: Int = 0,
    ): PlayerState = PlayerState(
        id = id,
        displayName = id,
        survivalPoints = survival,
        health = 3,
        hand = hand,
        traits = traits,
        powers = emptyList(),
        isBot = isBot,
    )

    private fun card(
        id: String,
        type: CardType,
        kind: DisasterKind? = null,
    ): Card = Card(
        id = id,
        name = id,
        type = type,
        pointsDelta = if (type == CardType.DISASTER) -1 else 1,
        disasterKind = kind,
    )
}

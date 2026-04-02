package com.fracturedearth.core.bot

import com.fracturedearth.core.model.Card
import com.fracturedearth.core.model.CardType
import com.fracturedearth.core.model.GameState
import kotlin.random.Random

data class BotAction(
    val card: Card,
    val targetPlayerId: String? = null,
)

interface BotStrategy {
    fun chooseAction(state: GameState, botPlayerId: String): BotAction?
}

class RandomStrategy(
    private val random: Random = Random.Default,
) : BotStrategy {
    override fun chooseAction(state: GameState, botPlayerId: String): BotAction? {
        val bot = state.players.firstOrNull { it.id == botPlayerId } ?: return null
        if (bot.hand.isEmpty()) return null

        val card = bot.hand[random.nextInt(bot.hand.size)]
        val target = state.players.filterNot { it.id == botPlayerId }.randomOrNull(random)
        return BotAction(card = card, targetPlayerId = target?.id)
    }
}

class TargetLeaderStrategy : BotStrategy {
    override fun chooseAction(state: GameState, botPlayerId: String): BotAction? {
        val bot = state.players.firstOrNull { it.id == botPlayerId } ?: return null
        val card = bot.hand.firstOrNull() ?: return null
        val leader = state.players
            .filterNot { it.id == botPlayerId }
            .maxByOrNull { it.survivalPoints }
        return BotAction(card = card, targetPlayerId = leader?.id)
    }
}

class CounterTraitStrategy : BotStrategy {
    override fun chooseAction(state: GameState, botPlayerId: String): BotAction? {
        val bot = state.players.firstOrNull { it.id == botPlayerId } ?: return null
        if (bot.hand.isEmpty()) return null

        val opponents = state.players.filterNot { it.id == botPlayerId }
        val traitHeavyOpponent = opponents.maxByOrNull { it.traits.size }

        val disasterCard = bot.hand.firstOrNull { it.type == CardType.DISASTER }
        return if (disasterCard != null && traitHeavyOpponent != null) {
            BotAction(card = disasterCard, targetPlayerId = traitHeavyOpponent.id)
        } else {
            val fallback = bot.hand.first()
            BotAction(card = fallback, targetPlayerId = opponents.firstOrNull()?.id)
        }
    }
}

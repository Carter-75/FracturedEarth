package com.fracturedearth.core.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
enum class CardType {
    SURVIVAL,
    DISASTER,
    POWER,
    ADAPT,
    CHAOS,
    ASCENDED,
    TWIST,
    CATACLYSM,
}

@Serializable
enum class DisasterKind {
    EARTHQUAKE,
    PLAGUE,
    FLOOD,
    WILDFIRE,
    GLOBAL,
}

@Serializable
data class Card(
    val id: String,
    val name: String,
    val type: CardType,
    val pointsDelta: Int = 0,
    val drawCount: Int = 0,
    val disasterKind: DisasterKind? = null,
    val blocksDisaster: DisasterKind? = null,
    val tier: Int? = null,
    val description: String? = null,
    val primitives: List<JsonElement>? = null,
    val discardCost: Int = 0,
)

@Serializable
data class Trigger(
    val id: String,
    val kind: String, // Triggers like 'NEGATE_NEXT_DISASTER', etc.
    val value: JsonElement? = null,
    val duration: String = "next_event", // "next_event", "turn", "round", "permanent"
    val sourceCardId: String? = null,
)

@Serializable
data class PlayerState(
    val id: String,
    val displayName: String,
    val survivalPoints: Int,
    val health: Int,
    val hand: List<Card>,
    val traits: List<Card>, // Permanent passive blockers
    val powers: List<Card>, // Pinned cards (e.g. ADAPT, POWER)
    val triggers: List<Trigger> = emptyList(),
    val isBot: Boolean,
)

@Serializable
data class GameState(
    val round: Int,
    val activePlayerIndex: Int,
    val players: List<PlayerState>,
    val drawPile: List<Card>,
    val discardPile: List<Card>,
    val turnPile: List<Card> = emptyList(),
    val isGlobalDisasterPhase: Boolean,
    val winnerId: String? = null,
    val turnDirection: Int = 1, // 1 or -1
)


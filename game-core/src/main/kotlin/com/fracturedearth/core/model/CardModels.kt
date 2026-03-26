package com.fracturedearth.core.model

enum class CardType {
    SURVIVAL,
    DISASTER,
    TRAIT,
    ADAPT,
    CHAOS,
}

enum class DisasterKind {
    EARTHQUAKE,
    PLAGUE,
    FLOOD,
    WILDFIRE,
    GLOBAL,
}

data class Card(
    val id: String,
    val name: String,
    val type: CardType,
    val pointsDelta: Int = 0,
    val drawCount: Int = 0,
    val disasterKind: DisasterKind? = null,
    val blocksDisaster: DisasterKind? = null,
)

data class PlayerState(
    val id: String,
    val displayName: String,
    val survivalPoints: Int,
    val health: Int,
    val hand: List<Card>,
    val traits: List<Card>,
    val isBot: Boolean,
)

data class GameState(
    val round: Int,
    val activePlayerIndex: Int,
    val players: List<PlayerState>,
    val drawPile: List<Card>,
    val discardPile: List<Card>,
    val isGlobalDisasterPhase: Boolean,
    val winnerId: String? = null,
)

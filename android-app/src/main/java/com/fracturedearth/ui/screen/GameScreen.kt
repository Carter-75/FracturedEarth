package com.fracturedearth.ui.screen

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.fracturedearth.BuildConfig
import com.fracturedearth.core.model.Card as GameCard
import com.fracturedearth.game.GameUiState
import com.fracturedearth.ui.component.BannerAdSlot
import com.fracturedearth.ui.component.FeButton
import com.fracturedearth.ui.component.LibGdxBoardView
import com.fracturedearth.ui.theme.Spacing
import kotlinx.coroutines.delay

@Composable
fun GameScreen(
    state: GameUiState,
    onOpenSettings: () -> Unit,
    onOpenMenu: () -> Unit,
    onFinish: () -> Unit,
    onNextTurn: () -> Unit,
    onDraw: () -> Unit,
    onPlayCard: (GameCard) -> Unit,
    showAds: Boolean,
) {
    val sectionsVisible = remember { mutableStateOf(false) }
    var selectedCard by remember { mutableStateOf<GameCard?>(null) }
    LaunchedEffect(Unit) {
        delay(90)
        sectionsVisible.value = true
    }

    val phaseColor by animateColorAsState(
        targetValue = if (state.phaseLabel.contains("Global")) {
            MaterialTheme.colorScheme.error
        } else {
            MaterialTheme.colorScheme.secondary
        },
        animationSpec = tween(300),
        label = "phase_color",
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surface,
                    )
                )
            )
            .padding(Spacing.x4),
        verticalArrangement = Arrangement.spacedBy(Spacing.x2),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.x2)) {
            FeButton(label = "Menu", onClick = onOpenMenu, modifier = Modifier.weight(1f))
            FeButton(label = "Settings", onClick = onOpenSettings, modifier = Modifier.weight(1f))
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        ) {
            Column(
                modifier = Modifier.padding(Spacing.x3),
                verticalArrangement = Arrangement.spacedBy(Spacing.x1),
            ) {
                Text("Round ${state.round}", style = MaterialTheme.typography.titleMedium)
                Text(state.activePlayerLabel, style = MaterialTheme.typography.bodyMedium)
                Text(state.phaseLabel, style = MaterialTheme.typography.bodyMedium, color = phaseColor)
                Text("Cards this turn: ${state.cardsPlayedThisTurn}/3", style = MaterialTheme.typography.bodySmall)
                Text("Winner: ${state.winnerLabel}", style = MaterialTheme.typography.bodySmall)
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.x2)) {
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            ) {
                Column(modifier = Modifier.padding(Spacing.x2)) {
                    Text("Survival", style = MaterialTheme.typography.labelMedium)
                    Text(state.humanSurvivalPoints.toString(), style = MaterialTheme.typography.titleMedium)
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            ) {
                Column(modifier = Modifier.padding(Spacing.x2)) {
                    Text("Health", style = MaterialTheme.typography.labelMedium)
                    Text(state.humanHealth.toString(), style = MaterialTheme.typography.titleMedium)
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            ) {
                Column(modifier = Modifier.padding(Spacing.x2)) {
                    Text("Traits", style = MaterialTheme.typography.labelMedium)
                    Text(state.humanTraits.size.toString(), style = MaterialTheme.typography.titleMedium)
                }
            }
        }

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(Spacing.x2),
                verticalArrangement = Arrangement.spacedBy(Spacing.x2),
            ) {
                OpponentHandsStrip(state = state)
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.background),
                ) {
                    LibGdxBoardView(modifier = Modifier.fillMaxSize())
                }
            }
        }

        Text("Your Hand", style = MaterialTheme.typography.titleMedium)
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(Spacing.x2),
            modifier = Modifier.fillMaxWidth(),
        ) {
            items(state.humanHand, key = { it.id }) { card ->
                val elevation by animateDpAsState(
                    targetValue = if (state.isHumanTurn) 6.dp else 1.dp,
                    label = "card_elevation",
                )
                UnoFaceUpCard(
                    card = card,
                    modifier = Modifier.width(138.dp),
                    elevation = elevation,
                    onClick = { selectedCard = card },
                )
            }
        }

        AnimatedVisibility(visible = sectionsVisible.value, enter = fadeIn()) {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.x1)) {
                Text("Traits", style = MaterialTheme.typography.titleMedium)
                if (state.humanTraits.isEmpty()) {
                    Text(
                        "No active traits yet",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                } else {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(Spacing.x1)) {
                        items(state.humanTraits, key = { it.id }) { trait ->
                            AssistChip(
                                onClick = { },
                                enabled = false,
                                label = { Text(trait.name) },
                            )
                        }
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.x2)) {
            FeButton(label = "Draw", onClick = onDraw, modifier = Modifier.weight(1f), enabled = state.isHumanTurn)
            FeButton(label = "End Turn", onClick = onNextTurn, modifier = Modifier.weight(1f), enabled = state.isHumanTurn)
            FeButton(label = "End Match", onClick = onFinish, modifier = Modifier.weight(1f))
        }

        AnimatedContent(targetState = showAds, label = "banner_visibility") { adsOn ->
            if (adsOn) {
                BannerAdSlot(adUnitId = BuildConfig.ADMOB_BANNER_AD_UNIT, enabled = true)
            } else {
                Spacer(modifier = Modifier.height(56.dp))
            }
        }

        selectedCard?.let { card ->
            CardDetailDialog(
                card = card,
                canPlay = state.isHumanTurn && state.cardsPlayedThisTurn < 3,
                onDismiss = { selectedCard = null },
                onPlay = {
                    onPlayCard(card)
                    selectedCard = null
                },
            )
        }
    }
}

@Composable
private fun OpponentHandsStrip(state: GameUiState) {
    val opponents = state.playerSummaries.filter { it.isBot }
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly,
    ) {
        opponents.forEach { player ->
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(player.displayName, style = MaterialTheme.typography.labelSmall)
                FaceDownCards(count = player.handCount)
                Text(
                    "${player.survivalPoints} pts / ${player.health} hp",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
        }
    }
}

@Composable
private fun FaceDownCards(count: Int) {
    val visible = count.coerceIn(1, 7)
    Box(
        modifier = Modifier
            .width((48 + (visible - 1) * 12).dp)
            .height(72.dp),
    ) {
        repeat(visible) { i ->
            Card(
                modifier = Modifier
                    .offset(x = (i * 12).dp)
                    .width(48.dp)
                    .height(70.dp),
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF15233A)),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .border(1.dp, Color(0xFF3E6CAA), RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("FE", style = MaterialTheme.typography.labelSmall, color = Color.White)
                }
            }
        }
    }
}

@Composable
private fun UnoFaceUpCard(
    card: GameCard,
    modifier: Modifier = Modifier,
    elevation: androidx.compose.ui.unit.Dp,
    onClick: () -> Unit,
) {
    val base = when (card.type.name) {
        "SURVIVAL" -> Color(0xFF2E7D32)
        "DISASTER" -> Color(0xFFC62828)
        "TRAIT" -> Color(0xFF1565C0)
        "ADAPT" -> Color(0xFFF9A825)
        else -> Color(0xFF6A1B9A)
    }
    Card(
        modifier = modifier
            .height(176.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = elevation),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        listOf(base, base.copy(alpha = 0.72f), Color(0xFF111111))
                    )
                )
                .border(1.dp, Color.White.copy(alpha = 0.22f), RoundedCornerShape(14.dp))
                .padding(10.dp),
        ) {
            Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.SpaceBetween) {
                Text(card.type.name, style = MaterialTheme.typography.labelSmall, color = Color.White)
                Text(
                    card.name,
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    if (card.pointsDelta != 0) "${if (card.pointsDelta > 0) "+" else ""}${card.pointsDelta}" else "Ability",
                    style = MaterialTheme.typography.headlineSmall,
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                )
            }
        }
    }
}

@Composable
private fun CardDetailDialog(
    card: GameCard,
    canPlay: Boolean,
    onDismiss: () -> Unit,
    onPlay: () -> Unit,
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(dismissOnClickOutside = true),
    ) {
        Card(
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        ) {
            Column(
                modifier = Modifier
                    .padding(Spacing.x3)
                    .width(280.dp),
                verticalArrangement = Arrangement.spacedBy(Spacing.x2),
            ) {
                UnoFaceUpCard(card = card, modifier = Modifier.fillMaxWidth(), elevation = 0.dp, onClick = { })
                Text(
                    "Tap Play to use this card, or tap outside to close.",
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.x2)) {
                    FeButton(label = "Close", onClick = onDismiss, modifier = Modifier.weight(1f))
                    FeButton(label = "Play", onClick = onPlay, modifier = Modifier.weight(1f), enabled = canPlay)
                }
            }
        }
    }
}

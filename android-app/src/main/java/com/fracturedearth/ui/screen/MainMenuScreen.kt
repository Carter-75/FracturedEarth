package com.fracturedearth.ui.screen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import com.fracturedearth.game.BotDifficulty
import com.fracturedearth.ui.component.FeButton
import com.fracturedearth.ui.theme.Spacing
import kotlinx.coroutines.delay

data class MatchConfig(
    val playerName: String,
    val botCount: Int,
    val difficulty: BotDifficulty,
)

@Composable
fun MainMenuScreen(
    onPlay: (MatchConfig) -> Unit,
    onSettings: () -> Unit,
    onExit: () -> Unit,
) {
    var visible by remember { mutableStateOf(false) }
    var playerName by remember { mutableStateOf("Player") }
    var botCount by remember { mutableIntStateOf(2) }
    var difficulty by remember { mutableStateOf(BotDifficulty.MEDIUM) }

    LaunchedEffect(Unit) {
        delay(120)
        visible = true
    }

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
            .padding(Spacing.x6),
        verticalArrangement = Arrangement.spacedBy(Spacing.x4, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        AnimatedVisibility(
            visible = visible,
            enter = fadeIn(tween(420)) + slideInVertically(tween(420), initialOffsetY = { -it / 3 }),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "FRACTURED EARTH",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Spacer(modifier = Modifier.height(Spacing.x1))
                Text(
                    text = "A Chaos Survival Card Game",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.secondary,
                )
            }
        }

        AnimatedVisibility(
            visible = visible,
            enter = fadeIn(tween(520)) + slideInVertically(tween(520), initialOffsetY = { it / 4 }),
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(Spacing.x4),
                    verticalArrangement = Arrangement.spacedBy(Spacing.x3),
                ) {
                    OutlinedTextField(
                        value = playerName,
                        onValueChange = { playerName = it },
                        label = { Text("Commander Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )

                    Text("Bots", style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.x2)) {
                        listOf(1, 2, 3).forEach { value ->
                            AssistChip(
                                onClick = { botCount = value },
                                label = { Text("$value") },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = if (botCount == value) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.background,
                                    labelColor = if (botCount == value) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onBackground,
                                ),
                            )
                        }
                    }

                    Text("Difficulty", style = MaterialTheme.typography.titleMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.x2)) {
                        BotDifficulty.entries.forEach { level ->
                            AssistChip(
                                onClick = { difficulty = level },
                                label = { Text(level.name) },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = if (difficulty == level) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.background,
                                    labelColor = if (difficulty == level) MaterialTheme.colorScheme.onBackground else MaterialTheme.colorScheme.onBackground,
                                ),
                            )
                        }
                    }
                }
            }
        }

        AnimatedVisibility(visible = visible, enter = fadeIn(tween(660))) {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.x2)) {
                FeButton(
                    label = "Play",
                    onClick = {
                        onPlay(
                            MatchConfig(
                                playerName = playerName,
                                botCount = botCount,
                                difficulty = difficulty,
                            )
                        )
                    },
                )
                FeButton(label = "Settings", onClick = onSettings)
                FeButton(label = "Exit", onClick = onExit)
            }
        }
    }
}

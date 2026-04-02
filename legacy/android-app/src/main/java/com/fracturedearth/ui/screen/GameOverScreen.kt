package com.fracturedearth.ui.screen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.fracturedearth.ui.component.FeButton
import com.fracturedearth.ui.theme.Spacing
import kotlinx.coroutines.delay

@Composable
fun GameOverScreen(
    winnerLabel: String,
    onPlayAgain: () -> Unit,
    onMainMenu: () -> Unit,
) {
    val visible = remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(100)
        visible.value = true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(Spacing.x6),
        verticalArrangement = Arrangement.spacedBy(Spacing.x2, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        AnimatedVisibility(
            visible = visible.value,
            enter = fadeIn() + slideInVertically(initialOffsetY = { -it / 4 }),
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(Spacing.x2),
            ) {
                Text("Game Over", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Text("Winner: $winnerLabel", style = MaterialTheme.typography.titleMedium)
            }
        }

        AnimatedVisibility(visible = visible.value, enter = fadeIn()) {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.x2)) {
                FeButton(label = "Play Again", onClick = onPlayAgain, modifier = Modifier.fillMaxWidth())
                FeButton(label = "Main Menu", onClick = onMainMenu, modifier = Modifier.fillMaxWidth())
            }
        }
    }
}

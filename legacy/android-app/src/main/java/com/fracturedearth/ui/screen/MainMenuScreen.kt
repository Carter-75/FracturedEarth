package com.fracturedearth.ui.screen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.width
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import coil.compose.AsyncImage
import com.fracturedearth.R
import com.fracturedearth.game.BotDifficulty
import com.fracturedearth.ui.component.FeButton
import com.fracturedearth.ui.theme.Spacing
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import kotlinx.coroutines.delay

data class MatchConfig(
    val playerName: String,
    val botCount: Int,
    val difficulty: BotDifficulty,
)


@Suppress("DEPRECATION")
@Composable
fun MainMenuScreen(
    currentUser: GoogleSignInAccount?,
    onSignIn: () -> Unit,
    onPlay: (MatchConfig) -> Unit,
    onGlobalMultiplayer: () -> Unit,
    onSettings: () -> Unit,
    onExit: () -> Unit,
) {
    var visible by remember { mutableStateOf(false) }
    var playerName by remember { mutableStateOf(currentUser?.displayName ?: "Commander") }
    var botCount by remember { mutableIntStateOf(2) }
    var difficulty by remember { mutableStateOf(BotDifficulty.MEDIUM) }

    LaunchedEffect(currentUser) {
        if (currentUser != null) {
            playerName = currentUser.displayName ?: "Commander"
        }
    }

    LaunchedEffect(Unit) {
        delay(120)
        visible = true
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Cinematic Background
        Image(
            painter = painterResource(id = R.drawable.bg_main),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // Subtle Overlay for readability
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color.Black.copy(alpha = 0.4f),
                            Color.Transparent,
                            Color.Black.copy(alpha = 0.6f),
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(Spacing.x6),
            verticalArrangement = Arrangement.spacedBy(Spacing.x4, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            AnimatedVisibility(
                visible = visible,
                enter = fadeIn(tween(600)) + slideInVertically(tween(600), initialOffsetY = { -it / 2 }),
            ) {
                // Cinematic Logo
                Image(
                    painter = painterResource(id = R.drawable.logo_main),
                    contentDescription = "Fractured Earth",
                    modifier = Modifier
                        .height(120.dp)
                        .fillMaxWidth(0.8f),
                    contentScale = ContentScale.Fit
                )
            }

            AnimatedVisibility(
                visible = visible,
                enter = fadeIn(tween(800)) + slideInVertically(tween(800), initialOffsetY = { it / 3 }),
            ) {
                // GLASSMORPHISM Match Config Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            width = 1.dp,
                            brush = Brush.verticalGradient(
                                listOf(
                                    Color.White.copy(alpha = 0.2f),
                                    Color.Transparent
                                )
                            ),
                            shape = RoundedCornerShape(24.dp)
                        ),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.85f)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(Spacing.x5),
                        verticalArrangement = Arrangement.spacedBy(Spacing.x3),
                    ) {
                        OutlinedTextField(
                            value = playerName,
                            onValueChange = { playerName = it },
                            label = { Text("COMMANDER NAME", fontWeight = FontWeight.Bold) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        Text("LOCAL SKIRMISH BOTS", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
                        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.x2)) {
                            listOf(1, 2, 3).forEach { value ->
                                AssistChip(
                                    onClick = { botCount = value },
                                    label = { Text("$value") },
                                    shape = CircleShape,
                                    colors = AssistChipDefaults.assistChipColors(
                                        containerColor = if (botCount == value) MaterialTheme.colorScheme.primary else Color.Transparent,
                                        labelColor = if (botCount == value) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onBackground,
                                    ),
                                )
                            }
                        }

                        Text("DIFFICULTY", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.secondary)
                        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.x2)) {
                            BotDifficulty.entries.forEach { level ->
                                AssistChip(
                                    onClick = { difficulty = level },
                                    label = { Text(level.name) },
                                    colors = AssistChipDefaults.assistChipColors(
                                        containerColor = if (difficulty == level) MaterialTheme.colorScheme.secondary else Color.Transparent,
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
                        label = "Local Play",
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
                    FeButton(
                        label = "Global Matchmaking",
                        onClick = onGlobalMultiplayer,
                        enabled = true // Always enabled, will trigger sign-in if needed
                    )
                    FeButton(label = "Settings", onClick = onSettings)
                    FeButton(label = "Exit", onClick = onExit)
                }
            }
        }

        // Profile HUD (Top Right)
        Row(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(Spacing.x6),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.x3)
        ) {
            if (currentUser != null) {
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = currentUser.displayName ?: "Commander",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "RANKED",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Black
                    )
                }
                
                AsyncImage(
                    model = currentUser.photoUrl,
                    contentDescription = "Profile",
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surface),
                    contentScale = ContentScale.Crop
                )
            } else {
                AssistChip(
                    onClick = onSignIn,
                    label = { Text("AUTHENTICATE") },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                        labelColor = MaterialTheme.colorScheme.primary
                    )
                )
            }
        }
    }
}

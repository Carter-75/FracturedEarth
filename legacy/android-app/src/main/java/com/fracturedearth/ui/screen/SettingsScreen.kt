package com.fracturedearth.ui.screen

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.fracturedearth.R
import com.fracturedearth.ui.component.FeButton
import com.fracturedearth.ui.theme.Spacing
import com.fracturedearth.ui.theme.ThemeOption
import com.fracturedearth.ui.theme.ThemePalette

@Composable
fun SettingsScreen(
    selectedTheme: ThemeOption,
    onThemeSelected: (ThemeOption) -> Unit,
    onSubscription: () -> Unit,
    onSignOut: () -> Unit,
    onBack: () -> Unit,
) {
    val themes = ThemeOption.entries

    Box(modifier = Modifier.fillMaxSize()) {
        // Cinematic Background
        Image(
            painter = painterResource(id = R.drawable.bg_main),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // Subtle Overlay
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color.Black.copy(alpha = 0.5f),
                            Color.Transparent,
                            Color.Black.copy(alpha = 0.8f),
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(Spacing.x4),
            verticalArrangement = Arrangement.spacedBy(Spacing.x2),
        ) {
            Text("SETTINGS", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = Color.White)
            
            // GLASSMORPHISM Stats Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp)),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
                ),
            ) {
                Column(modifier = Modifier.padding(Spacing.x4)) {
                    Text("THEME ENGINE", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        verticalArrangement = Arrangement.spacedBy(Spacing.x2),
                        horizontalArrangement = Arrangement.spacedBy(Spacing.x2),
                        modifier = Modifier.weight(1f),
                    ) {
                        items(themes) { option ->
                            val tokens = ThemePalette.all.getValue(option)
                            val isSelected = selectedTheme == option
                            
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(1.6f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(tokens.background)
                                    .border(
                                        width = if (isSelected) 2.dp else 1.dp,
                                        color = if (isSelected) tokens.primary else Color.White.copy(alpha = 0.1f),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .clickable { onThemeSelected(option) }
                                    .padding(8.dp)
                            ) {
                                Column {
                                    Text(
                                        text = option.name.replace("_", " "),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = tokens.textPrimary,
                                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(tokens.primary))
                                        Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(tokens.accent))
                                        Box(modifier = Modifier.size(16.dp).clip(CircleShape).background(tokens.cardSurface))
                                    }
                                }
                                
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = tokens.primary,
                                        modifier = Modifier.size(20.dp).align(Alignment.BottomEnd)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(Spacing.x2))
            FeButton(label = "Manage Neural Subscription", onClick = onSubscription)
            FeButton(label = "Logout Protocol", onClick = onSignOut)
            FeButton(label = "Return to Command", onClick = onBack)
        }
    }
}

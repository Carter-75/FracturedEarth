package com.fracturedearth.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.fracturedearth.ui.component.FeButton
import androidx.compose.ui.Modifier
import com.fracturedearth.ui.theme.Spacing
import com.fracturedearth.ui.theme.ThemeOption

@Composable
fun SettingsScreen(
    selectedTheme: ThemeOption,
    onThemeSelected: (ThemeOption) -> Unit,
    onSubscription: () -> Unit,
    onBack: () -> Unit,
) {
    val themes = ThemeOption.entries

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(Spacing.x4),
        verticalArrangement = Arrangement.spacedBy(Spacing.x2),
    ) {
        Text("Settings", style = MaterialTheme.typography.headlineMedium)
        Text("Theme", style = MaterialTheme.typography.titleMedium)
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.weight(1f),
        ) {
            items(themes) { option ->
                FilterChip(
                    selected = selectedTheme == option,
                    onClick = { onThemeSelected(option) },
                    label = { Text(option.name.replace("_", " ")) },
                )
            }
        }
        FeButton(label = "Ad-Free Subscription", onClick = onSubscription, modifier = Modifier.fillMaxWidth())
        FeButton(label = "Back", onClick = onBack, modifier = Modifier.fillMaxWidth())
    }
}

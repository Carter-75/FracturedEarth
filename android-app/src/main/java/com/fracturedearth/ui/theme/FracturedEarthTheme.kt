package com.fracturedearth.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

@Composable
fun FracturedEarthTheme(
    theme: ThemeOption = ThemeOption.OBSIDIAN,
    content: @Composable () -> Unit,
) {
    val tokens = ThemePalette.all.getValue(theme)
    val colors = darkColorScheme(
        primary = tokens.primary,
        background = tokens.background,
        surface = tokens.cardSurface,
        onPrimary = tokens.background,
        onBackground = tokens.textPrimary,
        onSurface = tokens.textPrimary,
        secondary = tokens.accent,
        error = tokens.danger,
    )

    MaterialTheme(
        colorScheme = colors,
        typography = FracturedEarthTypography,
        content = content,
    )
}

package com.fracturedearth.ui.theme

import androidx.compose.ui.graphics.Color

data class ThemeTokens(
    val primary: Color,
    val background: Color,
    val cardSurface: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val accent: Color,
    val danger: Color,
    val success: Color,
)

enum class ThemeOption {
    OBSIDIAN,
    DEEP_TEAL,
    ELECTRIC_INDIGO,
    CRIMSON_NIGHT,
    FOREST_SIGNAL,
    CARBON_GOLD,
    ARCTIC_TERMINAL,
    SOLAR_FLARE,
    VOID_PURPLE,
    TITANIUM_SLATE,
}

object ThemePalette {
    val all: Map<ThemeOption, ThemeTokens> = mapOf(
        ThemeOption.OBSIDIAN to ThemeTokens(
            primary = Color(0xFF4FC3F7), // Vibrant Ice Blue
            background = Color(0xFF020406), // Deepest Onyx (OLED Black)
            cardSurface = Color(0xFF0F1720), // Dark Slate Glass
            textPrimary = Color(0xFFEBEEF1),
            textSecondary = Color(0xFFA0B1C5),
            accent = Color(0xFF00E5FF),
            danger = Color(0xFFFF5252),
            success = Color(0xFF00E676),
        ),
        ThemeOption.DEEP_TEAL to ThemeTokens(Color(0xFF64FFDA), Color(0xFF010A0A), Color(0xFF0C1D1F), Color(0xFFE0F2F1), Color(0xFF80CBC4), Color(0xFF1DE9B6), Color(0xFFFF5252), Color(0xFF00E676)),
        ThemeOption.ELECTRIC_INDIGO to ThemeTokens(Color(0xFF7C8DFF), Color(0xFF04060C), Color(0xFF0C101F), Color(0xFFE8EAF6), Color(0xFF9FA8DA), Color(0xFF536DFE), Color(0xFFFF4081), Color(0xFF69F0AE)),
        ThemeOption.CRIMSON_NIGHT to ThemeTokens(Color(0xFFFF5252), Color(0xFF0A0204), Color(0xFF1F0C0F), Color(0xFFFDE0E0), Color(0xFFE57373), Color(0xFFFF1744), Color(0xFFD50000), Color(0xFF00E676)),
        ThemeOption.FOREST_SIGNAL to ThemeTokens(Color(0xFF69F0AE), Color(0xFF020603), Color(0xFF0C1A10), Color(0xFFE8F5E9), Color(0xFF81C784), Color(0xFF00E676), Color(0xFFFF5252), Color(0xFFB9F6CA)),
        ThemeOption.CARBON_GOLD to ThemeTokens(Color(0xFFFFD740), Color(0xFF080808), Color(0xFF121212), Color(0xFFFFFDE7), Color(0xFFFFE082), Color(0xFFFFC400), Color(0xFFFF5252), Color(0xFF00E676)),
        ThemeOption.ARCTIC_TERMINAL to ThemeTokens(Color(0xFF40C4FF), Color(0xFF01060A), Color(0xFF0C141F), Color(0xFFE1F5FE), Color(0xFF81D4FA), Color(0xFF00B0FF), Color(0xFFFF5252), Color(0xFF00E676)),
        ThemeOption.SOLAR_FLARE to ThemeTokens(Color(0xFFFFAB40), Color(0xFF0F0602), Color(0xFF1F0F0A), Color(0xFFFFF3E0), Color(0xFFFFB74D), Color(0xFFFF9100), Color(0xFFFF5252), Color(0xFF00E676)),
        ThemeOption.VOID_PURPLE to ThemeTokens(Color(0xFFE040FB), Color(0xFF06010D), Color(0xFF140C1F), Color(0xFFF3E5F5), Color(0xFFCE93D8), Color(0xFFD500F9), Color(0xFFFF4081), Color(0xFF69F0AE)),
        ThemeOption.TITANIUM_SLATE to ThemeTokens(Color(0xFFCFD8DC), Color(0xFF07090B), Color(0xFF101419), Color(0xFFECEFF1), Color(0xFFB0BEC5), Color(0xFF78909C), Color(0xFFFF5252), Color(0xFF00E676)),
    )
}

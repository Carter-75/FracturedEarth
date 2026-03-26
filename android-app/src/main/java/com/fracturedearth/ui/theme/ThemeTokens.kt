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
            primary = Color(0xFF8FA7C2),
            background = Color(0xFF090D12),
            cardSurface = Color(0xFF151D29),
            textPrimary = Color(0xFFF2F6FB),
            textSecondary = Color(0xFF9BA8BA),
            accent = Color(0xFF44B4E6),
            danger = Color(0xFFE26A5A),
            success = Color(0xFF5CD39A),
        ),
        ThemeOption.DEEP_TEAL to ThemeTokens(Color(0xFF66D2C4), Color(0xFF081313), Color(0xFF102426), Color(0xFFE7F9F7), Color(0xFF9AB9B5), Color(0xFF2BC3B2), Color(0xFFE66A6A), Color(0xFF75E39E)),
        ThemeOption.ELECTRIC_INDIGO to ThemeTokens(Color(0xFF9CA4FF), Color(0xFF0C1022), Color(0xFF161D39), Color(0xFFEDF0FF), Color(0xFF9DA7CF), Color(0xFF5E74FF), Color(0xFFFF6E7F), Color(0xFF5EE7A4)),
        ThemeOption.CRIMSON_NIGHT to ThemeTokens(Color(0xFFFF8D8D), Color(0xFF14090B), Color(0xFF2A1216), Color(0xFFFDEFF0), Color(0xFFCAA0A4), Color(0xFFFF667B), Color(0xFFFF4B4B), Color(0xFF8EF0BA)),
        ThemeOption.FOREST_SIGNAL to ThemeTokens(Color(0xFF8ED18A), Color(0xFF0A120B), Color(0xFF162618), Color(0xFFE9F6EA), Color(0xFF9DB9A0), Color(0xFF45C468), Color(0xFFD66C6C), Color(0xFF72EA8A)),
        ThemeOption.CARBON_GOLD to ThemeTokens(Color(0xFFE6C36D), Color(0xFF111111), Color(0xFF1E1E1E), Color(0xFFF9F5EA), Color(0xFFC1B18B), Color(0xFFF0B43C), Color(0xFFE06B5F), Color(0xFF7DDAA6)),
        ThemeOption.ARCTIC_TERMINAL to ThemeTokens(Color(0xFF78C7FF), Color(0xFF08101A), Color(0xFF142538), Color(0xFFE8F5FF), Color(0xFF9AB4C9), Color(0xFF42AFFF), Color(0xFFE36A6A), Color(0xFF77E1BE)),
        ThemeOption.SOLAR_FLARE to ThemeTokens(Color(0xFFFFB366), Color(0xFF1A0D07), Color(0xFF2E1A10), Color(0xFFFFF2E9), Color(0xFFD2AE95), Color(0xFFFF8C3A), Color(0xFFFF6464), Color(0xFF9DE588)),
        ThemeOption.VOID_PURPLE to ThemeTokens(Color(0xFFC8A5FF), Color(0xFF0F0A16), Color(0xFF1E1631), Color(0xFFF4EDFF), Color(0xFFB6A6D4), Color(0xFF9A6BFF), Color(0xFFFF6B8A), Color(0xFF79E4A8)),
        ThemeOption.TITANIUM_SLATE to ThemeTokens(Color(0xFF8FA0B1), Color(0xFF0D1116), Color(0xFF18212B), Color(0xFFF0F5FA), Color(0xFFA2AFC1), Color(0xFF5E86A8), Color(0xFFE07A72), Color(0xFF75D0A1)),
    )
}

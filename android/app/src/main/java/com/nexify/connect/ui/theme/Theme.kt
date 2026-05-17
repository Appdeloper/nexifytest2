package com.nexify.connect.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Cyberpunk Harmonious Harmonized Colors
val CyanNeon = Color(0xFF00FFD8)
val CyanGlow = Color(0x3300FFD8)
val PurpleNeon = Color(0xFFD800FF)
val PurpleGlow = Color(0x33D800FF)
val AmoledBg = Color(0xFF0A0612)
val CardBg = Color(0x99161128) // Transparent glass card background
val CardBorder = Color(0x26FFFFFF)
val TextPrimary = Color(0xFFFFFFFF)
val TextMuted = Color(0xFF8E88A0)

val CyberpunkColorScheme = darkColorScheme(
    primary = CyanNeon,
    secondary = PurpleNeon,
    background = AmoledBg,
    surface = CardBg,
    onPrimary = Color.Black,
    onSecondary = Color.White,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun NexifyConnectTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = CyberpunkColorScheme,
        content = content
    )
}

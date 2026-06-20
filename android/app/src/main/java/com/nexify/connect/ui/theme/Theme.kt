package com.nexify.connect.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

import androidx.compose.ui.graphics.Brush

// Cyberpunk Harmonious Harmonized Colors
val CyanNeon = Color(0xFF00E5FF)
val CyanGlow = Color(0x2600E5FF)
val PurpleNeon = Color(0xFF7B61FF)
val PurpleGlow = Color(0x267B61FF)
val AmoledBg = Color(0xFF0A0A0F)
val CardBg = Color(0xCC0D0D15) // Transparent glass card background
val CardBorder = Color(0x26FFFFFF)
val TextPrimary = Color(0xFFFFFFFF)
val TextMuted = Color(0xFF8E88A0)

val LuxuryBgGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFF0A0A0F), Color(0xFF121826))
)

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

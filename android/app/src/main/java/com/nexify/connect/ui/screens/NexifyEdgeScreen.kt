package com.nexify.connect.ui.screens

import android.content.Context
import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.ui.components.UniversalBackButton
import com.nexify.connect.ui.theme.*

@Composable
fun NexifyEdgeScreen(navController: NavController, repository: FirebaseRepository) {
    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("nexify_edge_prefs", Context.MODE_PRIVATE) }
    var isNotified by remember { mutableStateOf(sharedPrefs.getBoolean("notified", false)) }

    // Background Gradient: Black -> Deep Purple -> Blue
    val edgeBgGradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF000000), // black
            Color(0xFF1E1035), // deep purple
            Color(0xFF0A192F)  // blue/deep navy
        )
    )

    // Floating animation
    val infiniteTransition = rememberInfiniteTransition(label = "edge_animations")
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -8f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float"
    )

    // Pulsing glowing background
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.60f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow"
    )

    // Screen load scale & fade-in
    val scaleState = remember { Animatable(0.92f) }
    val alphaState = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        scaleState.animateTo(1.0f, animationSpec = tween(600, easing = EaseOutBack))
    }
    LaunchedEffect(Unit) {
        alphaState.animateTo(1.0f, animationSpec = tween(500))
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(edgeBgGradient)
    ) {
        // Appbar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            UniversalBackButton(navController = navController)
            Spacer(modifier = Modifier.width(16.dp))
            Text(
                text = "NEXIFY EDGE",
                color = Color.White,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 16.sp,
                letterSpacing = 1.5.sp
            )
        }

        // Center Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .graphicsLayer(
                    scaleX = scaleState.value,
                    scaleY = scaleState.value,
                    alpha = alphaState.value
                ),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Animated Icon Illustration
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .graphicsLayer { translationY = floatOffset.dp.toPx() },
                contentAlignment = Alignment.Center
            ) {
                // Soft background purple glow
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .blur(30.dp)
                        .background(PurpleNeon.copy(alpha = glowAlpha), CircleShape)
                )

                // Glassmorphism Outer Ring
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(CardBg)
                        .border(
                            1.dp,
                            Brush.linearGradient(listOf(PurpleNeon.copy(alpha = 0.5f), CyanNeon.copy(alpha = 0.2f))),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = "Edge Symbol",
                        tint = PurpleNeon,
                        modifier = Modifier.size(44.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Status Badge
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color(0x1F7B61FF))
                    .border(1.dp, PurpleNeon.copy(alpha = 0.6f), CircleShape)
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(PurpleNeon)
                    )
                    Text(
                        text = "Coming Soon",
                        color = PurpleNeon,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        letterSpacing = 1.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Title
            Text(
                text = "Nexify Edge",
                color = Color.White,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 32.sp,
                textAlign = TextAlign.Center,
                letterSpacing = 0.5.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Description Glassmorphic Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(CardBg)
                    .border(
                        1.dp,
                        Brush.horizontalGradient(listOf(CardBorder, PurpleNeon.copy(alpha = 0.25f))),
                        RoundedCornerShape(24.dp)
                    )
                    .padding(20.dp)
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Your gateway to powerful insights, global trends, and AI-driven updates — all in one place.",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 15.sp,
                        lineHeight = 22.sp,
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Medium
                    )

                    Text(
                        text = "We’re building something incredible. Stay tuned.",
                        color = TextMuted,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Normal
                    )

                    // Notify Me toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White.copy(alpha = 0.03f))
                            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                            .clickable {
                                isNotified = !isNotified
                                sharedPrefs.edit().putBoolean("notified", isNotified).apply()
                                val text = if (isNotified) "We'll notify you on launch! 🔔" else "Notifications turned off."
                                Toast.makeText(context, text, Toast.LENGTH_SHORT).show()
                            }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = if (isNotified) Icons.Default.NotificationsActive else Icons.Default.Notifications,
                                contentDescription = null,
                                tint = if (isNotified) PurpleNeon else TextMuted,
                                modifier = Modifier.size(20.dp)
                            )
                            Column {
                                Text(
                                    text = "Notify Me",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                                Text(
                                    text = "Get alerted when Edge launches",
                                    color = TextMuted,
                                    fontSize = 10.sp
                                )
                            }
                        }
                        Switch(
                            checked = isNotified,
                            onCheckedChange = { checked ->
                                isNotified = checked
                                sharedPrefs.edit().putBoolean("notified", checked).apply()
                                val text = if (checked) "We'll notify you on launch! 🔔" else "Notifications turned off."
                                Toast.makeText(context, text, Toast.LENGTH_SHORT).show()
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = PurpleNeon,
                                uncheckedThumbColor = Color.Gray,
                                uncheckedTrackColor = Color.White.copy(alpha = 0.08f)
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Disabled Button: Launching Soon 🚀
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.05f))
                    .border(1.dp, Color.White.copy(alpha = 0.12f), CircleShape)
                    .padding(vertical = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Launching Soon 🚀",
                    color = Color.White.copy(alpha = 0.4f),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}

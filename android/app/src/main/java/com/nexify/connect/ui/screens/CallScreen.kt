package com.nexify.connect.ui.screens

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.nexify.connect.data.model.CallSession
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.services.safeCollect
import com.nexify.connect.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun CallScreen(
    navController: NavController,
    repository: FirebaseRepository,
    callId: String,
    otherUserId: String,
    isOutgoing: Boolean
) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    // Live Subscriptions
    val callSession by repository.subscribeToCallState(callId).safeCollect("CallScreen_session", null).collectAsState(initial = null)
    val otherUser by repository.subscribeToUser(otherUserId).safeCollect("CallScreen_otherUser", null).collectAsState(initial = null)

    // Call controls state
    var isMuted by remember { mutableStateOf(false) }
    var isCameraEnabled by remember { mutableStateOf(true) }

    // Pulsing circle animation for dialer
    val infiniteTransition = rememberInfiniteTransition()
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, ease = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    // Automatically navigate back if the call is ended
    LaunchedEffect(callSession) {
        if (callSession != null && callSession?.status == "ended") {
            Toast.makeText(context, "Call Terminated.", Toast.LENGTH_SHORT).show()
            delay(1000)
            navController.popBackStack()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg),
        contentAlignment = Alignment.Center
    ) {
        // Futuristic radial background glow
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            if (isOutgoing) PurpleNeon.copy(alpha = 0.15f) else CyanNeon.copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    )
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier
                .fillMaxHeight(0.9f)
                .fillMaxWidth(0.9f)
        ) {
            // Header information
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(top = 40.dp)
            ) {
                Text(
                    text = if (isOutgoing) "OUTGOING SECTOR CALL" else "INCOMING TRANSMISSION",
                    color = if (isOutgoing) PurpleNeon else CyanNeon,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    letterSpacing = 2.sp
                )
                
                otherUser?.let {
                    Text(
                        text = "@${it.username}",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 24.sp
                    )
                }

                Text(
                    text = when (callSession?.status) {
                        "dialing" -> "Establishing secure uplink..."
                        "ringing" -> "Ringing sector..."
                        "connected" -> "Transmission connected [WebRTC Secure]"
                        else -> "Uplink initializing..."
                    },
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }

            // Central Avatar / Video Feed mockup
            Box(
                modifier = Modifier.size(160.dp),
                contentAlignment = Alignment.Center
            ) {
                // Glow rings
                Box(
                    modifier = Modifier
                        .size(160.dp * pulseScale)
                        .clip(CircleShape)
                        .border(
                            1.dp,
                            if (isOutgoing) PurpleNeon.copy(alpha = 0.3f) else CyanNeon.copy(alpha = 0.3f),
                            CircleShape
                        )
                )

                otherUser?.let {
                    AsyncImage(
                        model = it.profileImage,
                        contentDescription = null,
                        modifier = Modifier
                            .size(120.dp)
                            .clip(CircleShape)
                            .border(2.dp, if (isOutgoing) PurpleNeon else CyanNeon, CircleShape)
                    )
                }
            }

            // Controls
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.padding(bottom = 20.dp)
            ) {
                // Incoming Answer / Reject options
                if (callSession?.status == "ringing" && !isOutgoing) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(32.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Reject / Hang up Button
                        FloatingActionButton(
                            onClick = {
                                coroutineScope.launch {
                                    repository.endCall(callId)
                                }
                            },
                            containerColor = Color.Red,
                            contentColor = Color.White,
                            shape = CircleShape,
                            modifier = Modifier.size(64.dp)
                        ) {
                            Icon(Icons.Default.CallEnd, contentDescription = "Decline Call", modifier = Modifier.size(28.dp))
                        }

                        // Accept Button
                        FloatingActionButton(
                            onClick = {
                                coroutineScope.launch {
                                    repository.answerCall(callId)
                                }
                            },
                            containerColor = Color.Green,
                            contentColor = Color.Black,
                            shape = CircleShape,
                            modifier = Modifier.size(64.dp)
                        ) {
                            Icon(Icons.Default.Call, contentDescription = "Accept Call", modifier = Modifier.size(28.dp))
                        }
                    }
                } else {
                    // Active call controls (Mute, Camera toggle, Hang Up)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(24.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Mute button
                        IconButton(
                            onClick = { isMuted = !isMuted },
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(if (isMuted) Color.White.copy(alpha = 0.2f) else CardBg)
                                .border(1.dp, CardBorder, CircleShape)
                        ) {
                            Icon(
                                imageVector = if (isMuted) Icons.Default.MicOff else Icons.Default.Mic,
                                contentDescription = "Mute",
                                tint = Color.White
                            )
                        }

                        // Decline / End call button
                        FloatingActionButton(
                            onClick = {
                                coroutineScope.launch {
                                    repository.endCall(callId)
                                }
                            },
                            containerColor = Color.Red,
                            contentColor = Color.White,
                            shape = CircleShape,
                            modifier = Modifier.size(64.dp)
                        ) {
                            Icon(Icons.Default.CallEnd, contentDescription = "End Call", modifier = Modifier.size(28.dp))
                        }

                        // Camera toggle button
                        IconButton(
                            onClick = { isCameraEnabled = !isCameraEnabled },
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(if (!isCameraEnabled) Color.White.copy(alpha = 0.2f) else CardBg)
                                .border(1.dp, CardBorder, CircleShape)
                        ) {
                            Icon(
                                imageVector = if (isCameraEnabled) Icons.Default.Videocam else Icons.Default.VideocamOff,
                                contentDescription = "Toggle Camera",
                                tint = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}

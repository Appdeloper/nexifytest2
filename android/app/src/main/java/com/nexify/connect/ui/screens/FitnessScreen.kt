package com.nexify.connect.ui.screens

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.nexify.connect.data.model.FitnessRecord
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.services.safeCollect
import com.nexify.connect.ui.components.PremiumButton
import com.nexify.connect.ui.components.PremiumCard
import com.nexify.connect.ui.components.PremiumTextField
import com.nexify.connect.ui.components.UniversalBackButton
import com.nexify.connect.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun FitnessScreen(navController: NavController, repository: FirebaseRepository) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    // Database record state
    val fitnessRecords by repository.subscribeToFitnessData().safeCollect("FitnessScreen_records", emptyList()).collectAsState(initial = emptyList())
    
    val todayDateStr = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) }
    val todayRecord = fitnessRecords.find { it.date == todayDateStr }
    
    var currentSteps by remember { mutableStateOf(0) }
    var currentStreak by remember { mutableStateOf(0) }
    
    // Sync initial state from DB
    LaunchedEffect(todayRecord) {
        if (todayRecord != null) {
            currentSteps = todayRecord.steps
            currentStreak = todayRecord.streak
        }
    }

    // Hardware Sensor integration
    val sensorManager = remember { context.getSystemService(Context.SENSOR_SERVICE) as SensorManager }
    val stepSensor = remember { sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) }
    var hasHardwareSensor by remember { mutableStateOf(stepSensor != null) }
    
    // Simulator configuration
    var isSimulating by remember { mutableStateOf(false) }

    // 1. Hardware Sensor Listener registration
    DisposableEffect(hasHardwareSensor) {
        val listener = object : SensorEventListener {
            private var initialSensorSteps = -1

            override fun onSensorChanged(event: SensorEvent?) {
                if (event == null || event.sensor.type != Sensor.TYPE_STEP_COUNTER) return
                val totalSteps = event.values[0].toInt()
                if (initialSensorSteps == -1) {
                    initialSensorSteps = totalSteps
                }
                val newStepsSinceLaunch = totalSteps - initialSensorSteps
                if (newStepsSinceLaunch > 0) {
                    val finalSteps = currentSteps + newStepsSinceLaunch
                    currentSteps = finalSteps
                    
                    // Save to Firestore
                    coroutineScope.launch {
                        repository.saveFitnessData(
                            date = todayDateStr,
                            steps = finalSteps,
                            calories = finalSteps * 0.04,
                            streak = currentStreak,
                            xpRewarded = if (finalSteps >= 5000 && (todayRecord?.xpRewarded ?: 0L) == 0L) 100L else 0L
                        )
                    }
                }
            }
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }

        if (hasHardwareSensor && stepSensor != null) {
            sensorManager.registerListener(listener, stepSensor, SensorManager.SENSOR_DELAY_UI)
        }
        
        onDispose {
            if (hasHardwareSensor) {
                sensorManager.unregisterListener(listener)
            }
        }
    }

    // 2. Simulated steps runner
    LaunchedEffect(isSimulating) {
        if (isSimulating) {
            while (isSimulating) {
                delay(1000)
                val newSteps = currentSteps + 4
                currentSteps = newSteps
                repository.saveFitnessData(
                    date = todayDateStr,
                    steps = newSteps,
                    calories = newSteps * 0.04,
                    streak = currentStreak,
                    xpRewarded = if (newSteps >= 5000 && (todayRecord?.xpRewarded ?: 0L) == 0L) 100L else 0L
                )
            }
        }
    }

    val caloriesBurned = remember(currentSteps) { currentSteps * 0.04 }
    val stepGoal = 10000
    val progressFraction = remember(currentSteps) { (currentSteps.toFloat() / stepGoal.toFloat()).coerceIn(0f, 1f) }

    // SharedPreferences for Beta onboarding accepted
    val sharedPrefs = remember { context.getSharedPreferences("nexify_fit_prefs", Context.MODE_PRIVATE) }
    var showBetaContent by remember { mutableStateOf(sharedPrefs.getBoolean("accepted_beta", false)) }
    
    // Feedback dialog state
    var showFeedbackDialog by remember { mutableStateOf(false) }
    var feedbackText by remember { mutableStateOf("") }
    var isSubmittingFeedback by remember { mutableStateOf(false) }

    // Animations
    val infiniteTransition = rememberInfiniteTransition(label = "fitness_animations")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.98f,
        targetValue = 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )
    val ringRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ringRotation"
    )

    // Dark Gradient background: Black -> Purple -> Blue
    val fitBgGradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF000000), // black
            Color(0xFF1E1035), // deep purple
            Color(0xFF0A192F)  // blue/deep navy
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(fitBgGradient)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // App Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    UniversalBackButton(navController = navController)
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(
                        text = "NEXIFY FIT",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 16.sp,
                        letterSpacing = 1.5.sp
                    )
                }

                // Cyan Beta Badge
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Color(0x1F00E5FF))
                        .border(1.dp, CyanNeon.copy(alpha = 0.6f), CircleShape)
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(CyanNeon)
                        )
                        Text(
                            text = "BETA",
                            color = CyanNeon,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }

            if (!showBetaContent) {
                // Beta Screen preview & invitation
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                        .padding(horizontal = 24.dp, vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    // Preview Title & Badging
                    Text(
                        text = "Nexify Fit",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 32.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Track your steps, build streaks, and level up your fitness journey.",
                        color = TextMuted,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 20.sp,
                        modifier = Modifier.padding(horizontal = 12.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))

                    // Step Counter Preview (Glassmorphic & Blurred components)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .graphicsLayer {
                                scaleX = pulseScale
                                scaleY = pulseScale
                            }
                            .clip(RoundedCornerShape(24.dp))
                            .background(CardBg)
                            .border(
                                1.dp,
                                Brush.horizontalGradient(listOf(CardBorder, CyanNeon.copy(alpha = 0.25f))),
                                RoundedCornerShape(24.dp)
                            )
                            .padding(20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        // Soft glow background inside card
                        Box(
                            modifier = Modifier
                                .size(140.dp)
                                .blur(25.dp)
                                .background(CyanNeon.copy(alpha = 0.08f), CircleShape)
                        )

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            // Circular Progress Ring Preview (Low opacity)
                            Box(
                                modifier = Modifier
                                    .size(130.dp)
                                    .graphicsLayer { rotationZ = ringRotation },
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(
                                    progress = 0.54f,
                                    modifier = Modifier.fillMaxSize(),
                                    color = CyanNeon.copy(alpha = 0.35f),
                                    strokeWidth = 8.dp,
                                    trackColor = CardBorder.copy(alpha = 0.1f)
                                )
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .graphicsLayer { rotationZ = -ringRotation } // keep text straight
                                        .blur(4.dp) // preview blur
                                ) {
                                    Text(
                                        text = "5,420",
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White
                                    )
                                    Text(
                                        text = "Goal: 10k",
                                        fontSize = 10.sp,
                                        color = TextMuted
                                    )
                                }
                            }

                            // Stats Preview Row (Blurred)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .blur(3.dp), // preview blur
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(12.dp))
                                        .border(1.5.dp, CardBorder, RoundedCornerShape(12.dp))
                                        .padding(8.dp)
                                ) {
                                    Column {
                                        Text("CALORIES", fontSize = 8.sp, color = PurpleNeon, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text("216.8 kcal", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(12.dp))
                                        .border(1.5.dp, CardBorder, RoundedCornerShape(12.dp))
                                        .padding(8.dp)
                                ) {
                                    Column {
                                        Text("STREAK", fontSize = 8.sp, color = CyanNeon, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text("3 Days", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Text(
                        text = "This feature is in beta. Some features may still improve.",
                        color = TextMuted,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(28.dp))

                    // Button: Try Beta
                    PremiumButton(
                        text = "Try Beta",
                        onClick = {
                            showBetaContent = true
                            sharedPrefs.edit().putBoolean("accepted_beta", true).apply()
                            Toast.makeText(context, "Welcome to Nexify Fit Beta! 🏋️", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Footnote
                    Text(
                        text = "Your feedback helps us improve 💙",
                        color = CyanNeon,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .clickable { showFeedbackDialog = true }
                            .padding(8.dp)
                    )
                }
            } else {
                // Active tracker content (original functionality)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Step Circular Progress Ring
                    Box(
                        modifier = Modifier
                            .size(200.dp)
                            .border(2.dp, Brush.radialGradient(listOf(PurpleNeon.copy(alpha = 0.2f), Color.Transparent)), RoundedCornerShape(100.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            progress = progressFraction,
                            modifier = Modifier.fillMaxSize(0.9f),
                            color = CyanNeon,
                            strokeWidth = 12.dp,
                            trackColor = CardBorder
                        )
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = currentSteps.toString(),
                                fontSize = 36.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                            Text(
                                text = "Goal: $stepGoal",
                                fontSize = 12.sp,
                                color = TextMuted
                            )
                        }
                    }

                    // Stats Cards Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        PremiumCard(
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("CALORIES", fontSize = 10.sp, color = PurpleNeon, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(String.format("%.1f", caloriesBurned) + " kcal", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                            }
                        }
                        PremiumCard(
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("STREAK", fontSize = 10.sp, color = CyanNeon, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("$currentStreak Days", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                            }
                        }
                    }

                    // Simulator Panel
                    PremiumCard(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text("ENGINE CONTROLLER", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(
                                text = if (hasHardwareSensor) "Hardware Pedometer listener engaged." else "No step sensor detected. Emulating engine.",
                                color = TextMuted,
                                fontSize = 11.sp
                            )
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                PremiumButton(
                                    text = "LOG 1K STEPS",
                                    onClick = {
                                        val steps = currentSteps + 1000
                                        currentSteps = steps
                                        coroutineScope.launch {
                                            repository.saveFitnessData(
                                                date = todayDateStr,
                                                steps = steps,
                                                calories = steps * 0.04,
                                                streak = currentStreak + 1,
                                                xpRewarded = if (steps >= 5000 && (todayRecord?.xpRewarded ?: 0L) == 0L) 100L else 0L
                                            )
                                        }
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                                
                                PremiumButton(
                                    text = if (isSimulating) "PAUSE SIM" else "RUN SIM",
                                    onClick = { isSimulating = !isSimulating },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // Weekly Stats Graph
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("WEEKLY PERFORMANCE", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        
                        LazyRow(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .background(CardBg, RoundedCornerShape(16.dp))
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceAround,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            val last7Records = fitnessRecords.takeLast(7)
                            items(last7Records) { record ->
                                val barHeightFraction = (record.steps.toFloat() / stepGoal.toFloat()).coerceIn(0.05f, 1f)
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Bottom,
                                    modifier = Modifier.fillMaxHeight()
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .width(16.dp)
                                            .fillMaxHeight(barHeightFraction)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(if (record.steps >= stepGoal) CyanNeon else PurpleNeon)
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(record.date.takeLast(2), fontSize = 10.sp, color = TextMuted)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Dialog Overlay for feedback
        if (showFeedbackDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.7f))
                    .clickable { showFeedbackDialog = false },
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.85f)
                        .clip(RoundedCornerShape(24.dp))
                        .background(CardBg)
                        .border(
                            1.dp,
                            Brush.horizontalGradient(listOf(CardBorder, CyanNeon.copy(alpha = 0.3f))),
                            RoundedCornerShape(24.dp)
                        )
                        .clickable(enabled = false) {} // block click propagation
                        .padding(20.dp)
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = "Submit Beta Feedback 💙",
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp
                        )
                        
                        Text(
                            text = "Help us shape Nexify Fit. Let us know what features or improvements you'd like to see!",
                            color = TextMuted,
                            fontSize = 12.sp,
                            lineHeight = 16.sp
                        )

                        PremiumTextField(
                            value = feedbackText,
                            onValueChange = { feedbackText = it },
                            placeholder = "Write your suggestions here..."
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { showFeedbackDialog = false },
                                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, CardBorder, CircleShape)
                            ) {
                                Text("Cancel", color = Color.White)
                            }

                            PremiumButton(
                                text = if (isSubmittingFeedback) "SUBMITTING..." else "SUBMIT",
                                onClick = {
                                    if (feedbackText.trim().isEmpty()) {
                                        Toast.makeText(context, "Please enter some feedback.", Toast.LENGTH_SHORT).show()
                                        return@PremiumButton
                                    }
                                    isSubmittingFeedback = true
                                    coroutineScope.launch {
                                        try {
                                            repository.submitFeedback("fitness_beta", feedbackText)
                                            Toast.makeText(context, "Thank you! Feedback received. 💙", Toast.LENGTH_SHORT).show()
                                            feedbackText = ""
                                            showFeedbackDialog = false
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Submission failed.", Toast.LENGTH_SHORT).show()
                                        } finally {
                                            isSubmittingFeedback = false
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1.2f)
                            )
                        }
                    }
                }
            }
        }
    }
}

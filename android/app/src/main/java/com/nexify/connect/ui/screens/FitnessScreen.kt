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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
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
import com.nexify.connect.data.model.FitnessRecord
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.services.safeCollect
import com.nexify.connect.ui.components.PremiumButton
import com.nexify.connect.ui.components.PremiumCard
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
    ) {
        // Appbar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(CardBg)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            UniversalBackButton(navController = navController)
            Text("NEXIFY FIT", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
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
                        fontSize = 32.sp,
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

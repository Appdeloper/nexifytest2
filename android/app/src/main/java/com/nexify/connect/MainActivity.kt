package com.nexify.connect

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.google.firebase.auth.FirebaseAuth
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.services.LocalErrorReporter
import com.nexify.connect.services.NexifyLog
import com.nexify.connect.ui.screens.*
import com.nexify.connect.ui.viewmodel.*
import com.nexify.connect.ui.theme.NexifyConnectTheme
import kotlinx.coroutines.flow.*

class MainActivity : ComponentActivity() {
    private val repository = FirebaseRepository()
    private val authViewModel by lazy { AuthViewModel(repository) }
    private val friendsViewModel by lazy { FriendsViewModel(repository) }
    private val chatViewModel by lazy { ChatViewModel(repository) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            NexifyConnectTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    var globalError by remember { mutableStateOf<Throwable?>(null) }

                    LaunchedEffect(intent) {
                        if (intent?.hasExtra("crash_error") == true) {
                            val errMsg = intent.getStringExtra("crash_error") ?: "Unspecified crash"
                            NexifyLog.e("MainActivity", "App restarted due to crash: $errMsg")
                            globalError = Throwable(errMsg)
                        }

                        val target = intent?.getStringExtra("target_screen")
                        if (!target.isNullOrEmpty()) {
                            try {
                                navController.navigate(target) {
                                    launchSingleTop = true
                                }
                            } catch (e: Exception) {
                                NexifyLog.e("MainActivity", "Failed to route FCM target: $target", e)
                            }
                        }
                    }

                    // Navigation event logger
                    LaunchedEffect(navController) {
                        navController.addOnDestinationChangedListener { _, destination, arguments ->
                            NexifyLog.i("Navigation", "Routing event -> Route: ${destination.route}, Params: $arguments")
                        }
                    }

                    // Firebase Session Listener for automatic redirection
                    DisposableEffect(Unit) {
                        val authListener = FirebaseAuth.AuthStateListener { firebaseAuth ->
                            val user = firebaseAuth.currentUser
                            NexifyLog.i("SessionState", "Auth snapshot updated. Current User UID: ${user?.uid}")
                            if (user == null) {
                                // Clear stack and pop to login screen safely
                                try {
                                    navController.navigate("login") {
                                        popUpTo(0) { inclusive = true }
                                    }
                                } catch (e: Exception) {
                                    NexifyLog.e("SessionState", "Redirect to login failed.", e)
                                }
                            }
                        }
                        FirebaseAuth.getInstance().addAuthStateListener(authListener)
                        onDispose {
                            FirebaseAuth.getInstance().removeAuthStateListener(authListener)
                        }
                    }

                    CompositionLocalProvider(LocalErrorReporter provides { err -> globalError = err }) {
                        if (globalError != null) {
                            ErrorScreen(
                                error = globalError,
                                onReload = {
                                    NexifyLog.i("ErrorScreen", "Reload requested. Restarting task stack.")
                                    val restartIntent = packageManager.getLaunchIntentForPackage(packageName)
                                    restartIntent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                                    startActivity(restartIntent)
                                    finish()
                                },
                                onBackToHome = {
                                    NexifyLog.i("ErrorScreen", "Resetting state. Clearing stack to home.")
                                    globalError = null
                                    try {
                                        navController.navigate("home") {
                                            popUpTo(0) { inclusive = true }
                                            launchSingleTop = true
                                        }
                                    } catch (e: Exception) {
                                        NexifyLog.e("ErrorScreen", "Redirect to home failed.", e)
                                    }
                                },
                                onSignOut = {
                                    NexifyLog.i("ErrorScreen", "Signing out and wiping local session cache.")
                                    try {
                                        repository.logout()
                                    } catch (e: Exception) {
                                        FirebaseAuth.getInstance().signOut()
                                    }

                                    // Clear SharedPreferences and Cache
                                    try {
                                        val sharedPrefs = getSharedPreferences("nexify_connect_prefs", MODE_PRIVATE)
                                        sharedPrefs.edit().clear().apply()
                                        cacheDir.deleteRecursively()
                                    } catch (e: Exception) {
                                        NexifyLog.e("ErrorScreen", "Failed to clear system cache.", e)
                                    }

                                    globalError = null
                                    try {
                                        navController.navigate("login") {
                                            popUpTo(0) { inclusive = true }
                                        }
                                    } catch (e: Exception) {
                                        NexifyLog.e("ErrorScreen", "Redirect to login failed.", e)
                                    }
                                }
                            )
                        } else {
                            val sharedPrefs = remember { this@MainActivity.getSharedPreferences("nexify_connect_prefs", 0) }
                            val onboardingComplete = remember { sharedPrefs.getBoolean("onboarding_complete", false) }

                            val currentUser = FirebaseAuth.getInstance().currentUser
                            val startDestination = if (!onboardingComplete) "onboarding" else if (currentUser != null) "home" else "login"

                            LaunchedEffect(currentUser) {
                                if (currentUser != null) {
                                    repository.subscribeToIncomingCalls().collect { calls ->
                                        val activeCall = calls.firstOrNull { it.status == "ringing" || it.status == "dialing" }
                                        if (activeCall != null) {
                                            val currentRoute = navController.currentBackStackEntry?.destination?.route ?: ""
                                            if (!currentRoute.startsWith("call/")) {
                                                navController.navigate("call/${activeCall.callId}/${activeCall.callerId}/false") {
                                                    launchSingleTop = true
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            NavHost(
                                navController = navController,
                                startDestination = startDestination
                            ) {
                                composable("onboarding") {
                                    OnboardingScreen(navController = navController)
                                }
                                composable("settings") {
                                    SettingsScreen(navController = navController, repository = repository)
                                }
                                composable("login") {
                                    LoginScreen(navController = navController, repository = repository)
                                }
                                composable("signup") {
                                    SignUpScreen(navController = navController, repository = repository)
                                }
                                composable("forgot_password") {
                                    ForgotPasswordScreen(navController = navController, repository = repository)
                                }
                                composable("home") {
                                    LaunchedEffect(Unit) {
                                        repository.checkAndIncrementStreak()
                                    }
                                    ChatListScreen(navController = navController, repository = repository)
                                }
                                composable("find") {
                                    FindFriendsScreen(navController = navController, repository = repository)
                                }
                                composable(
                                    route = "chat/{chatId}/{otherUserId}",
                                    arguments = listOf(
                                        navArgument("chatId") { type = NavType.StringType },
                                        navArgument("otherUserId") { type = NavType.StringType }
                                    )
                                ) { backStackEntry ->
                                    val chatId = backStackEntry.arguments?.getString("chatId") ?: ""
                                    val otherUserId = backStackEntry.arguments?.getString("otherUserId") ?: ""
                                    ChatConversationScreen(
                                        navController = navController,
                                        repository = repository,
                                        chatId = chatId,
                                        otherUserId = otherUserId
                                    )
                                }
                                composable("rooms") {
                                    RoomsScreen(navController = navController, repository = repository)
                                }
                                composable(
                                    route = "room/{roomId}",
                                    arguments = listOf(
                                        navArgument("roomId") { type = NavType.StringType }
                                    )
                                ) { backStackEntry ->
                                    val roomId = backStackEntry.arguments?.getString("roomId") ?: ""
                                    RoomChatScreen(
                                        navController = navController,
                                        repository = repository,
                                        roomId = roomId
                                    )
                                }
                                composable("profile") {
                                    ProfileCustomizationScreen(navController = navController, repository = repository)
                                }
                                composable("create_group") {
                                    CreateGroupScreen(navController = navController, repository = repository)
                                }
                                composable(
                                    route = "group/{groupId}",
                                    arguments = listOf(
                                        navArgument("groupId") { type = NavType.StringType }
                                    )
                                ) { backStackEntry ->
                                    val groupId = backStackEntry.arguments?.getString("groupId") ?: ""
                                    GroupChatScreen(
                                        navController = navController,
                                        repository = repository,
                                        groupId = groupId
                                    )
                                }
                                composable("ai_chat") {
                                    AiChatScreen(navController = navController, repository = repository)
                                }
                                composable("focus_pod") {
                                    FocusPodScreen(navController = navController, repository = repository)
                                }
                                composable("chat_rooms") {
                                    ChatRoomsListScreen(navController = navController, repository = repository)
                                }
                                composable(
                                    route = "chat_room/{roomId}",
                                    arguments = listOf(
                                        navArgument("roomId") { type = NavType.StringType }
                                    )
                                ) { backStackEntry ->
                                    val roomId = backStackEntry.arguments?.getString("roomId") ?: ""
                                    ChatRoomConversationScreen(
                                        navController = navController,
                                        repository = repository,
                                        roomId = roomId
                                    )
                                }
                                composable("leaderboard") {
                                    LeaderboardScreen(navController = navController, repository = repository)
                                }
                                composable("fitness") {
                                    FitnessScreen(navController = navController, repository = repository)
                                }
                                composable("nexify_edge") {
                                    NexifyEdgeScreen(navController = navController, repository = repository)
                                }
                                composable(
                                    route = "call/{callId}/{otherUserId}/{isOutgoing}",
                                    arguments = listOf(
                                        navArgument("callId") { type = NavType.StringType },
                                        navArgument("otherUserId") { type = NavType.StringType },
                                        navArgument("isOutgoing") { type = NavType.BoolType }
                                    )
                                ) { backStackEntry ->
                                    val callId = backStackEntry.arguments?.getString("callId") ?: ""
                                    val otherUserId = backStackEntry.arguments?.getString("otherUserId") ?: ""
                                    val isOutgoing = backStackEntry.arguments?.getBoolean("isOutgoing") ?: false
                                    CallScreen(
                                        navController = navController,
                                        repository = repository,
                                        callId = callId,
                                        otherUserId = otherUserId,
                                        isOutgoing = isOutgoing
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        try {
            repository.updatePresence(true)
        } catch (e: Exception) {
            NexifyLog.e("MainActivity", "Failed to update presence status.", e)
        }
    }

    override fun onPause() {
        super.onPause()
        try {
            repository.updatePresence(false)
        } catch (e: Exception) {
            NexifyLog.e("MainActivity", "Failed to update presence status.", e)
        }
    }

    override fun onStop() {
        super.onStop()
        try {
            repository.updatePresence(false)
        } catch (e: Exception) {
            NexifyLog.e("MainActivity", "Failed to update presence status.", e)
        }
    }
}


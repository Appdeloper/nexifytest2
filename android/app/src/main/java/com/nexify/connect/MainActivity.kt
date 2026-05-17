package com.nexify.connect

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.google.firebase.auth.FirebaseAuth
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.ui.screens.*
import com.nexify.connect.ui.theme.NexifyConnectTheme

class MainActivity : ComponentActivity() {
    private val repository = FirebaseRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            NexifyConnectTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val currentUser = FirebaseAuth.getInstance().currentUser
                    val startDestination = if (currentUser != null) "home" else "login"

                    NavHost(
                        navController = navController,
                        startDestination = startDestination
                    ) {
                        composable("login") {
                            LoginScreen(navController = navController, repository = repository)
                        }
                        composable("signup") {
                            SignUpScreen(navController = navController, repository = repository)
                        }
                        composable("home") {
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
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        repository.updatePresence(true)
    }

    override fun onPause() {
        super.onPause()
        repository.updatePresence(false)
    }

    override fun onStop() {
        super.onStop()
        repository.updatePresence(false)
    }
}

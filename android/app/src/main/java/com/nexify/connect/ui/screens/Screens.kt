package com.nexify.connect.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.nexify.connect.data.model.*
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.services.AiService
import com.nexify.connect.services.CloudinaryService
import com.nexify.connect.services.safeCollect
import com.nexify.connect.services.LocalErrorReporter
import com.nexify.connect.services.NexifyLog
import com.nexify.connect.ui.components.*
import kotlinx.coroutines.flow.catch
import com.nexify.connect.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.RepeatMode
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.ExperimentalFoundationApi

// ── RELATIVE PRESENCE PARSER ──────────────────────────────────
fun getRelativeTimeString(date: Date?, onlineStatus: Boolean): String {
    if (onlineStatus) return "online"
    if (date == null) return "offline"
    val diff = Date().time - date.time
    val seconds = diff / 1000
    val minutes = seconds / 60
    val hours = minutes / 60
    val days = hours / 24
    
    return when {
        seconds < 30 -> "online"
        minutes < 60 -> "Last seen ${minutes}m ago"
        hours < 24 -> "Last seen ${hours}h ago"
        else -> "Last seen ${days}d ago"
    }
}

// ── LOGIN SCREEN ─────────────────────────────────────────────
@Composable
fun LoginScreen(navController: NavController, repository: FirebaseRepository) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "NEXIFY CONNECT",
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                color = CyanNeon
            )
            Text(
                text = "Enter the social gateway of the future",
                fontSize = 12.sp,
                color = TextMuted
            )

            Spacer(modifier = Modifier.height(16.dp))

            PremiumTextField(
                value = email,
                onValueChange = { email = it },
                placeholder = "Email Address",
                leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, color = CyanNeon) }
            )

            PremiumTextField(
                value = password,
                onValueChange = { password = it },
                placeholder = "Password",
                visualTransformation = PasswordVisualTransformation(),
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, color = CyanNeon) }
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (isLoading) {
                CircularProgressIndicator(color = CyanNeon)
            } else {
                PremiumButton(
                    text = "AUTHENTICATE",
                    onClick = {
                        if (email.isEmpty() || password.isEmpty()) return@PremiumButton
                        coroutineScope.launch {
                            isLoading = true
                            try {
                                repository.login(email, password)
                                navController.navigate("home") {
                                    popUpTo("login") { inclusive = true }
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, e.message ?: "Auth failed.", Toast.LENGTH_SHORT).show()
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedButton(
                    onClick = {
                        coroutineScope.launch {
                            isLoading = true
                            try {
                                val success = repository.signInWithGoogle("mock_google_id_token")
                                if (success) {
                                    navController.navigate("home") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, e.message ?: "Google Auth failed.", Toast.LENGTH_SHORT).show()
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text("G  ", fontWeight = FontWeight.Bold, color = CyanNeon, fontSize = 16.sp)
                        Text("SIGN IN WITH GOOGLE", fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                }
            }

            TextButton(onClick = { 
                navController.navigate("signup") {
                    popUpTo("login") { inclusive = true }
                }
            }) {
                Text("Create new avatar profile", color = PurpleNeon)
            }
        }
    }
}

// ── SIGN UP SCREEN ────────────────────────────────────────────
@Composable
fun SignUpScreen(navController: NavController, repository: FirebaseRepository) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var inviteCode by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "INITIALIZE PROFILE",
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                color = PurpleNeon
            )

            PremiumTextField(
                value = username,
                onValueChange = { username = it },
                placeholder = "Citizen Username",
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, color = PurpleNeon) }
            )

            PremiumTextField(
                value = email,
                onValueChange = { email = it },
                placeholder = "Email Address",
                leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, color = PurpleNeon) }
            )

            PremiumTextField(
                value = password,
                onValueChange = { password = it },
                placeholder = "Secure Password",
                visualTransformation = PasswordVisualTransformation(),
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, color = PurpleNeon) }
            )

            PremiumTextField(
                value = inviteCode,
                onValueChange = { inviteCode = it },
                placeholder = "Access / Invite Code",
                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, color = PurpleNeon) }
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (isLoading) {
                CircularProgressIndicator(color = PurpleNeon)
            } else {
                PremiumButton(
                    text = "REGISTER CITIZEN",
                    onClick = {
                        if (email.isEmpty() || password.isEmpty() || username.isEmpty() || inviteCode.isEmpty()) return@PremiumButton
                        coroutineScope.launch {
                            isLoading = true
                            try {
                                repository.signUp(email, password, username, inviteCode)
                                navController.navigate("home") {
                                    popUpTo("signup") { inclusive = true }
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, e.message ?: "Sign up failed.", Toast.LENGTH_SHORT).show()
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = listOf(CyanNeon, PurpleNeon)
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedButton(
                    onClick = {
                        coroutineScope.launch {
                            isLoading = true
                            try {
                                val success = repository.signInWithGoogle("mock_google_id_token")
                                if (success) {
                                    navController.navigate("home") {
                                        popUpTo("signup") { inclusive = true }
                                    }
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, e.message ?: "Google Sign Up failed.", Toast.LENGTH_SHORT).show()
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text("G  ", fontWeight = FontWeight.Bold, color = CyanNeon, fontSize = 16.sp)
                        Text("SIGN IN WITH GOOGLE", fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                }
            }

            TextButton(onClick = { 
                navController.navigate("login") {
                    popUpTo("signup") { inclusive = true }
                }
            }) {
                Text("Already registered? Login", color = CyanNeon)
            }
        }
    }
}

// ── EDIT PROFILE / CHANGE DP SCREEN (with AI Bio Generation) ────────
@Composable
fun ProfileCustomizationScreen(navController: NavController, repository: FirebaseRepository) {
    val uid = repository.currentUserId ?: ""
    val userProfile by repository.subscribeToUser(uid).safeCollect("ProfileCustomizationScreen", null).collectAsState(initial = null)
    
    var bioText by remember { mutableStateOf("") }
    var isUploading by remember { mutableStateOf(false) }
    var showAiBioDialog by remember { mutableStateOf(false) }
    var aiInterestInput by remember { mutableStateOf("") }
    var isGeneratingBio by remember { mutableStateOf(false) }
    
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(userProfile) {
        userProfile?.let { bioText = it.bio }
    }

    val imageLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            coroutineScope.launch {
                isUploading = true
                try {
                    Toast.makeText(context, "Compressing & uploading...", Toast.LENGTH_SHORT).show()
                    val secureUrl = CloudinaryService.uploadImage(context, it)
                    repository.updateProfileImage(secureUrl)
                    Toast.makeText(context, "Profile Image Updated!", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    Toast.makeText(context, e.message ?: "Upload failed.", Toast.LENGTH_LONG).show()
                } finally {
                    isUploading = false
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, color = Color.White)
            }
            Text("Edit Profile", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        Spacer(modifier = Modifier.height(10.dp))

        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(130.dp)
        ) {
            AsyncImage(
                model = userProfile?.profileImage,
                contentDescription = "Profile Picture",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .border(3.dp, Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)), CircleShape)
                    .clickable { imageLauncher.launch("image/*") }
            )

            if (isUploading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.6f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = CyanNeon)
                }
            } else {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .background(PurpleNeon, CircleShape)
                        .padding(8.dp)
                        .border(1.dp, Color.Black, CircleShape)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, color = Color.White, modifier = Modifier.size(16.dp))
                }
            }
        }

        Text(
            text = userProfile?.username ?: "Citizen",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Text(
            text = userProfile?.email ?: "",
            fontSize = 13.sp,
            color = TextMuted
        )

        Spacer(modifier = Modifier.height(10.dp))

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("BIOGRAPHY", fontSize = 11.sp, color = CyanNeon, fontWeight = FontWeight.Bold)
                
                Row(
                    modifier = Modifier
                        .clickable { showAiBioDialog = true }
                        .padding(horizontal = 6.dp, vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(12.dp))
                    Text("AI Suggest", color = CyanNeon, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            PremiumTextField(
                value = bioText,
                onValueChange = { bioText = it },
                placeholder = "Write something futuristic about yourself..."
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        PremiumButton(
            text = "SAVE CHANGES",
            onClick = {
                coroutineScope.launch {
                    repository.updateProfileBio(bioText)
                    Toast.makeText(context, "Profile bio updated!", Toast.LENGTH_SHORT).show()
                    navController.popBackStack()
                }
            },
            modifier = Modifier.fillMaxWidth()
        )
    }

    if (showAiBioDialog) {
        AlertDialog(
            onDismissRequest = { showAiBioDialog = false },
            title = { Text("Generate Futuristic Bio", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Tell Nexify AI your interests (e.g. studying, fitness, coding) to generate a cyber bio:", color = TextMuted, fontSize = 13.sp)
                    PremiumTextField(
                        value = aiInterestInput,
                        onValueChange = { aiInterestInput = it },
                        placeholder = "e.g. gaming, lofi, tech"
                    )
                    if (isGeneratingBio) {
                        CircularProgressIndicator(color = CyanNeon, modifier = Modifier.align(Alignment.CenterHorizontally))
                    }
                }
            },
            confirmButton = {
                PremiumButton(
                    text = "GENERATE",
                    onClick = {
                        if (aiInterestInput.isNotEmpty()) {
                            coroutineScope.launch {
                                isGeneratingBio = true
                                try {
                                    val suggested = AiService.generateBio(aiInterestInput)
                                    bioText = suggested
                                    showAiBioDialog = false
                                } catch (e: Exception) {
                                    Toast.makeText(context, "AI core error.", Toast.LENGTH_SHORT).show()
                                } finally {
                                    isGeneratingBio = false
                                }
                            }
                        }
                    }
                )
    }
}

// ── FIND CITIZENS / ADD FRIEND SCREEN (Sliding Invites Tab) ────────────────
@Composable
fun FindFriendsScreen(navController: NavController, repository: FirebaseRepository) {
    var searchQuery by remember { mutableStateOf("") }
    val currentUserProfile by repository.subscribeToUser(repository.currentUserId ?: "").safeCollect("FindFriendsScreen_currentUser", null).collectAsState(initial = null)
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    var activeSubTab by remember { mutableStateOf("Search") }
    var searchResults by remember { mutableStateOf<List<User>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }

    val receivedRequestIds = currentUserProfile?.requestsReceived ?: emptyList()
    val requestUsersFlow = remember(receivedRequestIds) {
        repository.subscribeToUsersByIds(receivedRequestIds)
    }
    val requestsList by requestUsersFlow.safeCollect("FindFriendsScreen_requests", emptyList()).collectAsState(initial = emptyList())

    fun runFriendAction(successMessage: String, action: suspend () -> Unit) {
        coroutineScope.launch {
            try {
                action()
                Toast.makeText(context, successMessage, Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, e.message ?: "Action failed.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    LaunchedEffect(activeSubTab, searchQuery, repository.currentUserId) {
        val normalizedQuery = searchQuery.trim().lowercase()
        searchResults = emptyList()
        if (activeSubTab != "Search" || normalizedQuery.isBlank()) {
            isSearching = false
            return@LaunchedEffect
        }

        isSearching = true
        delay(400)
        repository.searchUsersByUsername(normalizedQuery).collect { users ->
            searchResults = users
            isSearching = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, color = Color.White)
            }
            Text("Citizen Directory", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        // Sliding Sub-Tabs for Search vs Received Requests
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            TabButton(
                text = "Search Citizens",
                active = activeSubTab == "Search",
                onClick = { activeSubTab = "Search" }
            )
            TabButton(
                text = "Received Invites (${currentUserProfile?.requestsReceived?.size ?: 0})",
                active = activeSubTab == "Requests",
                onClick = { activeSubTab = "Requests" }
            )
        }

        if (activeSubTab == "Search") {
            PremiumTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it.lowercase() },
                placeholder = "Search by username...",
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, color = CyanNeon) }
            )

            if (searchQuery.isBlank()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Search citizens by username.", color = TextMuted, fontSize = 14.sp)
                }
            } else if (isSearching) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = CyanNeon)
                }
            } else if (searchResults.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No users found", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(searchResults, key = { it.userId }) { targetUser ->
                        GlassmorphicCard(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    PresenceIndicator(
                                        imageUrl = targetUser.profileImage,
                                        onlineStatus = targetUser.onlineStatus
                                    )
                                    Column {
                                        Text(targetUser.username, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                        Text(targetUser.email, color = TextMuted, fontSize = 12.sp)
                                    }
                                }

                                val status = when {
                                    currentUserProfile?.blockedUsers?.contains(targetUser.userId) == true -> "blocked"
                                    currentUserProfile?.friends?.contains(targetUser.userId) == true -> "friends"
                                    currentUserProfile?.requestsSent?.contains(targetUser.userId) == true -> "sent"
                                    currentUserProfile?.requestsReceived?.contains(targetUser.userId) == true -> "received"
                                    else -> "none"
                                }

                                when (status) {
                                    "blocked" -> {
                                        Button(
                                            onClick = {
                                                runFriendAction("User unblocked.") {
                                                    repository.unblockUser(targetUser.userId)
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF5555)),
                                            shape = RoundedCornerShape(20.dp)
                                        ) {
                                            Icon(Icons.Default.Block, contentDescription = null, color = Color.White, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Blocked", color = Color.White, fontSize = 12.sp)
                                        }
                                    }
                                    "friends" -> {
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Button(
                                                onClick = {
                                                    val chatId = repository.getChatId(targetUser.userId)
                                                    navController.navigate("chat/$chatId/${targetUser.userId}")
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = CyanNeon),
                                                shape = RoundedCornerShape(20.dp)
                                            ) {
                                                Icon(Icons.Default.Message, contentDescription = null, color = Color.Black)
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Message", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                            IconButton(
                                                onClick = {
                                                    runFriendAction("User blocked.") {
                                                        repository.blockUser(targetUser.userId)
                                                    }
                                                },
                                                modifier = Modifier.size(36.dp)
                                            ) {
                                                Icon(Icons.Default.Block, contentDescription = "Block", color = Color.Red)
                                            }
                                        }
                                    }
                                    "sent" -> {
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Button(
                                                onClick = {
                                                    runFriendAction("Request cancelled.") {
                                                        repository.cancelFriendRequest(targetUser.userId)
                                                    }
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                                                shape = RoundedCornerShape(20.dp)
                                            ) {
                                                Text("Pending", color = Color.White, fontSize = 12.sp)
                                            }
                                            IconButton(
                                                onClick = {
                                                    runFriendAction("User blocked.") {
                                                        repository.blockUser(targetUser.userId)
                                                    }
                                                },
                                                modifier = Modifier.size(36.dp)
                                            ) {
                                                Icon(Icons.Default.Block, contentDescription = "Block", color = Color.Red)
                                            }
                                        }
                                    }
                                    "received" -> {
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Button(
                                                onClick = {
                                                    runFriendAction("Accepted request!") {
                                                        repository.acceptFriendRequest(targetUser.userId)
                                                    }
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = PurpleNeon),
                                                shape = RoundedCornerShape(20.dp),
                                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Text("Accept", color = Color.White, fontSize = 11.sp)
                                            }
                                            OutlinedButton(
                                                onClick = {
                                                    runFriendAction("Rejected request.") {
                                                        repository.rejectFriendRequest(targetUser.userId)
                                                    }
                                                },
                                                border = BorderStroke(1.dp, Color.Red),
                                                shape = RoundedCornerShape(20.dp),
                                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Text("Reject", color = Color.Red, fontSize = 11.sp)
                                            }
                                            IconButton(
                                                onClick = {
                                                    runFriendAction("User blocked.") {
                                                        repository.blockUser(targetUser.userId)
                                                    }
                                                },
                                                modifier = Modifier.size(36.dp)
                                            ) {
                                                Icon(Icons.Default.Block, contentDescription = "Block", color = Color.Red)
                                            }
                                        }
                                    }
                                    "none" -> {
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Button(
                                                onClick = {
                                                    runFriendAction("Friend request sent!") {
                                                        repository.sendFriendRequest(targetUser.userId)
                                                    }
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                                                shape = RoundedCornerShape(20.dp),
                                                modifier = Modifier
                                                    .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)), RoundedCornerShape(20.dp))
                                            ) {
                                                Icon(Icons.Default.PersonAdd, contentDescription = null, color = Color.White, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Add", color = Color.White, fontSize = 12.sp)
                                            }
                                            IconButton(
                                                onClick = {
                                                    runFriendAction("User blocked.") {
                                                        repository.blockUser(targetUser.userId)
                                                    }
                                                },
                                                modifier = Modifier.size(36.dp)
                                            ) {
                                                Icon(Icons.Default.Block, contentDescription = "Block", color = Color.Red)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Received Requests view
            if (requestsList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No pending invitations received.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(requestsList, key = { it.userId }) { sender ->
                        GlassmorphicCard(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    PresenceIndicator(
                                        imageUrl = sender.profileImage,
                                        onlineStatus = sender.onlineStatus
                                    )
                                    Column {
                                        Text(sender.username, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                        Text(sender.email, color = TextMuted, fontSize = 12.sp)
                                    }
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = {
                                            runFriendAction("Accepted invite!") {
                                                repository.acceptFriendRequest(sender.userId)
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = PurpleNeon),
                                        shape = RoundedCornerShape(20.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text("Accept", color = Color.White, fontSize = 12.sp)
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            runFriendAction("Rejected invite.") {
                                                repository.rejectFriendRequest(sender.userId)
                                            }
                                        },
                                        border = BorderStroke(1.dp, Color.Red),
                                        shape = RoundedCornerShape(20.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text("Reject", color = Color.Red, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── DIRECT MESSAGES & GROUP LISTS (with AI Shortcut) ───────────────────
@Composable
fun ChatListScreen(navController: NavController, repository: FirebaseRepository) {
    val chats by repository.subscribeToChats().safeCollect("ChatListScreen_chats", emptyList()).collectAsState(initial = emptyList())
    val groups by repository.subscribeToGroups().safeCollect("ChatListScreen_groups", emptyList()).collectAsState(initial = emptyList())
    val allUsers by repository.subscribeToAllUsers().safeCollect("ChatListScreen_users", emptyList()).collectAsState(initial = emptyList())
    
    var currentTab by remember { mutableStateOf("DMs") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Nexify Hub", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = CyanNeon)
            Row {
                IconButton(onClick = { navController.navigate("ai_chat") }) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = "AI Assistant", tint = CyanNeon)
                }
                IconButton(onClick = { navController.navigate("settings") }) {
                    Icon(Icons.Default.Settings, contentDescription = "Settings", color = Color.White)
                }
                IconButton(onClick = { navController.navigate("find") }) {
                    Icon(Icons.Default.PersonAdd, contentDescription = null, color = Color.White)
                }
                IconButton(onClick = { navController.navigate("rooms") }) {
                    Icon(Icons.Default.Explore, contentDescription = null, color = Color.White)
                }
                IconButton(onClick = { navController.navigate("chat_rooms") }) {
                    Icon(Icons.Default.Groups, contentDescription = "Chat Rooms", tint = CyanNeon)
                }
                IconButton(onClick = { navController.navigate("leaderboard") }) {
                    Icon(Icons.Default.Star, contentDescription = "Leaderboard", tint = Color.White)
                }
                IconButton(onClick = {
                    repository.logout()
                    navController.navigate("login") {
                        popUpTo(0)
                    }
                }) {
                    Icon(Icons.Default.ExitToApp, contentDescription = null, color = Color.Red)
                }
            }
        }

        // Nexify Apps Quick Launcher Bar
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 4.dp)
        ) {
            item {
                AppLaunchChip(
                    label = "⏱️ Focus Pod",
                    onClick = { navController.navigate("focus_pod") }
                )
            }
            item {
                AppLaunchChip(
                    label = "🏋️ Nexify Fit",
                    onClick = { navController.navigate("fitness") }
                )
            }
            item {
                AppLaunchChip(
                    label = "⚡ Nexify Edge",
                    onClick = { navController.navigate("nexify_edge") }
                )
            }
            item {
                AppLaunchChip(
                    label = "🌊 Waves (Soon)",
                    onClick = { /* Locked */ },
                    enabled = false
                )
            }
        }

        // Tab Selector
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            TabButton(text = "Direct Messages", active = currentTab == "DMs", onClick = { currentTab = "DMs" })
            TabButton(text = "Group Chats", active = currentTab == "Groups", onClick = { currentTab = "Groups" })
        }

        if (currentTab == "DMs") {
            if (chats.isEmpty()) {
                Box(modifier = Modifier.fillGrid(), contentAlignment = Alignment.Center) {
                    Text("No active DMs. Find friends to connect!", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(chats) { chat ->
                        val otherUserId = chat.participants.find { it != repository.currentUserId } ?: ""
                        val otherUserProfile = allUsers.find { it.userId == otherUserId }

                        if (otherUserProfile != null) {
                            GlassmorphicCard(
                                modifier = Modifier.fillMaxWidth(),
                                onClick = {
                                    navController.navigate("chat/${chat.chatId}/$otherUserId")
                                }
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        PresenceIndicator(
                                            imageUrl = otherUserProfile.profileImage,
                                            onlineStatus = otherUserProfile.onlineStatus
                                        )
                                        Column {
                                            Text(otherUserProfile.username, color = Color.White, fontWeight = FontWeight.Bold)
                                            Text(
                                                text = if (chat.typingStatus[otherUserId] == true) "typing..." else chat.lastMessage,
                                                color = if (chat.typingStatus[otherUserId] == true) CyanNeon else TextMuted,
                                                fontSize = 13.sp,
                                                maxLines = 1
                                            )
                                        }
                                    }

                                    chat.timestamp?.let {
                                        Text(
                                            text = SimpleDateFormat("h:mm a", Locale.getDefault()).format(it),
                                            color = TextMuted,
                                            fontSize = 11.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Groups Tab
            Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Your Active Pods", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    IconButton(onClick = { navController.navigate("create_group") }) {
                        Icon(Icons.Default.GroupAdd, contentDescription = null, color = CyanNeon)
                    }
                }

                if (groups.isEmpty()) {
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("No active groups. Initialize a group!", color = TextMuted, fontSize = 14.sp)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(groups) { group ->
                            GlassmorphicCard(
                                modifier = Modifier.fillMaxWidth(),
                                onClick = { navController.navigate("group/${group.groupId}") }
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    AsyncImage(
                                        model = group.groupImage,
                                        contentDescription = null,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier
                                            .size(50.dp)
                                            .clip(CircleShape)
                                            .border(1.5.dp, PurpleNeon, CircleShape)
                                    )
                                    Column {
                                        Text(group.name, color = Color.White, fontWeight = FontWeight.Bold)
                                        Text("${group.members.size} members connected", color = TextMuted, fontSize = 13.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── DIRECT DM CONVERSATION SCREEN (with AI Smart Reply Chips) ─────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatConversationScreen(navController: NavController, repository: FirebaseRepository, chatId: String, otherUserId: String) {
    val messages by repository.subscribeToMessages(chatId).safeCollect("ChatConversationScreen_messages", emptyList()).collectAsState(initial = emptyList())
    val otherUserProfile by repository.subscribeToUser(otherUserId).safeCollect("ChatConversationScreen_otherUser", null).collectAsState(initial = null)
    val currentUserProfile by repository.subscribeToUser(repository.currentUserId ?: "").safeCollect("ChatConversationScreen_currentUser", null).collectAsState(initial = null)
    val chatMeta by repository.subscribeToChats().safeCollect("ChatConversationScreen_meta", emptyList()).collectAsState(initial = emptyList())
    val stickers by repository.subscribeToStickers().safeCollect("ChatConversationScreen_stickers", emptyList()).collectAsState(initial = emptyList())

    var typedText by remember { mutableStateOf("") }
    var isUploadingMedia by remember { mutableStateOf(false) }
    var showStickerSheet by remember { mutableStateOf(false) }
    
    // Dynamic Smart Replies
    var smartReplies by remember { mutableStateOf<List<String>>(emptyList()) }
    val lastMessageText = messages.lastOrNull()?.let { if (it.senderId != repository.currentUserId) it.text ?: "" else "" } ?: ""
    
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(chatId, otherUserId) {
        coroutineScope.launch {
            try {
                repository.createChatIfNotExists(chatId, otherUserId)
            } catch (e: Exception) {
                NexifyLog.e("ChatConversationScreen", "Failed to auto-create DM metadata doc.", e)
            }
        }
    }

    LaunchedEffect(messages.size) {
        repository.markMessagesAsSeen(chatId)
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    // AI tag check on incoming DM messages
    LaunchedEffect(messages) {
        val lastMsg = messages.lastOrNull()
        if (lastMsg != null && lastMsg.senderId == repository.currentUserId && lastMsg.text?.contains("@nexifyai", ignoreCase = true) == true) {
            coroutineScope.launch {
                try {
                    repository.processChatAITag(chatId, messages)
                } catch (e: Exception) {
                    NexifyLog.e("ChatConversationScreen", "Failed to auto-trigger AI reply", e)
                }
            }
        }
    }

    LaunchedEffect(typedText) {
        repository.setTypingStatus(chatId, typedText.isNotEmpty())
    }

    // Trigger AI Smart suggestions whenever a new message lands
    LaunchedEffect(lastMessageText) {
        if (lastMessageText.isNotEmpty()) {
            smartReplies = AiService.getSmartReplies(lastMessageText)
        } else {
            smartReplies = emptyList()
        }
    }

    // Media Picker launcher
    val mediaLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            coroutineScope.launch {
                isUploadingMedia = true
                try {
                    val imageUrl = CloudinaryService.uploadImage(context, it)
                    repository.sendMessage(chatId, otherUserId, imageUrl = imageUrl)
                } catch (e: Exception) {
                    Toast.makeText(context, e.message ?: "Failed to transmit media.", Toast.LENGTH_SHORT).show()
                } finally {
                    isUploadingMedia = false
                }
            }
        }
    }

    val activeChat = chatMeta.find { it.chatId == chatId }
    val isOtherTyping = activeChat?.typingStatus?.get(otherUserId) == true

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
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.Default.ArrowBack, contentDescription = null, color = Color.White)
                }
                otherUserProfile?.let {
                    PresenceIndicator(imageUrl = it.profileImage, onlineStatus = it.onlineStatus, size = 40)
                    Column {
                        Text(it.username, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(
                            text = if (isOtherTyping) "typing..." else getRelativeTimeString(it.lastSeen, it.onlineStatus),
                            color = if (isOtherTyping) CyanNeon else if (it.onlineStatus) Color.Green else TextMuted,
                            fontSize = 11.sp
                        )
                    }
                }
            }
            
            // Calling Actions (Voice Call & Video Call buttons)
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = {
                    coroutineScope.launch {
                        try {
                            val callId = repository.startCall(otherUserId)
                            navController.navigate("call/$callId/$otherUserId/true")
                        } catch (e: Exception) {
                            Toast.makeText(context, "Voice call signal failed.", Toast.LENGTH_SHORT).show()
                        }
                    }
                }) {
                    Icon(Icons.Default.Phone, contentDescription = "Voice Call", tint = CyanNeon)
                }
                IconButton(onClick = {
                    coroutineScope.launch {
                        try {
                            val callId = repository.startCall(otherUserId)
                            navController.navigate("call/$callId/$otherUserId/true")
                        } catch (e: Exception) {
                            Toast.makeText(context, "Video call signal failed.", Toast.LENGTH_SHORT).show()
                        }
                    }
                }) {
                    Icon(Icons.Default.Videocam, contentDescription = "Video Call", tint = PurpleNeon)
                }
            }
        }

        // Messages List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            items(messages) { message ->
                val isMe = message.senderId == repository.currentUserId
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isMe) Alignment.CenterEnd else Alignment.CenterStart
                ) {
                    Column(horizontalAlignment = if (isMe) Alignment.End else Alignment.Start) {
                        when {
                            message.imageUrl != null -> {
                                AsyncImage(
                                    model = message.imageUrl,
                                    contentDescription = "Image message",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(width = 200.dp, height = 240.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .border(1.dp, if (isMe) PurpleNeon else CardBorder, RoundedCornerShape(16.dp))
                                )
                            }
                            message.stickerUrl != null -> {
                                AsyncImage(
                                    model = message.stickerUrl,
                                    contentDescription = "Sticker message",
                                    modifier = Modifier.size(120.dp)
                                )
                            }
                            else -> {
                                Box(
                                    modifier = Modifier
                                        .clip(
                                            RoundedCornerShape(
                                                topStart = 16.dp,
                                                topEnd = 16.dp,
                                                bottomStart = if (isMe) 16.dp else 0.dp,
                                                bottomEnd = if (isMe) 0.dp else 16.dp
                                            )
                                        )
                                        .background(if (isMe) PurpleNeon else CardBg)
                                        .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                                        .padding(12.dp)
                                ) {
                                    Text(message.text ?: "", color = Color.White, fontSize = 14.sp)
                                }
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier.padding(top = 2.dp)
                        ) {
                            message.timestamp?.let {
                                Text(
                                    text = SimpleDateFormat("h:mm a", Locale.getDefault()).format(it),
                                    color = TextMuted,
                                    fontSize = 10.sp
                                )
                            }
                            if (isMe) {
                                Icon(
                                    imageVector = if (message.seen) Icons.Default.CheckCircle else Icons.Default.Check,
                                    contentDescription = null,
                                    tint = if (message.seen) CyanNeon else Color.Gray,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        if (isUploadingMedia) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CircularProgressIndicator(color = CyanNeon, modifier = Modifier.size(16.dp))
                Text("Uploading media to cloud...", color = CyanNeon, fontSize = 12.sp)
            }
        }

        val isFriend = currentUserProfile?.friends?.contains(otherUserId) == true

        if (!isFriend) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .background(Color.Red.copy(alpha = 0.08f), RoundedCornerShape(16.dp))
                    .border(1.dp, Color.Red.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                    .padding(vertical = 20.dp, horizontal = 16.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = Color.Red,
                        modifier = Modifier.size(28.dp)
                    )
                    Text(
                        text = "Secure Connection Required",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "You must be mutually connected as friends to unlock the secure chat line.",
                        color = TextMuted,
                        fontSize = 12.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            // AI Smart Suggestion Chips
            if (smartReplies.isNotEmpty()) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(smartReplies) { reply ->
                        Box(
                            modifier = Modifier
                                .background(CardBg, RoundedCornerShape(16.dp))
                                .border(1.dp, CyanNeon.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                                .clickable { typedText = reply }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(reply, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Input Form
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(onClick = { mediaLauncher.launch("image/*") }) {
                    Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = CyanNeon)
                }
                IconButton(onClick = { showStickerSheet = true }) {
                    Icon(Icons.Default.SentimentSatisfied, contentDescription = null, tint = CyanNeon)
                }

                PremiumTextField(
                    value = typedText,
                    onValueChange = { typedText = it },
                    placeholder = "Transmit DM...",
                    modifier = Modifier.weight(1f)
                )

                IconButton(
                    onClick = {
                        if (typedText.isEmpty()) return@IconButton
                        coroutineScope.launch {
                            try {
                                repository.sendMessage(chatId, otherUserId, text = typedText)
                                typedText = ""
                            } catch (e: Exception) {
                                Toast.makeText(context, e.message ?: "Blocked.", Toast.LENGTH_LONG).show()
                            }
                        }
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)))
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, color = Color.White)
                }
            }
        }
    }

    // STICKER PICKER BOTTOM SHEET
    if (showStickerSheet) {
        ModalBottomSheet(
            onDismissRequest = { showStickerSheet = false },
            containerColor = Color(0xFF161128),
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Choose sticker", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(260.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(stickers) { sticker ->
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .background(CardBg, RoundedCornerShape(12.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
                                .clickable {
                                    coroutineScope.launch {
                                        repository.sendMessage(
                                            chatId,
                                            otherUserId,
                                            stickerId = sticker.stickerId,
                                            stickerUrl = sticker.imageUrl
                                        )
                                        showStickerSheet = false
                                    }
                                }
                                .padding(12.dp)
                        ) {
                            AsyncImage(
                                model = sticker.imageUrl,
                                contentDescription = null,
                                modifier = Modifier.size(65.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ── CREATE GROUP / CHAT POD SCREEN ─────────────────────────────────
@Composable
fun CreateGroupScreen(navController: NavController, repository: FirebaseRepository) {
    var groupName by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var uploadedImageUrl by remember { mutableStateOf("") }
    var isUploading by remember { mutableStateOf(false) }

    val friendsList by repository.subscribeToAllUsers().safeCollect("CreateGroupScreen_friends", emptyList()).collectAsState(initial = emptyList())
    val selectedMembers = remember { mutableStateListOf<String>() }

    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            selectedImageUri = it
            coroutineScope.launch {
                isUploading = true
                try {
                    Toast.makeText(context, "Uploading pod avatar...", Toast.LENGTH_SHORT).show()
                    uploadedImageUrl = CloudinaryService.uploadImage(context, it)
                    Toast.makeText(context, "Avatar loaded!", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    Toast.makeText(context, e.message ?: "Media upload failed.", Toast.LENGTH_SHORT).show()
                } finally {
                    isUploading = false
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, color = Color.White)
            }
            Text("Create Chat Pod", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(CardBg)
                    .border(2.dp, PurpleNeon, CircleShape)
                    .clickable { galleryLauncher.launch("image/*") },
                contentAlignment = Alignment.Center
            ) {
                if (selectedImageUri != null) {
                    AsyncImage(
                        model = selectedImageUri,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(Icons.Default.CameraAlt, contentDescription = null, tint = TextMuted)
                }

                if (isUploading) {
                    Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(0.6f)), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = CyanNeon, modifier = Modifier.size(24.dp))
                    }
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                PremiumTextField(
                    value = groupName,
                    onValueChange = { groupName = it },
                    placeholder = "Pod Name"
                )
            }
        }

        Text("Select Citizens to Join", color = CyanNeon, fontWeight = FontWeight.Bold, fontSize = 13.sp)

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(friendsList) { friend ->
                val isChecked = selectedMembers.contains(friend.userId)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CardBg, RoundedCornerShape(12.dp))
                        .clickable {
                            if (isChecked) selectedMembers.remove(friend.userId) else selectedMembers.add(friend.userId)
                        }
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        PresenceIndicator(imageUrl = friend.profileImage, onlineStatus = friend.onlineStatus)
                        Text(friend.username, color = Color.White)
                    }
                    Checkbox(
                        checked = isChecked,
                        onCheckedChange = {
                            if (it) selectedMembers.add(friend.userId) else selectedMembers.remove(friend.userId)
                        },
                        colors = CheckboxDefaults.colors(checkedColor = CyanNeon)
                    )
                }
            }
        }

        PremiumButton(
            text = "INITIALIZE POD",
            onClick = {
                if (groupName.isEmpty()) return@PremiumButton
                coroutineScope.launch {
                    try {
                        repository.createGroup(groupName, selectedMembers.toList(), uploadedImageUrl)
                        Toast.makeText(context, "Group created successfully!", Toast.LENGTH_SHORT).show()
                        navController.navigate("home") {
                            popUpTo("create_group") { inclusive = true }
                        }
                    } catch (e: Exception) {
                        Toast.makeText(context, e.message ?: "Failed.", Toast.LENGTH_SHORT).show()
                    }
                }
            },
            modifier = Modifier.fillMaxWidth()
        )
    }
}

// ── GROUP CONVERSATION SCREEN ──────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GroupChatScreen(navController: NavController, repository: FirebaseRepository, groupId: String) {
    val uid = repository.currentUserId ?: ""
    val groups by repository.subscribeToGroups().safeCollect("GroupChatScreen_groups", emptyList()).collectAsState(initial = emptyList())
    val messages by repository.subscribeToGroupMessages(groupId).safeCollect("GroupChatScreen_messages", emptyList()).collectAsState(initial = emptyList())
    val stickers by repository.subscribeToStickers().safeCollect("GroupChatScreen_stickers", emptyList()).collectAsState(initial = emptyList())
    val friendsList by repository.subscribeToAllUsers().safeCollect("GroupChatScreen_friends", emptyList()).collectAsState(initial = emptyList())

    val currentGroup = groups.find { it.groupId == groupId }
    val isAdmin = currentGroup?.adminId == uid

    var typedText by remember { mutableStateOf("") }
    var isUploadingMedia by remember { mutableStateOf(false) }
    var showStickerSheet by remember { mutableStateOf(false) }
    var showAdminPanel by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    val imageLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            coroutineScope.launch {
                isUploadingMedia = true
                try {
                    val imageUrl = CloudinaryService.uploadImage(context, it)
                    repository.sendGroupMessage(groupId, imageUrl = imageUrl)
                } catch (e: Exception) {
                    Toast.makeText(context, e.message ?: "Media failure.", Toast.LENGTH_SHORT).show()
                } finally {
                    isUploadingMedia = false
                }
            }
        }
    }

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
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.Default.ArrowBack, contentDescription = null, color = Color.White)
                }
                currentGroup?.let {
                    AsyncImage(
                        model = it.groupImage,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .border(1.dp, PurpleNeon, CircleShape)
                    )
                    Column {
                        Text(it.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("${it.members.size} active members", color = TextMuted, fontSize = 11.sp)
                    }
                }
            }

            IconButton(onClick = { showAdminPanel = true }) {
                Icon(Icons.Default.Info, contentDescription = null, tint = Color.White)
            }
        }

        // Messages List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            items(messages) { message ->
                val isMe = message.senderId == uid
                val senderName = friendsList.find { it.userId == message.senderId }?.username ?: "Citizen"

                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isMe) Alignment.CenterEnd else Alignment.CenterStart
                ) {
                    Column(horizontalAlignment = if (isMe) Alignment.End else Alignment.Start) {
                        if (!isMe) {
                            Text(senderName, color = CyanNeon, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 2.dp))
                        }
                        
                        when {
                            message.imageUrl != null -> {
                                AsyncImage(
                                    model = message.imageUrl,
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(width = 200.dp, height = 240.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .border(1.dp, if (isMe) PurpleNeon else CardBorder, RoundedCornerShape(16.dp))
                                )
                            }
                            message.stickerUrl != null -> {
                                AsyncImage(
                                    model = message.stickerUrl,
                                    contentDescription = null,
                                    modifier = Modifier.size(120.dp)
                                )
                            }
                            else -> {
                                Box(
                                    modifier = Modifier
                                        .clip(
                                            RoundedCornerShape(
                                                topStart = 16.dp,
                                                topEnd = 16.dp,
                                                bottomStart = if (isMe) 16.dp else 0.dp,
                                                bottomEnd = if (isMe) 0.dp else 16.dp
                                            )
                                        )
                                        .background(if (isMe) PurpleNeon else CardBg)
                                        .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                                        .padding(12.dp)
                                ) {
                                    Text(message.text ?: "", color = Color.White, fontSize = 14.sp)
                                }
                            }
                        }

                        message.timestamp?.let {
                            Text(
                                text = SimpleDateFormat("h:mm a", Locale.getDefault()).format(it),
                                color = TextMuted,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        if (isUploadingMedia) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CircularProgressIndicator(color = PurpleNeon, modifier = Modifier.size(16.dp))
                Text("Uploading media to cloud...", color = PurpleNeon, fontSize = 12.sp)
            }
        }

        // Input forms
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            IconButton(onClick = { imageLauncher.launch("image/*") }) {
                Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = CyanNeon)
            }
            IconButton(onClick = { showStickerSheet = true }) {
                Icon(Icons.Default.SentimentSatisfied, contentDescription = null, tint = CyanNeon)
            }

            PremiumTextField(
                value = typedText,
                onValueChange = { typedText = it },
                placeholder = "Pod broadcast...",
                modifier = Modifier.weight(1f)
            )

            IconButton(
                onClick = {
                    if (typedText.isEmpty()) return@IconButton
                    coroutineScope.launch {
                        try {
                            repository.sendGroupMessage(groupId, text = typedText)
                            typedText = ""
                        } catch (e: Exception) {
                            Toast.makeText(context, e.message ?: "Blocked.", Toast.LENGTH_LONG).show()
                        }
                    }
                },
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)))
            ) {
                Icon(Icons.Default.Send, contentDescription = null, color = Color.White)
            }
        }
    }

    // Sticker Picker Bottom Sheet
    if (showStickerSheet) {
        ModalBottomSheet(
            onDismissRequest = { showStickerSheet = false },
            containerColor = Color(0xFF161128)
        ) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Send Pod Sticker", color = Color.White, fontWeight = FontWeight.Bold)
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    modifier = Modifier.fillMaxWidth().height(260.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(stickers) { sticker ->
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .background(CardBg, RoundedCornerShape(12.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
                                .clickable {
                                    coroutineScope.launch {
                                        repository.sendGroupMessage(groupId, stickerId = sticker.stickerId, stickerUrl = sticker.imageUrl)
                                        showStickerSheet = false
                                    }
                                }
                                .padding(12.dp)
                        ) {
                            AsyncImage(model = sticker.imageUrl, contentDescription = null, modifier = Modifier.size(65.dp))
                        }
                    }
                }
            }
        }
    }

    // Admin Options Panel
    if (showAdminPanel && currentGroup != null) {
        ModalBottomSheet(
            onDismissRequest = { showAdminPanel = false },
            containerColor = Color(0xFF161128)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("Pod Management Panel", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                
                Text("Admin: ${if (isAdmin) "You (Sole Admin)" else "Citizen #${currentGroup.adminId.take(5)}"}", color = CyanNeon, fontSize = 12.sp)

                Divider(color = CardBorder)

                Text("Citizens in this Pod", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)

                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(currentGroup.members) { memberId ->
                        val memberProfile = friendsList.find { it.userId == memberId } ?: allUsers.find { it.userId == memberId }
                        val isMemberMe = memberId == uid

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CardBg, RoundedCornerShape(12.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                AsyncImage(
                                    model = memberProfile?.profileImage ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=$memberId",
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                )
                                Text(memberProfile?.username ?: "Citizen #${memberId.take(4)}", color = Color.White)
                            }

                            if (isAdmin && !isMemberMe) {
                                IconButton(
                                    onClick = {
                                        coroutineScope.launch {
                                            repository.removeMemberFromGroup(groupId, memberId)
                                            Toast.makeText(context, "Removed Citizen.", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = null, tint = Color.Red)
                                }
                            }
                        }
                    }
                }

                if (isAdmin) {
                    Divider(color = CardBorder)
                    Text("Add Friends to this Pod", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    val unaddedFriends = friendsList.filter { !currentGroup.members.contains(it.userId) }

                    if (unaddedFriends.isEmpty()) {
                        Text("All active citizens are already connected.", color = TextMuted, fontSize = 12.sp)
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(unaddedFriends) { friend ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(CardBg, RoundedCornerShape(12.dp))
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(friend.username, color = Color.White)
                                    IconButton(
                                        onClick = {
                                            coroutineScope.launch {
                                                repository.addMemberToGroup(groupId, friend.userId)
                                                Toast.makeText(context, "Citizen Added!", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = null, tint = CyanNeon)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── DISCORD-STYLE ROOMS SCREEN ──────────────────────────────────────
@Composable
fun RoomsScreen(navController: NavController, repository: FirebaseRepository) {
    val rooms by repository.subscribeToRooms().safeCollect("RoomsScreen_rooms", emptyList()).collectAsState(initial = emptyList())
    var showCreateDialog by remember { mutableStateOf(false) }
    
    var newRoomName by remember { mutableStateOf("") }
    var newRoomDesc by remember { mutableStateOf("") }
    var newRoomCategory by remember { mutableStateOf("Gaming 🎮") }

    val categories = listOf("General 💬", "Gaming 🎮", "Music 🎵", "Focus Pods ⚡")
    var selectedCategoryFilter by remember { mutableStateOf("All") }

    val coroutineScope = rememberCoroutineScope()

    val filteredRooms = rooms.filter {
        selectedCategoryFilter == "All" || it.category == selectedCategoryFilter
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.popBackStack() }) {
                    Icon(Icons.Default.ArrowBack, contentDescription = null, color = Color.White)
                }
                Text("Nexify Rooms", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = CyanNeon)
            }
            IconButton(onClick = { showCreateDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = null, color = Color.White)
            }
        }

        // Category Filter Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            TabButton(text = "All", active = selectedCategoryFilter == "All", onClick = { selectedCategoryFilter = "All" })
            categories.forEach { cat ->
                TabButton(text = cat, active = selectedCategoryFilter == cat, onClick = { selectedCategoryFilter = cat })
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(filteredRooms) { room ->
                val isMember = room.members.contains(repository.currentUserId)
                GlassmorphicCard(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = {
                        if (isMember) {
                            navController.navigate("room/${room.roomId}")
                        }
                    }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("# ${room.name}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(room.category, color = PurpleNeon, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            if (isMember) {
                                Pill(text = "Joined", color = CyanNeon)
                            } else {
                                Button(
                                    onClick = {
                                        coroutineScope.launch {
                                            repository.joinRoom(room.roomId)
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = PurpleNeon),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Text("Join", fontSize = 12.sp, color = Color.White)
                                }
                            }
                        }
                        Text(room.description, color = TextMuted, fontSize = 13.sp)
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.People, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(14.dp))
                            Text("${room.members.size} citizens inside", color = CyanNeon, fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("Initialize Custom Room", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    PremiumTextField(value = newRoomName, onValueChange = { newRoomName = it }, placeholder = "Room Name")
                    PremiumTextField(value = newRoomDesc, onValueChange = { newRoomDesc = it }, placeholder = "Room Description")
                    
                    Text("Select Category", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    
                    categories.forEach { cat ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { newRoomCategory = cat }
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = newRoomCategory == cat,
                                onClick = { newRoomCategory = cat },
                                colors = RadioButtonDefaults.colors(selectedColor = CyanNeon)
                            )
                            Text(cat, color = Color.White, fontSize = 14.sp)
                        }
                    }
                }
            },
            confirmButton = {
                PremiumButton(
                    text = "CREATE",
                    onClick = {
                        if (newRoomName.isNotEmpty()) {
                            coroutineScope.launch {
                                repository.createRoom(newRoomName, newRoomDesc, newRoomCategory, false)
                                newRoomName = ""
                                newRoomDesc = ""
                                showCreateDialog = false
                            }
                        }
                    }
                )
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("CANCEL", color = Color.Red)
                }
            },
            containerColor = Color(0xFF161128),
            shape = RoundedCornerShape(16.dp)
        )
    }
}

// ── 🤖 INTELLIGENT AI COMPANION PORTAL (Nexify AI Chat Screen) ────────
@Composable
fun AiChatScreen(navController: NavController, repository: FirebaseRepository) {
    LaunchedEffect(Unit) {
        repository.logFeatureUsage("ai_chat")
    }
    val uid = repository.currentUserId ?: ""
    val messages by repository.subscribeToAiMessages(uid).safeCollect("AiChatScreen_messages", emptyList()).collectAsState(initial = emptyList())
    var typedText by remember { mutableStateOf("") }
    var isAiGenerating by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    // Dialog state variables for tools
    var showReelDialog by remember { mutableStateOf(false) }
    var reelTopic by remember { mutableStateOf("") }

    var showCaptionDialog by remember { mutableStateOf(false) }
    var captionDesc by remember { mutableStateOf("") }
    var captionTone by remember { mutableStateOf("Chill") }

    var showPromptDialog by remember { mutableStateOf(false) }
    var promptTask by remember { mutableStateOf("") }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

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
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
            }
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon))),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.White)
            }
            Column {
                Text("Nexify AI", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                Text(
                    text = if (isAiGenerating) "Thinking..." else "Online & ready",
                    color = if (isAiGenerating) CyanNeon else Color.Green,
                    fontSize = 11.sp
                )
            }
        }

        // Messages List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            if (messages.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(48.dp))
                            Text("Yo citizen! I'm your futuristic companion.", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text("Ask me about workouts, study tips, or just vibe!", color = TextMuted, fontSize = 12.sp)
                        }
                    }
                }
            }

            items(messages) { message ->
                val isAi = message.sender == "ai"
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isAi) Alignment.CenterStart else Alignment.CenterEnd
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Top,
                        modifier = Modifier.fillMaxWidth(0.85f)
                    ) {
                        if (isAi) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(CyanNeon),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.Black, modifier = Modifier.size(16.dp))
                            }
                        }

                        Column(
                            modifier = Modifier.weight(1f),
                            horizontalAlignment = if (isAi) Alignment.Start else Alignment.End
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (isAi) CardBg else PurpleNeon)
                                    .border(1.dp, if (isAi) CyanNeon.copy(0.4f) else CardBorder, RoundedCornerShape(16.dp))
                                    .padding(12.dp)
                            ) {
                                Text(message.text, color = Color.White, fontSize = 14.sp)
                            }
                            Text(
                                text = SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date(message.timestamp)),
                                color = TextMuted,
                                fontSize = 9.sp,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        // Typing Loader
        if (isAiGenerating) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CircularProgressIndicator(color = CyanNeon, modifier = Modifier.size(14.dp))
                Text("Nexify AI is generating response...", color = CyanNeon, fontSize = 11.sp)
            }
        }

        // AI Quick Tools Row
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 4.dp)
        ) {
            item {
                ToolChip(
                    text = "🎬 Reel Idea",
                    onClick = { showReelDialog = true }
                )
            }
            item {
                ToolChip(
                    text = "✍️ Caption Gen",
                    onClick = { showCaptionDialog = true }
                )
            }
            item {
                ToolChip(
                    text = "🤖 Optimize Prompt",
                    onClick = { showPromptDialog = true }
                )
            }
        }

        // Input Form
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            PremiumTextField(
                value = typedText,
                onValueChange = { typedText = it },
                placeholder = "Vibe check with AI...",
                modifier = Modifier.weight(1f),
                leadingIcon = { Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = CyanNeon) }
            )

            IconButton(
                onClick = {
                    if (typedText.isEmpty()) return@IconButton
                    val prompt = typedText
                    typedText = ""
                    coroutineScope.launch {
                        try {
                            repository.sendAiMessage(uid, prompt) { generating ->
                                isAiGenerating = generating
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, e.message ?: "Blocked.", Toast.LENGTH_LONG).show()
                        }
                    }
                },
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)))
            ) {
                Icon(Icons.Default.Send, contentDescription = null, color = Color.White)
            }
        }
    }

    // --- Tool Dialogs ---

    if (showReelDialog) {
        AlertDialog(
            onDismissRequest = { showReelDialog = false },
            title = { Text("🎬 Reel Idea Generator", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Enter a topic or niche to brainstorm a structured viral Reel idea.", color = TextMuted, fontSize = 12.sp)
                    PremiumTextField(
                        value = reelTopic,
                        onValueChange = { reelTopic = it },
                        placeholder = "e.g., coding routine, gym hacks"
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (reelTopic.isNotBlank()) {
                            val topic = reelTopic
                            reelTopic = ""
                            showReelDialog = false
                            coroutineScope.launch {
                                try {
                                    repository.generateReelIdea(uid, topic) { generating ->
                                        isAiGenerating = generating
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, e.message ?: "Failed", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanNeon)
                ) {
                    Text("Generate", color = Color.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showReelDialog = false }) {
                    Text("Cancel", color = TextMuted)
                }
            },
            containerColor = Color(0xFF161128),
            shape = RoundedCornerShape(16.dp)
        )
    }

    if (showCaptionDialog) {
        AlertDialog(
            onDismissRequest = { showCaptionDialog = false },
            title = { Text("✍️ AI Caption Generator", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Describe your post and select the tone.", color = TextMuted, fontSize = 12.sp)
                    PremiumTextField(
                        value = captionDesc,
                        onValueChange = { captionDesc = it },
                        placeholder = "e.g., A developer debugging at 2 AM"
                    )
                    Text("Tone Selection", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        val tones = listOf("Chill", "Professional", "Hustle")
                        tones.forEach { t ->
                            val selected = captionTone == t
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { captionTone = t }
                                    .clip(RoundedCornerShape(8.dp))
                                    .border(
                                        1.dp,
                                        if (selected) CyanNeon else Color.Gray.copy(alpha = 0.4f),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .background(if (selected) CyanNeon.copy(alpha = 0.2f) else Color.Transparent)
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = t,
                                    color = if (selected) CyanNeon else Color.White,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (captionDesc.isNotBlank()) {
                            val desc = captionDesc
                            val tone = captionTone
                            captionDesc = ""
                            showCaptionDialog = false
                            coroutineScope.launch {
                                try {
                                    repository.generateCaption(uid, desc, tone) { generating ->
                                        isAiGenerating = generating
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, e.message ?: "Failed", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanNeon)
                ) {
                    Text("Generate", color = Color.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCaptionDialog = false }) {
                    Text("Cancel", color = TextMuted)
                }
            },
            containerColor = Color(0xFF161128),
            shape = RoundedCornerShape(16.dp)
        )
    }

    if (showPromptDialog) {
        AlertDialog(
            onDismissRequest = { showPromptDialog = false },
            title = { Text("🤖 AI Prompt Optimizer", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Turn a simple task description into a high-quality system prompt.", color = TextMuted, fontSize = 12.sp)
                    PremiumTextField(
                        value = promptTask,
                        onValueChange = { promptTask = it },
                        placeholder = "e.g., Translate text to SQL"
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (promptTask.isNotBlank()) {
                            val task = promptTask
                            promptTask = ""
                            showPromptDialog = false
                            coroutineScope.launch {
                                try {
                                    repository.generatePrompt(uid, task) { generating ->
                                        isAiGenerating = generating
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, e.message ?: "Failed", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanNeon)
                ) {
                    Text("Optimize", color = Color.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showPromptDialog = false }) {
                    Text("Cancel", color = TextMuted)
                }
            },
            containerColor = Color(0xFF161128),
            shape = RoundedCornerShape(16.dp)
        )
    }
}

@Composable
fun ToolChip(
    text: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .clickable(onClick = onClick)
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)), RoundedCornerShape(20.dp)),
        color = CardBg.copy(alpha = 0.6f)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = text,
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}


// ── ROOM CHAT SCREEN ──────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun RoomChatScreen(
    navController: NavController,
    repository: FirebaseRepository,
    roomId: String
) {
    val uid = repository.currentUserId ?: ""
    val room by repository.subscribeToRoom(roomId).safeCollect("RoomChatScreen_room", null).collectAsState(initial = null)
    val messages by repository.subscribeToRoomMessages(roomId).safeCollect("RoomChatScreen_messages", emptyList()).collectAsState(initial = emptyList())
    val stickers by repository.subscribeToStickers().safeCollect("RoomChatScreen_stickers", emptyList()).collectAsState(initial = emptyList())
    val allUsers by repository.subscribeToAllUsers().safeCollect("RoomChatScreen_allUsers", emptyList()).collectAsState(initial = emptyList())
    
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    var typedText by remember { mutableStateOf("") }
    var isUploadingMedia by remember { mutableStateOf(false) }
    var showStickerSheet by remember { mutableStateOf(false) }
    var showAdminPanel by remember { mutableStateOf(false) }
    
    val listState = rememberLazyListState()
    
    // Auto-scroll on new messages
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    // AI tag check on incoming room messages
    LaunchedEffect(messages) {
        val lastMsg = messages.lastOrNull()
        if (lastMsg != null && lastMsg.senderId == uid && lastMsg.text?.contains("@nexifyai", ignoreCase = true) == true) {
            coroutineScope.launch {
                try {
                    repository.processRoomAITag(roomId, messages)
                } catch (e: Exception) {
                    NexifyLog.e("RoomChatScreen", "Failed to auto-trigger AI reply", e)
                }
            }
        }
    }
    
    // Auto-disconnect from voice when screen is disposed
    DisposableEffect(roomId) {
        onDispose {
            coroutineScope.launch {
                repository.leaveVoice(roomId)
            }
        }
    }
    
    val imageLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            coroutineScope.launch {
                isUploadingMedia = true
                try {
                    val imageUrl = CloudinaryService.uploadImage(context, it)
                    repository.sendRoomMessage(roomId, mediaUrl = imageUrl, type = "image")
                } catch (e: Exception) {
                    Toast.makeText(context, e.message ?: "Upload failed.", Toast.LENGTH_SHORT).show()
                } finally {
                    isUploadingMedia = false
                }
            }
        }
    }
    
    val inVoice = room?.voiceMembers?.contains(uid) == true
    val isCurrentUserCreator = room?.createdBy == uid
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // 1. App Bar Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(CardBg)
                    .padding(horizontal = 8.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, color = Color.White)
                    }
                    
                    Box(modifier = Modifier.size(40.dp)) {
                        AsyncImage(
                            model = "https://api.dicebear.com/7.x/identicon/svg?seed=$roomId",
                            contentDescription = null,
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(CardBorder)
                                .align(Alignment.Center)
                        )
                        if (inVoice) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF10B981))
                                    .border(1.5.dp, CardBg, CircleShape)
                                    .align(Alignment.BottomEnd)
                            )
                        }
                    }
                    
                    Column {
                        Text(room?.name ?: "Loading...", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text("${room?.members?.size ?: 0} CITIZENS", color = TextMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
                
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    // Voice Control Toggle
                    Button(
                        onClick = {
                            coroutineScope.launch {
                                try {
                                    if (inVoice) {
                                        repository.leaveVoice(roomId)
                                    } else {
                                        repository.joinVoice(roomId)
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Voice gateway error.", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (inVoice) Color(0xFF10B981).copy(0.15f) else CardBg
                        ),
                        border = BorderStroke(1.dp, if (inVoice) Color(0xFF10B981).copy(0.3f) else CardBorder),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = if (inVoice) Icons.Default.VolumeUp else Icons.Default.VolumeMute,
                                contentDescription = null,
                                tint = if (inVoice) Color(0xFF10B981) else Color.White,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = if (inVoice) "VOICE ON" else "JOIN VOICE",
                                color = if (inVoice) Color(0xFF10B981) else Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    
                    IconButton(onClick = { showAdminPanel = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = null, tint = TextMuted)
                    }
                }
            }
            
            // 2. Voice Strip Panel (Top 30% area if users are in voice)
            val voiceMembersList = room?.voiceMembers ?: emptyList()
            if (voiceMembersList.isNotEmpty()) {
                val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                val pulseScale by infiniteTransition.animateFloat(
                    initialValue = 1f,
                    targetValue = 1.12f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(800),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "scale"
                )
                
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CardBg.copy(0.4f))
                        .border(1.dp, CardBorder.copy(0.3f), RoundedCornerShape(0.dp))
                        .padding(vertical = 10.dp, horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("ACTIVE VOICE CHANNEL", fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, color = CyanNeon, letterSpacing = 1.sp)
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(voiceMembersList) { vMemberId ->
                            val vUser = allUsers.find { it.userId == vMemberId }
                            val mockSpeaking = vMemberId.hashCode() % 3 == 0 // dynamic mock speaking animation for premium visual response
                            val userScale = if (mockSpeaking) pulseScale else 1f
                            val borderColor = if (mockSpeaking) Color(0xFF10B981) else CyanNeon.copy(0.6f)
                            
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .graphicsLayer(scaleX = userScale, scaleY = userScale),
                                    contentAlignment = Alignment.Center
                                ) {
                                    AsyncImage(
                                        model = vUser?.profileImage?.ifEmpty { "https://api.dicebear.com/7.x/avataaars/svg?seed=$vMemberId" }
                                            ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=$vMemberId",
                                        contentDescription = null,
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(CardBg)
                                            .border(2.dp, borderColor, CircleShape)
                                    )
                                    if (mockSpeaking) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .clip(CircleShape)
                                                .background(Color(0xFF10B981))
                                                .border(1.dp, CardBg, CircleShape)
                                                .align(Alignment.BottomEnd)
                                        )
                                    }
                                }
                                Text(
                                    text = vUser?.username ?: "Citizen",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }
            
            // 3. Threaded Messages List (Bottom 70%)
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                items(messages) { message ->
                    val isMe = message.senderId == uid
                    val sender = allUsers.find { it.userId == message.senderId }
                    val senderName = sender?.username ?: "Citizen"
                    var showMenu by remember { mutableStateOf(false) }
                    
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (isMe) Alignment.CenterEnd else Alignment.CenterStart
                    ) {
                        Column(
                            horizontalAlignment = if (isMe) Alignment.End else Alignment.Start,
                            modifier = Modifier.fillMaxWidth(0.85f)
                        ) {
                            if (!isMe) {
                                Text(
                                    text = senderName,
                                    color = CyanNeon,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(bottom = 2.dp, start = 4.dp)
                                )
                            }
                            
                            Box {
                                Box(
                                    modifier = Modifier
                                        .clip(
                                            RoundedCornerShape(
                                                topStart = 14.dp,
                                                topEnd = 14.dp,
                                                bottomStart = if (isMe) 14.dp else 0.dp,
                                                bottomEnd = if (isMe) 0.dp else 14.dp
                                            )
                                        )
                                        .background(if (isMe) PurpleNeon else CardBg)
                                        .border(
                                            1.dp,
                                            if (message.isPinned) CyanNeon else CardBorder,
                                            RoundedCornerShape(
                                                topStart = 14.dp,
                                                topEnd = 14.dp,
                                                bottomStart = if (isMe) 14.dp else 0.dp,
                                                bottomEnd = if (isMe) 0.dp else 14.dp
                                            )
                                        )
                                        .pointerInput(message.messageId) {
                                            detectTapGestures(
                                                onDoubleTap = {
                                                    coroutineScope.launch {
                                                        repository.reactToRoomMessage(roomId, message.messageId, "❤️")
                                                    }
                                                },
                                                onLongPress = {
                                                    showMenu = true
                                                }
                                            )
                                        }
                                        .padding(10.dp)
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        if (message.isPinned) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Icon(Icons.Default.PushPin, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(10.dp))
                                                Text("PINNED", color = CyanNeon, fontSize = 8.sp, fontWeight = FontWeight.ExtraBold)
                                            }
                                        }
                                        
                                        when {
                                            message.type == "image" && message.mediaURL != null -> {
                                                AsyncImage(
                                                    model = message.mediaURL,
                                                    contentDescription = null,
                                                    contentScale = ContentScale.Crop,
                                                    modifier = Modifier
                                                        .size(width = 180.dp, height = 220.dp)
                                                        .clip(RoundedCornerShape(10.dp))
                                                )
                                            }
                                            message.type == "sticker" && message.mediaURL != null -> {
                                                AsyncImage(
                                                    model = message.mediaURL,
                                                    contentDescription = null,
                                                    modifier = Modifier.size(100.dp)
                                                )
                                            }
                                            message.type == "gif" && message.mediaURL != null -> {
                                                AsyncImage(
                                                    model = message.mediaURL,
                                                    contentDescription = null,
                                                    modifier = Modifier.size(120.dp).clip(RoundedCornerShape(8.dp))
                                                )
                                            }
                                            else -> {
                                                Text(
                                                    text = message.text ?: "",
                                                    color = Color.White,
                                                    fontSize = 13.5.sp
                                                )
                                            }
                                        }
                                    }
                                }
                                
                                // Context Actions Dropdown
                                DropdownMenu(
                                    expanded = showMenu,
                                    onDismissRequest = { showMenu = false },
                                    modifier = Modifier.background(CardBg)
                                ) {
                                    // Reaction row inside dropdown
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        listOf("❤️", "🔥", "😂", "😮", "😢", "💯").forEach { emoji ->
                                            Text(
                                                text = emoji,
                                                fontSize = 18.sp,
                                                modifier = Modifier
                                                    .clickable {
                                                        coroutineScope.launch {
                                                            repository.reactToRoomMessage(roomId, message.messageId, emoji)
                                                            showMenu = false
                                                        }
                                                    }
                                                    .padding(2.dp)
                                            )
                                        }
                                    }
                                    Divider(color = CardBorder, thickness = 0.5.dp)
                                    DropdownMenuItem(
                                        text = { Text(if (message.isPinned) "Unpin Message" else "Pin Message", color = Color.White) },
                                        onClick = {
                                            coroutineScope.launch {
                                                repository.togglePinRoomMessage(roomId, message.messageId, message.isPinned)
                                                showMenu = false
                                            }
                                        },
                                        leadingIcon = { Icon(Icons.Default.PushPin, contentDescription = null, tint = CyanNeon) }
                                    )
                                }
                            }
                            
                            // Reactions display row
                            val activeReactions = message.reactions.filter { it.value.isNotEmpty() }
                            if (activeReactions.isNotEmpty()) {
                                Row(
                                    modifier = Modifier.padding(top = 4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    activeReactions.forEach { (emoji, userList) ->
                                        val reactedByMe = userList.contains(uid)
                                        Row(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(if (reactedByMe) CyanNeon.copy(0.15f) else CardBg.copy(0.6f))
                                                .border(1.dp, if (reactedByMe) CyanNeon else CardBorder, RoundedCornerShape(8.dp))
                                                .clickable {
                                                    coroutineScope.launch {
                                                        if (reactedByMe) {
                                                            repository.removeReactionFromRoomMessage(roomId, message.messageId, emoji)
                                                        } else {
                                                            repository.reactToRoomMessage(roomId, message.messageId, emoji)
                                                        }
                                                    }
                                                }
                                                .padding(horizontal = 6.dp, vertical = 2.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                                        ) {
                                            Text(emoji, fontSize = 10.sp)
                                            Text(userList.size.toString(), color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                            
                            message.timestamp?.let {
                                Text(
                                    text = SimpleDateFormat("h:mm a", Locale.getDefault()).format(it),
                                    color = TextMuted,
                                    fontSize = 9.sp,
                                    modifier = Modifier.padding(top = 2.dp, end = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
            
            // Media Uploading Loader
            if (isUploadingMedia) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CircularProgressIndicator(color = PurpleNeon, modifier = Modifier.size(14.dp))
                    Text("Uploading media to cloud...", color = PurpleNeon, fontSize = 11.sp)
                }
            }
            
            // Smart quick-replies pill list
            if (typedText.isEmpty()) {
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(listOf("Awesome!", "Count me in!", "Nice work!", "Let's go!", "🔥")) { reply ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(CyanNeon.copy(0.08f))
                                .border(1.dp, CyanNeon.copy(0.25f), RoundedCornerShape(16.dp))
                                .clickable {
                                    coroutineScope.launch {
                                        repository.sendRoomMessage(roomId, text = reply)
                                    }
                                }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(reply, color = CyanNeon, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            
            // Typing indicators row
            val typingUserIds = room?.typing?.filter { it.value && it.key != uid }?.keys ?: emptyList()
            if (typingUserIds.isNotEmpty()) {
                val typingUserNames = typingUserIds.map { allUsers.find { u -> u.userId == it }?.username ?: "Someone" }
                val typingText = when {
                    typingUserNames.size == 1 -> "${typingUserNames.first()} is typing..."
                    typingUserNames.size > 1 -> "Several citizens are typing..."
                    else -> ""
                }
                if (typingText.isNotEmpty()) {
                    Text(
                        text = typingText,
                        color = TextMuted,
                        fontSize = 10.sp,
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 2.dp)
                    )
                }
            }
            
            // 4. Input Composer Form
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                IconButton(onClick = { imageLauncher.launch("image/*") }) {
                    Icon(Icons.Default.AddPhotoAlternate, contentDescription = null, tint = CyanNeon)
                }
                IconButton(onClick = { showStickerSheet = true }) {
                    Icon(Icons.Default.SentimentSatisfied, contentDescription = null, tint = CyanNeon)
                }
                
                PremiumTextField(
                    value = typedText,
                    onValueChange = {
                        typedText = it
                        if (it.isNotEmpty()) {
                            coroutineScope.launch {
                                repository.setRoomTypingStatus(roomId, true)
                                delay(2000)
                                if (typedText == it) {
                                    repository.setRoomTypingStatus(roomId, false)
                                }
                            }
                        } else {
                            coroutineScope.launch {
                                repository.setRoomTypingStatus(roomId, false)
                            }
                        }
                    },
                    placeholder = "Message room...",
                    modifier = Modifier.weight(1f)
                )
                
                IconButton(
                    onClick = {
                        if (typedText.isEmpty()) return@IconButton
                        coroutineScope.launch {
                            try {
                                repository.sendRoomMessage(roomId, text = typedText)
                                typedText = ""
                                repository.setRoomTypingStatus(roomId, false)
                            } catch (e: Exception) {
                                Toast.makeText(context, e.message ?: "Moderated.", Toast.LENGTH_LONG).show()
                            }
                        }
                    },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)))
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, color = Color.White)
                }
            }
        }
        
        // 5. Right-Sliding Room Console/Admin Side Panel
        AnimatedVisibility(
            visible = showAdminPanel,
            enter = slideInHorizontally(initialOffsetX = { it }) + fadeIn(),
            exit = slideOutHorizontally(targetOffsetX = { it }) + fadeOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f))
                    .clickable { showAdminPanel = false }
            ) {
                Box(
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .fillMaxHeight()
                        .fillMaxWidth(0.8f)
                        .background(CardBg)
                        .border(1.dp, CardBorder, RoundedCornerShape(topStart = 16.dp, bottomStart = 16.dp))
                        .clickable(enabled = false) {}
                        .padding(16.dp)
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        // Title header
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Room Admin Panel", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = CyanNeon)
                            IconButton(onClick = { showAdminPanel = false }) {
                                Icon(Icons.Default.Close, contentDescription = null, tint = Color.White)
                            }
                        }
                        
                        Divider(color = CardBorder, thickness = 1.dp)
                        
                        // Summon Citizens Section
                        Text("SUMMON FRIENDS", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = PurpleNeon, letterSpacing = 1.sp)
                        val nonMemberFriends = allUsers.filter { (room?.members?.contains(it.userId) == false) && it.userId != uid }
                        if (nonMemberFriends.isEmpty()) {
                            Text("All friends are already members.", color = TextMuted, fontSize = 12.sp)
                        } else {
                            LazyColumn(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(nonMemberFriends) { friend ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(CardBg.copy(0.5f))
                                            .padding(8.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            AsyncImage(
                                                model = friend.profileImage.ifEmpty { "https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.userId}" },
                                                contentDescription = null,
                                                modifier = Modifier.size(32.dp).clip(CircleShape)
                                            )
                                            Text(friend.username, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                        }
                                        Button(
                                            onClick = {
                                                coroutineScope.launch {
                                                    try {
                                                        repository.inviteFriendToRoom(roomId, friend.userId)
                                                        Toast.makeText(context, "${friend.username} summoned.", Toast.LENGTH_SHORT).show()
                                                    } catch (e: Exception) {
                                                        Toast.makeText(context, "Summoning failed.", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = CyanNeon),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                            modifier = Modifier.height(28.dp)
                                        ) {
                                            Text("Summon", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                        
                        Divider(color = CardBorder, thickness = 0.5.dp)
                        
                        // Citizens List Section
                        Text("MEMBERS (${room?.members?.size ?: 0})", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = PurpleNeon, letterSpacing = 1.sp)
                        val roomMembers = allUsers.filter { room?.members?.contains(it.userId) == true }
                        LazyColumn(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(roomMembers) { member ->
                                val isOwner = member.userId == room?.createdBy
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(CardBg.copy(0.5f))
                                        .padding(8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        AsyncImage(
                                            model = member.profileImage.ifEmpty { "https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}" },
                                            contentDescription = null,
                                            modifier = Modifier.size(32.dp).clip(CircleShape)
                                        )
                                        Column {
                                            Text(member.username, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                            if (isOwner) {
                                                Text("Creator", color = CyanNeon, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                    if (isCurrentUserCreator && !isOwner && member.userId != uid) {
                                        IconButton(
                                            onClick = {
                                                coroutineScope.launch {
                                                    try {
                                                        repository.removeRoomMember(roomId, member.userId)
                                                        Toast.makeText(context, "${member.username} dismissed.", Toast.LENGTH_SHORT).show()
                                                    } catch (e: Exception) {
                                                        Toast.makeText(context, "Dismissal failed.", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            }
                                        ) {
                                            Icon(Icons.Default.RemoveCircle, contentDescription = null, tint = Color.Red.copy(0.7f))
                                        }
                                    }
                                }
                            }
                        }
                        
                        Divider(color = CardBorder, thickness = 0.5.dp)
                        
                        // Disconnect Button
                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    try {
                                        repository.leaveRoom(roomId)
                                        navController.popBackStack()
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Failed to disconnect.", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Red.copy(0.15f)),
                            border = BorderStroke(1.dp, Color.Red),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Disconnect from Room", color = Color.Red, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
    
    // Sticker Dialog
    if (showStickerSheet) {
        ModalBottomSheet(
            onDismissRequest = { showStickerSheet = false },
            containerColor = Color(0xFF161128)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Send Room Sticker", color = Color.White, fontWeight = FontWeight.Bold)
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(260.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(stickers) { sticker ->
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier
                                .background(CardBg, RoundedCornerShape(12.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
                                .clickable {
                                    coroutineScope.launch {
                                        repository.sendRoomMessage(roomId, mediaUrl = sticker.imageUrl, type = "sticker")
                                        showStickerSheet = false
                                    }
                                }
                                .padding(12.dp)
                        ) {
                            AsyncImage(model = sticker.imageUrl, contentDescription = null, modifier = Modifier.size(65.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AppLaunchChip(
    label: String,
    onClick: () -> Unit,
    enabled: Boolean = true
) {
    Surface(
        modifier = Modifier
            .clickable(enabled = enabled, onClick = onClick)
            .clip(RoundedCornerShape(12.dp))
            .border(
                1.dp,
                if (enabled) Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon))
                else Brush.linearGradient(listOf(Color.Gray.copy(alpha = 0.3f), Color.Gray.copy(alpha = 0.3f))),
                RoundedCornerShape(12.dp)
            ),
        color = if (enabled) CardBg.copy(alpha = 0.6f) else Color.Transparent
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = label,
                color = if (enabled) Color.White else Color.Gray,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FocusPodScreen(navController: NavController, repository: FirebaseRepository) {
    LaunchedEffect(Unit) {
        repository.logFeatureUsage("focus_pod")
    }
    val uid = repository.currentUserId ?: ""
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var selectedDurationMinutes by remember { mutableStateOf(25) }
    var secondsRemaining by remember { mutableStateOf(25 * 60) }
    var isTimerRunning by remember { mutableStateOf(false) }
    var initialSecondsSelected by remember { mutableStateOf(25 * 60) }

    val userProfile by repository.subscribeToProfile(uid).safeCollect("FocusPod_profile", null).collectAsState(initial = null)
    val focusSessions by repository.subscribeToFocusSessions().safeCollect("FocusPod_sessions", emptyList()).collectAsState(initial = emptyList())

    var showCompletionDialog by remember { mutableStateOf(false) }
    var earnedXpAmount by remember { mutableStateOf(0L) }

    LaunchedEffect(isTimerRunning) {
        if (isTimerRunning) {
            while (secondsRemaining > 0) {
                delay(1000L)
                secondsRemaining--
            }
            isTimerRunning = false
            earnedXpAmount = selectedDurationMinutes * 10L
            coroutineScope.launch {
                try {
                    repository.saveFocusSession(selectedDurationMinutes, earnedXpAmount)
                    showCompletionDialog = true
                } catch (e: Exception) {
                    Toast.makeText(context, "Cloud sync failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    LaunchedEffect(selectedDurationMinutes) {
        if (!isTimerRunning) {
            secondsRemaining = selectedDurationMinutes * 60
            initialSecondsSelected = selectedDurationMinutes * 60
        }
    }

    val progressFraction = if (initialSecondsSelected > 0) {
        secondsRemaining.toFloat() / initialSecondsSelected.toFloat()
    } else {
        1f
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
            }
            Text("Focus Pod", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, modifier = Modifier.padding(start = 8.dp))
            Spacer(modifier = Modifier.weight(1f))
            Surface(
                color = CardBg,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, CyanNeon.copy(0.3f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(16.dp))
                    Text("${userProfile?.xp ?: 0} XP", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Box(
            modifier = Modifier
                .size(260.dp)
                .padding(20.dp),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(
                progress = progressFraction,
                modifier = Modifier.fillMaxSize(),
                color = CyanNeon,
                strokeWidth = 10.dp,
                trackColor = Color.White.copy(alpha = 0.05f)
            )

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                val mins = secondsRemaining / 60
                val secs = secondsRemaining % 60
                val formattedTime = String.format("%02d:%02d", mins, secs)
                Text(
                    text = formattedTime,
                    color = Color.White,
                    fontSize = 44.sp,
                    fontWeight = FontWeight.ExtraBold
                )
                Text(
                    text = if (isTimerRunning) "LOCKING IN" else "STANDBY",
                    color = if (isTimerRunning) CyanNeon else TextMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Button(
                onClick = { isTimerRunning = !isTimerRunning },
                modifier = Modifier
                    .height(50.dp)
                    .width(140.dp)
                    .clip(RoundedCornerShape(25.dp)),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isTimerRunning) Color.DarkGray else CyanNeon
                )
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = if (isTimerRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = if (isTimerRunning) Color.White else Color.Black
                    )
                    Text(
                        text = if (isTimerRunning) "PAUSE" else "START",
                        color = if (isTimerRunning) Color.White else Color.Black,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }

            IconButton(
                onClick = {
                    isTimerRunning = false
                    secondsRemaining = selectedDurationMinutes * 60
                    initialSecondsSelected = selectedDurationMinutes * 60
                },
                modifier = Modifier
                    .size(50.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(0.08f))
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Reset", tint = Color.White)
            }
        }

        if (!isTimerRunning) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("FOCUS RANGE PRESETS", color = CyanNeon, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val presets = listOf(15, 25, 45, 60)
                    presets.forEach { duration ->
                        val selected = selectedDurationMinutes == duration
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { selectedDurationMinutes = duration }
                                .clip(RoundedCornerShape(10.dp))
                                .border(
                                    1.dp,
                                    if (selected) CyanNeon else Color.Gray.copy(alpha = 0.3f),
                                    RoundedCornerShape(10.dp)
                                )
                                .background(if (selected) CyanNeon.copy(alpha = 0.15f) else Color.Transparent)
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "${duration}m",
                                color = if (selected) CyanNeon else Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Text(
                    text = "CUSTOM FOCUS: ${selectedDurationMinutes} MIN",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 16.dp)
                )
                Slider(
                    value = selectedDurationMinutes.toFloat(),
                    onValueChange = { selectedDurationMinutes = it.toInt() },
                    valueRange = 5f..120f,
                    steps = 23,
                    colors = SliderDefaults.colors(
                        thumbColor = CyanNeon,
                        activeTrackColor = CyanNeon,
                        inactiveTrackColor = Color.Gray.copy(0.2f)
                    ),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
                )
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 30.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Distraction-free mode active. Stay focused, citizen. 🌌",
                    color = TextMuted,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        if (focusSessions.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(top = 10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("TODAY'S SHIFT RECORDS", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(focusSessions.takeLast(5).reversed()) { sess ->
                        GlassmorphicCard(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.Default.Schedule, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(16.dp))
                                    Text("Focused for ${sess.durationMinutes}m", color = Color.White, fontSize = 13.sp)
                                }
                                Text("+${sess.xpEarned} XP", color = Color.Green, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        } else {
            Spacer(modifier = Modifier.weight(1f))
        }
    }

    if (showCompletionDialog) {
            containerColor = Color(0xFF161128),
            shape = RoundedCornerShape(16.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatRoomsListScreen(navController: NavController, repository: FirebaseRepository) {
    val uid = repository.currentUserId ?: ""
    val rooms by repository.subscribeToChatRooms().safeCollect("ChatRooms_rooms", emptyList()).collectAsState(initial = emptyList())
    val allUsers by repository.subscribeToAllUsers().safeCollect("ChatRooms_users", emptyList()).collectAsState(initial = emptyList())

    var showCreateDialog by remember { mutableStateOf(false) }
    var newRoomName by remember { mutableStateOf("") }
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Appbar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
            }
            Text("Global Chat Hubs", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, modifier = Modifier.padding(start = 8.dp))
            Spacer(modifier = Modifier.weight(1f))
            IconButton(
                onClick = { showCreateDialog = true },
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(CyanNeon)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Color.Black)
            }
        }

        Text("Select a global pod room to join real-time chat with other citizens.", color = TextMuted, fontSize = 12.sp)

        if (rooms.isEmpty()) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("No active global rooms. Initialize one!", color = TextMuted, fontSize = 14.sp)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(rooms) { room ->
                    val isParticipant = room.participants.contains(uid)
                    val creator = allUsers.find { it.userId == room.createdBy }?.username ?: "Citizen"

                    GlassmorphicCard(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            coroutineScope.launch {
                                if (!isParticipant) {
                                    repository.joinChatRoom(room.roomId)
                                }
                                navController.navigate("chat_room/${room.roomId}")
                            }
                        }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(room.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Initialized by: @$creator", color = TextMuted, fontSize = 11.sp)
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text("${room.participants.size} active", color = CyanNeon, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Icon(Icons.Default.NavigateNext, contentDescription = null, tint = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("Initialize Global Room", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Provide a topic name for your group discussion board.", color = TextMuted, fontSize = 12.sp)
                    PremiumTextField(
                        value = newRoomName,
                        onValueChange = { newRoomName = it },
                        placeholder = "e.g., Coding Pod, Muscle Grind"
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newRoomName.isNotBlank()) {
                            val name = newRoomName
                            newRoomName = ""
                            showCreateDialog = false
                            coroutineScope.launch {
                                try {
                                    repository.createChatRoom(name)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Failed to create room: ${e.message}", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanNeon)
                ) {
                    Text("Create", color = Color.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateDialog = false }) {
                    Text("Cancel", color = TextMuted)
                }
            },
            containerColor = Color(0xFF161128),
            shape = RoundedCornerShape(16.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatRoomConversationScreen(navController: NavController, repository: FirebaseRepository, roomId: String) {
    LaunchedEffect(Unit) {
        repository.logFeatureUsage("chat_rooms")
    }
    val uid = repository.currentUserId ?: ""
    val room by repository.subscribeToChatRoom(roomId).safeCollect("ChatRoomConv_room", null).collectAsState(initial = null)
    val messages by repository.subscribeToChatRoomMessages(roomId).safeCollect("ChatRoomConv_messages", emptyList()).collectAsState(initial = emptyList())
    val allUsers by repository.subscribeToAllUsers().safeCollect("ChatRoomConv_users", emptyList()).collectAsState(initial = emptyList())

    var typedText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    var activeOutgoingCallId by remember { mutableStateOf<String?>(null) }
    val activeCallState by remember(activeOutgoingCallId) {
        if (activeOutgoingCallId != null) {
            repository.subscribeToCallState(activeOutgoingCallId!!)
        } else {
            kotlinx.coroutines.flow.flow { emit(null) }
        }
    }.collectAsState(initial = null)

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(CardBg)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(room?.name ?: "Chat Room", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                Text("${room?.participants?.size ?: 0} citizens connected", color = CyanNeon, fontSize = 11.sp)
            }
            
            if (room != null && room!!.participants.size >= 2) {
                IconButton(onClick = {
                    val otherMember = room!!.participants.find { it != uid }
                    if (otherMember != null) {
                        coroutineScope.launch {
                            try {
                                val callId = repository.startCall(otherMember)
                                activeOutgoingCallId = callId
                            } catch (e: Exception) {
                                Toast.makeText(context, "Call gateway fail: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }) {
                    Icon(Icons.Default.Phone, contentDescription = "Call", tint = CyanNeon)
                }
            }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            items(messages) { message ->
                val isMe = message.senderId == uid
                val senderName = allUsers.find { it.userId == message.senderId }?.username ?: "Citizen"

                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isMe) Alignment.CenterEnd else Alignment.CenterStart
                ) {
                    Column(
                        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start,
                        modifier = Modifier.fillMaxWidth(0.85f)
                    ) {
                        if (!isMe) {
                            Text(
                                text = "@$senderName",
                                color = CyanNeon,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(bottom = 2.dp)
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (isMe) PurpleNeon else CardBg)
                                .border(1.dp, if (isMe) CardBorder else CyanNeon.copy(0.4f), RoundedCornerShape(16.dp))
                                .padding(12.dp)
                        ) {
                            Text(message.text ?: "", color = Color.White, fontSize = 14.sp)
                        }
                        message.timestamp?.let {
                            Text(
                                text = SimpleDateFormat("h:mm a", Locale.getDefault()).format(it),
                                color = TextMuted,
                                fontSize = 9.sp,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            PremiumTextField(
                value = typedText,
                onValueChange = { typedText = it },
                placeholder = "Message room...",
                modifier = Modifier.weight(1f)
            )

            IconButton(
                onClick = {
                    if (typedText.isEmpty()) return@IconButton
                    val prompt = typedText
                    typedText = ""
                    coroutineScope.launch {
                        try {
                            repository.sendChatRoomMessage(roomId, prompt)
                        } catch (e: Exception) {
                            Toast.makeText(context, e.message ?: "Failed", Toast.LENGTH_LONG).show()
                        }
                    }
                },
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)))
            ) {
                Icon(Icons.Default.Send, contentDescription = null, color = Color.White)
            }
        }
    }

    if (activeCallState != null && activeCallState!!.status != "ended") {
        val call = activeCallState!!
        val receiverProfile = allUsers.find { it.userId == call.receiverId }
        val callStatus = call.status.toUpperCase()

        AlertDialog(
            onDismissRequest = {},
            title = { Text("📞 Outgoing Signal...", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = receiverProfile?.username ?: "Calling User",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        text = "STATUS: $callStatus",
                        color = if (call.status == "connected") Color.Green else CyanNeon,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            confirmButton = {},
            dismissButton = {
                Button(
                    onClick = {
                        coroutineScope.launch {
                            repository.endCall(call.callId)
                            activeOutgoingCallId = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
                ) {
                    Text("DISCONNECT", color = Color.White)
                }
            },
            containerColor = Color(0xFF161128),
            shape = RoundedCornerShape(16.dp)
        )
    }
}

@Composable
fun LeaderboardScreen(navController: NavController, repository: FirebaseRepository) {
    LaunchedEffect(Unit) {
        repository.logFeatureUsage("leaderboard")
    }
    val uid = repository.currentUserId ?: ""
    val leaderboardUsers by repository.subscribeToLeaderboard().safeCollect("Leaderboard_users", emptyList()).collectAsState(initial = emptyList())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
            }
            Text("Citizen Board", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, modifier = Modifier.padding(start = 8.dp))
        }

        Text("Real-time rankings based on focus logs, work shifts, and social activities.", color = TextMuted, fontSize = 12.sp, modifier = Modifier.align(Alignment.Start))

        if (leaderboardUsers.isEmpty()) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = CyanNeon)
            }
        } else {
            val top3 = leaderboardUsers.take(3)
            if (top3.size >= 2) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        PodiumCard(rank = 2, user = top3[1], color = Color.LightGray)
                    }
                    Box(modifier = Modifier.weight(1.2f), contentAlignment = Alignment.Center) {
                        PodiumCard(rank = 1, user = top3[0], color = Color(0xFFFFD700))
                    }
                    if (top3.size >= 3) {
                        Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                            PodiumCard(rank = 3, user = top3[2], color = Color(0xFFCD7F32))
                        }
                    }
                }
            }

            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(leaderboardUsers.size) { index ->
                    val user = leaderboardUsers[index]
                    val isMe = user.userId == uid
                    val rank = index + 1
                    GlassmorphicCard(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {}
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(
                                    text = "#$rank",
                                    color = if (rank <= 3) CyanNeon else TextMuted,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(if (isMe) CyanNeon else Color.Gray.copy(0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = user.username.take(2).toUpperCase(),
                                        color = if (isMe) Color.Black else Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }
                                Column {
                                    Text(
                                        text = if (isMe) "${user.username} (You)" else user.username,
                                        color = if (isMe) CyanNeon else Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                    Text("${user.email}", color = TextMuted, fontSize = 10.sp)
                                }
                            }
                            Text(
                                text = "${user.xp} XP",
                                color = if (isMe) CyanNeon else Color.Green,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PodiumCard(rank: Int, user: User, color: Color) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .border(2.dp, color, RoundedCornerShape(12.dp)),
        color = CardBg
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = if (rank == 1) "🏆 Rank 1" else "Rank $rank",
                color = color,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 12.sp
            )
            Text(
                text = user.username,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                maxLines = 1
            )
            Text(
                text = "${user.xp} XP",
                color = Color.Green,
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun OnboardingScreen(navController: NavController) {
    val context = LocalContext.current
    var currentSlideIndex by remember { mutableStateOf(0) }

    val slides = remember {
        listOf(
            OnboardingSlide(
                "NEXIFY CONNECT",
                "Unlock the future of social productivity. Sync, study, and build pods with citizens worldwide.",
                Icons.Default.Groups
            ),
            OnboardingSlide(
                "FOCUS PODS",
                "Lock in with custom Pomodoro focus runs. Keep your eyes on the grid and earn XP rewards.",
                Icons.Default.Schedule
            ),
            OnboardingSlide(
                "AI SIDEKICK",
                "Vibe check with Nexify AI. Brainstorm viral reels, optimize system prompts, and get coding advice instantly.",
                Icons.Default.AutoAwesome
            ),
            OnboardingSlide(
                "CITIZEN BOARD",
                "Track focus stats, stay on streaks, and climb the real-time global leaderboard ranking.",
                Icons.Default.Star
            )
        )
    }

    val slide = slides[currentSlideIndex]

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            TextButton(onClick = {
                val sharedPrefs = context.getSharedPreferences("nexify_connect_prefs", 0)
                sharedPrefs.edit().putBoolean("onboarding_complete", true).apply()
                navController.navigate("login") {
                    popUpTo("onboarding") { inclusive = true }
                }
            }) {
                Text("SKIP", color = TextMuted, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .clip(CircleShape)
                    .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)))
                    .border(2.dp, Color.White, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = slide.icon,
                    contentDescription = null,
                    tint = Color.Black,
                    modifier = Modifier.size(56.dp)
                )
            }

            Text(
                text = slide.title,
                color = CyanNeon,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 22.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            Text(
                text = slide.description,
                color = Color.White,
                fontSize = 14.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                lineHeight = 20.sp
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                slides.forEachIndexed { idx, _ ->
                    val active = idx == currentSlideIndex
                    Box(
                        modifier = Modifier
                            .size(if (active) 10.dp else 8.dp)
                            .clip(CircleShape)
                            .background(if (active) CyanNeon else Color.Gray.copy(0.4f))
                    )
                }
            }

            Button(
                onClick = {
                    if (currentSlideIndex < slides.size - 1) {
                        currentSlideIndex++
                    } else {
                        val sharedPrefs = context.getSharedPreferences("nexify_connect_prefs", 0)
                        sharedPrefs.edit().putBoolean("onboarding_complete", true).apply()
                        navController.navigate("login") {
                            popUpTo("onboarding") { inclusive = true }
                        }
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = CyanNeon),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(RoundedCornerShape(25.dp))
            ) {
                Text(
                    text = if (currentSlideIndex == slides.size - 1) "GET STARTED" else "CONTINUE",
                    color = Color.Black,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp
                )
            }
        }
    }
}

data class OnboardingSlide(
    val title: String,
    val description: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(navController: NavController, repository: FirebaseRepository) {
    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("nexify_connect_prefs", 0) }

    var notificationsEnabled by remember { mutableStateOf(sharedPrefs.getBoolean("notifications_enabled", true)) }
    var privacyReceiptsEnabled by remember { mutableStateOf(sharedPrefs.getBoolean("privacy_receipts", true)) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AmoledBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
            }
            Text("Workspace Controls", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, modifier = Modifier.padding(start = 8.dp))
        }

        Text("CITIZEN IDENTITY", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        GlassmorphicCard(
            modifier = Modifier.fillMaxWidth(),
            onClick = { navController.navigate("profile") }
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(Icons.Default.AccountCircle, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(24.dp))
                    Column {
                        Text("Customize Profile Avatar & Bio", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Update public bios or details", color = TextMuted, fontSize = 11.sp)
                    }
                }
                Icon(Icons.Default.NavigateNext, contentDescription = null, tint = Color.White)
            }
        }

        Text("ALERT CHANNELS & PREFERENCES", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        GlassmorphicCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(Icons.Default.Notifications, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(24.dp))
                        Column {
                            Text("Workspace Push Notifications", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Toggle new messages or XP reward reminders", color = TextMuted, fontSize = 11.sp)
                        }
                    }
                    Switch(
                        checked = notificationsEnabled,
                        onCheckedChange = { checked ->
                            notificationsEnabled = checked
                            sharedPrefs.edit().putBoolean("notifications_enabled", checked).apply()
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.Black,
                            checkedTrackColor = CyanNeon,
                            uncheckedTrackColor = Color.Gray.copy(alpha = 0.3f)
                        )
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(Icons.Default.Palette, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(24.dp))
                        Column {
                            Text("System Visual Environment", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("AMOLED Dark Mode enabled by default", color = TextMuted, fontSize = 11.sp)
                        }
                    }
                    Text("DARK", color = CyanNeon, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Text("SECURITY & GRID PROTECTION", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        GlassmorphicCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(24.dp))
                        Column {
                            Text("Private Status Sync", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Show presence records to DM contacts", color = TextMuted, fontSize = 11.sp)
                        }
                    }
                    Switch(
                        checked = privacyReceiptsEnabled,
                        onCheckedChange = { checked ->
                            privacyReceiptsEnabled = checked
                            sharedPrefs.edit().putBoolean("privacy_receipts", checked).apply()
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.Black,
                            checkedTrackColor = CyanNeon,
                            uncheckedTrackColor = Color.Gray.copy(alpha = 0.3f)
                        )
                    )
                }
            }
        }

        Text("REFERRAL NETWORK", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        GlassmorphicCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Refer a fellow citizen to Nexify Connect. Once they initialize profile using your access code, both of you will receive +500 XP.",
                    color = Color.White,
                    fontSize = 13.sp
                )
                
                Button(
                    onClick = {
                        coroutineScope.launch {
                            try {
                                val code = repository.generateInviteCode()
                                val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                val clip = android.content.ClipData.newPlainText("invite_code", code)
                                clipboard.setPrimaryClip(clip)
                                Toast.makeText(context, "Access code generated & copied: $code", Toast.LENGTH_LONG).show()
                            } catch (e: Exception) {
                                Toast.makeText(context, "Failed to generate: ${e.message}", Toast.LENGTH_LONG).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanNeon),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.Black)
                        Text("GENERATE ACCESS CODE", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        Text("SUPPORT & MISSION DETAILS", color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)

        var showHelpDialog by remember { mutableStateOf(false) }
        var showAboutDialog by remember { mutableStateOf(false) }

        GlassmorphicCard(
            modifier = Modifier.fillMaxWidth(),
            onClick = { showHelpDialog = true }
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(Icons.Default.Help, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(24.dp))
                    Column {
                        Text("Help & Support Center", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Contact email support or bug logs", color = TextMuted, fontSize = 11.sp)
                    }
                }
                Icon(Icons.Default.NavigateNext, contentDescription = null, tint = Color.White)
            }
        }

        GlassmorphicCard(
            modifier = Modifier.fillMaxWidth(),
            onClick = { showAboutDialog = true }
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = CyanNeon, modifier = Modifier.size(24.dp))
                    Column {
                        Text("About Nexify Connect", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Platform info, mission & version", color = TextMuted, fontSize = 11.sp)
                    }
                }
                Icon(Icons.Default.NavigateNext, contentDescription = null, tint = Color.White)
            }
        }

        if (showHelpDialog) {
            AlertDialog(
                onDismissRequest = { showHelpDialog = false },
                title = { Text("Help & Support Desk", color = Color.White, fontWeight = FontWeight.Bold) },
                text = {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.verticalScroll(rememberScrollState())
                    ) {
                        Text(
                            text = "Need help? We're here for you.\n\nIf you are facing issues, have suggestions, or want to report a bug, feel free to reach out to us. Our support team is dedicated to helping you get the best experience from Nexify Connect.",
                            color = Color.White,
                            fontSize = 13.sp
                        )
                        Divider(color = Color.White.copy(alpha = 0.1f))
                        Text(
                            text = "📧 Email Support: nexifyconnect90@gmail.com\n📱 Phone Support: +91 8828428386",
                            color = CyanNeon,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Divider(color = Color.White.copy(alpha = 0.1f))
                        Text(
                            text = "Common Support Areas:\n• Account & Login Issues\n• Message Delivery Problems\n• Calls & Audio Quality\n• Privacy & Security Concerns\n• App Bugs & Feedback",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 12.sp
                        )
                        Text(
                            text = "We usually respond within 24–48 hours.\n\nThank you for being part of Nexify Connect 💙",
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showHelpDialog = false }) {
                        Text("DISMISS", color = CyanNeon)
                    }
                },
                containerColor = Color(0xFF161128),
                shape = RoundedCornerShape(24.dp)
            )
        }

        if (showAboutDialog) {
            AlertDialog(
                onDismissRequest = { showAboutDialog = false },
                title = { Text("About Nexify Connect", color = Color.White, fontWeight = FontWeight.Bold) },
                text = {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.verticalScroll(rememberScrollState())
                    ) {
                        Text(
                            text = "Nexify Connect is a next-generation communication platform designed for speed, privacy, and seamless connection. Built for the modern world, Nexify Connect brings messaging, calling, and smart features together in one powerful and beautifully crafted experience.",
                            color = Color.White,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Our mission is simple: make communication faster, safer, and more enjoyable. Whether you're chatting with friends, collaborating with teams, or connecting across the globe, Nexify Connect ensures reliability, high performance, and top-tier security.",
                            color = Color.White,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "With features like real-time messaging, HD calls, smart notifications, and customizable themes, Nexify Connect adapts to your style while keeping your data protected.",
                            color = Color.White,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "We are constantly evolving — adding new features, improving performance, and listening to our users.",
                            color = Color.White,
                            fontSize = 13.sp
                        )
                        Divider(color = Color.White.copy(alpha = 0.1f))
                        Text(
                            text = "Version: 1.0.0\nBuilt with passion for the future of communication.",
                            color = PurpleNeon,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showAboutDialog = false }) {
                        Text("CLOSE", color = PurpleNeon)
                    }
                },
                containerColor = Color(0xFF161128),
                shape = RoundedCornerShape(24.dp)
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = {
                repository.logout()
                navController.navigate("login") {
                    popUpTo(0) { inclusive = true }
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red.copy(0.15f)),
            border = BorderStroke(1.dp, Color.Red),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .clip(RoundedCornerShape(25.dp))
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = null, tint = Color.Red)
                Text("LOGOUT CITIZEN SESSION", color = Color.Red, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}



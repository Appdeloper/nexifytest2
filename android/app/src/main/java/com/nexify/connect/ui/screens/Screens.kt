package com.nexify.connect.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import com.nexify.connect.ui.components.*
import com.nexify.connect.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

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
            }

            TextButton(onClick = { navController.navigate("signup") }) {
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

            Spacer(modifier = Modifier.height(12.dp))

            if (isLoading) {
                CircularProgressIndicator(color = PurpleNeon)
            } else {
                PremiumButton(
                    text = "REGISTER CITIZEN",
                    onClick = {
                        if (email.isEmpty() || password.isEmpty() || username.isEmpty()) return@PremiumButton
                        coroutineScope.launch {
                            isLoading = true
                            try {
                                repository.signUp(email, password, username)
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
            }

            TextButton(onClick = { navController.navigate("login") }) {
                Text("Already registered? Login", color = CyanNeon)
            }
        }
    }
}

// ── EDIT PROFILE / CHANGE DP SCREEN (with AI Bio Generation) ────────
@Composable
fun ProfileCustomizationScreen(navController: NavController, repository: FirebaseRepository) {
    val uid = repository.currentUserId ?: ""
    val userProfile by repository.subscribeToUser(uid).collectAsState(initial = null)
    
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
    val allUsers by repository.subscribeToAllUsers().collectAsState(initial = emptyList())
    val currentUserProfile by repository.subscribeToUser(repository.currentUserId ?: "").collectAsState(initial = null)
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    var activeSubTab by remember { mutableStateOf("Search") }

    val filteredUsers = allUsers.filter {
        it.username.contains(searchQuery, ignoreCase = true) ||
        it.email.contains(searchQuery, ignoreCase = true)
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
                onValueChange = { searchQuery = it },
                placeholder = "Search by username or email...",
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, color = CyanNeon) }
            )

            if (filteredUsers.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No citizens found matching query.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredUsers) { targetUser ->
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
                                    currentUserProfile?.friends?.contains(targetUser.userId) == true -> "friends"
                                    currentUserProfile?.requestsSent?.contains(targetUser.userId) == true -> "sent"
                                    currentUserProfile?.requestsReceived?.contains(targetUser.userId) == true -> "received"
                                    else -> "none"
                                }

                                when (status) {
                                    "friends" -> {
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
                                    }
                                    "sent" -> {
                                        Button(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.cancelFriendRequest(targetUser.userId)
                                                    Toast.makeText(context, "Request cancelled.", Toast.LENGTH_SHORT).show()
                                                }
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                                            shape = RoundedCornerShape(20.dp)
                                        ) {
                                            Text("Pending", color = Color.White, fontSize = 12.sp)
                                        }
                                    }
                                    "received" -> {
                                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                            Button(
                                                onClick = {
                                                    coroutineScope.launch {
                                                        repository.acceptFriendRequest(targetUser.userId)
                                                        Toast.makeText(context, "Accepted request!", Toast.LENGTH_SHORT).show()
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
                                                    coroutineScope.launch {
                                                        repository.rejectFriendRequest(targetUser.userId)
                                                        Toast.makeText(context, "Rejected request.", Toast.LENGTH_SHORT).show()
                                                    }
                                                },
                                                border = BorderStroke(1.dp, Color.Red),
                                                shape = RoundedCornerShape(20.dp),
                                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                            ) {
                                                Text("Reject", color = Color.Red, fontSize = 11.sp)
                                            }
                                        }
                                    }
                                    "none" -> {
                                        Button(
                                            onClick = {
                                                coroutineScope.launch {
                                                    repository.sendFriendRequest(targetUser.userId)
                                                    Toast.makeText(context, "Friend request sent!", Toast.LENGTH_SHORT).show()
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
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Received Requests view
            val requestsList = allUsers.filter { currentUserProfile?.requestsReceived?.contains(it.userId) == true }
            
            if (requestsList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No pending invitations received.", color = TextMuted, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(requestsList) { sender ->
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
                                            coroutineScope.launch {
                                                repository.acceptFriendRequest(sender.userId)
                                                Toast.makeText(context, "Accepted invite!", Toast.LENGTH_SHORT).show()
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
                                            coroutineScope.launch {
                                                repository.rejectFriendRequest(sender.userId)
                                                Toast.makeText(context, "Rejected invite.", Toast.LENGTH_SHORT).show()
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
    val chats by repository.subscribeToChats().collectAsState(initial = emptyList())
    val groups by repository.subscribeToGroups().collectAsState(initial = emptyList())
    val allUsers by repository.subscribeToAllUsers().collectAsState(initial = emptyList())
    
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
                IconButton(onClick = { navController.navigate("profile") }) {
                    Icon(Icons.Default.Settings, contentDescription = null, color = Color.White)
                }
                IconButton(onClick = { navController.navigate("find") }) {
                    Icon(Icons.Default.PersonAdd, contentDescription = null, color = Color.White)
                }
                IconButton(onClick = { navController.navigate("rooms") }) {
                    Icon(Icons.Default.Explore, contentDescription = null, color = Color.White)
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
    val messages by repository.subscribeToMessages(chatId).collectAsState(initial = emptyList())
    val otherUserProfile by repository.subscribeToUser(otherUserId).collectAsState(initial = null)
    val currentUserProfile by repository.subscribeToUser(repository.currentUserId ?: "").collectAsState(initial = null)
    val chatMeta by repository.subscribeToChats().collectAsState(initial = emptyList())
    val stickers by repository.subscribeToStickers().collectAsState(initial = emptyList())

    var typedText by remember { mutableStateOf("") }
    var isUploadingMedia by remember { mutableStateOf(false) }
    var showStickerSheet by remember { mutableStateOf(false) }
    
    // Dynamic Smart Replies
    var smartReplies by remember { mutableStateOf<List<String>>(emptyList()) }
    val lastMessageText = messages.lastOrNull()?.let { if (it.senderId != repository.currentUserId) it.text ?: "" else "" } ?: ""
    
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(messages.size) {
        repository.markMessagesAsSeen(chatId)
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
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
                horizontalArrangement = Arrangement.spacedBy(12.dp)
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

    val friendsList by repository.subscribeToAllUsers().collectAsState(initial = emptyList())
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
    val groups by repository.subscribeToGroups().collectAsState(initial = emptyList())
    val messages by repository.subscribeToGroupMessages(groupId).collectAsState(initial = emptyList())
    val stickers by repository.subscribeToStickers().collectAsState(initial = emptyList())
    val friendsList by repository.subscribeToAllUsers().collectAsState(initial = emptyList())

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
    val rooms by repository.subscribeToRooms().collectAsState(initial = emptyList())
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
    val uid = repository.currentUserId ?: ""
    val messages by repository.subscribeToAiMessages(uid).collectAsState(initial = emptyList())
    var typedText by remember { mutableStateOf("") }
    var isAiGenerating by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

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
                val isAi = message.senderId == "AI"
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
}

package com.nexify.connect.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.nexify.connect.data.model.*
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.ui.components.*
import com.nexify.connect.ui.theme.*
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

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

// ── FIND CITIZENS / ADD FRIEND SCREEN (Satisfying Core Goal) ─────
@Composable
fun FindFriendsScreen(navController: NavController, repository: FirebaseRepository) {
    var searchQuery by remember { mutableStateOf("") }
    val allUsers by repository.subscribeToAllUsers().collectAsState(initial = emptyList())
    val currentUserProfile by repository.subscribeToUser(repository.currentUserId ?: "").collectAsState(initial = null)
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

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
            Text("Find Citizens", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        PremiumTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = "Search by username or email...",
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, color = CyanNeon) }
        )

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

                        // Determine relation status dynamically
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
                                }
                            }
                            "sent" -> {
                                Button(
                                    onClick = {
                                        coroutineScope.launch {
                                            repository.cancelFriendRequest(targetUser.userId)
                                            Toast.makeText(context, "Cancelled", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Text("Pending", color = Color.White, fontSize = 12.sp)
                                }
                            }
                            "received" -> {
                                Button(
                                    onClick = {
                                        coroutineScope.launch {
                                            repository.acceptFriendRequest(targetUser.userId)
                                            Toast.makeText(context, "Accepted!", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = PurpleNeon),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Text("Accept", color = Color.White, fontSize = 12.sp)
                                }
                            }
                            "none" -> {
                                Button(
                                    onClick = {
                                        coroutineScope.launch {
                                            repository.sendFriendRequest(targetUser.userId)
                                            Toast.makeText(context, "Request Sent", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                                    shape = RoundedCornerShape(20.dp),
                                    modifier = Modifier
                                        .background(Brush.horizontalGradient(listOf(PurpleNeon, CyanNeon)), RoundedCornerShape(20.dp))
                                ) {
                                    Icon(Icons.Default.UserPlus, contentDescription = null, color = Color.White)
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
}

// ── DIRECT MESSAGES / CHAT LIST SCREEN ──────────────────────────
@Composable
fun ChatListScreen(navController: NavController, repository: FirebaseRepository) {
    val chats by repository.subscribeToChats().collectAsState(initial = emptyList())
    val allUsers by repository.subscribeToAllUsers().collectAsState(initial = emptyList())

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
            Text("Nexify DMs", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = CyanNeon)
            Row {
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

        if (chats.isEmpty()) {
            Box(modifier = Modifier.fillGrid(), contentAlignment = Alignment.Center) {
                Text("No active conversations. Find friends to start a chat!", color = TextMuted, fontSize = 14.sp)
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
    }
}

// ── DIRECT MESSAGES CHAT SCREEN (Auto-Scroll, Typing, Timestamps, Seen) ─
@Composable
fun ChatConversationScreen(navController: NavController, repository: FirebaseRepository, chatId: String, otherUserId: String) {
    val messages by repository.subscribeToMessages(chatId).collectAsState(initial = emptyList())
    val otherUserProfile by repository.subscribeToUser(otherUserId).collectAsState(initial = null)
    val chatMeta by repository.subscribeToChats().collectAsState(initial = emptyList())

    var typedText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Mark messages as seen
    LaunchedEffect(messages.size) {
        repository.markMessagesAsSeen(chatId)
    }

    // Auto scroll to bottom
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    // Monitor typing status
    LaunchedEffect(typedText) {
        repository.setTypingStatus(chatId, typedText.isNotEmpty())
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
                            text = if (isOtherTyping) "typing..." else if (it.onlineStatus) "online" else "offline",
                            color = if (isOtherTyping) CyanNeon else if (it.onlineStatus) Color.Green else TextMuted,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // Message List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            items(messages) { message ->
                val isMe = message.senderId == repository.currentUserId
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isMe) Alignment.CenterEnd else Alignment.CenterStart
                ) {
                    Column(
                        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
                    ) {
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
                            Text(message.text, color = Color.White, fontSize = 14.sp)
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

        // Typing indicator
        if (isOtherTyping) {
            Text(
                text = "${otherUserProfile?.username ?: "Someone"} is typing...",
                color = CyanNeon,
                fontSize = 11.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )
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
                placeholder = "Transmit message...",
                modifier = Modifier.weight(1f)
            )
            IconButton(
                onClick = {
                    if (typedText.isEmpty()) return@IconButton
                    coroutineScope.launch {
                        repository.sendMessage(chatId, otherUserId, typedText)
                        typedText = ""
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

// Helper Extension
fun Modifier.fillGrid() = this.fillMaxSize()

// ── DISCORD-STYLE ROOMS SCREEN ───────────────────────────────
@Composable
fun RoomsScreen(navController: NavController, repository: FirebaseRepository) {
    val rooms by repository.subscribeToRooms().collectAsState(initial = emptyList())
    var showCreateDialog by remember { mutableStateOf(false) }
    var newRoomName by remember { mutableStateOf("") }
    var newRoomDesc by remember { mutableStateOf("") }
    val coroutineScope = rememberCoroutineScope()

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

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(rooms) { room ->
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
                            Text("# ${room.name}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
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
                        Text("${room.members.size} members online", color = CyanNeon, fontSize = 11.sp)
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        AlertDialog(
            onDismissRequest = { showCreateDialog = false },
            title = { Text("Initialize Custom Room", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    PremiumTextField(value = newRoomName, onValueChange = { newRoomName = it }, placeholder = "Room Name")
                    PremiumTextField(value = newRoomDesc, onValueChange = { newRoomDesc = it }, placeholder = "Room Description")
                }
            },
            confirmButton = {
                PremiumButton(
                    text = "CREATE",
                    onClick = {
                        if (newRoomName.isNotEmpty()) {
                            coroutineScope.launch {
                                repository.createRoom(newRoomName, newRoomDesc, false)
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

// ── ROOM / CHANNEL CHAT SCREEN ───────────────────────────────
@Composable
fun RoomChatScreen(navController: NavController, repository: FirebaseRepository, roomId: String) {
    val messages by repository.subscribeToRoomMessages(roomId).collectAsState(initial = emptyList())
    var typedText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

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
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { navController.popBackStack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = null, color = Color.White)
            }
            Text("Room Broadcast", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            items(messages) { message ->
                val isMe = message.senderId == repository.currentUserId
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isMe) Alignment.CenterEnd else Alignment.CenterStart
                ) {
                    GlassmorphicCard(
                        modifier = Modifier.fillMaxWidth(0.8f),
                        borderStroke = BorderStroke(1.dp, if (isMe) PurpleNeon else CardBorder)
                    ) {
                        Column {
                            Text(
                                text = if (isMe) "You" else "Citizen #${message.senderId.take(5)}",
                                color = if (isMe) PurpleNeon else CyanNeon,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            )
                            Text(message.text, color = Color.White, fontSize = 14.sp)
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
                placeholder = "Broadcast signal...",
                modifier = Modifier.weight(1f)
            )
            IconButton(
                onClick = {
                    if (typedText.isEmpty()) return@IconButton
                    coroutineScope.launch {
                        repository.sendRoomMessage(roomId, typedText)
                        typedText = ""
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

@Composable
fun Pill(text: String, color: Color) {
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
            .border(1.dp, color, RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(text = text, color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

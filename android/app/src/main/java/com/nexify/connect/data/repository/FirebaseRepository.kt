package com.nexify.connect.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.storage.FirebaseStorage
import com.nexify.connect.data.model.*
import com.nexify.connect.services.AiService
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.Date
import java.util.UUID

class FirebaseRepository {
    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()
    private val storage = FirebaseStorage.getInstance()

    val currentUserId: String? get() = auth.currentUser?.uid

    private fun List<String>?.safeIds(): List<String> = this ?: emptyList()

    private fun dmChatId(userA: String, userB: String): String =
        listOf(userA, userB).sorted().joinToString("_")

    private suspend fun getUserOrThrow(userId: String): User {
        val snap = db.collection("users").document(userId).get().await()
        return snap.toObject(User::class.java) ?: throw Exception("User not found.")
    }

    private suspend fun ensureUserShape(userId: String) {
        val ref = db.collection("users").document(userId)
        val snap = ref.get().await()
        if (!snap.exists()) return

        val data = snap.data ?: return
        val updates = mutableMapOf<String, Any>()
        val username = data["username"] as? String
        if (!username.isNullOrBlank() && username != username.lowercase()) {
            updates["username"] = username.lowercase()
        }
        if (!data.containsKey("friends")) updates["friends"] = emptyList<String>()
        if (!data.containsKey("requestsSent")) updates["requestsSent"] = emptyList<String>()
        if (!data.containsKey("requestsReceived")) updates["requestsReceived"] = emptyList<String>()

        if (updates.isNotEmpty()) {
            ref.set(updates, SetOptions.merge()).await()
        }
    }

    // ── AUTHENTICATION ───────────────────────────────────────────
    suspend fun login(email: String, password: CharSequence): Boolean {
        auth.signInWithEmailAndPassword(email, password.toString()).await()
        currentUserId?.let { ensureUserShape(it) }
        updatePresence(true)
        return true
    }

    suspend fun signUp(email: String, password: CharSequence, username: String): Boolean {
        val result = auth.createUserWithEmailAndPassword(email, password.toString()).await()
        val userId = result.user?.uid ?: throw Exception("Sign up failed.")
        
        val user = User(
            userId = userId,
            username = username.trim().lowercase(),
            email = email,
            profileImage = "https://api.dicebear.com/7.x/avataaars/svg?seed=$userId",
            bio = "Hey! I am using Nexify Connect.",
            onlineStatus = true,
            lastSeen = Date()
        )
        db.collection("users").document(userId).set(user).await()
        return true
    }

    fun logout() {
        val uid = currentUserId
        if (uid != null) {
            db.collection("users").document(uid).update(
                mapOf(
                    "onlineStatus" to false,
                    "lastSeen" to Date()
                )
            )
        }
        auth.signOut()
    }

    // ── PROFILE CUSTOMIZATION ─────────────────────────────────────
    suspend fun updateProfileImage(imageUrl: String) {
        val uid = currentUserId ?: return
        db.collection("users").document(uid).update("profileImage", imageUrl).await()
    }

    suspend fun updateProfileBio(bio: String) {
        val uid = currentUserId ?: return
        db.collection("users").document(uid).update("bio", bio).await()
    }

    // ── PRESENCE SYSTEM ──────────────────────────────────────────
    fun updatePresence(isOnline: Boolean) {
        val uid = currentUserId ?: return
        db.collection("users").document(uid).update(
            mapOf(
                "onlineStatus" to isOnline,
                "lastSeen" to Date()
            )
        )
    }

    // ── REAL-TIME FLOWS FOR USERS ─────────────────────────────────
    fun subscribeToUser(userId: String): Flow<User?> = callbackFlow {
        val docRef = db.collection("users").document(userId)
        val listener = docRef.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            trySend(snap?.toObject(User::class.java))
        }
        awaitClose { listener.remove() }
    }

    fun subscribeToAllUsers(): Flow<List<User>> = callbackFlow {
        val collRef = db.collection("users")
        val listener = collRef.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(User::class.java) } ?: emptyList()
            trySend(list.filter { it.userId != currentUserId })
        }
        awaitClose { listener.remove() }
    }

    // ── ADD FRIEND SYSTEM (Firestore Batch/Transaction Writes) ─────
    fun searchUsersByUsername(rawQuery: String): Flow<List<User>> = callbackFlow {
        val uid = currentUserId
        val search = rawQuery.trim().lowercase()
        if (uid == null || search.isBlank()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val listener = db.collection("users")
            .orderBy("username")
            .startAt(search)
            .endAt(search + "\uf8ff")
            .limit(20)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    close(err)
                    return@addSnapshotListener
                }
                val usersById = linkedMapOf<String, User>()
                snap?.documents
                    ?.mapNotNull { it.toObject(User::class.java) }
                    ?.filter { it.userId != uid }
                    ?.forEach { usersById[it.userId] = it }
                trySend(usersById.values.toList())
            }

        awaitClose { listener.remove() }
    }

    fun subscribeToUsersByIds(userIds: List<String>): Flow<List<User>> = callbackFlow {
        val uniqueIds = userIds.distinct().filter { it.isNotBlank() }
        if (uniqueIds.isEmpty()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }

        val users = linkedMapOf<String, User>()
        val listeners = uniqueIds.map { userId ->
            db.collection("users").document(userId).addSnapshotListener { snap, err ->
                if (err != null) {
                    close(err)
                    return@addSnapshotListener
                }
                val user = snap?.toObject(User::class.java)
                if (user != null) users[userId] = user else users.remove(userId)
                trySend(users.values.toList())
            }
        }

        awaitClose { listeners.forEach { it.remove() } }
    }

    suspend fun sendFriendRequest(targetUserId: String) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        if (uid == targetUserId) throw Exception("You cannot add yourself.")

        val currentUser = getUserOrThrow(uid)
        val targetUser = getUserOrThrow(targetUserId)
        if (currentUser.friends.safeIds().contains(targetUserId) || targetUser.friends.safeIds().contains(uid)) {
            throw Exception("You are already friends.")
        }
        if (currentUser.requestsSent.safeIds().contains(targetUserId) || targetUser.requestsReceived.safeIds().contains(uid)) {
            throw Exception("Friend request already sent.")
        }
        if (currentUser.requestsReceived.safeIds().contains(targetUserId) || targetUser.requestsSent.safeIds().contains(uid)) {
            throw Exception("This user already sent you a request.")
        }

        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        val batch = db.batch()
        batch.update(currentRef, "requestsSent", FieldValue.arrayUnion(targetUserId))
        batch.update(targetRef, "requestsReceived", FieldValue.arrayUnion(uid))
        batch.commit().await()
    }

    suspend fun cancelFriendRequest(targetUserId: String) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        val batch = db.batch()
        batch.update(currentRef, "requestsSent", FieldValue.arrayRemove(targetUserId))
        batch.update(targetRef, "requestsReceived", FieldValue.arrayRemove(uid))
        batch.commit().await()
    }

    suspend fun acceptFriendRequest(targetUserId: String) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        if (uid == targetUserId) throw Exception("Invalid friend request.")

        val currentUser = getUserOrThrow(uid)
        val targetUser = getUserOrThrow(targetUserId)
        val alreadyFriends = currentUser.friends.safeIds().contains(targetUserId) &&
            targetUser.friends.safeIds().contains(uid)
        val hasRequest = currentUser.requestsReceived.safeIds().contains(targetUserId) &&
            targetUser.requestsSent.safeIds().contains(uid)
        if (!alreadyFriends && !hasRequest) {
            throw Exception("Friend request is no longer available.")
        }

        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        val chatId = dmChatId(uid, targetUserId)
        val chatRef = db.collection("chats").document(chatId)

        val batch = db.batch()
        batch.update(currentRef, mapOf(
            "friends" to FieldValue.arrayUnion(targetUserId),
            "requestsReceived" to FieldValue.arrayRemove(targetUserId)
        ))
        batch.update(targetRef, mapOf(
            "friends" to FieldValue.arrayUnion(uid),
            "requestsSent" to FieldValue.arrayRemove(uid)
        ))
        batch.set(chatRef, mapOf(
            "chatId" to chatId,
            "participants" to listOf(uid, targetUserId).sorted(),
            "lastMessage" to "",
            "timestamp" to Date(),
            "createdAt" to Date()
        ), SetOptions.merge())
        batch.commit().await()
        /*

                "lastMessage" to "✨ Connected! Say hello.",
                "timestamp" to Date(),
                "createdAt" to Date()
            )
            transaction.set(chatRef, chatMeta, SetOptions.merge())
        }.await()
        */
    }

    suspend fun rejectFriendRequest(targetUserId: String) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        val batch = db.batch()
        batch.update(currentRef, "requestsReceived", FieldValue.arrayRemove(targetUserId))
        batch.update(targetRef, "requestsSent", FieldValue.arrayRemove(uid))
        batch.commit().await()
    }

    suspend fun removeFriend(targetUserId: String) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        val batch = db.batch()
        batch.update(currentRef, "friends", FieldValue.arrayRemove(targetUserId))
        batch.update(targetRef, "friends", FieldValue.arrayRemove(uid))
        batch.commit().await()
    }

    // ── STICKER SYSTEM ───────────────────────────────────────────
    fun subscribeToStickers(): Flow<List<Sticker>> = callbackFlow {
        db.collection("stickers").get().addOnSuccessListener { snap ->
            if (snap.isEmpty) {
                val defaultStickers = listOf(
                    Sticker("stk_1", "https://api.dicebear.com/7.x/bottts/svg?seed=NeonMax", "Futuristic"),
                    Sticker("stk_2", "https://api.dicebear.com/7.x/bottts/svg?seed=RetroBit", "Futuristic"),
                    Sticker("stk_3", "https://api.dicebear.com/7.x/bottts/svg?seed=GlowCore", "Neon Glow"),
                    Sticker("stk_4", "https://api.dicebear.com/7.x/bottts/svg?seed=HyperDriv", "Neon Glow"),
                    Sticker("stk_5", "https://api.dicebear.com/7.x/bottts/svg?seed=CitizZero", "Cyberpunk"),
                    Sticker("stk_6", "https://api.dicebear.com/7.x/bottts/svg?seed=NexPulse", "Cyberpunk")
                )
                db.runBatch { batch ->
                    defaultStickers.forEach { sticker ->
                        batch.set(db.collection("stickers").document(sticker.stickerId), sticker)
                    }
                }
            }
        }

        val listener = db.collection("stickers").addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Sticker::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    // ── 1-TO-1 CHAT SYSTEM (with Nexify Edge Moderation Shield) ───────
    fun getChatId(otherUserId: String): String {
        val uid = currentUserId ?: ""
        return dmChatId(uid, otherUserId)
    }

    suspend fun sendMessage(
        chatId: String, 
        otherUserId: String, 
        text: String? = null,
        imageUrl: String? = null,
        stickerId: String? = null,
        stickerUrl: String? = null
    ) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        val currentUser = getUserOrThrow(uid)
        if (!currentUser.friends.safeIds().contains(otherUserId)) {
            throw Exception("Add this user as a friend before messaging.")
        }
        if (chatId != dmChatId(uid, otherUserId)) {
            throw Exception("Invalid chat.")
        }

        // CONTENT MODERATION / SHIELD
        if (text != null && AiService.isOffensiveOrSpam(text)) {
            throw Exception("Transmission blocked by Nexify Edge: Spam or unsafe content detected.")
        }

        val messageId = UUID.randomUUID().toString()
        val message = Message(
            messageId = messageId,
            senderId = uid,
            text = text,
            imageUrl = imageUrl,
            stickerId = stickerId,
            stickerUrl = stickerUrl,
            timestamp = Date(),
            seen = false
        )

        val batch = db.batch()
        val msgRef = db.collection("messages").document(chatId).collection("chat_messages").document(messageId)
        batch.set(msgRef, message)

        val chatRef = db.collection("chats").document(chatId)
        val summary = when {
            imageUrl != null -> "📷 Sent an image"
            stickerId != null -> "👾 Sent a sticker"
            else -> text ?: ""
        }
        val chatMeta = mapOf(
            "chatId" to chatId,
            "participants" to listOf(uid, otherUserId).sorted(),
            "lastMessage" to summary,
            "timestamp" to Date()
        )
        batch.set(chatRef, chatMeta, SetOptions.merge())

        batch.commit().await()
    }

    fun subscribeToChats(): Flow<List<Chat>> = callbackFlow {
        val uid = currentUserId ?: return@callbackFlow
        var friendIds = emptySet<String>()
        var rawChats = emptyList<Chat>()

        fun publish() {
            trySend(rawChats.filter { chat ->
                val otherUserId = chat.participants.firstOrNull { it != uid }
                otherUserId != null && friendIds.contains(otherUserId) && chat.chatId == dmChatId(uid, otherUserId)
            }.sortedByDescending { it.timestamp })
        }

        val userListener = db.collection("users").document(uid).addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            friendIds = snap?.toObject(User::class.java)?.friends?.toSet() ?: emptySet()
            publish()
        }

        val q = db.collection("chats").whereArrayContains("participants", uid)
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            rawChats = snap?.documents?.mapNotNull { it.toObject(Chat::class.java) } ?: emptyList()
            publish()
        }
        awaitClose {
            userListener.remove()
            listener.remove()
        }
    }

    fun subscribeToMessages(chatId: String): Flow<List<Message>> = callbackFlow {
        val q = db.collection("messages").document(chatId).collection("chat_messages").orderBy("timestamp")
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Message::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    fun setTypingStatus(chatId: String, isTyping: Boolean) {
        val uid = currentUserId ?: return
        db.collection("chats").document(chatId).update("typingStatus.$uid", isTyping)
    }

    fun markMessagesAsSeen(chatId: String) {
        val uid = currentUserId ?: return
        db.collection("messages").document(chatId).collection("chat_messages")
            .whereNotEqualTo("senderId", uid)
            .whereEqualTo("seen", false)
            .get()
            .addOnSuccessListener { snap ->
                db.runBatch { batch ->
                    snap.documents.forEach { doc ->
                        batch.update(doc.reference, "seen", true)
                    }
                }
            }
    }

    // ── NEXIFY INTELLIGENT ASSISTANT (Nexify AI Chat System) ───────────
    fun subscribeToAiMessages(userId: String): Flow<List<Message>> = callbackFlow {
        val q = db.collection("ai_chats").document(userId).collection("chat_messages").orderBy("timestamp")
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Message::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    suspend fun sendAiMessage(userId: String, text: String, onAiTyping: (Boolean) -> Unit) {
        // CONTENT MODERATION CHECK ON USER PROMPT
        if (AiService.isOffensiveOrSpam(text)) {
            throw Exception("Transmission blocked by Nexify Edge: Prompt violates moderation rules.")
        }

        val messageId = UUID.randomUUID().toString()
        val userMessage = Message(
            messageId = messageId,
            senderId = userId,
            text = text,
            timestamp = Date()
        )
        val ref = db.collection("ai_chats").document(userId).collection("chat_messages")
        ref.document(messageId).set(userMessage).await()

        // Get context chat history
        val historySnap = ref.orderBy("timestamp").limitToLast(10).get().await()
        val history = historySnap.documents.mapNotNull { it.toObject(Message::class.java) }

        // Start typing animation delay
        onAiTyping(true)
        
        // Secure AI Call
        val response = AiService.askNexifyAI(text, history)
        
        // Delay to simulate computation
        kotlinx.coroutines.delay(1200)
        onAiTyping(false)

        val aiMessageId = UUID.randomUUID().toString()
        val aiMessage = Message(
            messageId = aiMessageId,
            senderId = "AI",
            text = response,
            timestamp = Date()
        )
        ref.document(aiMessageId).set(aiMessage).await()
    }

    // ── GROUP CHAT SYSTEM (with Moderation) ──────────────────────
    suspend fun createGroup(name: String, members: List<String>, groupImage: String): String {
        val uid = currentUserId ?: throw Exception("Unauthenticated")
        val groupId = UUID.randomUUID().toString()
        val allMembers = members + uid
        val group = Group(
            groupId = groupId,
            name = name,
            adminId = uid,
            members = allMembers,
            groupImage = groupImage.ifEmpty { "https://api.dicebear.com/7.x/identicon/svg?seed=$name" },
            createdAt = Date()
        )
        db.collection("groups").document(groupId).set(group).await()
        return groupId
    }

    suspend fun addMemberToGroup(groupId: String, targetUserId: String) {
        db.collection("groups").document(groupId).update("members", FieldValue.arrayUnion(targetUserId)).await()
    }

    suspend fun removeMemberFromGroup(groupId: String, targetUserId: String) {
        db.collection("groups").document(groupId).update("members", FieldValue.arrayRemove(targetUserId)).await()
    }

    suspend fun updateGroupImage(groupId: String, imageUrl: String) {
        db.collection("groups").document(groupId).update("groupImage", imageUrl).await()
    }

    suspend fun sendGroupMessage(
        groupId: String, 
        text: String? = null,
        imageUrl: String? = null,
        stickerId: String? = null,
        stickerUrl: String? = null
    ) {
        if (text != null && AiService.isOffensiveOrSpam(text)) {
            throw Exception("Transmission blocked by Nexify Edge: Moderation filter triggered.")
        }

        val uid = currentUserId ?: return
        val messageId = UUID.randomUUID().toString()
        val message = Message(
            messageId = messageId,
            senderId = uid,
            text = text,
            imageUrl = imageUrl,
            stickerId = stickerId,
            stickerUrl = stickerUrl,
            timestamp = Date()
        )
        db.collection("group_messages").document(groupId).collection("messages").document(messageId).set(message).await()
    }

    fun subscribeToGroups(): Flow<List<Group>> = callbackFlow {
        val uid = currentUserId ?: return@callbackFlow
        val q = db.collection("groups").whereArrayContains("members", uid)
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Group::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    fun subscribeToGroupMessages(groupId: String): Flow<List<Message>> = callbackFlow {
        val q = db.collection("group_messages").document(groupId).collection("messages").orderBy("timestamp")
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Message::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    // ── DISCORD-STYLE ROOMS SYSTEM ──────────────────────────────────
    suspend fun createRoom(name: String, description: String, category: String, isPrivate: Boolean) {
        val uid = currentUserId ?: return
        val roomId = UUID.randomUUID().toString()
        val room = Room(
            roomId = roomId,
            name = name,
            description = description,
            members = listOf(uid),
            createdBy = uid,
            isPrivate = isPrivate,
            category = category
        )
        db.collection("rooms").document(roomId).set(room).await()
    }

    suspend fun joinRoom(roomId: String) {
        val uid = currentUserId ?: return
        db.collection("rooms").document(roomId).update("members", FieldValue.arrayUnion(uid)).await()
    }

    suspend fun leaveRoom(roomId: String) {
        val uid = currentUserId ?: return
        db.collection("rooms").document(roomId).update("members", FieldValue.arrayRemove(uid)).await()
    }

    suspend fun sendRoomMessage(roomId: String, text: String) {
        if (AiService.isOffensiveOrSpam(text)) {
            throw Exception("Transmission blocked by Nexify Edge: Moderation filter triggered.")
        }
        val uid = currentUserId ?: return
        val messageId = UUID.randomUUID().toString()
        val message = Message(
            messageId = messageId,
            senderId = uid,
            text = text,
            timestamp = Date()
        )
        db.collection("room_messages").document(roomId).collection("messages").document(messageId).set(message).await()
    }

    fun subscribeToRooms(): Flow<List<Room>> = callbackFlow {
        val listener = db.collection("rooms").addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Room::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    fun subscribeToRoomMessages(roomId: String): Flow<List<Message>> = callbackFlow {
        val q = db.collection("room_messages").document(roomId).collection("messages").orderBy("timestamp")
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Message::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }
}

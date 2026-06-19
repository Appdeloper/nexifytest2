package com.nexify.connect.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.storage.FirebaseStorage
import com.nexify.connect.data.model.*
import com.nexify.connect.services.AiService
import com.nexify.connect.services.NexifyLog
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import java.util.Calendar as JavaCalendar

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
        if (!data.containsKey("blockedUsers")) updates["blockedUsers"] = emptyList<String>()

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

    suspend fun forgotPassword(email: String): Boolean {
        auth.sendPasswordResetEmail(email).await()
        return true
    }

    suspend fun signUp(email: String, password: CharSequence, username: String, inviteCode: String): Boolean {
        val trimmedCode = inviteCode.trim()
        if (trimmedCode.isEmpty()) {
            throw Exception("Invite / Access code is required to join this sector.")
        }
        val inviteRef = db.collection("invites").document(trimmedCode)
        val inviteSnap = inviteRef.get().await()
        if (!inviteSnap.exists()) {
            throw Exception("Invalid access/invite code. Access sector closed.")
        }
        val status = inviteSnap.getString("status") ?: "available"
        if (status == "used") {
            throw Exception("Invite code has already been claimed by another citizen.")
        }

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

        val referrerId = inviteSnap.getString("createdBy") ?: ""
        val batch = db.batch()
        batch.set(db.collection("users").document(userId), user)
        batch.update(inviteRef, mapOf(
            "status" to "used",
            "usedBy" to userId,
            "timestamp" to System.currentTimeMillis()
        ))
        if (referrerId.isNotEmpty()) {
            val referrerRef = db.collection("users").document(referrerId)
            batch.update(referrerRef, "xp", FieldValue.increment(500L))
        }
        batch.commit().await()

        updatePresence(true)
        return true
    }

    suspend fun signInWithGoogle(idToken: String): Boolean {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        val result = auth.signInWithCredential(credential).await()
        val userId = result.user?.uid ?: throw Exception("Google auth failed.")
        
        val userRef = db.collection("users").document(userId)
        val snap = userRef.get().await()
        if (!snap.exists()) {
            val user = User(
                userId = userId,
                username = (result.user?.displayName ?: "citizen_${userId.take(6)}").trim().lowercase().replace(" ", "_"),
                email = result.user?.email ?: "",
                profileImage = result.user?.photoUrl?.toString() ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=$userId",
                bio = "Hey! I am using Nexify Connect.",
                onlineStatus = true,
                lastSeen = Date()
            )
            userRef.set(user).await()
        } else {
            ensureUserShape(userId)
        }
        updatePresence(true)
        return true
     }

     suspend fun checkAndIncrementStreak() {
        val uid = currentUserId ?: return
        try {
            val userRef = db.collection("users").document(uid)
            val snap = userRef.get().await()
            if (!snap.exists()) return

            val data = snap.data ?: return
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val todayStr = sdf.format(Date())
            val lastActiveDate = data["lastActiveDate"] as? String ?: ""

            if (lastActiveDate == todayStr) {
                return
            }

            var streak = (data["streak"] as? Long)?.toInt() ?: 0
            var streakFreezes = (data["streakFreezes"] as? Long)?.toInt() ?: 1 // default to 1 free freeze
            var highestStreak = (data["highestStreak"] as? Long)?.toInt() ?: 0
            val activeDates = (data["activeDates"] as? List<String>)?.toMutableList() ?: mutableListOf()
            val frozenDates = (data["frozenDates"] as? List<String>)?.toMutableList() ?: mutableListOf()
            var streakUpdateToast: Map<String, Any>? = null

            if (lastActiveDate.isNotEmpty()) {
                val today = sdf.parse(todayStr)
                val lastActive = sdf.parse(lastActiveDate)
                val diffTime = Math.abs(today.time - lastActive.time)
                val diffDays = Math.ceil(diffTime.toDouble() / (1000 * 60 * 60 * 24)).toInt()

                if (diffDays == 1) {
                    // Regular consecutive check-in
                    streak += 1
                    var xpReward = 10L
                    var freezeReward = 0
                    
                    // Add dailyLogin XP directly
                    var currentXp = (data["xp"] as? Long) ?: 0L
                    currentXp += 10L
                    
                    // Check milestones
                    if (streak == 3) {
                        xpReward += 50L
                        currentXp += 50L
                        streakUpdateToast = mapOf("type" to "milestone", "streak" to 3, "xp" to 50, "freezes" to 0)
                    } else if (streak == 7) {
                        xpReward += 150L
                        currentXp += 150L
                        streakFreezes += 1
                        freezeReward += 1
                        streakUpdateToast = mapOf("type" to "milestone", "streak" to 7, "xp" to 150, "freezes" to 1)
                    } else if (streak == 14) {
                        xpReward += 250L
                        currentXp += 250L
                        streakFreezes += 1
                        freezeReward += 1
                        streakUpdateToast = mapOf("type" to "milestone", "streak" to 14, "xp" to 250, "freezes" to 1)
                    } else if (streak == 30) {
                        xpReward += 500L
                        currentXp += 500L
                        streakFreezes += 2
                        freezeReward += 2
                        streakUpdateToast = mapOf("type" to "milestone", "streak" to 30, "xp" to 500, "freezes" to 2)
                    } else {
                        streakUpdateToast = mapOf("type" to "daily", "streak" to streak, "xp" to 10, "freezes" to 0)
                    }

                    // Level calculation: 100 XP per level
                    val level = (currentXp / 100).toInt() + 1
                    userRef.update(mapOf("xp" to currentXp, "level" to level)).await()
                    
                } else if (diffDays == 2) {
                    // Missed exactly 1 day. Check if we have a streak freeze!
                    if (streakFreezes > 0) {
                        streakFreezes -= 1
                        // Keep current streak!
                        // Yesterday's date
                        val cal = JavaCalendar.getInstance()
                        cal.add(JavaCalendar.DAY_OF_YEAR, -1)
                        val yesterdayStr = sdf.format(cal.time)
                        frozenDates.add(yesterdayStr)
                        if (frozenDates.size > 30) frozenDates.removeAt(0)

                        streakUpdateToast = mapOf("type" to "freeze_used", "streak" to streak, "remainingFreezes" to streakFreezes)

                        // Log activity
                        val activity = mapOf(
                            "userId" to uid,
                            "userName" to (data["displayName"] as? String ?: "Citizen"),
                            "userPhoto" to (data["photoURL"] as? String ?: ""),
                            "type" to "ACHIEVEMENT_UNLOCKED",
                            "text" to "used a ❄️ Streak Freeze to keep a $streak-day streak alive!",
                            "timestamp" to FieldValue.serverTimestamp()
                        )
                        db.collection("activityFeed").add(activity).await()

                    } else {
                        // Reset
                        streak = 1
                        streakUpdateToast = mapOf("type" to "reset", "oldStreak" to streak, "newStreak" to 1)
                    }
                } else {
                    // Reset
                    streak = 1
                    streakUpdateToast = mapOf("type" to "reset", "oldStreak" to streak, "newStreak" to 1)
                }
            } else {
                streak = 1
                streakUpdateToast = mapOf("type" to "welcome", "streak" to 1)
            }

            if (streak > highestStreak) {
                highestStreak = streak
            }

            activeDates.add(todayStr)
            if (activeDates.size > 30) activeDates.removeAt(0)

            userRef.update(mapOf(
                "streak" to streak,
                "highestStreak" to highestStreak,
                "streakFreezes" to streakFreezes,
                "lastActiveDate" to todayStr,
                "activeDates" to activeDates,
                "frozenDates" to frozenDates,
                "streakUpdateToast" to streakUpdateToast,
                "updatedAt" to FieldValue.serverTimestamp()
            )).await()

        } catch (e: Exception) {
            NexifyLog.e("FirebaseRepository", "Failed to check and increment daily streak: ${e.message}", e)
        }
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
        if (currentUser.blockedUsers.safeIds().contains(targetUserId)) {
            throw Exception("You have blocked this user.")
        }
        if (targetUser.blockedUsers.safeIds().contains(uid)) {
            throw Exception("Action blocked.")
        }
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
        
        if (currentUser.blockedUsers.safeIds().contains(targetUserId) || targetUser.blockedUsers.safeIds().contains(uid)) {
            throw Exception("Block action exists. Friend request cannot be accepted.")
        }

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
            "requestsReceived" to FieldValue.arrayRemove(targetUserId),
            "requestsSent" to FieldValue.arrayRemove(targetUserId)
        ))
        batch.update(targetRef, mapOf(
            "friends" to FieldValue.arrayUnion(uid),
            "requestsSent" to FieldValue.arrayRemove(uid),
            "requestsReceived" to FieldValue.arrayRemove(uid)
        ))
        batch.set(chatRef, mapOf(
            "chatId" to chatId,
            "type" to "dm",
            "participants" to listOf(uid, targetUserId).sorted(),
            "members" to listOf(uid, targetUserId).sorted(),
            "memberMap" to mapOf(uid to true, targetUserId to true),
            "lastMessage" to "",
            "lastMessageAt" to null,
            "timestamp" to Date(),
            "createdAt" to Date()
        ), SetOptions.merge())
        batch.commit().await()
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

    suspend fun blockUser(targetUserId: String) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        if (uid == targetUserId) throw Exception("You cannot block yourself.")

        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        val batch = db.batch()
        batch.update(currentRef, mapOf(
            "blockedUsers" to FieldValue.arrayUnion(targetUserId),
            "friends" to FieldValue.arrayRemove(targetUserId),
            "requestsSent" to FieldValue.arrayRemove(targetUserId),
            "requestsReceived" to FieldValue.arrayRemove(targetUserId)
        ))
        batch.update(targetRef, mapOf(
            "friends" to FieldValue.arrayRemove(uid),
            "requestsSent" to FieldValue.arrayRemove(uid),
            "requestsReceived" to FieldValue.arrayRemove(uid)
        ))
        batch.commit().await()
    }

    suspend fun unblockUser(targetUserId: String) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        val currentRef = db.collection("users").document(uid)
        currentRef.update("blockedUsers", FieldValue.arrayRemove(targetUserId)).await()
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

    suspend fun createChatIfNotExists(chatId: String, otherUserId: String) {
        val uid = currentUserId ?: throw Exception("Unauthenticated.")
        val chatRef = db.collection("chats").document(chatId)
        val snap = chatRef.get().await()

        if (!snap.exists()) {
            val currentUser = getUserOrThrow(uid)
            if (!currentUser.friends.safeIds().contains(otherUserId)) {
                throw Exception("Add this user as a friend before messaging.")
            }

            val chatData = mapOf(
                "chatId" to chatId,
                "type" to "dm",
                "participants" to listOf(uid, otherUserId).sorted(),
                "members" to listOf(uid, otherUserId).sorted(),
                "memberMap" to mapOf(uid to true, otherUserId to true),
                "lastMessage" to "",
                "lastMessageAt" to null,
                "timestamp" to Date(),
                "lastTimestamp" to Date(),
                "createdAt" to Date()
            )
            chatRef.set(chatData).await()
            NexifyLog.i("ChatCreation", "Created non-existent chat: $chatId")
        }
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
        createChatIfNotExists(chatId, otherUserId)
        
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

        val messageId = java.util.UUID.randomUUID().toString()
        val type = when {
            imageUrl != null -> "image"
            stickerId != null || stickerUrl != null -> "sticker"
            else -> "text"
        }
        val message = Message(
            messageId = messageId,
            senderId = uid,
            text = text,
            imageUrl = imageUrl,
            stickerId = stickerId,
            stickerUrl = stickerUrl,
            type = type,
            timestamp = Date(),
            createdAt = Date(),
            seen = false
        )

        val batch = db.batch()
        val msgRef = db.collection("chats").document(chatId).collection("messages").document(messageId)
        batch.set(msgRef, message)

        val chatRef = db.collection("chats").document(chatId)
        val summary = when {
            imageUrl != null -> "📷 Sent an image"
            stickerId != null || stickerUrl != null -> "👾 Sent a sticker"
            else -> text ?: ""
        }
        val chatMeta = mapOf(
            "chatId" to chatId,
            "participants" to listOf(uid, otherUserId).sorted(),
            "lastMessage" to summary,
            "timestamp" to Date(),
            "lastMessageAt" to Date(),
            "updatedAt" to Date()
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

    fun listenMessages(chatId: String, limit: Int = 50): Flow<List<Message>> = subscribeToMessages(chatId, limit)

    fun subscribeToMessages(chatId: String, limit: Int = 50): Flow<List<Message>> = callbackFlow {
        val q = db.collection("chats").document(chatId).collection("messages")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(limit.toLong())
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Message::class.java) } ?: emptyList()
            trySend(list.reversed())
        }
        awaitClose { listener.remove() }
    }

    fun setTypingStatus(chatId: String, isTyping: Boolean) {
        val uid = currentUserId ?: return
        db.collection("chats").document(chatId).update("typingStatus.$uid", isTyping)
    }

    fun markMessagesAsSeen(chatId: String) {
        val uid = currentUserId ?: return
        db.collection("chats").document(chatId).collection("messages")
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
    fun subscribeToAiMessages(userId: String): Flow<List<AiChatMessage>> = callbackFlow {
        val q = db.collection("ai_chats").document(userId).collection("messages").orderBy("timestamp")
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { doc ->
                try {
                    doc.toObject(AiChatMessage::class.java)
                } catch (e: Exception) {
                    // Fallback to manual parsing if document is malformed
                    val sender = doc.getString("sender") ?: "user"
                    val text = doc.getString("text") ?: ""
                    val timestamp = doc.getLong("timestamp") ?: System.currentTimeMillis()
                    AiChatMessage(sender, text, timestamp)
                }
            } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    suspend fun receiveAIResponse(userId: String, prompt: String, history: List<AiChatMessage>): String {
        // Map history to standard Message shape for the OkHttp REST API call context
        val mappedHistory = history.map {
            Message(
                senderId = if (it.sender == "ai") "AI" else userId,
                text = it.text,
                timestamp = Date(it.timestamp)
            )
        }
        return AiService.askNexifyAI(prompt, mappedHistory)
    }

    suspend fun sendAIMessage(userId: String, text: String, onAiTyping: (Boolean) -> Unit) {
        if (AiService.isOffensiveOrSpam(text)) {
            throw Exception("Transmission blocked by Nexify Edge: Prompt violates moderation rules.")
        }

        val chatRef = db.collection("ai_chats").document(userId)
        val messagesRef = chatRef.collection("messages")

        // Ensure parent document existence in ai_chats
        chatRef.set(mapOf(
            "chatId" to userId,
            "userId" to userId,
            "createdAt" to Date()
        ), SetOptions.merge()).await()

        // Write user's message document
        val userMsgId = UUID.randomUUID().toString()
        val userMessage = AiChatMessage(
            sender = "user",
            text = text,
            timestamp = System.currentTimeMillis()
        )
        messagesRef.document(userMsgId).set(userMessage).await()

        // Fetch context history for query limits
        val historySnap = messagesRef.orderBy("timestamp").limitToLast(10).get().await()
        val history = historySnap.documents.mapNotNull { it.toObject(AiChatMessage::class.java) }

        onAiTyping(true)
        try {
            val response = receiveAIResponse(userId, text, history)
            
            // Artificial delay to simulate thinking time
            kotlinx.coroutines.delay(1200)

            // Write AI's response document
            val aiMsgId = UUID.randomUUID().toString()
            val aiMessage = AiChatMessage(
                sender = "ai",
                text = response,
                timestamp = System.currentTimeMillis()
            )
            messagesRef.document(aiMsgId).set(aiMessage).await()
        } catch (e: Exception) {
            NexifyLog.e("AiChat", "Failed to retrieve AI response", e)
            throw e
        } finally {
            onAiTyping(false)
        }
    }

    suspend fun sendAiMessage(userId: String, text: String, onAiTyping: (Boolean) -> Unit) {
        sendAIMessage(userId, text, onAiTyping)
    }

    // ── AI TOOLS SYSTEM WRAPPERS ──────────────────────────────────────
    suspend fun generateReelIdea(userId: String, topic: String, onAiTyping: (Boolean) -> Unit) {
        val userPrompt = "[Reel Tool] Generate Reel ideas for topic: '$topic'"
        val chatRef = db.collection("ai_chats").document(userId)
        val messagesRef = chatRef.collection("messages")

        chatRef.set(mapOf(
            "chatId" to userId,
            "userId" to userId,
            "createdAt" to Date()
        ), SetOptions.merge()).await()

        val userMsgId = UUID.randomUUID().toString()
        messagesRef.document(userMsgId).set(AiChatMessage(
            sender = "user",
            text = userPrompt,
            timestamp = System.currentTimeMillis()
        )).await()

        onAiTyping(true)
        try {
            val response = AiService.generateReelIdea(topic)
            val aiMsgId = UUID.randomUUID().toString()
            messagesRef.document(aiMsgId).set(AiChatMessage(
                sender = "ai",
                text = response,
                timestamp = System.currentTimeMillis()
            )).await()
        } catch (e: Exception) {
            NexifyLog.e("ReelIdeaTool", "Tool failed", e)
            throw e
        } finally {
            onAiTyping(false)
        }
    }

    suspend fun generateCaption(userId: String, mediaDescription: String, tone: String, onAiTyping: (Boolean) -> Unit) {
        val userPrompt = "[Caption Tool] Write a caption for: '$mediaDescription' (Tone: $tone)"
        val chatRef = db.collection("ai_chats").document(userId)
        val messagesRef = chatRef.collection("messages")

        chatRef.set(mapOf(
            "chatId" to userId,
            "userId" to userId,
            "createdAt" to Date()
        ), SetOptions.merge()).await()

        val userMsgId = UUID.randomUUID().toString()
        messagesRef.document(userMsgId).set(AiChatMessage(
            sender = "user",
            text = userPrompt,
            timestamp = System.currentTimeMillis()
        )).await()

        onAiTyping(true)
        try {
            val response = AiService.generateCaption(mediaDescription, tone)
            val aiMsgId = UUID.randomUUID().toString()
            messagesRef.document(aiMsgId).set(AiChatMessage(
                sender = "ai",
                text = response,
                timestamp = System.currentTimeMillis()
            )).await()
        } catch (e: Exception) {
            NexifyLog.e("CaptionTool", "Tool failed", e)
            throw e
        } finally {
            onAiTyping(false)
        }
    }

    suspend fun generatePrompt(userId: String, taskDescription: String, onAiTyping: (Boolean) -> Unit) {
        val userPrompt = "[Prompt Tool] Optimize prompt for task: '$taskDescription'"
        val chatRef = db.collection("ai_chats").document(userId)
        val messagesRef = chatRef.collection("messages")

        chatRef.set(mapOf(
            "chatId" to userId,
            "userId" to userId,
            "createdAt" to Date()
        ), SetOptions.merge()).await()

        val userMsgId = UUID.randomUUID().toString()
        messagesRef.document(userMsgId).set(AiChatMessage(
            sender = "user",
            text = userPrompt,
            timestamp = System.currentTimeMillis()
        )).await()

        onAiTyping(true)
        try {
            val response = AiService.generatePrompt(taskDescription)
            val aiMsgId = UUID.randomUUID().toString()
            messagesRef.document(aiMsgId).set(AiChatMessage(
                sender = "ai",
                text = response,
                timestamp = System.currentTimeMillis()
            )).await()
        } catch (e: Exception) {
            NexifyLog.e("PromptOptimizerTool", "Tool failed", e)
            throw e
        } finally {
            onAiTyping(false)
        }
    }

    suspend fun processRoomAITag(roomId: String, messages: List<Message>) {
        val lastMsg = messages.lastOrNull() ?: return
        if (lastMsg.senderId == "nexify_ai") return

        val text = lastMsg.text ?: ""
        val isTagged = text.contains("@nexifyai", ignoreCase = true)
        if (!isTagged) return

        val roomRef = db.collection("rooms").document(roomId)
        
        try {
            // Set AI typing to true in Room
            roomRef.update("typing.nexify_ai", true).await()

            // Get context history matching the Message model shapes
            val history = messages.takeLast(10)

            // Secure Gemini / Local simulation call
            val response = AiService.askNexifyAI(text, history)

            // Small delay to simulate thoughts processing
            kotlinx.coroutines.delay(1200)

            // Write AI message payload
            val aiMessageId = UUID.randomUUID().toString()
            val now = Date()
            val aiMessage = Message(
                messageId = aiMessageId,
                senderId = "nexify_ai",
                text = response,
                type = "text",
                timestamp = now,
                createdAt = now,
                seen = true
            )
            val msgRef = roomRef.collection("messages").document(aiMessageId)
            
            val batch = db.batch()
            batch.set(msgRef, aiMessage)
            
            // Update parent room summaries
            val roomUpdates = mapOf(
                "lastMessage" to response,
                "lastMessageAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp(),
                "typing.nexify_ai" to false
            )
            batch.update(roomRef, roomUpdates)
            batch.commit().await()

        } catch (e: Exception) {
            NexifyLog.e("RoomAITag", "Failed to process AI tag reply.", e)
            try {
                roomRef.update("typing.nexify_ai", false).await()
            } catch (ignore: Exception) {}
        }
    }

    suspend fun processChatAITag(chatId: String, messages: List<Message>) {
        val lastMsg = messages.lastOrNull() ?: return
        if (lastMsg.senderId == "nexify_ai") return

        val text = lastMsg.text ?: ""
        val isTagged = text.contains("@nexifyai", ignoreCase = true)
        if (!isTagged) return

        val chatRef = db.collection("chats").document(chatId)
        
        try {
            // Set AI typing to true in Chat
            chatRef.update("typingStatus.nexify_ai", true).await()

            // Get context history matching the Message model shapes
            val history = messages.takeLast(10)

            // Secure Gemini / Local simulation call
            val response = AiService.askNexifyAI(text, history)

            // Small delay to simulate thoughts processing
            kotlinx.coroutines.delay(1200)

            // Write AI message payload
            val aiMessageId = UUID.randomUUID().toString()
            val now = Date()
            val aiMessage = Message(
                messageId = aiMessageId,
                senderId = "nexify_ai",
                text = response,
                type = "text",
                timestamp = now,
                createdAt = now,
                seen = false
            )
            val msgRef = chatRef.collection("messages").document(aiMessageId)
            
            val batch = db.batch()
            batch.set(msgRef, aiMessage)
            
            // Update parent chat summaries
            val chatUpdates = mapOf(
                "lastMessage" to response,
                "timestamp" to now,
                "lastMessageAt" to now,
                "typingStatus.nexify_ai" to false
            )
            batch.update(chatRef, chatUpdates)
            batch.commit().await()

        } catch (e: Exception) {
            NexifyLog.e("ChatAITag", "Failed to process AI tag reply.", e)
            try {
                chatRef.update("typingStatus.nexify_ai", false).await()
            } catch (ignore: Exception) {}
        }
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
        val uid = currentUserId ?: throw Exception("Unauthorized session.")
        val roomRef = db.collection("rooms").document(roomId)
        val roomSnap = roomRef.get().await()
        if (!roomSnap.exists()) {
            throw Exception("Room sector not found.")
        }
        val batch = db.batch()
        batch.update(roomRef, "members", FieldValue.arrayUnion(uid))
        batch.update(roomRef, "memberMap.$uid", true)
        val userRef = db.collection("users").document(uid)
        batch.update(userRef, "joinedRooms", FieldValue.arrayUnion(roomId))
        batch.commit().await()
    }

    suspend fun leaveRoom(roomId: String) {
        val uid = currentUserId ?: return
        val batch = db.batch()
        val roomRef = db.collection("rooms").document(roomId)
        batch.update(roomRef, "members", FieldValue.arrayRemove(uid))
        batch.update(roomRef, "memberMap.$uid", FieldValue.delete())
        val userRef = db.collection("users").document(uid)
        batch.update(userRef, "joinedRooms", FieldValue.arrayRemove(roomId))
        batch.commit().await()
    }

    suspend fun sendRoomMessage(
        roomId: String,
        text: String? = null,
        mediaUrl: String? = null,
        type: String = "text",
        fileName: String? = null,
        fileSize: Long? = null
    ) {
        val uid = currentUserId ?: return
        if (text != null && text.trim().isNotEmpty() && AiService.isOffensiveOrSpam(text)) {
            throw Exception("Transmission blocked by Nexify Edge: Moderation filter triggered.")
        }
        val messageId = UUID.randomUUID().toString()
        val now = Date()
        val message = Message(
            messageId = messageId,
            senderId = uid,
            text = text,
            mediaURL = mediaUrl,
            type = type,
            fileName = fileName,
            fileSize = fileSize,
            timestamp = now,
            createdAt = now,
            isPinned = false,
            reactions = emptyMap()
        )
        
        val batch = db.batch()
        val msgRef = db.collection("rooms").document(roomId).collection("messages").document(messageId)
        batch.set(msgRef, message)
        
        val roomRef = db.collection("rooms").document(roomId)
        val lastMsgText = when (type) {
            "image" -> "📷 Sent an image"
            "gif" -> "👾 Sent a GIF"
            "file" -> "📁 Sent a file: ${fileName ?: "attachment"}"
            else -> text ?: ""
        }
        val roomUpdates = mapOf(
            "lastMessage" to lastMsgText,
            "lastMessageAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        batch.update(roomRef, roomUpdates)
        
        batch.commit().await()
    }

    suspend fun joinVoice(roomId: String) {
        val uid = currentUserId ?: return
        db.collection("rooms").document(roomId)
            .update("voiceMembers", FieldValue.arrayUnion(uid))
            .await()
    }

    suspend fun leaveVoice(roomId: String) {
        val uid = currentUserId ?: return
        db.collection("rooms").document(roomId)
            .update("voiceMembers", FieldValue.arrayRemove(uid))
            .await()
    }

    suspend fun togglePinRoomMessage(roomId: String, messageId: String, currentPinStatus: Boolean) {
        db.collection("rooms").document(roomId).collection("messages").document(messageId)
            .update("isPinned", !currentPinStatus)
            .await()
    }

    suspend fun reactToRoomMessage(roomId: String, messageId: String, emoji: String) {
        val uid = currentUserId ?: return
        db.collection("rooms").document(roomId).collection("messages").document(messageId)
            .update("reactions.$emoji", FieldValue.arrayUnion(uid))
            .await()
    }

    suspend fun removeReactionFromRoomMessage(roomId: String, messageId: String, emoji: String) {
        val uid = currentUserId ?: return
        db.collection("rooms").document(roomId).collection("messages").document(messageId)
            .update("reactions.$emoji", FieldValue.arrayRemove(uid))
            .await()
    }

    suspend fun setRoomTypingStatus(roomId: String, isTyping: Boolean) {
        val uid = currentUserId ?: return
        db.collection("rooms").document(roomId)
            .update("typing.$uid", isTyping)
            .await()
    }

    suspend fun removeRoomMember(roomId: String, userId: String) {
        val batch = db.batch()
        val roomRef = db.collection("rooms").document(roomId)
        batch.update(roomRef, "members", FieldValue.arrayRemove(userId))
        batch.update(roomRef, "memberMap.$userId", FieldValue.delete())
        batch.commit().await()
    }

    suspend fun inviteFriendToRoom(roomId: String, friendId: String) {
        val batch = db.batch()
        val roomRef = db.collection("rooms").document(roomId)
        batch.update(roomRef, "members", FieldValue.arrayUnion(friendId))
        batch.update(roomRef, "memberMap.$friendId", true)
        batch.commit().await()
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

    fun subscribeToRoom(roomId: String): Flow<Room?> = callbackFlow {
        val listener = db.collection("rooms").document(roomId).addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val room = snap?.toObject(Room::class.java)
            trySend(room)
        }
        awaitClose { listener.remove() }
    }

    fun subscribeToRoomMessages(roomId: String, limit: Int = 50): Flow<List<Message>> = callbackFlow {
        val q = db.collection("rooms").document(roomId).collection("messages")
            .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(limit.toLong())
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Message::class.java) } ?: emptyList()
            trySend(list.reversed())
        }
        awaitClose { listener.remove() }
    }

    suspend fun rewardUserXp(amount: Long) {
        val uid = currentUserId ?: return
        db.collection("users").document(uid)
            .update("xp", FieldValue.increment(amount))
            .await()
    }

    suspend fun saveFocusSession(durationMinutes: Int, xpEarned: Long) {
        val uid = currentUserId ?: return
        val sessionId = UUID.randomUUID().toString()
        val session = FocusSession(
            sessionId = sessionId,
            userId = uid,
            durationMinutes = durationMinutes,
            xpEarned = xpEarned,
            timestamp = System.currentTimeMillis()
        )
        db.collection("focus_sessions").document(sessionId).set(session).await()
        rewardUserXp(xpEarned)
    }

    fun subscribeToFocusSessions(): Flow<List<FocusSession>> = callbackFlow {
        val uid = currentUserId
        if (uid == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val q = db.collection("focus_sessions")
            .whereEqualTo("userId", uid)
            .orderBy("timestamp")
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                trySend(emptyList())
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { doc ->
                try {
                    doc.toObject(FocusSession::class.java)
                } catch (e: Exception) {
                    val sId = doc.id
                    val uId = doc.getString("userId") ?: ""
                    val dur = doc.getLong("durationMinutes")?.toInt() ?: 0
                    val xp = doc.getLong("xpEarned") ?: 0L
                    val ts = doc.getLong("timestamp") ?: 0L
                    FocusSession(sId, uId, dur, xp, ts)
                }
            } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    suspend fun createChatRoom(name: String) {
        val uid = currentUserId ?: return
        val roomId = UUID.randomUUID().toString()
        val room = ChatRoom(
            roomId = roomId,
            name = name,
            createdBy = uid,
            participants = listOf(uid),
            createdAt = Date()
        )
        db.collection("chat_rooms").document(roomId).set(room).await()
    }

    suspend fun joinChatRoom(roomId: String) {
        val uid = currentUserId ?: return
        db.collection("chat_rooms").document(roomId)
            .update("participants", FieldValue.arrayUnion(uid))
            .await()
    }

    fun subscribeToChatRooms(): Flow<List<ChatRoom>> = callbackFlow {
        val listener = db.collection("chat_rooms")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { it.toObject(ChatRoom::class.java) } ?: emptyList()
                trySend(list)
            }
        awaitClose { listener.remove() }
    }

    fun subscribeToChatRoom(roomId: String): Flow<ChatRoom?> = callbackFlow {
        val listener = db.collection("chat_rooms").document(roomId)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    trySend(null)
                    return@addSnapshotListener
                }
                trySend(snap?.toObject(ChatRoom::class.java))
            }
        awaitClose { listener.remove() }
    }

    fun subscribeToChatRoomMessages(roomId: String, limit: Int = 50): Flow<List<Message>> = callbackFlow {
        val q = db.collection("chat_rooms").document(roomId).collection("messages")
            .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(limit.toLong())
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                trySend(emptyList())
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Message::class.java) } ?: emptyList()
            trySend(list.reversed())
        }
        awaitClose { listener.remove() }
    }

    suspend fun sendChatRoomMessage(roomId: String, text: String) {
        val uid = currentUserId ?: return
        if (AiService.isOffensiveOrSpam(text)) {
            throw Exception("Transmission blocked by moderation check.")
        }
        val messageId = UUID.randomUUID().toString()
        val msg = Message(
            messageId = messageId,
            senderId = uid,
            text = text,
            timestamp = Date(),
            type = "text"
        )
        db.collection("chat_rooms").document(roomId).collection("messages")
            .document(messageId).set(msg).await()
        rewardUserXp(10L)
    }

    fun subscribeToLeaderboard(): Flow<List<User>> = callbackFlow {
        val q = db.collection("users")
            .orderBy("xp", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(50)
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                trySend(emptyList())
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(User::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    suspend fun startCall(receiverId: String): String {
        val uid = currentUserId ?: throw Exception("Not logged in")
        val callId = "${uid}_${receiverId}"
        val call = CallSession(
            callId = callId,
            callerId = uid,
            receiverId = receiverId,
            status = "dialing",
            timestamp = System.currentTimeMillis()
        )
        db.collection("calls").document(callId).set(call).await()
        return callId
    }

    suspend fun answerCall(callId: String) {
        db.collection("calls").document(callId)
            .update("status", "connected")
            .await()
    }

    suspend fun endCall(callId: String) {
        db.collection("calls").document(callId)
            .update("status", "ended")
            .await()
    }

    fun subscribeToIncomingCalls(): Flow<List<CallSession>> = callbackFlow {
        val uid = currentUserId
        if (uid == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val q = db.collection("calls")
            .whereEqualTo("receiverId", uid)
            .whereNotEqualTo("status", "ended")
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                trySend(emptyList())
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(CallSession::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    fun subscribeToCallState(callId: String): Flow<CallSession?> = callbackFlow {
        val listener = db.collection("calls").document(callId)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    trySend(null)
                    return@addSnapshotListener
                }
                trySend(snap?.toObject(CallSession::class.java))
            }
        awaitClose { listener.remove() }
    }

    suspend fun saveFitnessData(date: String, steps: Int, calories: Double, streak: Int, xpRewarded: Long) {
        val uid = currentUserId ?: return
        val record = FitnessRecord(
            date = date,
            steps = steps,
            calories = calories,
            streak = streak,
            xpRewarded = xpRewarded,
            timestamp = System.currentTimeMillis()
        )
        db.collection("fitness").document(uid).collection("records").document(date).set(record).await()
        if (xpRewarded > 0L) {
            rewardUserXp(xpRewarded)
        }
    }

    fun subscribeToFitnessData(): Flow<List<FitnessRecord>> = callbackFlow {
        val uid = currentUserId
        if (uid == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val q = db.collection("fitness").document(uid).collection("records")
            .orderBy("timestamp")
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                trySend(emptyList())
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(FitnessRecord::class.java) } ?: emptyList()
            trySend(list)
        }
        awaitClose { listener.remove() }
    }

    fun subscribeToEdgePosts(): Flow<List<EdgePost>> = callbackFlow {
        val listener = db.collection("edge_posts")
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .addSnapshotListener { snap, err ->
                if (err != null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }
                val list = snap?.documents?.mapNotNull { it.toObject(EdgePost::class.java) } ?: emptyList()
                trySend(list)
            }
        awaitClose { listener.remove() }
    }

    fun subscribeToSavedEdgePosts(): Flow<List<String>> = callbackFlow {
        val uid = currentUserId
        if (uid == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val ref = db.collection("users").document(uid).collection("saved_edge").document("posts")
        val listener = ref.addSnapshotListener { snap, err ->
            if (err != null || snap == null || !snap.exists()) {
                trySend(emptyList())
                return@addSnapshotListener
            }
            val ids = snap.get("savedIds") as? List<*>
            val stringIds = ids?.mapNotNull { it as? String } ?: emptyList()
            trySend(stringIds)
        }
        awaitClose { listener.remove() }
    }

    suspend fun saveEdgePost(postId: String) {
        val uid = currentUserId ?: return
        val ref = db.collection("users").document(uid).collection("saved_edge").document("posts")
        db.runTransaction { transaction ->
            val snapshot = transaction.get(ref)
            val currentIds = if (snapshot.exists()) {
                (snapshot.get("savedIds") as? List<*>)?.mapNotNull { it as? String } ?: emptyList()
            } else {
                emptyList()
            }
            if (!currentIds.contains(postId)) {
                val updatedIds = currentIds + postId
                transaction.set(ref, mapOf("savedIds" to updatedIds), SetOptions.merge())
            }
            null
        }.await()
    }

    suspend fun unsaveEdgePost(postId: String) {
        val uid = currentUserId ?: return
        val ref = db.collection("users").document(uid).collection("saved_edge").document("posts")
        db.runTransaction { transaction ->
            val snapshot = transaction.get(ref)
            if (snapshot.exists()) {
                val currentIds = (snapshot.get("savedIds") as? List<*>)?.mapNotNull { it as? String } ?: emptyList()
                if (currentIds.contains(postId)) {
                    val updatedIds = currentIds - postId
                    transaction.set(ref, mapOf("savedIds" to updatedIds), SetOptions.merge())
                }
            }
            null
        }.await()
    }

    fun subscribeToUserPreferences(): Flow<List<String>> = callbackFlow {
        val uid = currentUserId
        if (uid == null) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val ref = db.collection("users").document(uid).collection("preferences").document("settings")
        val listener = ref.addSnapshotListener { snap, err ->
            if (err != null || snap == null || !snap.exists()) {
                trySend(listOf("Tech", "Focus", "Students", "Motivation"))
                return@addSnapshotListener
            }
            val interests = snap.get("interests") as? List<*>
            val stringInterests = interests?.mapNotNull { it as? String } ?: listOf("Tech", "Focus", "Students", "Motivation")
            trySend(stringInterests)
        }
        awaitClose { listener.remove() }
    }

    suspend fun updateUserPreferences(interests: List<String>) {
        val uid = currentUserId ?: return
        val ref = db.collection("users").document(uid).collection("preferences").document("settings")
        ref.set(mapOf("interests" to interests), SetOptions.merge()).await()
    }

    suspend fun generateInviteCode(): String {
        val uid = currentUserId ?: throw Exception("Not logged in")
        val code = "NEXIFY-" + UUID.randomUUID().toString().take(8).toUpperCase()
        db.collection("invites").document(code).set(mapOf(
            "code" to code,
            "createdBy" to uid,
            "status" to "available",
            "createdAt" to Date()
        )).await()
        return code
    }

    suspend fun logFeatureUsage(featureName: String) {
        val uid = currentUserId ?: return
        try {
            val ref = db.collection("users").document(uid).collection("behavior_analytics").document("current_metrics")
            db.runTransaction { transaction ->
                val snapshot = transaction.get(ref)
                val rawMap = snapshot.get("featureUsageFreq") as? Map<*, *>
                val updatedFreq = mutableMapOf<String, Long>()
                rawMap?.forEach { (k, v) ->
                    if (k is String && v is Number) {
                        updatedFreq[k] = v.toLong()
                    }
                }
                updatedFreq[featureName] = (updatedFreq[featureName] ?: 0L) + 1L

                val updates = mapOf(
                    "lastActiveTimestamp" to System.currentTimeMillis(),
                    "featureUsageFreq" to updatedFreq
                )
                transaction.set(ref, updates, SetOptions.merge())
                null
            }.await()
        } catch (e: Exception) {
            NexifyLog.e("Telemetry", "Failed to log feature usage for $featureName", e)
        }
    }

    suspend fun updateProfileDetails(username: String, email: String, bio: String): Boolean {
        val uid = currentUserId ?: return false
        val updates = mapOf(
            "username" to username.trim().lowercase(),
            "email" to email.trim().lowercase(),
            "bio" to bio
        )
        db.collection("users").document(uid).update(updates).await()
        
        try {
            val user = auth.currentUser
            if (user != null && user.email != email) {
                user.updateEmail(email.trim().lowercase()).await()
            }
        } catch (e: Exception) {
            NexifyLog.e("FirebaseRepository", "Failed to update auth email: ${e.message}")
        }
        return true
    }

    suspend fun reportBug(title: String, description: String, deviceDetails: String): Boolean {
        val uid = currentUserId ?: "anonymous"
        val bugMap = mapOf(
            "title" to title,
            "description" to description,
            "deviceDetails" to deviceDetails,
            "reportedBy" to uid,
            "timestamp" to FieldValue.serverTimestamp()
        )
        db.collection("bugs").add(bugMap).await()
        return true
    }
}



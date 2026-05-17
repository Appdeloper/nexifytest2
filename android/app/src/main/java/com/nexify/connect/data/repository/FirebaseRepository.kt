package com.nexify.connect.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.storage.FirebaseStorage
import com.nexify.connect.data.model.*
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

    // ── AUTHENTICATION ───────────────────────────────────────────
    suspend fun login(email: String, password: CharSequence): Boolean {
        auth.signInWithEmailAndPassword(email, password.toString()).await()
        updatePresence(true)
        return true
    }

    suspend fun signUp(email: String, password: CharSequence, username: String): Boolean {
        val result = auth.createUserWithEmailAndPassword(email, password.toString()).await()
        val userId = result.user?.uid ?: throw Exception("Sign up failed.")
        
        val user = User(
            userId = userId,
            username = username,
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
    suspend fun sendFriendRequest(targetUserId: String) {
        val uid = currentUserId ?: return
        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        db.runTransaction { transaction ->
            // Update current user
            transaction.update(currentRef, "requestsSent", FieldValue.arrayUnion(targetUserId))
            // Update target user
            transaction.update(targetRef, "requestsReceived", FieldValue.arrayUnion(uid))
        }.await()
    }

    suspend fun cancelFriendRequest(targetUserId: String) {
        val uid = currentUserId ?: return
        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        db.runTransaction { transaction ->
            transaction.update(currentRef, "requestsSent", FieldValue.arrayRemove(targetUserId))
            transaction.update(targetRef, "requestsReceived", FieldValue.arrayRemove(uid))
        }.await()
    }

    suspend fun acceptFriendRequest(targetUserId: String) {
        val uid = currentUserId ?: return
        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        db.runTransaction { transaction ->
            // Move both into each other's friends list
            transaction.update(currentRef, "friends", FieldValue.arrayUnion(targetUserId))
            transaction.update(targetRef, "friends", FieldValue.arrayUnion(uid))
            // Remove from request lists
            transaction.update(currentRef, "requestsReceived", FieldValue.arrayRemove(targetUserId))
            transaction.update(targetRef, "requestsSent", FieldValue.arrayRemove(uid))
        }.await()
    }

    suspend fun rejectFriendRequest(targetUserId: String) {
        val uid = currentUserId ?: return
        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        db.runTransaction { transaction ->
            transaction.update(currentRef, "requestsReceived", FieldValue.arrayRemove(targetUserId))
            transaction.update(targetRef, "requestsSent", FieldValue.arrayRemove(uid))
        }.await()
    }

    suspend fun removeFriend(targetUserId: String) {
        val uid = currentUserId ?: return
        val currentRef = db.collection("users").document(uid)
        val targetRef = db.collection("users").document(targetUserId)

        db.runTransaction { transaction ->
            transaction.update(currentRef, "friends", FieldValue.arrayRemove(targetUserId))
            transaction.update(targetRef, "friends", FieldValue.arrayRemove(uid))
        }.await()
    }

    // ── 1-TO-1 CHAT SYSTEM ────────────────────────────────────────
    fun getChatId(otherUserId: String): String {
        val uid = currentUserId ?: ""
        return listOf(uid, otherUserId).sorted().joinToString("_")
    }

    suspend fun sendMessage(chatId: String, otherUserId: String, text: String) {
        val uid = currentUserId ?: return
        val messageId = UUID.randomUUID().toString()
        val message = Message(
            messageId = messageId,
            senderId = uid,
            text = text,
            timestamp = Date(),
            seen = false
        )

        val batch = db.batch()
        
        // Write message
        val msgRef = db.collection("messages").document(chatId).collection("chat_messages").document(messageId)
        batch.set(msgRef, message)

        // Write or update Chat meta document
        val chatRef = db.collection("chats").document(chatId)
        val chatMeta = mapOf(
            "participants" to listOf(uid, otherUserId),
            "lastMessage" to text,
            "timestamp" to Date()
        )
        batch.set(chatRef, chatMeta, SetOptions.merge())

        batch.commit().await()
    }

    fun subscribeToChats(): Flow<List<Chat>> = callbackFlow {
        val uid = currentUserId ?: return@callbackFlow
        val q = db.collection("chats").whereArrayContains("participants", uid)
        val listener = q.addSnapshotListener { snap, err ->
            if (err != null) {
                close(err)
                return@addSnapshotListener
            }
            val list = snap?.documents?.mapNotNull { it.toObject(Chat::class.java) } ?: emptyList()
            trySend(list.sortedByDescending { it.timestamp })
        }
        awaitClose { listener.remove() }
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

    // ── GROUP CHAT SYSTEM ──────────────────────────────────────────
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

    suspend fun sendGroupMessage(groupId: String, text: String) {
        val uid = currentUserId ?: return
        val messageId = UUID.randomUUID().toString()
        val message = Message(
            messageId = messageId,
            senderId = uid,
            text = text,
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
    suspend fun createRoom(name: String, description: String, isPrivate: Boolean) {
        val uid = currentUserId ?: return
        val roomId = UUID.randomUUID().toString()
        val room = Room(
            roomId = roomId,
            name = name,
            description = description,
            members = listOf(uid),
            createdBy = uid,
            isPrivate = isPrivate
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

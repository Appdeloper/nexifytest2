package com.nexify.connect.data.model

import com.google.firebase.firestore.DocumentId
import java.util.Date

data class User(
    @DocumentId val userId: String = "",
    val username: String = "",
    val email: String = "",
    val profileImage: String = "",
    val bio: String = "",
    val onlineStatus: Boolean = false,
    val lastSeen: Date? = null,
    val friends: List<String> = emptyList(),
    val requestsSent: List<String> = emptyList(),
    val requestsReceived: List<String> = emptyList(),
    val blockedUsers: List<String> = emptyList(),
    val xp: Long = 0L,
    val streak: Int = 0
)

data class Chat(
    @DocumentId val chatId: String = "",
    val participants: List<String> = emptyList(),
    val lastMessage: String = "",
    val timestamp: Date? = null,
    val lastTimestamp: Date? = null,
    val typingStatus: Map<String, Boolean> = emptyMap()
)

data class Message(
    @DocumentId val messageId: String = "",
    val senderId: String = "",
    val text: String? = null,
    val imageUrl: String? = null,
    val stickerId: String? = null,
    val stickerUrl: String? = null,
    val timestamp: Date? = null,
    val seen: Boolean = false,
    
    // Cross-platform fields for Room messages compatibility
    val type: String = "text",
    val mediaURL: String? = null,
    val fileName: String? = null,
    val fileSize: Long? = null,
    val createdAt: Date? = null,
    val isPinned: Boolean = false,
    val reactions: Map<String, List<String>> = emptyMap()
)

data class Group(
    @DocumentId val groupId: String = "",
    val name: String = "",
    val adminId: String = "",
    val members: List<String> = emptyList(),
    val groupImage: String = "",
    val createdAt: Date? = null
)

data class Room(
    @DocumentId val roomId: String = "",
    val name: String = "",
    val description: String = "",
    val members: List<String> = emptyList(),
    val createdBy: String = "",
    val isPrivate: Boolean = false,
    val category: String = "General",
    
    // Cross-platform voice and status tracking fields
    val voiceMembers: List<String> = emptyList(),
    val typing: Map<String, Boolean> = emptyMap()
)

data class Sticker(
    @DocumentId val stickerId: String = "",
    val imageUrl: String = "",
    val category: String = "Futuristic"
)

data class AiChatMessage(
    val sender: String = "", // "user" or "ai"
    val text: String = "",
    val timestamp: Long = 0L
)

data class FocusSession(
    @DocumentId val sessionId: String = "",
    val userId: String = "",
    val durationMinutes: Int = 0,
    val xpEarned: Long = 0L,
    val timestamp: Long = 0L
)

data class ChatRoom(
    @DocumentId val roomId: String = "",
    val name: String = "",
    val createdBy: String = "",
    val participants: List<String> = emptyList(),
    val createdAt: Date? = null
)

data class CallSession(
    @DocumentId val callId: String = "",
    val callerId: String = "",
    val receiverId: String = "",
    val status: String = "ringing", // "dialing", "ringing", "connected", "ended"
    val timestamp: Long = 0L
)

data class FitnessRecord(
    val date: String = "",
    val steps: Int = 0,
    val calories: Double = 0.0,
    val streak: Int = 0,
    val xpRewarded: Long = 0L,
    val timestamp: Long = 0L
)

data class EdgePost(
    @DocumentId val id: String = "",
    val title: String = "",
    val category: String = "",
    val type: String = "", // ai, tip, motivation, tool, news
    val content: String = "",
    val summary: String = "",
    val createdAt: Date? = null
)





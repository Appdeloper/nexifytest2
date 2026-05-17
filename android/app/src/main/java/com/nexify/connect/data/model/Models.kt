package com.nexify.connect.data.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp
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
    val requestsReceived: List<String> = emptyList()
)

data class Chat(
    @DocumentId val chatId: String = "",
    val participants: List<String> = emptyList(),
    val lastMessage: String = "",
    val timestamp: Date? = null,
    val typingStatus: Map<String, Boolean> = emptyMap()
)

data class Message(
    @DocumentId val messageId: String = "",
    val senderId: String = "",
    val text: String = "",
    val timestamp: Date? = null,
    val seen: Boolean = false
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
    val isPrivate: Boolean = false
)

package com.nexify.connect.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nexify.connect.data.model.*
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.services.AiService
import com.nexify.connect.services.NexifyLog
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Date

@OptIn(ExperimentalCoroutinesApi::class)
class ChatViewModel(private val repository: FirebaseRepository) : ViewModel() {

    // Lists
    val chats: StateFlow<List<Chat>> = repository.subscribeToChats()
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val groups: StateFlow<List<Group>> = repository.subscribeToGroups()
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val stickers: StateFlow<List<Sticker>> = repository.subscribeToStickers()
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val chatRooms: StateFlow<List<ChatRoom>> = repository.subscribeToChatRooms()
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val incomingCalls: StateFlow<List<CallSession>> = repository.subscribeToIncomingCalls()
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Active Chat Session (DM)
    private val _activeChatId = MutableStateFlow("")
    val activeChatId: StateFlow<String> = _activeChatId

    private val _chatLimit = MutableStateFlow(50)
    val chatLimit: StateFlow<Int> = _chatLimit

    val messages: StateFlow<List<Message>> = _activeChatId
        .flatMapLatest { chatId ->
            if (chatId.isBlank()) flowOf(emptyList())
            else _chatLimit.flatMapLatest { limit ->
                repository.subscribeToMessages(chatId, limit)
            }
        }
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val smartReplies: StateFlow<List<String>> = messages
        .map { list ->
            val last = list.lastOrNull()
            if (last != null && last.senderId != repository.currentUserId) {
                last.text ?: ""
            } else ""
        }
        .distinctUntilChanged()
        .map { text ->
            if (text.isNotEmpty()) AiService.getSmartReplies(text) else emptyList()
        }
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Active Room Session (Discord-style or ChatRoom)
    private val _activeRoomId = MutableStateFlow("")
    val activeRoomId: StateFlow<String> = _activeRoomId

    private val _roomLimit = MutableStateFlow(50)
    val roomLimit: StateFlow<Int> = _roomLimit

    val roomMessages: StateFlow<List<Message>> = _activeRoomId
        .flatMapLatest { roomId ->
            if (roomId.isBlank()) flowOf(emptyList())
            else _roomLimit.flatMapLatest { limit ->
                repository.subscribeToChatRoomMessages(roomId, limit)
            }
        }
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectChat(chatId: String) {
        _activeChatId.value = chatId
        _chatLimit.value = 50
    }

    fun selectRoom(roomId: String) {
        _activeRoomId.value = roomId
        _roomLimit.value = 50
    }

    fun loadMoreMessages() {
        _chatLimit.value += 50
    }

    fun loadMoreRoomMessages() {
        _roomLimit.value += 50
    }

    fun sendMessage(chatId: String, otherUserId: String, text: String? = null, imageUrl: String? = null, stickerId: String? = null, stickerUrl: String? = null, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.sendMessage(chatId, otherUserId, text, imageUrl, stickerId, stickerUrl)
            } catch (e: Exception) {
                onError(e.message ?: "Failed to transmit message.")
            }
        }
    }

    fun sendChatRoomMessage(roomId: String, text: String, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.sendChatRoomMessage(roomId, text)
            } catch (e: Exception) {
                onError(e.message ?: "Failed to send message.")
            }
        }
    }

    fun setTypingStatus(chatId: String, isTyping: Boolean) {
        viewModelScope.launch {
            try {
                repository.setTypingStatus(chatId, isTyping)
            } catch (e: Exception) {
                // Fail silently
            }
        }
    }

    fun markMessagesAsSeen(chatId: String) {
        viewModelScope.launch {
            try {
                repository.markMessagesAsSeen(chatId)
            } catch (e: Exception) {
                // Fail silently
            }
        }
    }

    fun createChatRoom(name: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.createChatRoom(name)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Action failed.")
            }
        }
    }

    fun joinChatRoom(roomId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.joinChatRoom(roomId)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Action failed.")
            }
        }
    }

    fun answerCall(callId: String) {
        viewModelScope.launch {
            try {
                repository.answerCall(callId)
            } catch (e: Exception) {
                NexifyLog.e("Calls", "Failed to answer call", e)
            }
        }
    }

    fun endCall(callId: String) {
        viewModelScope.launch {
            try {
                repository.endCall(callId)
            } catch (e: Exception) {
                NexifyLog.e("Calls", "Failed to end call", e)
            }
        }
    }
}

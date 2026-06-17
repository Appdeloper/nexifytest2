package com.nexify.connect.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nexify.connect.data.model.User
import com.nexify.connect.data.repository.FirebaseRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class)
class FriendsViewModel(private val repository: FirebaseRepository) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery

    private val _isSearching = MutableStateFlow(false)
    val isSearching: StateFlow<Boolean> = _isSearching

    val searchResults: StateFlow<List<User>> = _searchQuery
        .debounce(400)
        .flatMapLatest { query ->
            val normalized = query.trim().lowercase()
            if (normalized.isBlank()) {
                _isSearching.value = false
                flowOf(emptyList())
            } else {
                _isSearching.value = true
                repository.searchUsersByUsername(normalized)
                    .onEach { _isSearching.value = false }
                    .catch { _isSearching.value = false; emit(emptyList()) }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allUsers: StateFlow<List<User>> = repository.subscribeToAllUsers()
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val leaderboard: StateFlow<List<User>> = repository.subscribeToLeaderboard()
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val currentUserProfile: StateFlow<User?> = repository.subscribeToUser(repository.currentUserId ?: "")
        .catch { emit(null) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val receivedRequests: StateFlow<List<User>> = currentUserProfile
        .map { it?.requestsReceived ?: emptyList() }
        .flatMapLatest { ids ->
            if (ids.isEmpty()) flowOf(emptyList())
            else repository.subscribeToUsersByIds(ids)
        }
        .catch { emit(emptyList()) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun sendFriendRequest(targetUserId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.sendFriendRequest(targetUserId)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Action failed.")
            }
        }
    }

    fun cancelFriendRequest(targetUserId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.cancelFriendRequest(targetUserId)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Action failed.")
            }
        }
    }

    fun acceptFriendRequest(targetUserId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.acceptFriendRequest(targetUserId)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Action failed.")
            }
        }
    }

    fun rejectFriendRequest(targetUserId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.rejectFriendRequest(targetUserId)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Action failed.")
            }
        }
    }

    fun blockUser(targetUserId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.blockUser(targetUserId)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Action failed.")
            }
        }
    }

    fun unblockUser(targetUserId: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                repository.unblockUser(targetUserId)
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Action failed.")
            }
        }
    }
}

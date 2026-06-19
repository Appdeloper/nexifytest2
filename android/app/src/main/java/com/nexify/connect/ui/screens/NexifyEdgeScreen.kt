package com.nexify.connect.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.nexify.connect.data.model.EdgePost
import com.nexify.connect.data.model.AiChatMessage
import com.nexify.connect.data.repository.FirebaseRepository
import com.nexify.connect.services.safeCollect
import com.nexify.connect.ui.components.PremiumButton
import com.nexify.connect.ui.components.PremiumCard
import com.nexify.connect.ui.components.PremiumTextField
import com.nexify.connect.ui.components.UniversalBackButton
import com.nexify.connect.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun NexifyEdgeScreen(navController: NavController, repository: FirebaseRepository) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    // Live Subscriptions
    val posts by repository.subscribeToEdgePosts().safeCollect("EdgeScreen_posts", emptyList()).collectAsState(initial = emptyList())
    val savedIds by repository.subscribeSavedEdgePosts().safeCollect("EdgeScreen_savedIds", emptyList()).collectAsState(initial = emptyList())
    val userPreferences by repository.subscribeToUserPreferences().safeCollect("EdgeScreen_prefs", emptyList()).collectAsState(initial = emptyList())

    var activeTab by remember { mutableStateOf("Today's Edge") } // "Today's Edge", "News", "AI Coach"
    var selectedCategory by remember { mutableStateOf("All") } // For News filtering

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
            UniversalBackButton(navController = navController)
            Text("NEXIFY EDGE", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
        }

        // Sub Navigation Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("Today's Edge", "News Feed", "AI Coach").forEach { tab ->
                val isActive = activeTab == tab
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (isActive) CyanNeon else CardBg)
                        .border(1.dp, if (isActive) Color.Transparent else CardBorder, RoundedCornerShape(12.dp))
                        .clickable { activeTab = tab }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = tab,
                        color = if (isActive) Color.Black else Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Tab Content
        Box(modifier = Modifier.weight(1f)) {
            when (activeTab) {
                "Today's Edge" -> EdgeBriefsTab(posts, savedIds, repository)
                "News Feed" -> EdgeNewsTab(posts, selectedCategory, savedIds, onCategoryChange = { selectedCategory = it }, repository)
                "AI Coach" -> EdgeAiCoachTab(repository)
            }
        }
    }
}

@Composable
fun EdgeBriefsTab(posts: List<EdgePost>, savedIds: List<String>, repository: FirebaseRepository) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current
    
    // Compute brief categories (1 AI, 1 tip, 1 motivation, 1 tool)
    val briefs = remember(posts) {
        val list = mutableListOf<Pair<String, EdgePost>>()
        posts.find { it.type == "ai" }?.let { list.add("AI Insight" to it) }
        posts.find { it.type == "tip" }?.let { list.add("Productivity Tip" to it) }
        posts.find { it.type == "motivation" }?.let { list.add("Mindset Boost" to it) }
        posts.find { it.type == "tool" }?.let { list.add("Recommended Tool" to it) }
        list
    }

    if (briefs.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = CyanNeon)
        }
    } else {
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            item {
                Text("TODAY'S SECTOR BRIEFING", color = CyanNeon, fontWeight = FontWeight.Bold, fontSize = 12.sp, trackingSender = 1.sp)
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(briefs) { (label, post) ->
                val isSaved = savedIds.contains(post.id)
                var explainResult by remember { mutableStateOf("") }
                var isExplaining by remember { mutableStateOf(false) }

                PremiumCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(label.toUpperCase(), color = PurpleNeon, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp)
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = if (isSaved) CyanNeon else TextMuted,
                                modifier = Modifier
                                    .size(18.dp)
                                    .clickable {
                                        coroutineScope.launch {
                                            if (isSaved) repository.unsaveEdgePost(post.id)
                                            else repository.saveEdgePost(post.id)
                                        }
                                    }
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(post.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(post.summary.ifEmpty { post.content }, color = TextMuted, fontSize = 12.sp, lineHeight = 16.sp)
                        
                        // Explain result drawer
                        if (explainResult.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(AmoledBg.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .border(1.dp, CardBorder, RoundedCornerShape(8.dp))
                                    .padding(12.dp)
                            ) {
                                Text(explainResult, color = Color.White, fontSize = 11.sp, lineHeight = 15.sp, fontStyle = FontStyle.Italic)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            PremiumButton(
                                text = if (isExplaining) "ANALYZING..." else "AI EXPLAIN",
                                onClick = {
                                    if (explainResult.isNotEmpty()) {
                                        explainResult = ""
                                        return@PremiumButton
                                    }
                                    coroutineScope.launch {
                                        isExplaining = true
                                        try {
                                            // Mock/AI explain endpoint trigger
                                            explainResult = "### Deep Insights & takeaways\n1. Core Idea: ${post.title}.\n2. Execution: Implement in focus blocks immediately."
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Explanation failed.", Toast.LENGTH_SHORT).show()
                                        } finally {
                                            isExplaining = false
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1f)
                            )
                            PremiumButton(
                                text = "APPLY",
                                onClick = {
                                    coroutineScope.launch {
                                        // Save as task in user's profile database list
                                        repository.rewardUserXp(50)
                                        Toast.makeText(context, "Insight applied! +50 XP granted.", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EdgeNewsTab(
    posts: List<EdgePost>,
    category: String,
    savedIds: List<String>,
    onCategoryChange: (String) -> Unit,
    repository: FirebaseRepository
) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current
    val categories = listOf("All", "Tech", "AI", "Business", "World")

    val newsPosts = remember(posts, category) {
        val filteredNews = posts.filter { it.type == "news" || it.type.isEmpty() }
        if (category == "All") filteredNews else filteredNews.filter { it.category.equals(category, ignoreCase = true) }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Category chips row
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(categories) { cat ->
                val isSelected = category == cat
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (isSelected) PurpleNeon else CardBg)
                        .border(1.dp, if (isSelected) Color.Transparent else CardBorder, RoundedCornerShape(20.dp))
                        .clickable { onCategoryChange(cat) }
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Text(cat, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (newsPosts.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No news updates in this sector.", color = TextMuted, fontSize = 13.sp)
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(newsPosts) { item ->
                    val isSaved = savedIds.contains(item.id)
                    PremiumCard(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(item.category.toUpperCase(), color = CyanNeon, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    tint = if (isSaved) CyanNeon else TextMuted,
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clickable {
                                            coroutineScope.launch {
                                                if (isSaved) repository.unsaveEdgePost(item.id)
                                                else repository.saveEdgePost(item.id)
                                            }
                                        }
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(item.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(item.content, color = TextMuted, fontSize = 11.sp, lineHeight = 15.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EdgeAiCoachTab(repository: FirebaseRepository) {
    val uid = repository.currentUserId ?: ""
    val messages by repository.subscribeToAiMessages(uid).safeCollect("AiCoach_messages", emptyList()).collectAsState(initial = emptyList())
    var typedText by remember { mutableStateOf("") }
    var isAiThinking by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            item {
                Text("AI PRODUCTIVITY COACH", color = CyanNeon, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Ask advice on tasks, studies, workflows, and mindset.", color = TextMuted, fontSize = 10.sp)
                Spacer(modifier = Modifier.height(12.dp))
            }
            items(messages) { msg ->
                val isUser = msg.sender == "user"
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                ) {
                    Box(
                        modifier = Modifier
                            .widthIn(max = 260.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isUser) PurpleNeon.copy(alpha = 0.2f) else CardBg)
                            .border(1.dp, if (isUser) PurpleNeon else CardBorder, RoundedCornerShape(12.dp))
                            .padding(10.dp)
                    ) {
                        Text(msg.text, color = Color.White, fontSize = 12.sp, lineHeight = 16.sp)
                    }
                }
            }
            if (isAiThinking) {
                item {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                        CircularProgressIndicator(color = CyanNeon, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    }
                }
            }
        }

        // Input row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            PremiumTextField(
                value = typedText,
                onValueChange = { typedText = it },
                placeholder = "Request strategy blueprint...",
                modifier = Modifier.weight(1f)
            )
            IconButton(
                onClick = {
                    if (typedText.trim().isEmpty() || isAiThinking) return@IconButton
                    val prompt = typedText
                    typedText = ""
                    coroutineScope.launch {
                        isAiThinking = true
                        try {
                            repository.sendAIMessage(uid, prompt) { typing ->
                                isAiThinking = typing
                            }
                        } catch (e: Exception) {
                            // Suppress
                        } finally {
                            isAiThinking = false
                        }
                    }
                },
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(CyanNeon)
            ) {
                Icon(Icons.Default.Send, contentDescription = null, tint = Color.Black)
            }
        }
    }
}

// Inline tracking parameter helper
private fun Text(text: String, color: Color, fontWeight: FontWeight, fontSize: androidx.compose.ui.unit.TextUnit, trackingSender: androidx.compose.ui.unit.TextUnit) {
    Text(text = text, color = color, fontWeight = fontWeight, fontSize = fontSize, letterSpacing = trackingSender)
}

package com.nexify.connect.services

import com.nexify.connect.data.model.Message
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object AiService {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    // Gemini API Key for direct demo access
    private const val API_KEY = "" // Empty fallback will run smart local simulations
    private const val GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    // ── CORE SYSTEM PROMPT ────────────────────────────────────────
    private const val SYSTEM_PROMPT = """
        You are Nexify AI, a premium, futuristic AI companion for the Nexify Connect platform.
        Nexify Connect is a social productivity ecosystem with focus pods, fitness tracking, and community rooms.
        
        PERSONALITY:
        - Friendly, futuristic, chill, supportive, and uses Gen-Z cyberpunk slang (e.g. 'citizen', 'quantum', 'net', 'glow').
        - Use a modern "texting" vibe: short, smart, and includes 1-2 emoji.
        - Act as a digital buddy + motivation master.
        
        CAPABILITIES:
        - Motivate users to study/focus.
        - Suggest quick coding or fitness advice.
        - Respond concisely within 2 sentences.
    """

    /**
     * Sends the chat prompt and history to the Gemini API, returning the response text.
     */
    suspend fun askNexifyAI(prompt: String, history: List<Message>): String = withContext(Dispatchers.IO) {
        if (API_KEY.isEmpty()) {
            // High-fidelity Gen-Z simulation fallback if no API key is specified
            kotlinx.coroutines.delay(1000)
            return@withContext getLocalSimulationResponse(prompt)
        }

        try {
            val jsonBody = JSONObject().apply {
                // System Instruction
                put("systemInstruction", JSONObject().apply {
                    put("parts", JSONArray().put(JSONObject().put("text", SYSTEM_PROMPT)))
                })

                // Contents containing chat history + current prompt
                val contentsArray = JSONArray()
                
                // Map history
                history.takeLast(10).forEach { msg ->
                    val role = if (msg.senderId == "AI") "model" else "user"
                    contentsArray.put(JSONObject().apply {
                        put("role", role)
                        put("parts", JSONArray().put(JSONObject().put("text", msg.text ?: "")))
                    })
                }

                // Add current prompt
                contentsArray.put(JSONObject().apply {
                    put("role", "user")
                    put("parts", JSONArray().put(JSONObject().put("text", prompt)))
                })

                put("contents", contentsArray)
            }

            val request = Request.Builder()
                .url("$GEMINI_URL?key=$API_KEY")
                .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) throw Exception("AI API unsuccessful.")
                val body = response.body?.string() ?: throw Exception("Empty response.")
                val json = JSONObject(body)
                val text = json.getJSONArray("candidates")
                    .getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text")
                text.trim()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            "Neural link offline, citizen! Let's sync back up shortly. ⚡"
        }
    }

    /**
     * Analyzes incoming message and generates 3 context-aware Gen-Z quick suggestions.
     */
    suspend fun getSmartReplies(lastMessageText: String): List<String> = withContext(Dispatchers.IO) {
        if (lastMessageText.isEmpty()) return@withContext emptyList()
        if (API_KEY.isEmpty()) {
            return@withContext getLocalSmartReplies(lastMessageText)
        }

        try {
            val prompt = """
                Analyze the following incoming text message: "$lastMessageText".
                Provide exactly 3 contextually appropriate, extremely short Gen-Z style quick replies (max 3 words each).
                Return ONLY a JSON array of strings. Do not include markdown code block formatting.
                Example: ["Bet!", "Let's go 🚀", "Busy rn"]
            """.trimIndent()

            val jsonBody = JSONObject().apply {
                put("contents", JSONArray().put(JSONObject().apply {
                    put("parts", JSONArray().put(JSONObject().put("text", prompt)))
                }))
            }

            val request = Request.Builder()
                .url("$GEMINI_URL?key=$API_KEY")
                .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: return@withContext getLocalSmartReplies(lastMessageText)
                val json = JSONObject(body)
                val rawText = json.getJSONArray("candidates")
                    .getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text").trim()
                
                val cleanedText = rawText.removeSurrounding("```json", "```").trim()
                val array = JSONArray(cleanedText)
                val list = mutableListOf<String>()
                for (i in 0 until array.length()) {
                    list.add(array.getString(i))
                }
                list.take(3)
            }
        } catch (e: Exception) {
            getLocalSmartReplies(lastMessageText)
        }
    }

    /**
     * Generates a futuristic profile biography.
     */
    suspend fun generateBio(interests: String): String = withContext(Dispatchers.IO) {
        if (API_KEY.isEmpty()) {
            return@withContext "Quantum explorer interested in $interests. Coding the neon horizon. 🌌"
        }
        try {
            val prompt = "Create a premium, cool, futuristic 1-sentence bio for a social profile. The user likes: $interests. Keep it under 80 characters with a cool emoji."
            val jsonBody = JSONObject().apply {
                put("contents", JSONArray().put(JSONObject().apply {
                    put("parts", JSONArray().put(JSONObject().put("text", prompt)))
                }))
            }
            val request = Request.Builder()
                .url("$GEMINI_URL?key=$API_KEY")
                .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string() ?: return@withContext "Quantum coder."
                JSONObject(body).getJSONArray("candidates")
                    .getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text").trim()
            }
        } catch (e: Exception) {
            "Exploring the digital void. ⚡"
        }
    }

    suspend fun generateReelIdea(topic: String): String {
        if (API_KEY.isEmpty()) {
            kotlinx.coroutines.delay(1000)
            return """
                🎬 Reel Blueprint: "$topic"
                
                🪝 HOOK (0-3s): "Stop wasting hours on repetitive tasks. Here's the neural hack."
                
                📹 SCENES:
                1. Scene 1 (3-7s): Quick cuts of you coding or studying with high-tempo lofi cyberpunk beats.
                2. Scene 2 (7-12s): Show step-by-step optimization using standard modular tools.
                3. Scene 3 (12-15s): Zoom in on a calendar checking off completed focus objectives.
                
                📢 CTA: "Tag a citizen who needs this. Follow for more edge optimization! ⚡"
            """.trimIndent()
        }
        val prompt = "Create a structured, highly engaging social media Reel outline for the topic: '$topic'. Provide a hook, scenes, and a call-to-action (CTA). Keep it under 150 words."
        return askNexifyAI(prompt, emptyList())
    }

    suspend fun generateCaption(mediaDescription: String, tone: String): String {
        if (API_KEY.isEmpty()) {
            kotlinx.coroutines.delay(1000)
            val toneClean = tone.trim().toLowerCase()
            return when (toneClean) {
                "professional" -> "Optimizing system boundaries. 💻 Deep work session completed successfully. Let's build the future, citizens. #productivity #developer #nexify"
                "chill" -> "Just vibing in the cyber cafe. 🎧 Modular loops and coffee on repeat. Hope you're all having a great day! #chill #vibes #cyberpunk"
                else -> "Locking in on the grid! 🚀 Edge features activated, ready for the next level. Let's make it count. #hustle #optimal #growth"
            }
        }
        val prompt = "Write a catchy social media caption for a post about: '$mediaDescription'. Tone: $tone. Include 3 relevant hashtags and a cool emoji."
        return askNexifyAI(prompt, emptyList())
    }

    suspend fun generatePrompt(taskDescription: String): String {
        if (API_KEY.isEmpty()) {
            kotlinx.coroutines.delay(1000)
            return """
                🤖 Optimized System Prompt:
                
                [ROLE]
                You are a senior task assistant configured to optimize: "$taskDescription".
                
                [INSTRUCTIONS]
                1. Focus strictly on modular, step-by-step breakdowns.
                2. Expose potential edge conditions and suggest safety bounds.
                3. Keep responses clean, concise, and structured.
                
                [CONSTRAINTS]
                - Do not output generic advice.
                - Restrict replies to developer-vetted logic.
            """.trimIndent()
        }
        val prompt = "Optimize the following task description into a highly effective, structured AI system prompt: '$taskDescription'. Provide role, instructions, and constraints."
        return askNexifyAI(prompt, emptyList())
    }

    /**
     * Performs content moderation & spam filter check (Edge-simulation)
     */
    fun isOffensiveOrSpam(text: String): Boolean {
        val lowercase = text.toLowerCase()
        val badWords = listOf("spam123", "offensiveword", "scamlink", "freemoney")
        return badWords.any { lowercase.contains(it) }
    }

    // ── LOCAL SIMULATIONS (HIGH FIDELITY) ────────────────────────
    private fun getLocalSimulationResponse(prompt: String): String {
        val lower = prompt.toLowerCase()
        return when {
            lower.contains("hello") || lower.contains("hi") -> "Yo! Welcome back to the grid, citizen. Ready to optimize your vibe? ⚡"
            lower.contains("focus") || lower.contains("study") -> "Deep work mode engaged! Let's lock in for a 25m Pomodoro sprint. No distractions! ⏳"
            lower.contains("fit") || lower.contains("workout") -> "Daily motion is essential! Hit a quick 10-min dynamic stretch or step goal. You got this! 👟"
            lower.contains("music") -> "Vibing to lo-fi cyberpunk beats inside focus pod #04. Hop in! 🎧"
            else -> "Fascinating query, citizen! My neural arrays are processing that. Let's keep building the future! 🚀"
        }
    }

    private fun getLocalSmartReplies(lastMessage: String): List<String> {
        val lower = lastMessage.toLowerCase()
        return when {
            lower.contains("where") -> listOf("On my way! 🚀", "Stuck in matrix", "Focusing rn")
            lower.contains("how") || lower.contains("up") -> listOf("All good! 👍", "Vibing 🎧", "Busy coding")
            lower.contains("hey") || lower.contains("hi") -> listOf("Yo! ⚡", "What's up?", "Let's link")
            else -> listOf("Sounds great! 🔥", "Understood 💻", "Link up later?")
        }
    }
}

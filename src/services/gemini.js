import { GoogleGenerativeAI } from "@google/generative-ai";

// Note: In a production app, the API key should be handled via a secure backend.
// For this demonstration, we'll look for it in env or use a placeholder.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const askNexifyAI = async (prompt, history = []) => {
  if (!genAI) {
    // Fallback response if no API key is provided
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("I'm Nexify AI, your personal productivity assistant. To enable my full capabilities (Gemini Power), please provide a VITE_GEMINI_API_KEY in the environment. For now, I can help you with basic tasks!");
      }, 1000);
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    // Optimized Nexify System Context
    const systemPrompt = `
      You are Nexify AI, a premium, futuristic AI companion for the Nexify Connect platform.
      Nexify Connect is a social productivity ecosystem with focus pods, fitness tracking, and community rooms.
      
      PERSONALITY:
      - Friendly, futuristic, chill, and supportive.
      - Use a modern "texting" vibe: short, smart, sometimes emojis.
      - Act as a digital friend + productivity assistant.
      
      CORE CAPABILITIES:
      - Motivate users to stay focused.
      - Suggest workout routines (Beginner to Advanced).
      - Help with coding and study techniques (e.g., Pomodoro).
      - Summarize chat conversations.
      - Create and suggest tasks.
      - Recommend focus pods based on ambience (Rain, Lo-fi, Cyberpunk).
      
      SAFETY & CONSTRAINTS:
      - Do NOT pretend to be a real human.
      - Do NOT become manipulative or create unhealthy dependency.
      - Refuse unsafe, harmful, or sexually explicit requests.
      - Stay respectful and encourage healthy digital habits.
      - If tagged in a group/room, keep your response concise.

      User Context: ${prompt}
    `;

    const result = await chat.sendMessage(systemPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error("I'm having trouble connecting to my neural core. Please try again later.");
  }
};

export const handleAIMention = async (message, chatHistory = []) => {
  // Clean the mention from the message
  const prompt = message.replace(/@nexifyai/gi, '').trim();
  if (!prompt) return "I'm here! How can I help you today? ✨";
  
  return await askNexifyAI(prompt, chatHistory);
};

export const summarizeChats = async (chats) => {
  if (!genAI) return "Chat summarization requires an active AI core.";
  
  const chatContext = chats.map(c => `${c.sender}: ${c.text}`).join('\n');
  const prompt = `Summarize the following chat messages concisely. Highlight important action items or topics: \n\n${chatContext}`;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    return "Failed to summarize chats.";
  }
};

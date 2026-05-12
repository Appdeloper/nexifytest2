import { db } from './firebase';
import { 
  collection, doc, setDoc, updateDoc, 
  serverTimestamp, onSnapshot, query, orderBy, limit 
} from 'firebase/firestore';
import { handleAIMention } from './gemini';

const AI_UID = 'nexify_ai';

export const processAITag = async (chatId, isRoom = false, messages = []) => {
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.senderId === AI_UID) return;

  const text = lastMsg.text || '';
  if (text.toLowerCase().includes('@nexifyai')) {
    // Show typing status (simulated by not sending immediately)
    // In a real app, you'd have a 'typing' collection
    
    try {
      const history = messages.slice(-10).map(m => ({
        sender: m.senderId === AI_UID ? 'ai' : 'user',
        text: m.text
      }));

      const response = await handleAIMention(text, history);
      
      const targetPath = isRoom ? `rooms/${chatId}/messages` : `chats/${chatId}/messages`;
      const msgRef = doc(collection(db, targetPath));
      
      await setDoc(msgRef, {
        senderId: AI_UID,
        text: response,
        type: 'text',
        createdAt: serverTimestamp(),
        readBy: [AI_UID],
        reactions: {},
        isPinned: false,
        isAI: true
      });

      // Update last message
      const parentRef = doc(db, isRoom ? 'rooms' : 'chats', chatId);
      await updateDoc(parentRef, {
        lastMessage: response,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error("AI Reply Error:", error);
    }
  }
};

export const subscribeToAIMentions = (chatId, isRoom = false, callback) => {
  const path = isRoom ? `rooms/${chatId}/messages` : `chats/${chatId}/messages`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(1));
  
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const lastMsg = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      callback(lastMsg);
    }
  });
};

import { db } from './firebase';
import { 
  collection, doc, setDoc, updateDoc, getDoc,
  serverTimestamp, onSnapshot, query, orderBy, limit 
} from 'firebase/firestore';
import { handleAIMention } from './gemini';

const AI_UID = 'nexify_ai';

export const processAITag = async (chatId, isRoom = false, messages = []) => {
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.senderId === AI_UID) return;

  const text = lastMsg.text || '';
  const isTagged = text.toLowerCase().includes('@nexifyai');
  
  if (isTagged) {
    // ── PROD NOTE: Move this to Firebase Cloud Functions ──
    // This logic should be triggered by a Firestore onCreate trigger 
    // to keep API keys secure and prevent client-side manipulation.

    const parentRef = doc(db, isRoom ? 'rooms' : 'chats', chatId);
    const parentSnap = await getDoc(parentRef);
    if (!parentSnap.exists()) return;
    const parentData = parentSnap.data();

    // AI Cooldown Check (e.g., once every 3 seconds per chat)
    const now = Date.now();
    const lastAIAt = parentData.lastAIPulse?.toMillis() || 0;
    if (now - lastAIAt < 3000) return;

    try {
      // Mark AI as typing in the parent doc
      await updateDoc(parentRef, { 
        [`typing.${AI_UID}`]: true,
        lastAIPulse: serverTimestamp() 
      });

      const history = messages.slice(-10).map(m => ({
        sender: m.senderId === AI_UID ? 'ai' : 'user',
        text: m.text
      }));

      // Injects AI Personality Context
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

      // Update parent last message and clear typing
      await updateDoc(parentRef, {
        lastMessage: response,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`typing.${AI_UID}`]: false
      });

    } catch (error) {
      console.error("AI Reply Error:", error);
      await updateDoc(parentRef, { [`typing.${AI_UID}`]: false }).catch(() => {});
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

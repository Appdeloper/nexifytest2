import { db } from './firebase';
import { 
  collection, doc, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, getDoc, getDocs 
} from 'firebase/firestore';
import { uploadToCloudinary } from './cloudinary';

export const subscribeUserChats = (uid, callback) => {
  const q = query(
    collection(db, 'chats'),
    where(`memberMap.${uid}`, '==', true),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(chats);
  }, (err) => {
    console.warn("User chats subscription failed:", err);
    callback([]);
  });

};

export const subscribeToMessages = (chatId, callback) => {
  const q = query(
    collection(db, `chats/${chatId}/messages`),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(msgs);
  }, (err) => {
    console.warn("Messages subscription failed:", err);
    callback([]);
  });

};

export const createOrGetDMChat = async (uid1, uid2) => {
  // Check if chat exists
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where(`memberMap.${uid1}`, '==', true), where(`memberMap.${uid2}`, '==', true), where('type', '==', 'dm'));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  
  // Create new chat
  const newChatRef = doc(collection(db, 'chats'));
  await setDoc(newChatRef, {
    type: 'dm',
    members: [uid1, uid2],
    memberMap: {
      [uid1]: true,
      [uid2]: true
    },
    lastMessage: '',
    lastMessageAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return newChatRef.id;
};

export const updateLastMessage = async (chatId, text) => {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

let lastMessageTime = 0;
const MESSAGE_COOLDOWN = 500; // 500ms

export const sendTextMessage = async (chatId, senderId, text, replyTo = null) => {
  const now = Date.now();
  if (now - lastMessageTime < MESSAGE_COOLDOWN) {
    throw new Error('Please wait before sending another message.');
  }
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Cannot send an empty message.');
  if (trimmed.length > 2000) throw new Error('Message is too long (max 2000 chars).');
  lastMessageTime = now;
  try {
    const msgRef = doc(collection(db, `chats/${chatId}/messages`));
    await setDoc(msgRef, {
      senderId,
      text: trimmed,
      type: 'text',
      createdAt: serverTimestamp(),
      readBy: [senderId],
      ...(replyTo ? { replyTo: { id: replyTo.id, text: replyTo.text, senderId: replyTo.senderId } } : {})
    });
    await updateLastMessage(chatId, trimmed);
    
    // Notification logic
    try {
      const chatSnap = await getDoc(doc(db, 'chats', chatId));
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const otherId = chatData.members.find(id => id !== senderId);
        if (otherId) {
          const { getUserData } = await import('./users');
          const senderData = await getUserData(senderId);
          const { sendNotification, NOTIFICATION_TYPES } = await import('./notifications');
          await sendNotification(otherId, {
            title: senderData?.displayName || 'New Message',
            body: trimmed,
            type: NOTIFICATION_TYPES.NEW_MESSAGE,
            chatId: chatId,
            senderId: senderId
          });
        }
      }
    } catch (err) {
      console.warn("Notification trigger failed:", err);
    }

    // Award XP for sending a message
    import('./xp').then(({ addXP }) => addXP(senderId, 'sendMessage')).catch(() => {});

  } catch (error) {
    throw new Error('Failed to send message. Please try again.');
  }
};

export const compressImage = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return resolve(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        let scaleSize = MAX_WIDTH / img.width;
        if (scaleSize > 1) scaleSize = 1; // Don't upscale
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

export const uploadChatAttachment = async (chatId, file, onProgress, onComplete, onError) => {
  if (file.size > 5 * 1024 * 1024 && !file.type.startsWith('image/')) {
    if (onError) onError(new Error("File size must be under 5MB."));
    return;
  }
  
  try {
    const processedFile = await compressImage(file);
    // Cloudinary doesn't provide granular progress in a simple fetch, 
    // but we can simulate it or just call onProgress(100) at the end.
    if (onProgress) onProgress(50); 
    const url = await uploadToCloudinary(processedFile, `chats/${chatId}`);
    if (onProgress) onProgress(100);
    if (onComplete) onComplete(url);
  } catch (error) {
    console.error("[Upload Error]", error);
    if (onError) onError(new Error("Upload failed. Please try again."));
  }
};

export const sendMediaMessage = async (chatId, senderId, file, type, mediaURL) => {
  const msgRef = doc(collection(db, `chats/${chatId}/messages`));
  await setDoc(msgRef, {
    senderId,
    text: '',
    type,
    mediaURL,
    fileName: file.name,
    fileSize: file.size,
    createdAt: serverTimestamp(),
    readBy: [senderId]
  });
  const body = `[${type === 'image' ? 'Image' : 'File'}]`;
  await updateLastMessage(chatId, body);
  
  // Notification
  try {
    const chatSnap = await getDoc(doc(db, 'chats', chatId));
    const chatData = chatSnap.data();
    const otherId = chatData.members.find(id => id !== senderId);
    if (otherId) {
      const { getUserData } = await import('./users');
      const senderData = await getUserData(senderId);
      const { sendNotification, NOTIFICATION_TYPES } = await import('./notifications');
      await sendNotification(otherId, {
        title: senderData?.displayName || 'New Message',
        body: body,
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        chatId: chatId,
        senderId: senderId
      });
    }
  } catch (e) {}
};

export const sendGifMessage = async (chatId, senderId, gifUrl) => {
  const msgRef = doc(collection(db, `chats/${chatId}/messages`));
  await setDoc(msgRef, {
    senderId,
    text: '',
    type: 'gif',
    mediaURL: gifUrl,
    createdAt: serverTimestamp(),
    readBy: [senderId]
  });
  await updateLastMessage(chatId, '[GIF]');
  
  // Notification
  try {
    const chatSnap = await getDoc(doc(db, 'chats', chatId));
    const chatData = chatSnap.data();
    const otherId = chatData.members.find(id => id !== senderId);
    if (otherId) {
      const { getUserData } = await import('./users');
      const senderData = await getUserData(senderId);
      const { sendNotification, NOTIFICATION_TYPES } = await import('./notifications');
      await sendNotification(otherId, {
        title: senderData?.displayName || 'New Message',
        body: '[GIF]',
        type: NOTIFICATION_TYPES.NEW_MESSAGE,
        chatId: chatId,
        senderId: senderId
      });
    }
  } catch (e) {}
};

export const markMessagesRead = async (chatId) => {};

export const deleteMessage = async (chatId, messageId) => {
  const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
  await updateDoc(msgRef, { deleted: true, text: '', mediaURL: null });
};

export const addReaction = async (chatId, messageId, uid, emoji) => {
  const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
  await updateDoc(msgRef, { [`reactions.${uid}`]: emoji });
};

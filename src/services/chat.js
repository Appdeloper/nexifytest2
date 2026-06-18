import { db } from './firebase';
import { 
  collection, doc, setDoc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore';
import { uploadToCloudinary } from './cloudinary';

const getDMChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');
const getMembers = (chat) => chat?.members || chat?.participants || [];
const getFriends = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  const friends = snap.exists() && Array.isArray(snap.data().friends) ? snap.data().friends : [];
  return friends;
};

const areFriends = async (uid1, uid2) => {
  const [friends1, friends2] = await Promise.all([getFriends(uid1), getFriends(uid2)]);
  return friends1.includes(uid2) && friends2.includes(uid1);
};

const assertCanUseChat = async (chatId, uid) => {
  const chatSnap = await getDoc(doc(db, 'chats', chatId));
  if (!chatSnap.exists()) throw new Error('Chat not found.');

  const chat = chatSnap.data();
  const members = getMembers(chat);
  if (!members.includes(uid)) throw new Error('You are not a participant in this chat.');

  if (chat.type === 'dm') {
    const otherUid = members.find(id => id !== uid);
    if (!otherUid || chatId !== getDMChatId(uid, otherUid) || !(await areFriends(uid, otherUid))) {
      throw new Error('You can only message accepted friends.');
    }
  }

  return chat;
};

export const canUserAccessChat = async (chatId, uid) => {
  try {
    await assertCanUseChat(chatId, uid);
    return true;
  } catch {
    return false;
  }
};

export const subscribeUserChats = (uid, callback) => {
  let rawChats = [];
  let friendIds = new Set();
  let hasUserSnapshot = false;

  const publish = () => {
    if (!hasUserSnapshot) return;
    const visibleChats = rawChats.filter(chat => {
      if (chat.type !== 'dm') return true;
      const members = getMembers(chat);
      const otherUid = members.find(id => id !== uid);
      return otherUid && friendIds.has(otherUid) && chat.id === getDMChatId(uid, otherUid);
    });

    // Sort visibleChats in-memory by updatedAt (descending)
    visibleChats.sort((a, b) => {
      const getMillis = (timestamp) => {
        if (!timestamp) return 0;
        if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
        if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
        if (timestamp.seconds) return timestamp.seconds * 1000;
        return new Date(timestamp).getTime() || 0;
      };
      return getMillis(b.updatedAt) - getMillis(a.updatedAt);
    });

    callback(visibleChats);
  };

  const unsubUser = onSnapshot(doc(db, 'users', uid), (snap) => {
    const friends = snap.exists() && Array.isArray(snap.data().friends) ? snap.data().friends : [];
    friendIds = new Set(friends);
    hasUserSnapshot = true;
    publish();
  }, (err) => {
    console.warn("User friends subscription failed:", err);
    friendIds = new Set();
    hasUserSnapshot = true;
    publish();
  });

  const q = query(
    collection(db, 'chats'),
    where(`memberMap.${uid}`, '==', true)
  );
  
  const unsubChats = onSnapshot(q, (snapshot) => {
    rawChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    publish();
  }, (err) => {
    console.warn("User chats subscription failed:", err);
    rawChats = [];
    callback([]);
  });

  return () => {
    unsubUser();
    unsubChats();
  };
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
  if (!uid1 || !uid2) throw new Error('Missing user.');
  if (!(await areFriends(uid1, uid2))) throw new Error('Add this user as a friend before messaging.');

  const chatId = getDMChatId(uid1, uid2);
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) return chatId;
  
  await setDoc(chatRef, {
    type: 'dm',
    participants: [uid1, uid2].sort(),
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
  
  return chatId;
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
  await assertCanUseChat(chatId, senderId);
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
        const otherId = getMembers(chatData).find(id => id !== senderId);
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
    throw new Error('Failed to send message. Please try again.', { cause: error });
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
  await assertCanUseChat(chatId, senderId);
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
    const otherId = getMembers(chatData).find(id => id !== senderId);
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
  } catch {
    /* Notification is best-effort. */
  }
};

export const sendGifMessage = async (chatId, senderId, gifUrl) => {
  await assertCanUseChat(chatId, senderId);
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
    const otherId = getMembers(chatData).find(id => id !== senderId);
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
  } catch {
    /* Notification is best-effort. */
  }
};

export const markMessagesRead = async () => null;

export const deleteMessage = async (chatId, messageId) => {
  const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
  await updateDoc(msgRef, { deleted: true, text: '', mediaURL: null });
};

export const addReaction = async (chatId, messageId, uid, emoji) => {
  const msgRef = doc(db, `chats/${chatId}/messages`, messageId);
  await updateDoc(msgRef, { [`reactions.${uid}`]: emoji });
};

import { db } from './firebase';
import { 
  collection, doc, setDoc, updateDoc, 
  onSnapshot, query, where, orderBy, serverTimestamp, getDocs, deleteField, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { uploadToCloudinary } from './cloudinary';
import { compressImage } from './chat';

export const subscribeMyRooms = (uid, callback) => {
  const q = query(
    collection(db, 'rooms'),
    where(`memberMap.${uid}`, '==', true)
  );
  
  return onSnapshot(q, (snapshot) => {
    let rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    rooms.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
    callback(rooms);
  }, (err) => {
    console.warn("My Rooms subscription failed:", err);
    callback([]);
  });

};

export const subscribePublicRooms = (callback) => {
  const q = query(
    collection(db, 'rooms'),
    where('privacy', '==', 'public')
  );
  
  return onSnapshot(q, (snapshot) => {
    let rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    rooms.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    callback(rooms);
  }, (err) => {
    console.warn("Public Rooms subscription failed:", err);
    callback([]);
  });

};

export const uploadRoomIcon = async (roomId, file) => {
  return await uploadToCloudinary(file, `roomIcons/${roomId}`);
};

let lastRoomCreateTime = 0;
const ROOM_CREATE_COOLDOWN = 5000; // 5 seconds

export const createRoom = async (data, iconFile = null) => {
  const now = Date.now();
  if (now - lastRoomCreateTime < ROOM_CREATE_COOLDOWN) {
    throw new Error('Please wait before creating another room.');
  }
  
  if (!data.name || data.name.trim().length < 3 || data.name.trim().length > 30) {
    throw new Error('Room name must be between 3 and 30 characters.');
  }

  lastRoomCreateTime = now;
  const newRoomRef = doc(collection(db, 'rooms'));
  
  let iconURL = data.iconURL || '';
  if (iconFile) {
    iconURL = await uploadRoomIcon(newRoomRef.id, iconFile);
  }

  try {
    await setDoc(newRoomRef, {
    roomId: newRoomRef.id,
    name: data.name,
    description: data.description || '',
    type: data.type || 'Community',
    privacy: data.privacy || 'public',
    iconURL: iconURL,
    createdBy: data.createdBy,
    members: [data.createdBy, ...(data.friends || [])],
    memberMap: {
      [data.createdBy]: true,
      ...(data.friends || []).reduce((acc, uid) => ({...acc, [uid]: true}), {})
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: null
  });
  
  // Award XP for creating a room
  import('./xp').then(({ addXP }) => addXP(data.createdBy, 'createRoom')).catch(() => {});

  return newRoomRef.id;
  } catch (error) {
    console.error("[Room Error] Failed to create room");
    throw new Error('Failed to create room. Please try again.');
  }
};

export const joinRoom = async (roomId, uid) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    members: arrayUnion(uid),
    [`memberMap.${uid}`]: true
  });
};

export const leaveRoom = async (roomId, uid) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    members: arrayRemove(uid),
    [`memberMap.${uid}`]: deleteField()
  });
};

export const subscribeRoomMessages = (roomId, callback) => {
  const q = query(
    collection(db, `rooms/${roomId}/messages`),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(msgs);
  }, (err) => {
    console.warn("Room messages subscription failed:", err);
    callback([]);
  });

};

export const updateRoomLastMessage = async (roomId, text) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

let lastRoomMessageTime = 0;
const ROOM_MESSAGE_COOLDOWN = 500; // 500ms

export const sendRoomMessage = async (roomId, senderId, text) => {
  const now = Date.now();
  if (now - lastRoomMessageTime < ROOM_MESSAGE_COOLDOWN) {
    throw new Error('Please wait before sending another message.');
  }
  
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Cannot send an empty message.');
  }
  if (trimmed.length > 2000) {
    throw new Error('Message is too long (max 2000 chars).');
  }

  lastRoomMessageTime = now;

  try {
    const msgRef = doc(collection(db, `rooms/${roomId}/messages`));
    await setDoc(msgRef, {
      senderId,
      text: trimmed,
      type: 'text',
      createdAt: serverTimestamp(),
      readBy: [senderId],
      reactions: {},
      isPinned: false
    });
    await updateRoomLastMessage(roomId, trimmed);
    // Award XP for sending a message
    import('./xp').then(({ addXP }) => addXP(senderId, 'sendMessage')).catch(() => {});
  } catch (error) {
    console.error("[Room Error] Failed to send message");
    throw new Error('Failed to send message. Please try again.');
  }
};

export const uploadRoomAttachment = async (roomId, file, onProgress, onComplete, onError) => {
  if (file.size > 10 * 1024 * 1024 && !file.type.startsWith('image/')) {
    if (onError) onError(new Error("File size must be under 10MB."));
    return;
  }

  try {
    const processedFile = await compressImage(file);
    if (onProgress) onProgress(50);
    const url = await uploadToCloudinary(processedFile, `rooms/${roomId}`);
    if (onProgress) onProgress(100);
    if (onComplete) onComplete(url);
  } catch (error) {
    console.error("[Upload Error]", error);
    if (onError) onError(new Error("Upload failed. Please try again."));
  }
};

export const sendRoomMediaMessage = async (roomId, senderId, file, type, mediaURL) => {
  const msgRef = doc(collection(db, `rooms/${roomId}/messages`));
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
  await updateRoomLastMessage(roomId, `[${type === 'image' ? 'Image' : 'File'}]`);
};

export const sendRoomGifMessage = async (roomId, senderId, gifUrl) => {
  const msgRef = doc(collection(db, `rooms/${roomId}/messages`));
  await setDoc(msgRef, {
    senderId,
    text: '',
    type: 'gif',
    mediaURL: gifUrl,
    createdAt: serverTimestamp(),
    readBy: [senderId],
    reactions: {},
    isPinned: false
  });
  await updateRoomLastMessage(roomId, '[GIF]');
};

export const togglePinRoomMessage = async (roomId, messageId, currentPinStatus) => {
  const msgRef = doc(db, `rooms/${roomId}/messages`, messageId);
  await updateDoc(msgRef, { isPinned: !currentPinStatus });
};

export const reactToRoomMessage = async (roomId, messageId, uid, emoji) => {
  const msgRef = doc(db, `rooms/${roomId}/messages`, messageId);
  await updateDoc(msgRef, {
    [`reactions.${emoji}`]: arrayUnion(uid)
  });
};

export const removeReactionFromRoomMessage = async (roomId, messageId, uid, emoji) => {
  const msgRef = doc(db, `rooms/${roomId}/messages`, messageId);
  await updateDoc(msgRef, {
    [`reactions.${emoji}`]: arrayRemove(uid)
  });
};

// Wrappers for requirements
export const loadMyRooms = subscribeMyRooms;
export const loadPublicRooms = subscribePublicRooms;

export const filterRooms = (rooms, type) => {
  return rooms.filter(r => r.type === type);
};

export const openRoom = (roomId, navigate) => {
  navigate(`/room-chat/${roomId}`);
};

export const loadRoomMessages = subscribeRoomMessages;

export const sendRoomImage = async (roomId, senderId, file) => {
  return new Promise((resolve, reject) => {
    uploadRoomAttachment(roomId, file, null, async (url) => {
      await sendRoomMediaMessage(roomId, senderId, file, 'image', url);
      resolve(url);
    }, reject);
  });
};

export const sendRoomFile = async (roomId, senderId, file) => {
  return new Promise((resolve, reject) => {
    uploadRoomAttachment(roomId, file, null, async (url) => {
      await sendRoomMediaMessage(roomId, senderId, file, 'file', url);
      resolve(url);
    }, reject);
  });
};

export const addRoomMember = async (roomId, uid) => {
  return joinRoom(roomId, uid);
};

export const removeRoomMember = async (roomId, uid) => {
  return leaveRoom(roomId, uid);
};


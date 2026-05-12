import { db } from './firebase';
import { 
  collection, doc, setDoc, updateDoc, onSnapshot, 
  query, where, orderBy, limit, serverTimestamp, 
  increment, arrayUnion, addDoc
} from 'firebase/firestore';

/**
 * Nexify Waves Service - Realtime Music Ecosystem
 */

export const subscribeMusicRooms = (callback) => {
  const q = query(collection(db, 'musicRooms'), orderBy('activeListeners', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const updateNowPlaying = async (uid, songData) => {
  if (!uid) return;
  const statusRef = doc(db, 'userMusicStatus', uid);
  await setDoc(statusRef, {
    ...songData,
    uid,
    lastUpdated: serverTimestamp()
  }, { merge: true });

  // Log music activity
  await addDoc(collection(db, 'musicActivity'), {
    uid,
    songId: songData.id,
    title: songData.title,
    artist: songData.artist,
    timestamp: serverTimestamp()
  });
};

export const subscribeUserMusicStatus = (uid, callback) => {
  if (!uid) return () => {};
  return onSnapshot(doc(db, 'userMusicStatus', uid), doc => {
    if (doc.exists()) callback(doc.data());
    else callback(null);
  });
};

export const joinMusicRoom = async (roomId, uid) => {
  const roomRef = doc(db, 'musicRooms', roomId);
  await updateDoc(roomRef, {
    activeListeners: increment(1),
    listeners: arrayUnion(uid)
  });
};

export const leaveMusicRoom = async (roomId, uid) => {
  const roomRef = doc(db, 'musicRooms', roomId);
  await updateDoc(roomRef, {
    activeListeners: increment(-1)
  });
};

export const AMBIENCE_SOUNDS = [
  { id: 'rain', label: 'Heavy Rain', icon: '🌧️', url: '/sounds/rain.mp3' },
  { id: 'cafe', label: 'Cyber Cafe', icon: '☕', url: '/sounds/cafe.mp3' },
  { id: 'city', label: 'Night City', icon: '🌃', url: '/sounds/city.mp3' },
  { id: 'thunder', label: 'Thunderstorm', icon: '⛈️', url: '/sounds/thunder.mp3' },
  { id: 'keyboard', label: 'Mechanical Keyboard', icon: '⌨️', url: '/sounds/keyboard.mp3' },
];

export const MOCK_TRACKS = [
  { id: 't1', title: 'Midnight Signals', artist: 'DZ', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300', duration: '3:45', mood: 'night' },
  { id: 't2', title: 'Neon Dreams', artist: 'Cyberspace', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300', duration: '4:20', mood: 'chill' },
  { id: 't3', title: 'Focus Flow', artist: 'Nexify Records', cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300', duration: '2:30', mood: 'focus' },
  { id: 't4', title: 'Phonk Legend', artist: 'Drift King', cover: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=300', duration: '3:15', mood: 'gaming' },
];

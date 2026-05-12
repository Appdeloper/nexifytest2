import { db } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

export const getAllUsers = async (currentUid) => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .map(doc => doc.data())
    .filter(user => user.uid !== currentUid);
};

export const getUserData = async (uid) => {
  const docRef = doc(db, 'users', uid);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) return snapshot.data();
  return null;
};

export const ensureAIUser = async () => {
  const aiUid = 'nexify_ai';
  const aiRef = doc(db, 'users', aiUid);
  const snap = await getDoc(aiRef);
  
  if (!snap.exists()) {
    await setDoc(aiRef, {
      uid: aiUid,
      displayName: 'Nexify AI',
      username: 'nexifyai',
      role: 'ai',
      verified: true,
      bio: 'Your futuristic AI companion. Tag me with @nexifyai to chat!',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexify_ai&backgroundColor=000000',
      presence: 'online',
      createdAt: new Date(),
      prefs: {
        avatarRing: true,
        animatedStatus: true
      },
      xp: 9999,
      roleColor: '#00dfd8'
    });
  }
};

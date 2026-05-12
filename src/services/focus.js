import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const getFocusDocRef = (uid) => doc(db, 'focusStats', uid);

export const initializeFocusData = async (uid) => {
  const ref = getFocusDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      focusMinutes: 0,
      focusSessions: 0,
      focusStreak: 0,
      lastSessionAt: null,
      updatedAt: serverTimestamp()
    });
  }
};

export const subscribeFocusData = (uid, callback) => {
  const ref = getFocusDocRef(uid);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      initializeFocusData(uid);
    }
  });
};

export const updateFocusStats = async (uid, minutes) => {
  const ref = getFocusDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await initializeFocusData(uid);
  }
  
  const data = snap.data() || { focusMinutes: 0, focusSessions: 0, focusStreak: 0 };
  
  await updateDoc(ref, {
    focusMinutes: (data.focusMinutes || 0) + minutes,
    focusSessions: (data.focusSessions || 0) + 1,
    lastSessionAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Award XP
  import('./xp').then(({ addXP }) => addXP(uid, 'focusSession')).catch(() => {});
};

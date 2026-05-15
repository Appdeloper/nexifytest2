import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, collection, addDoc, query, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';

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
  }, (err) => {
    console.warn("Focus data subscription failed:", err);
    callback({ focusMinutes: 0 });
  });
};

export const updateFocusStats = async (uid, minutes) => {
  const ref = getFocusDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await initializeFocusData(uid);
  }
  
  const data = snap.data() || { focusMinutes: 0, focusSessions: 0, focusStreak: 0 };
  
  const totalFocus = (data.focusMinutes || 0) + minutes;
  await updateDoc(ref, {
    focusMinutes: totalFocus,
    focusSessions: (data.focusSessions || 0) + 1,
    lastSessionAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Sync to leaderboard
  const lbRef = doc(db, 'leaderboards', 'global', 'users', uid);
  await setDoc(lbRef, { focusMinutes: totalFocus, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});

  // Award XP
  import('./xp').then(({ addXP }) => addXP(uid, 'finishFocusSession')).catch(() => {});
};

export const createFocusPod = async (uid, data) => {
  const docRef = await addDoc(collection(db, 'focusPods'), {
    ...data,
    createdBy: uid,
    members: [uid],
    createdAt: serverTimestamp(),
    endTime: Date.now() + (data.time || 25) * 60000
  });
  return docRef.id;
};

export const joinFocusPod = async (podId, uid) => {
  await updateDoc(doc(db, 'focusPods', podId), {
    members: arrayUnion(uid)
  });
};

export const leaveFocusPod = async (podId, uid) => {
  await updateDoc(doc(db, 'focusPods', podId), {
    members: arrayRemove(uid)
  });
};

export const subscribeFocusPods = (callback) => {
  const q = query(collection(db, 'focusPods'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

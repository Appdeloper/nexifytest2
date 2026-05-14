import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export const getFitnessDocRef = (uid) => doc(db, `users/${uid}/data/fitness`);

export const initializeFitnessData = async (uid) => {
  const ref = getFitnessDocRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      steps: 0,
      stepGoal: 10000,
      calories: 0,
      calorieGoal: 500,
      hydration: 0,
      hydrationGoal: 8,
      sleep: 0,
      sleepGoal: 8,
      workoutsCompleted: 0,
      streak: 0,
      lastUpdated: serverTimestamp()
    });
  }
};

export const subscribeFitnessData = (uid, callback) => {
  const ref = getFitnessDocRef(uid);
  return onSnapshot(ref, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      initializeFitnessData(uid).then(() => {
        // Will trigger next snapshot
      });
    }
  });
};

export const updateFitnessData = async (uid, data) => {
  const ref = getFitnessDocRef(uid);
  await setDoc(ref, {
    ...data,
    lastUpdated: serverTimestamp()
  }, { merge: true });

  const lbData = {};
  if (data.steps !== undefined) lbData.steps = data.steps;
  if (data.workoutsCompleted !== undefined) lbData.workoutsCompleted = data.workoutsCompleted;
  if (data.streak !== undefined) lbData.streak = data.streak;
  
  if (Object.keys(lbData).length > 0) {
    const lbRef = doc(db, 'leaderboards', 'global', 'users', uid);
    await setDoc(lbRef, { ...lbData, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
  }
};

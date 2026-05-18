import { db } from './firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { uploadToCloudinary } from './cloudinary';

// ── Update public profile fields with cooldown ────────────────
export const updateUserProfile = async (uid, updates) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found');
  
  const nextUpdates = { ...updates };
  if (nextUpdates.username) {
    nextUpdates.username = nextUpdates.username.trim().toLowerCase();
  }

  const userData = snap.data();
  const now = Date.now();
  const DAY_IN_MS = 24 * 60 * 60 * 1000;

  // Check username cooldown
  if (nextUpdates.username && nextUpdates.username !== userData.username) {
    const lastUpdate = userData.lastUsernameUpdate?.toMillis() || 0;
    if (now - lastUpdate < DAY_IN_MS) {
      const remaining = Math.ceil((DAY_IN_MS - (now - lastUpdate)) / (60 * 60 * 1000));
      throw new Error(`Username can only be changed once every 24 hours. Try again in ${remaining} hours.`);
    }
    nextUpdates.lastUsernameUpdate = serverTimestamp();
  }

  // Check name cooldown
  if (nextUpdates.displayName && nextUpdates.displayName !== userData.displayName) {
    const lastUpdate = userData.lastNameUpdate?.toMillis() || 0;
    if (now - lastUpdate < DAY_IN_MS) {
      const remaining = Math.ceil((DAY_IN_MS - (now - lastUpdate)) / (60 * 60 * 1000));
      throw new Error(`Name can only be changed once every 24 hours. Try again in ${remaining} hours.`);
    }
    nextUpdates.lastNameUpdate = serverTimestamp();
  }

  await updateDoc(userRef, {
    ...nextUpdates,
    updatedAt: serverTimestamp(),
  });
};

// ── Upload avatar to Cloudinary ───────────────────────────────
export const uploadAvatar = async (uid, file) => {
  const url = await uploadToCloudinary(file, `avatars/${uid}`);
  await updateUserProfile(uid, { photoURL: url });
  return url;
};

// ── Upload banner to Cloudinary ───────────────────────────────
export const uploadBanner = async (uid, file) => {
  const url = await uploadToCloudinary(file, `banners/${uid}`);
  await updateUserProfile(uid, { bannerURL: url });
  return url;
};

// ── Get full user profile ─────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

// ── Save settings to Firestore user prefs ─────────────────────
export const saveUserPrefs = async (uid, prefs) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { prefs, updatedAt: serverTimestamp() });
};

export const setProfileAnthem = async (uid, anthemData) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    anthem: anthemData,
    updatedAt: serverTimestamp()
  });
};

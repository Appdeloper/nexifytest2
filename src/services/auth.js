import { auth, db, googleProvider } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity, ACTIVITY_TYPES } from './activity';
import { syncLeaderboard } from './xp';

const OWNER_EMAIL = "iamwe@nexify.com";

/**
 * Ensures a user profile exists in Firestore.
 * If not, creates it with default values (or Owner values if matching).
 */
export const ensureUserProfile = async (user) => {
  if (!user) return null;
  
  const userRef = doc(db, 'users', user.uid);
  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (e) {
    console.error("Failed to fetch user profile:", e);
    return {
      uid: user.uid,
      displayName: user.displayName || 'Nexify Citizen',
      email: user.email,
      role: 'member',
      rank: 'rookie',
      xp: 0,
      level: 1
    };
  }
  
  const isOwner = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  
  if (!snap.exists()) {
    const fallbackUsername = user.email ? user.email.split('@')[0].toLowerCase() : 'user';
    const normalizedUsername = (user.username || fallbackUsername).trim().toLowerCase();

    const profileData = {
      uid: user.uid,
      displayName: user.displayName || 'Nexify Citizen',
      displayNameLower: (user.displayName || 'Nexify Citizen').toLowerCase(),
      username: normalizedUsername,
      email: user.email || '',
      emailLower: (user.email || '').toLowerCase(),
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      bio: isOwner ? "Founder & Lead Architect of Nexify Connect" : "Hey, I'm using Nexify Connect",
      role: isOwner ? "owner" : "member",
      rank: isOwner ? "founder" : "rookie",
      xp: 0,
      level: 1,
      verified: isOwner ? true : false,
      badges: isOwner ? ["founder", "owner"] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      online: true,
      lastSeen: serverTimestamp(),
      friends: [],
      requestsSent: [],
      requestsReceived: [],
      blockedUsers: [],
    };
    
    await setDoc(userRef, profileData);
    
    // Sync to leaderboard
    await syncLeaderboard(user.uid, profileData).catch(() => {});

    // Log signup activity
    await logActivity({
      userId: user.uid,
      userName: profileData.displayName,
      userPhoto: profileData.photoURL,
      type: ACTIVITY_TYPES.JOIN_NEXUS,
      text: "just joined the Nexify Nexus! 👋",
    }).catch(() => {});

    return profileData;
  } else {
    const rawData = snap.data();
    
    // Clean any keys and values with trailing spaces
    let hasSpacedKeys = false;
    const data = {};
    Object.keys(rawData).forEach(key => {
      const cleanKey = key.trim();
      let val = rawData[key];
      if (typeof val === 'string') {
        val = val.trim();
      }
      if (cleanKey !== key || (typeof rawData[key] === 'string' && rawData[key] !== val)) {
        hasSpacedKeys = true;
      }
      data[cleanKey] = val;
    });

    const isIncomplete = !data.displayName || !data.role || !data.username || !data.email || !data.blockedUsers;

    if (hasSpacedKeys || isIncomplete) {
      const fallbackUsername = user.email ? user.email.split('@')[0].toLowerCase() : 'user';
      const normalizedUsername = (data.username || fallbackUsername).trim().toLowerCase();

      const repairedData = {
        uid: user.uid,
        displayName: data.displayName || user.displayName || 'Nexify Citizen',
        displayNameLower: (data.displayName || user.displayName || 'Nexify Citizen').toLowerCase(),
        username: normalizedUsername,
        email: data.email || user.email || '',
        emailLower: (data.email || user.email || '').toLowerCase(),
        photoURL: data.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        bio: data.bio || (isOwner ? "Founder & Lead Architect of Nexify Connect" : "Hey, I'm using Nexify Connect"),
        role: data.role || (isOwner ? "owner" : "member"),
        rank: data.rank || (isOwner ? "founder" : "rookie"),
        xp: data.xp !== undefined ? data.xp : 0,
        level: data.level !== undefined ? data.level : 1,
        verified: data.verified !== undefined ? data.verified : (isOwner ? true : false),
        badges: data.badges || (isOwner ? ["founder", "owner"] : []),
        createdAt: data.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        online: true,
        lastSeen: serverTimestamp(),
        friends: data.friends || [],
        requestsSent: data.requestsSent || [],
        requestsReceived: data.requestsReceived || [],
        blockedUsers: data.blockedUsers || [],
      };

      // Rewrite clean and complete data (without merge to discard old keys with spaces)
      await setDoc(userRef, repairedData);
      await syncLeaderboard(user.uid, repairedData).catch(() => {});
      return repairedData;
    }

    // Check for role upgrade if matching owner email
    if (isOwner && data.role !== 'owner') {
      const updates = {
        role: 'owner',
        rank: 'founder',
        verified: true,
        badges: Array.from(new Set([...(data.badges || []), 'founder', 'owner'])),
        updatedAt: serverTimestamp()
      };
      await updateDoc(userRef, updates);
      return { ...data, ...updates };
    }

    // Update status
    await setDoc(userRef, {
      lastSeen: serverTimestamp(),
      online: true
    }, { merge: true });
    
    // Sync to leaderboard
    await syncLeaderboard(user.uid, data).catch(() => {});
    
    return data;
  }
};

export const checkAndIncrementStreak = async (uid, data) => {
  if (!uid || !data) return;
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const lastActiveDate = data.lastActiveDate || '';
  
  if (lastActiveDate === todayStr) {
    return;
  }

  let newStreak = data.streak || 0;
  
  if (lastActiveDate) {
    const today = new Date(todayStr);
    const lastActive = new Date(lastActiveDate);
    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      newStreak += 1;
      import('./xp').then(({ addXP }) => addXP(uid, 'dailyLogin')).catch(() => {});
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    streak: newStreak,
    lastActiveDate: todayStr,
    updatedAt: serverTimestamp()
  }).catch((err) => {
    console.warn("Failed to update daily login streak:", err.message);
  });
};

export const registerUser = async (email, password, username) => {
  if (!username || username.trim().length < 3 || username.trim().length > 20) {
    throw new Error('Username must be between 3 and 20 characters.');
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await ensureUserProfile({ ...user, displayName: username, username });
    return user;
  } catch (error) {
    throw parseAuthError(error);
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(userCredential.user);
    return userCredential.user;
  } catch (error) {
    throw parseAuthError(error);
  }
};

export const loginWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(userCredential.user);
    return userCredential.user;
  } catch (error) {
    throw parseAuthError(error);
  }
};

export const logoutUser = async () => {
  try {
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        online: false,
        lastSeen: serverTimestamp()
      }, { merge: true });
    }
    await signOut(auth);
  } catch (error) {
    throw parseAuthError(error);
  }
};

const parseAuthError = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return new Error('This email is already registered.');
    case 'auth/invalid-email':
      return new Error('Invalid email address format.');
    case 'auth/weak-password':
      return new Error('Password should be at least 6 characters.');
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return new Error('Invalid email or password.');
    default:
      return new Error('An authentication error occurred. Please try again.');
  }
};

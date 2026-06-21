import { auth, db, googleProvider } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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
  let newStreakFreezes = data.streakFreezes !== undefined ? data.streakFreezes : 1; // Default to 1 free freeze
  let newHighestStreak = data.highestStreak || 0;
  let activeDates = data.activeDates || [];
  let frozenDates = data.frozenDates || [];
  let streakUpdateToast = null;

  if (lastActiveDate) {
    const today = new Date(todayStr);
    const lastActive = new Date(lastActiveDate);
    const diffTime = Math.abs(today - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Regular consecutive check-in
      newStreak += 1;
      // Add XP for login
      try {
        const { addXP } = await import('./xp');
        await addXP(uid, 'dailyLogin').catch(() => {});
      } catch (err) {
        console.warn("Failed to load addXP module:", err);
      }
      
      // Streak Milestones
      if (newStreak === 3) {
        try {
          const { addXP } = await import('./xp');
          await addXP(uid, 'streakMilestone_3', 50).catch(() => {});
        } catch (_) {}
        streakUpdateToast = { type: 'milestone', streak: 3, xp: 50, freezes: 0 };
      } else if (newStreak === 7) {
        newStreakFreezes += 1;
        try {
          const { addXP } = await import('./xp');
          await addXP(uid, 'streakMilestone_7', 150).catch(() => {});
        } catch (_) {}
        streakUpdateToast = { type: 'milestone', streak: 7, xp: 150, freezes: 1 };
      } else if (newStreak === 14) {
        newStreakFreezes += 1;
        try {
          const { addXP } = await import('./xp');
          await addXP(uid, 'streakMilestone_14', 250).catch(() => {});
        } catch (_) {}
        streakUpdateToast = { type: 'milestone', streak: 14, xp: 250, freezes: 1 };
      } else if (newStreak === 30) {
        newStreakFreezes += 2;
        try {
          const { addXP } = await import('./xp');
          await addXP(uid, 'streakMilestone_30', 500).catch(() => {});
        } catch (_) {}
        streakUpdateToast = { type: 'milestone', streak: 30, xp: 500, freezes: 2 };
      } else {
        streakUpdateToast = { type: 'daily', streak: newStreak, xp: 10, freezes: 0 };
      }
    } else if (diffDays === 2) {
      // Missed exactly 1 day. Check if we have a streak freeze!
      if (newStreakFreezes > 0) {
        newStreakFreezes -= 1;
        // Keep the current streak!
        // Record the missed day (yesterday) as frozen
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');
        frozenDates = [...frozenDates, yesterdayStr];
        if (frozenDates.length > 30) frozenDates.shift();
        
        streakUpdateToast = { type: 'freeze_used', streak: newStreak, remainingFreezes: newStreakFreezes };
        
        // Log activity
        await logActivity({
          userId: uid,
          userName: data.displayName,
          userPhoto: data.photoURL,
          type: ACTIVITY_TYPES.ACHIEVEMENT_UNLOCKED,
          text: `used a ❄️ Streak Freeze to keep a ${newStreak}-day streak alive!`,
        }).catch(() => {});
      } else {
        // No freeze available, reset
        newStreak = 1;
        streakUpdateToast = { type: 'reset', oldStreak: data.streak, newStreak: 1 };
      }
    } else {
      // Missed multiple days, reset
      newStreak = 1;
      streakUpdateToast = { type: 'reset', oldStreak: data.streak, newStreak: 1 };
    }
  } else {
    // First time initializing streak
    newStreak = 1;
    streakUpdateToast = { type: 'welcome', streak: 1 };
  }

  // Update highest streak
  if (newStreak > newHighestStreak) {
    newHighestStreak = newStreak;
  }

  // Add today to active dates list
  activeDates = [...activeDates, todayStr];
  if (activeDates.length > 30) activeDates.shift();

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    streak: newStreak,
    highestStreak: newHighestStreak,
    streakFreezes: newStreakFreezes,
    lastActiveDate: todayStr,
    activeDates: activeDates,
    frozenDates: frozenDates,
    streakUpdateToast: streakUpdateToast,
    updatedAt: serverTimestamp()
  }).catch((err) => {
    console.warn("Failed to update daily login streak:", err.message);
  });
};

export const buyStreakFreeze = async (uid) => {
  if (!uid) return { success: false, error: 'User ID required' };
  
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { success: false, error: 'User does not exist' };
  
  const data = snap.data();
  const xp = data.xp || 0;
  const streakFreezes = data.streakFreezes !== undefined ? data.streakFreezes : 1;
  
  const cost = 200; // Cost is 200 XP
  if (xp < cost) {
    return { success: false, error: `Insufficient XP. You need ${cost} XP, but you have ${xp} XP.` };
  }
  
  const newXP = xp - cost;
  const { calculateRankFromXP, syncLeaderboard } = await import('./xp');
  const newRank = calculateRankFromXP(newXP);
  const newLevel = Math.floor(newXP / 100) + 1;
  
  const updates = {
    xp: newXP,
    rank: newRank.id,
    level: newLevel,
    streakFreezes: streakFreezes + 1,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(userRef, updates);
  await syncLeaderboard(uid, { ...data, ...updates });
  
  // Log activity
  await logActivity({
    userId: uid,
    userName: data.displayName,
    userPhoto: data.photoURL,
    type: ACTIVITY_TYPES.ACHIEVEMENT_UNLOCKED,
    text: `purchased a ❄️ Streak Freeze for 200 XP!`,
  }).catch(() => {});
  
  return { success: true, newXP, newStreakFreezes: streakFreezes + 1 };
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
    const isMobileApp = navigator.userAgent.includes("NexifyApp") || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileApp) {
      console.log("[NexifyAuth] Mobile WebView/Browser detected. Initiating Google Sign-In with redirect...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    } else {
      console.log("[NexifyAuth] Desktop/Standard browser detected. Initiating Google Sign-In with popup...");
      const userCredential = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(userCredential.user);
      console.log("[NexifyAuth] LOGIN SUCCESS");
      return userCredential.user;
    }
  } catch (error) {
    console.error("[NexifyAuth] Google Sign-In error:", error);
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
      console.warn("[NexifyAuth] Popup blocked or not supported. Falling back to redirect...");
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.error("[NexifyAuth] Redirect fallback error:", redirectErr);
        throw parseAuthError(redirectErr);
      }
      return null;
    }
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

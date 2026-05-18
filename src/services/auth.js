import { auth, db, googleProvider } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity, ACTIVITY_TYPES } from './activity';

const OWNER_EMAIL = "iamwe@nexify.com";

/**
 * Ensures a user profile exists in Firestore.
 * If not, creates it with default values (or Owner values if matching).
 */
export const ensureUserProfile = async (user) => {
  if (!user) return null;
  
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    const isOwner = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    
    const fallbackUsername = user.email.split('@')[0].toLowerCase();
    const normalizedUsername = (user.username || fallbackUsername).trim().toLowerCase();

    const profileData = {
      uid: user.uid,
      displayName: user.displayName || 'Nexify Citizen',
      displayNameLower: (user.displayName || 'Nexify Citizen').toLowerCase(),
      username: normalizedUsername,
      email: user.email,
      emailLower: user.email.toLowerCase(),
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
    };
    
    await setDoc(userRef, profileData);
    
    // Log signup activity
    await logActivity({
      userId: user.uid,
      userName: profileData.displayName,
      userPhoto: profileData.photoURL,
      type: ACTIVITY_TYPES.JOIN_NEXUS,
      text: "just joined the Nexify Nexus! 👋",
    });

    return profileData;
  } else {
    const data = snap.data();
    const isOwner = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    
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
    return data;
  }
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

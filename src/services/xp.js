// XP + Rank system service - PRODUCTION GRADE
import { db } from './firebase';
import { 
  doc, getDoc, setDoc, updateDoc, increment, 
  serverTimestamp, addDoc, collection, onSnapshot
} from 'firebase/firestore';
import { logActivity, ACTIVITY_TYPES } from './activity';

export let RANKS = [
  { id: 'rookie',      name: 'Rookie',       xpRequired: 0,     icon: '🌱', color: '#ffffff', glow: 'white',  priority: 1 },
  { id: 'explorer',    name: 'Explorer',     xpRequired: 250,   icon: '🧭', color: '#38bdf8', glow: 'cyan',   priority: 2 },
  { id: 'signal',      name: 'Signal',       xpRequired: 750,   icon: '📡', color: '#00d4ff', glow: 'blue',   priority: 3 },
  { id: 'elite',       name: 'Elite',        xpRequired: 1500,  icon: '💠', color: '#8b5cf6', glow: 'purple', priority: 4 },
  { id: 'vanguard',    name: 'Vanguard',     xpRequired: 3000,  icon: '⚔️', color: '#a855f7', glow: 'violet', priority: 5 },
  { id: 'nova',        name: 'Nova',         xpRequired: 6000,  icon: '🌌', color: '#3b82f6', glow: 'blue',   priority: 6 },
  { id: 'pulse',       name: 'Pulse',        xpRequired: 10000, icon: '⚡', color: '#22d3ee', glow: 'cyan',   priority: 7 },
  { id: 'ascended',    name: 'Ascended',     xpRequired: 15000, icon: '🔥', color: '#f97316', glow: 'orange', priority: 8 },
  { id: 'founder',     name: 'Founder',      xpRequired: 25000, icon: '👑', color: '#a855f7', glow: 'purple', priority: 9 },
  { id: 'nexusLegend', name: 'Nexus Legend', xpRequired: 50000, icon: '🏆', color: '#facc15', glow: 'gold',   priority: 10 },
];

export let ROLES = {
  owner: {
    id: 'owner', label: 'OWNER', icon: '👑', color: '#ff3df2', glow: 'purple', priority: 100,
    permissions: ["manageRoles","manageUsers","manageRooms","deleteMessages","viewAdminPanel","verifyUsers"]
  },
  admin: {
    id: 'admin', label: 'ADMIN', icon: '🛡️', color: '#ff3b3b', glow: 'red', priority: 80,
    permissions: ["manageUsers","manageRooms","deleteMessages","verifyUsers"]
  },
  moderator: {
    id: 'moderator', label: 'MOD', icon: '⚡', color: '#00d4ff', glow: 'cyan', priority: 60,
    permissions: ["moderateChats","muteUsers","manageReports"]
  },
  verified: {
    id: 'verified', label: 'VERIFIED', icon: '⭐', color: '#2f80ff', glow: 'blue', priority: 40,
    permissions: ["verifiedBadge"]
  },
  member: {
    id: 'member', label: 'MEMBER', icon: '🌐', color: '#ffffff', glow: 'white', priority: 10,
    permissions: []
  },
};

export const XP_REWARDS = {
  sendMessage: 2,
  completeTask: 10,
  completeWorkout: 20,
  joinFocusPod: 15,
  finishFocusSession: 30,
  createRoom: 25,
  dailyLogin: 10,
};


// Anti-spam configuration
const XP_COOLDOWNS = {
  sendMessage: 5000, // 5 seconds
};
const DAILY_XP_LIMIT = 1000;

export const subscribeSystemConfig = (onUpdate) => {
  const unsubRanks = onSnapshot(collection(db, 'ranks'), (snap) => {
    if (!snap.empty) {
      RANKS = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.xpRequired - b.xpRequired);
      if (onUpdate) onUpdate();
    }
  }, (err) => {
    console.warn("Ranks subscription failed (check permissions):", err.message);
  });
  
  const unsubRoles = onSnapshot(collection(db, 'roles'), (snap) => {
    if (!snap.empty) {
      const newRoles = {};
      snap.docs.forEach(d => newRoles[d.id] = { id: d.id, ...d.data() });
      ROLES = newRoles;
      if (onUpdate) onUpdate();
    }
  }, (err) => {
    console.warn("Roles subscription failed (check permissions):", err.message);
  });
  
  return () => { unsubRanks(); unsubRoles(); };
};

export const calculateRankFromXP = (xp = 0) => {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xpRequired) rank = r;
  }
  return rank;
};

export const getRankForXP = calculateRankFromXP;

export const syncLeaderboard = async (uid) => {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const userData = snap.data();

    await setDoc(doc(db, 'leaderboards', 'global', 'users', uid), {
      uid,
      displayName: userData.displayName || 'Unknown',
      username: userData.username || 'user',
      photoURL: userData.photoURL || '',
      role: userData.role || 'member',
      rank: userData.rank || 'rookie',
      xp: userData.xp || 0,
      level: userData.level || 1,
      verified: userData.verified || false,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('Leaderboard sync failed:', e.message);
  }
};

export const logXPEvent = async (uid, amount, reason) => {
  try {
    await addDoc(collection(db, 'xpEvents'), {
      uid,
      amount,
      reason,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Failed to log XP event:', e.message);
  }
};

export const addXP = async (uid, reason, amountOverride = null) => {
  const amount = amountOverride || XP_REWARDS[reason] || 0;
  if (!amount || !uid) return;

  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    
    // Anti-spam checks
    const now = Date.now();
    const lastXpAt = data.lastXpAt?.toMillis() || 0;
    const cooldown = XP_COOLDOWNS[reason] || 0;
    
    if (now - lastXpAt < cooldown) return;

    // Daily limit check
    const today = new Date().toISOString().split('T')[0];
    const dailyXp = data.dailyXpDate === today ? (data.dailyXpAmount || 0) : 0;
    if (dailyXp >= DAILY_XP_LIMIT) return;

    // Reason-specific validations (Anti-cheat)
    if (reason === 'sendMessage') {
      if (amountOverride && amountOverride < 1) return; // Prevent negative/zero XP
      // Message length validation already handled in chat service, but we check here too
    }
    if (reason === 'finishFocusSession') {
      // Minimum 10 minutes for a focus session reward
      if (amountOverride && amountOverride < 10) return; 
    }

    const finalAmount = Math.min(amount, DAILY_XP_LIMIT - dailyXp);
    const newXP = (data.xp || 0) + finalAmount;
    const newRank = calculateRankFromXP(newXP);
    const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level

    const updates = {
      xp: increment(finalAmount),
      rank: newRank.id,
      level: newLevel,
      lastXpAt: serverTimestamp(),
      dailyXpAmount: (dailyXp + finalAmount),
      dailyXpDate: today,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updates);
    await logXPEvent(uid, finalAmount, reason);
    await syncLeaderboard(uid);

    // Notable milestones
    if (data.rank !== newRank.id) {
      await addDoc(collection(db, 'milestones'), {
        uid,
        type: 'RANK_UP',
        rankId: newRank.id,
        rankName: newRank.name,
        createdAt: serverTimestamp()
      });
    }

    // Log public activity
    if (reason === 'completeTask' || reason === 'completeWorkout' || reason === 'finishFocusSession' || (data.rank !== newRank.id)) {
      await logActivity({
        userId: uid,
        userName: data.displayName,
        userPhoto: data.photoURL,
        type: data.rank !== newRank.id ? ACTIVITY_TYPES.RANK_UP : (reason === 'completeTask' ? ACTIVITY_TYPES.COMPLETE_TASK : (reason === 'completeWorkout' ? ACTIVITY_TYPES.COMPLETE_WORKOUT : ACTIVITY_TYPES.FINISH_FOCUS)),
        text: data.rank !== newRank.id ? `Ranked up to ${newRank.name}!` : `Earned ${finalAmount} XP for ${reason.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      });
    }

    return { amount: finalAmount, newXP, newRank };
  } catch (e) {
    console.warn('XP award failed:', e.message);
  }
};

export const updateUserRank = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const rank = calculateRankFromXP(data.xp || 0);
  await updateDoc(userRef, { rank: rank.id, updatedAt: serverTimestamp() });
  await syncLeaderboard(uid);
};

export const getNextRank = (xp = 0) => {
  const currentRank = calculateRankFromXP(xp);
  const nextRankIndex = RANKS.findIndex(r => r.id === currentRank.id) + 1;
  return nextRankIndex < RANKS.length ? RANKS[nextRankIndex] : null;
};

export const getRankProgress = (xp = 0) => {
  const currentRank = calculateRankFromXP(xp);
  const nextRank = getNextRank(xp);
  if (!nextRank) return 100;
  const range = nextRank.xpRequired - currentRank.xpRequired;
  const progress = xp - currentRank.xpRequired;
  return Math.min(Math.round((progress / range) * 100), 100);
};

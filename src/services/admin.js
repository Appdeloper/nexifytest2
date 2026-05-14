// Admin Service - PRODUCTION GRADE
import { db } from './firebase';
import {
  doc, getDoc, updateDoc, setDoc, addDoc,
  collection, serverTimestamp, increment, onSnapshot,
  query, orderBy, limit, where
} from 'firebase/firestore';
import { RANKS, ROLES, XP_REWARDS, calculateRankFromXP, syncLeaderboard, addXP } from './xp';

// ── Role helpers ────────────────────────────────────────────
export const getCurrentUserRole = async (uid) => {
  if (!uid) return 'member';
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().role || 'member') : 'member';
  } catch (e) {
    return 'member';
  }
};

export const canManageRoles = (role) => 
  role === 'owner' || role === 'admin';

export const canAssignRole = (actorRole, targetRole) => {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') return targetRole !== 'owner';
  return false;
};

// ── Admin log ───────────────────────────────────────────────
export const logAdminAction = async (changedByUid, action, targetUid, oldValue, newValue) => {
  await addDoc(collection(db, 'adminLogs'), {
    action,
    targetUid,
    changedBy: changedByUid,
    oldValue: oldValue !== undefined ? String(oldValue) : 'none',
    newValue: newValue !== undefined ? String(newValue) : 'none',
    createdAt: serverTimestamp(),
  });
};

// ── User updates ─────────────────────────────────────────────
export const updateUserRole = async (actorUid, actorRole, targetUid, newRole) => {
  if (!canAssignRole(actorRole, newRole)) throw new Error('Insufficient permissions.');
  
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found.');
  
  const oldRole = snap.data().role || 'member';
  const updates = { role: newRole, updatedAt: serverTimestamp() };
  
  await updateDoc(userRef, updates);
  await logAdminAction(actorUid, 'ROLE_CHANGE', targetUid, oldRole, newRole);
  
  // Sync to leaderboard
  await syncLeaderboard(targetUid, { ...snap.data(), ...updates });
};

export const updateUserRankManual = async (actorUid, actorRole, targetUid, newRankId) => {
  if (!canManageRoles(actorRole)) throw new Error('Insufficient permissions.');
  
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found.');
  
  const oldRank = snap.data().rank || 'rookie';
  const updates = { 
    rank: newRankId, 
    updatedAt: serverTimestamp() 
  };
  
  await updateDoc(userRef, updates);
  await logAdminAction(actorUid, 'RANK_CHANGE', targetUid, oldRank, newRankId);
  await syncLeaderboard(targetUid, { ...snap.data(), ...updates });
};

export const adjustUserXP = async (actorUid, actorRole, targetUid, amount) => {
  if (!canManageRoles(actorRole)) throw new Error('Insufficient permissions.');
  
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found.');
  
  const data = snap.data();
  const oldXP = data.xp || 0;
  const newXP = Math.max(0, oldXP + amount);
  const newRank = calculateRankFromXP(newXP);
  
  const updates = {
    xp: newXP,
    rank: newRank.id,
    level: Math.floor(newXP / 100) + 1,
    updatedAt: serverTimestamp(),
  };

  
  await updateDoc(userRef, updates);
  await logAdminAction(actorUid, amount >= 0 ? 'XP_ADD' : 'XP_REMOVE', targetUid, oldXP, newXP);
  await syncLeaderboard(targetUid, { ...data, ...updates });
};

export const toggleUserVerification = async (actorUid, actorRole, targetUid, verified) => {
  if (!canManageRoles(actorRole)) throw new Error('Insufficient permissions.');
  
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  await updateDoc(userRef, { verified, updatedAt: serverTimestamp() });
  await logAdminAction(actorUid, verified ? 'VERIFY' : 'UNVERIFY', targetUid, !verified, verified);
  await syncLeaderboard(targetUid);
};

export const banUser = async (actorUid, actorRole, targetUid, reason) => {
  if (actorRole !== 'owner' && actorRole !== 'admin') throw new Error('Insufficient permissions.');
  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, { banned: true, banReason: reason, updatedAt: serverTimestamp() });
  await logAdminAction(actorUid, 'BAN_USER', targetUid, 'active', 'banned');
};

export const unbanUser = async (actorUid, actorRole, targetUid) => {
  if (actorRole !== 'owner' && actorRole !== 'admin') throw new Error('Insufficient permissions.');
  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, { banned: false, banReason: null, updatedAt: serverTimestamp() });
  await logAdminAction(actorUid, 'UNBAN_USER', targetUid, 'banned', 'active');
};



// ── Leaderboard Fetch ───────────────────────────────────────
export const subscribeLeaderboard = (callback, sortKey = 'xp') => {
  const q = query(
    collection(db, 'leaderboards', 'global', 'users'),
    orderBy(sortKey, 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });
};


// ── XP Helpers ──────────────────────────────────────────────
export const awardXPWithLimit = async (uid, reason) => {
  // Map COMPLETE_TASK to completeTask if needed
  const mappedReason = reason === 'COMPLETE_TASK' ? 'completeTask' : reason;
  return await addXP(uid, mappedReason);
};

import { db } from './firebase';
import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, getDocs, getDoc,
  serverTimestamp, orderBy, limit
} from 'firebase/firestore';

// ── Send a friend request ──────────────────────────────────────
export const sendFriendRequest = async (fromUid, toUid) => {
  if (fromUid === toUid) throw new Error('Cannot add yourself.');

  // Check for existing request
  const reqId = [fromUid, toUid].sort().join('_');
  const reqRef = doc(db, 'friendRequests', reqId);
  const existing = await getDoc(reqRef);
  if (existing.exists()) throw new Error('Friend request already sent or you are already friends.');

  // Check if already friends
  const friendRef = doc(db, 'friends', reqId);
  const fr = await getDoc(friendRef);
  if (fr.exists()) throw new Error('You are already friends.');

  await setDoc(reqRef, {
    from: fromUid,
    to: toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

// ── Cancel a sent request ──────────────────────────────────────
export const cancelFriendRequest = async (fromUid, toUid) => {
  const reqId = [fromUid, toUid].sort().join('_');
  await deleteDoc(doc(db, 'friendRequests', reqId));
};

// ── Accept a friend request ────────────────────────────────────
export const acceptFriendRequest = async (fromUid, toUid) => {
  const reqId = [fromUid, toUid].sort().join('_');
  await deleteDoc(doc(db, 'friendRequests', reqId));

  // Write friendship document (bidirectional via single doc + map)
  const friendRef = doc(db, 'friends', reqId);
  await setDoc(friendRef, {
    users: [fromUid, toUid],
    userMap: { [fromUid]: true, [toUid]: true },
    createdAt: serverTimestamp(),
  });
};

// ── Decline a friend request ───────────────────────────────────
export const declineFriendRequest = async (fromUid, toUid) => {
  const reqId = [fromUid, toUid].sort().join('_');
  await deleteDoc(doc(db, 'friendRequests', reqId));
};

// ── Remove a friend ────────────────────────────────────────────
export const removeFriend = async (uid1, uid2) => {
  const reqId = [uid1, uid2].sort().join('_');
  await deleteDoc(doc(db, 'friends', reqId));
};

// ── Real-time: incoming requests ───────────────────────────────
export const subscribeIncomingRequests = (uid, callback) => {
  const q = query(
    collection(db, 'friendRequests'),
    where('to', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ── Real-time: sent requests ───────────────────────────────────
export const subscribeSentRequests = (uid, callback) => {
  const q = query(
    collection(db, 'friendRequests'),
    where('from', '==', uid),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ── Real-time: friends list ────────────────────────────────────
export const subscribeFriends = (uid, callback) => {
  const q = query(
    collection(db, 'friends'),
    where(`userMap.${uid}`, '==', true)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.warn("Friends subscription failed:", err);
    callback([]);
  });

};

// ── Check friendship status ────────────────────────────────────
export const getFriendshipStatus = async (uid1, uid2) => {
  const reqId = [uid1, uid2].sort().join('_');
  const [frSnap, reqSnap] = await Promise.all([
    getDoc(doc(db, 'friends', reqId)),
    getDoc(doc(db, 'friendRequests', reqId)),
  ]);
  if (frSnap.exists()) return 'friends';
  if (reqSnap.exists()) {
    return reqSnap.data().from === uid1 ? 'sent' : 'received';
  }
  return 'none';
};

// ── Search users by display name ───────────────────────────────
export const searchUsers = async (queryText, currentUid) => {
  if (!queryText || queryText.length < 2) return [];
  const snap = await getDocs(collection(db, 'users'));
  const lower = queryText.toLowerCase();
  return snap.docs
    .map(d => d.data())
    .filter(u => u.uid !== currentUid &&
      (u.displayName?.toLowerCase().includes(lower) ||
       u.email?.toLowerCase().includes(lower)));
};

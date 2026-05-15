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
  
  if (existing.exists()) {
    const data = existing.data();
    if (data.from === toUid) {
      // They already sent a request to us! Let's just accept it.
      return await acceptFriendRequest(toUid, fromUid);
    }
    throw new Error('Friend request already sent.');
  }

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

  // Notify recipient
  try {
    const { getUserData } = await import('./users');
    const sender = await getUserData(fromUid);
    const { sendNotification, NOTIFICATION_TYPES } = await import('./notifications');
    await sendNotification(toUid, {
      title: 'New Friend Request',
      body: `${sender?.displayName || 'Someone'} wants to be your friend.`,
      type: NOTIFICATION_TYPES.FRIEND_REQUEST,
      fromUid: fromUid
    });
  } catch (e) {}
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

  // Notify the other person (fromUid is the one who sent the request, toUid is the one accepting)
  try {
    const { getUserData } = await import('./users');
    const acceptor = await getUserData(toUid);
    const { sendNotification, NOTIFICATION_TYPES } = await import('./notifications');
    await sendNotification(fromUid, {
      title: 'Friend Request Accepted',
      body: `${acceptor?.displayName || 'Someone'} accepted your friend request!`,
      type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
      fromUid: toUid
    });
  } catch (e) {}
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
  }, (err) => {
    console.warn("Incoming requests subscription failed:", err);
    callback([]);
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
  }, (err) => {
    console.warn("Sent requests subscription failed:", err);
    callback([]);
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
  if (!queryText || queryText.length < 1) return [];
  const snap = await getDocs(collection(db, 'users'));
  const lower = queryText.toLowerCase();
  return snap.docs
    .map(d => d.data())
    .filter(u => u.uid !== currentUid &&
      (u.displayName?.toLowerCase().includes(lower) ||
       u.email?.toLowerCase().includes(lower)));
};
// ── Get all users (demo-friendly version) ─────────────────────
export const getAllUsers = async (currentUid) => {
  const q = query(collection(db, 'users'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => u.uid !== currentUid);
};

export const subscribeSearchUsers = (searchQuery, currentUid, callback) => {
  if (!searchQuery || searchQuery.length < 1) {
    callback([]);
    return () => {};
  }

  const lower = searchQuery.toLowerCase();
  const qName = query(
    collection(db, 'users'),
    where('displayName', '>=', searchQuery),
    where('displayName', '<=', searchQuery + '\uf8ff'),
    limit(20)
  );

  // Note: Firestore doesn't support OR queries across different fields easily with onSnapshot 
  // and prefix matching without complex indexes. For now, we'll combine results.
  
  return onSnapshot(qName, (snap) => {
    const users = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => u.uid !== currentUid);
    callback(users);
  }, (err) => {
    console.error("subscribeSearchUsers error:", err);
    callback([]);
  });
};

import { db } from './firebase';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';

export const getDMChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');

const getArray = (data, key) => (Array.isArray(data?.[key]) ? data[key] : []);

const getRequiredUser = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('User not found.');
  return { id: snap.id, ...snap.data() };
};

export const sendFriendRequest = async (fromUid, toUid) => {
  if (!fromUid || !toUid) throw new Error('Missing user.');
  if (fromUid === toUid) throw new Error('Cannot add yourself.');

  const [fromUser, toUser] = await Promise.all([
    getRequiredUser(fromUid),
    getRequiredUser(toUid)
  ]);

  if (getArray(fromUser, 'friends').includes(toUid) || getArray(toUser, 'friends').includes(fromUid)) {
    throw new Error('You are already friends.');
  }
  if (getArray(fromUser, 'requestsSent').includes(toUid) || getArray(toUser, 'requestsReceived').includes(fromUid)) {
    throw new Error('Friend request already sent.');
  }
  if (getArray(fromUser, 'requestsReceived').includes(toUid) || getArray(toUser, 'requestsSent').includes(fromUid)) {
    throw new Error('This user already sent you a request.');
  }

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', fromUid), {
    requestsSent: arrayUnion(toUid),
    updatedAt: serverTimestamp()
  });
  batch.update(doc(db, 'users', toUid), {
    requestsReceived: arrayUnion(fromUid),
    updatedAt: serverTimestamp()
  });
  await batch.commit();

  try {
    const { getUserData } = await import('./users');
    const sender = await getUserData(fromUid);
    const { sendNotification, NOTIFICATION_TYPES } = await import('./notifications');
    await sendNotification(toUid, {
      title: 'New Friend Request',
      body: `${sender?.displayName || sender?.username || 'Someone'} wants to be your friend.`,
      type: NOTIFICATION_TYPES.FRIEND_REQUEST,
      fromUid
    });
  } catch {
    /* Notification is best-effort. */
  }
};

export const cancelFriendRequest = async (fromUid, toUid) => {
  if (!fromUid || !toUid) throw new Error('Missing user.');
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', fromUid), {
    requestsSent: arrayRemove(toUid),
    updatedAt: serverTimestamp()
  });
  batch.update(doc(db, 'users', toUid), {
    requestsReceived: arrayRemove(fromUid),
    updatedAt: serverTimestamp()
  });
  await batch.commit();
};

export const acceptFriendRequest = async (fromUid, toUid) => {
  if (!fromUid || !toUid) throw new Error('Missing user.');
  if (fromUid === toUid) throw new Error('Cannot add yourself.');

  const [fromUser, toUser] = await Promise.all([
    getRequiredUser(fromUid),
    getRequiredUser(toUid)
  ]);

  const alreadyFriends = getArray(toUser, 'friends').includes(fromUid) && getArray(fromUser, 'friends').includes(toUid);
  const hasIncomingRequest = getArray(toUser, 'requestsReceived').includes(fromUid)
    && getArray(fromUser, 'requestsSent').includes(toUid);

  if (!alreadyFriends && !hasIncomingRequest) {
    throw new Error('Friend request is no longer available.');
  }

  const chatId = getDMChatId(fromUid, toUid);
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', toUid), {
    friends: arrayUnion(fromUid),
    requestsReceived: arrayRemove(fromUid),
    requestsSent: arrayRemove(fromUid),
    updatedAt: serverTimestamp()
  });
  batch.update(doc(db, 'users', fromUid), {
    friends: arrayUnion(toUid),
    requestsSent: arrayRemove(toUid),
    requestsReceived: arrayRemove(toUid),
    updatedAt: serverTimestamp()
  });
  batch.set(doc(db, 'chats', chatId), {
    type: 'dm',
    participants: [fromUid, toUid].sort(),
    members: [fromUid, toUid],
    memberMap: {
      [fromUid]: true,
      [toUid]: true
    },
    lastMessage: '',
    lastMessageAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  await batch.commit();

  try {
    const { getUserData } = await import('./users');
    const acceptor = await getUserData(toUid);
    const { sendNotification, NOTIFICATION_TYPES } = await import('./notifications');
    await sendNotification(fromUid, {
      title: 'Friend Request Accepted',
      body: `${acceptor?.displayName || acceptor?.username || 'Someone'} accepted your friend request!`,
      type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
      fromUid: toUid,
      chatId
    });
  } catch {
    /* Notification is best-effort. */
  }

  return chatId;
};

export const declineFriendRequest = async (fromUid, toUid) => {
  if (!fromUid || !toUid) throw new Error('Missing user.');
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', toUid), {
    requestsReceived: arrayRemove(fromUid),
    updatedAt: serverTimestamp()
  });
  batch.update(doc(db, 'users', fromUid), {
    requestsSent: arrayRemove(toUid),
    updatedAt: serverTimestamp()
  });
  await batch.commit();
};

export const removeFriend = async (uid1, uid2) => {
  if (!uid1 || !uid2) throw new Error('Missing user.');
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid1), {
    friends: arrayRemove(uid2),
    updatedAt: serverTimestamp()
  });
  batch.update(doc(db, 'users', uid2), {
    friends: arrayRemove(uid1),
    updatedAt: serverTimestamp()
  });
  await batch.commit();
};

export const subscribeIncomingRequests = (uid, callback) => {
  return onSnapshot(doc(db, 'users', uid), snap => {
    const requests = getArray(snap.data(), 'requestsReceived')
      .filter(Boolean)
      .map(from => ({ id: getDMChatId(from, uid), from, to: uid, status: 'pending' }));
    callback(requests);
  }, err => {
    console.warn('Incoming requests subscription failed:', err);
    callback([]);
  });
};

export const subscribeSentRequests = (uid, callback) => {
  return onSnapshot(doc(db, 'users', uid), snap => {
    const requests = getArray(snap.data(), 'requestsSent')
      .filter(Boolean)
      .map(to => ({ id: getDMChatId(uid, to), from: uid, to, status: 'pending' }));
    callback(requests);
  }, err => {
    console.warn('Sent requests subscription failed:', err);
    callback([]);
  });
};

export const subscribeFriends = (uid, callback) => {
  return onSnapshot(doc(db, 'users', uid), snap => {
    const friends = getArray(snap.data(), 'friends')
      .filter(Boolean)
      .map(otherUid => ({
        id: getDMChatId(uid, otherUid),
        users: [uid, otherUid],
        userMap: { [uid]: true, [otherUid]: true },
        createdAt: null
      }));
    callback(friends);
  }, err => {
    console.warn('Friends subscription failed:', err);
    callback([]);
  });
};

export const getFriendshipStatus = async (uid1, uid2) => {
  if (!uid1 || !uid2) return 'none';
  const user = await getRequiredUser(uid1);
  if (getArray(user, 'friends').includes(uid2)) return 'friends';
  if (getArray(user, 'requestsSent').includes(uid2)) return 'sent';
  if (getArray(user, 'requestsReceived').includes(uid2)) return 'received';
  return 'none';
};

const uniqueUsersFromSnapshot = (snap, currentUid) => {
  const usersById = new Map();
  snap.docs.forEach(userDoc => {
    if (userDoc.id !== currentUid) {
      usersById.set(userDoc.id, { uid: userDoc.id, id: userDoc.id, ...userDoc.data() });
    }
  });
  return Array.from(usersById.values());
};

export const searchUsers = async (queryText, currentUid) => {
  const lower = queryText?.trim().toLowerCase();
  if (!lower) return [];

  const searchQuery = query(
    collection(db, 'users'),
    orderBy('username'),
    where('username', '>=', lower),
    where('username', '<=', `${lower}\uf8ff`),
    limit(20)
  );
  const snap = await getDocs(searchQuery);
  return uniqueUsersFromSnapshot(snap, currentUid);
};

export const getAllUsers = async (currentUid) => {
  const snap = await getDocs(query(collection(db, 'users')));
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => u.uid !== currentUid);
};

export const subscribeSearchUsers = (searchQuery, currentUid, callback) => {
  const lower = searchQuery?.trim().toLowerCase();
  if (!lower) {
    callback([]);
    return () => {};
  }

  const searchRef = query(
    collection(db, 'users'),
    orderBy('username'),
    where('username', '>=', lower),
    where('username', '<=', `${lower}\uf8ff`),
    limit(20)
  );

  return onSnapshot(searchRef, snap => {
    callback(uniqueUsersFromSnapshot(snap, currentUid));
  }, err => {
    console.error('Search subscribe failed:', err);
    callback([]);
  });
};

export const subscribeAllUsers = (currentUid, callback) => {
  return onSnapshot(query(collection(db, 'users')), snap => {
    const list = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => u.uid !== currentUid);
    callback(list);
  }, err => {
    console.warn('Subscribe all users failed:', err);
    callback([]);
  });
};

import { db } from './firebase';
import { 
  collection, addDoc, query, where, orderBy, 
  onSnapshot, serverTimestamp, updateDoc, doc, limit 
} from 'firebase/firestore';

/**
 * Send a notification to a specific user
 */
export const sendNotification = async (toUid, notification) => {
  try {
    const notifRef = collection(db, 'notifications');
    await addDoc(notifRef, {
      ...notification,
      toUid,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to send notification:', e.message);
  }
};

/**
 * Subscribe to a user's notifications in real-time
 */
export const subscribeNotifications = (uid, callback, limitCount = 50) => {
  const q = query(
    collection(db, 'notifications'),
    where('toUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(notifications);
  }, (err) => {
    console.error('Notifications subscription failed:', err);
    callback([]);
  });
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (e) {
    console.error('Failed to mark as read:', e.message);
  }
};

export const NOTIFICATION_TYPES = {
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  FRIEND_ACCEPTED: 'FRIEND_ACCEPTED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  ROOM_INVITE: 'ROOM_INVITE',
  ACHIEVEMENT: 'ACHIEVEMENT',
  SYSTEM: 'SYSTEM',
};

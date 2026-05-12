import { db } from './firebase';
import { 
  collection, addDoc, query, orderBy, limit, 
  onSnapshot, serverTimestamp 
} from 'firebase/firestore';

/**
 * Log an activity to the global feed
 */
export const logActivity = async (activity) => {
  try {
    const activityRef = collection(db, 'activityFeed');
    await addDoc(activityRef, {
      ...activity,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error('Failed to log activity:', e.message);
  }
};

/**
 * Subscribe to the latest activities
 */
export const subscribeActivityFeed = (callback, limitCount = 20) => {
  const q = query(
    collection(db, 'activityFeed'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(activities);
  });
};

export const ACTIVITY_TYPES = {
  JOIN_ROOM: 'JOIN_ROOM',
  CREATE_ROOM: 'CREATE_ROOM',
  RANK_UP: 'RANK_UP',
  COMPLETE_TASK: 'COMPLETE_TASK',
  COMPLETE_WORKOUT: 'COMPLETE_WORKOUT',
  START_FOCUS: 'START_FOCUS',
  FINISH_FOCUS: 'FINISH_FOCUS',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
};

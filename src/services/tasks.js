import { db } from './firebase';
import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore';

export const TASK_TYPES = {
  study:       { label: 'Study',       color: '#60a5fa', icon: '📚' },
  fitness:     { label: 'Fitness',     color: '#10b981', icon: '💪' },
  productivity:{ label: 'Productivity',color: '#f59e0b', icon: '⚡' },
  social:      { label: 'Social',      color: '#e879f9', icon: '👥' },
  daily:       { label: 'Daily Goal',  color: '#00dfd8', icon: '🎯' },
  focus:       { label: 'Focus',       color: '#a78bfa', icon: '🧠' },
};

export const createTask = async (uid, taskData) => {
  const ref = doc(collection(db, `users/${uid}/tasks`));
  await setDoc(ref, {
    ...taskData,
    uid,
    completed: false,
    progress: 0,
    xpReward: taskData.xpReward || 50,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const completeTask = async (uid, taskId) => {
  const taskRef = doc(db, `users/${uid}/tasks`, taskId);
  const snap = await getDoc(taskRef);
  if (!snap.exists()) return;
  const taskData = snap.data();

  await updateDoc(taskRef, {
    completed: true,
    progress: 100,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Award XP for completing a task
  import('./xp').then(({ addXP }) => addXP(uid, 'completeTask', taskData.xpReward)).catch(() => {});
};


export const updateTaskProgress = async (uid, taskId, progress) => {
  await updateDoc(doc(db, `users/${uid}/tasks`, taskId), {
    progress: Math.min(100, progress),
    updatedAt: serverTimestamp(),
  });
};

export const deleteTask = async (uid, taskId) => {
  await deleteDoc(doc(db, `users/${uid}/tasks`, taskId));
};

export const subscribeTasks = (uid, callback) => {
  const q = query(
    collection(db, `users/${uid}/tasks`),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.warn("Tasks subscription failed:", err);
    callback([]);
  });

};

export const SUGGESTED_TASKS = [
  { title: '20-min Focus Session',  type: 'focus',       xpReward: 25, icon: '🧠' },
  { title: 'Walk 5,000 Steps',       type: 'fitness',     xpReward: 50, icon: '👟' },
  { title: 'Drink 8 Glasses Water',  type: 'daily',       xpReward: 15, icon: '💧' },
  { title: 'Complete a Workout',      type: 'fitness',     xpReward: 100,icon: '💪' },
  { title: 'Read for 30 Minutes',     type: 'study',       xpReward: 40, icon: '📖' },
  { title: 'Message a Friend',        type: 'social',      xpReward: 10, icon: '💬' },
  { title: 'Plan Your Day',           type: 'productivity',xpReward: 20, icon: '📋' },
  { title: 'Join a Study Room',       type: 'study',       xpReward: 30, icon: '🏫' },
];

import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastProvider';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const useAIEngine = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const lastProactiveTime = useRef(Date.now());

  useEffect(() => {
    if (!currentUser) return;

    // Proactive AI Check-ins
    const interval = setInterval(() => {
      const now = Date.now();
      // Only check every 15 minutes and when the user is active
      if (now - lastProactiveTime.current > 15 * 60 * 1000 && currentUser.presence === 'online') {
        handleProactiveCheckIn();
        lastProactiveTime.current = now;
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [currentUser?.uid]);

  const handleProactiveCheckIn = async () => {
    // Randomized proactive messages
    const proactivePool = [
      "You're close to your daily focus goal! 🎯",
      "Time for a quick water break? 💧",
      "Great job staying active today! 🔥",
      "Need a focus pod recommendation for your next session?",
      "Remember to stretch if you've been sitting for a while. 🧘"
    ];

    const message = proactivePool[Math.floor(Math.random() * proactivePool.length)];
    
    // Show as a specialized notification/toast
    showToast(message, { 
      icon: '✨', 
      duration: 5000,
      onClick: () => {} // Could navigate to AI screen
    });

    // Optionally save this as a notification in Firestore
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'notifications'), {
        type: 'ai_proactive',
        text: message,
        senderId: 'nexify_ai',
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (e) {
      console.error("AI Proactive Save Error:", e);
    }
  };
};

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './useAuth';
import { subscribeFitnessData, updateFitnessData } from '../services/fitness';

const FitnessContext = createContext();

export const FitnessProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    steps: 0, stepGoal: 10000, calories: 0, calorieGoal: 500,
    hydration: 0, hydrationGoal: 8, sleep: 0, sleepGoal: 8,
    workoutsCompleted: 0, streak: 0, xp: 0, minutesTrained: 0
  });

  const lastSyncSteps = useRef(0);
  const currentSteps = useRef(0);
  const syncTimeout = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    
    // Subscribe to Firestore data
    const unsub = subscribeFitnessData(currentUser.uid, (data) => {
      setStats(prev => {
        // Only update if the incoming data has more steps or is different
        // Avoid overwriting fast local step updates with old remote data
        const newStats = { ...prev, ...data };
        if (data.steps !== undefined && data.steps > currentSteps.current) {
           currentSteps.current = data.steps;
           lastSyncSteps.current = data.steps;
        } else {
           newStats.steps = currentSteps.current; // Keep local steps if they are higher
        }
        return newStats;
      });
    });

    const handleStep = () => {
      currentSteps.current += 1;
      setStats(prev => ({ ...prev, steps: currentSteps.current }));
      
      // Debounce the sync to Firestore every 20 steps or 5 seconds
      if (currentSteps.current - lastSyncSteps.current >= 20) {
        syncSteps();
      } else {
        clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(syncSteps, 5000);
      }
    };

    const syncSteps = () => {
      if (currentSteps.current > lastSyncSteps.current) {
         updateFitnessData(currentUser.uid, { steps: currentSteps.current }).catch(() => {});
         lastSyncSteps.current = currentSteps.current;
      }
    };

    let devicemotionListener = null;

    // Use device motion API if available (mobile)
    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      let lastZ = null;
      let threshold = 2.0; // Acceleration threshold
      
      devicemotionListener = (e) => {
        if (e.acceleration && e.acceleration.z !== null) {
          let z = e.acceleration.z;
          if (lastZ !== null && Math.abs(z - lastZ) > threshold) {
             handleStep();
          }
          lastZ = z;
        }
      };
      window.addEventListener('devicemotion', devicemotionListener);
    }

    return () => {
      unsub();
      clearTimeout(syncTimeout.current);
      if (devicemotionListener) window.removeEventListener('devicemotion', devicemotionListener);
      syncSteps();
    };
  }, [currentUser]);

  return (
    <FitnessContext.Provider value={{ stats, setStats }}>
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => useContext(FitnessContext);

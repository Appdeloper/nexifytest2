import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ensureUserProfile } from '../services/auth';
import { ensureAIUser } from '../services/users';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Full Firestore profile (role, rank, xp, etc.)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub = null;

    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }
      
      if (user) {
        // Ensure profile exists before subscribing or updating status
        try {
          await ensureUserProfile(user);
          await ensureAIUser().catch(() => {});
        } catch (e) {
          console.error("Auth Setup Error:", e);
        }

        // Subscribe to full Firestore profile for live role/rank/xp updates
        profileUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
            // Merge Firestore fields onto currentUser object for easy access
            setCurrentUser({ ...user, ...data });
          } else {
            setCurrentUser(user);
            setUserProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Firestore Profile Sync Error:", err);
          setCurrentUser(user);
          setLoading(false);
        });

        // Mark online
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            online: true,
            lastSeen: serverTimestamp()
          });
        } catch (_) {}
      } else {
        if (profileUnsub) { profileUnsub(); profileUnsub = null; }
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    }, (err) => {
      console.error("Auth State Error:", err);
      setLoading(false);
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // Visibility / idle presence
  useEffect(() => {
    if (!currentUser?.uid) return;
    const uid = currentUser.uid;
    const userPresence = userProfile?.presence || 'online';
    
    let idleTimer;

    const updatePresence = async (p) => {
      // Don't auto-override DND
      if (userPresence === 'dnd' && p !== 'online') return;
      try {
        await updateDoc(doc(db, 'users', uid), {
          presence: p,
          lastSeen: serverTimestamp()
        });
      } catch (_) {}
    };

    const resetIdle = () => {
      if (document.visibilityState === 'visible' && userPresence === 'away') {
        updatePresence('online');
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (userPresence === 'online') updatePresence('away');
      }, 5 * 60 * 1000); // 5 mins idle
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        resetIdle();
      } else {
        updatePresence('away');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('mousemove', resetIdle);
    document.addEventListener('keydown', resetIdle);
    
    resetIdle();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('mousemove', resetIdle);
      document.removeEventListener('keydown', resetIdle);
      clearTimeout(idleTimer);
    };
  }, [currentUser?.uid, userProfile?.presence]);

  if (loading) {
    return (
      <div style={{ 
        height: '100dvh', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#000',
        gap: '20px'
      }}>
        <img 
          src={`${import.meta.env.BASE_URL}logo.png`} 
          alt="Nexify" 
          style={{ 
            width: 80, 
            height: 80, 
            objectFit: 'contain',
            animation: 'logoPulse 1.5s ease-in-out infinite alternate'
          }} 
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: '#00dfd8', 
                animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` 
              }} 
            />
          ))}
        </div>
        <style>{`
          @keyframes logoPulse {
            from { filter: drop-shadow(0 0 15px rgba(0,223,216,0.4)); transform: scale(1); }
            to   { filter: drop-shadow(0 0 25px rgba(0,223,216,0.7)); transform: scale(1.05); }
          }
          @keyframes dotBounce {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50% { transform: translateY(-10px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscribeNotifications, markAsRead } from '../services/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';
import { NotificationContext } from '../hooks/NotificationContext';

export const NotificationProvider = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [activeNotification, setActiveNotification] = useState(null);

  useEffect(() => {
    // Don't subscribe until auth has fully resolved — prevents the
    // "Missing or insufficient permissions" Firebase error that fires
    // when queries run before the user token is available.
    if (loading || !currentUser) {
      setNotifications([]);
      return;
    }

    const unsub = subscribeNotifications(currentUser.uid, (list) => {
      setNotifications(list);
      
      // If there's a new unread notification, show it as a toast
      const latest = list[0];
      if (latest && !latest.read && (!activeNotification || latest.id !== activeNotification.id)) {
        // Only show if it's within the last 10 seconds (avoid showing old unread ones on load)
        const now = Date.now();
        const created = latest.createdAt?.toMillis() || now;
        if (now - created < 10000) {
           setActiveNotification(latest);
           // Auto-hide after 5 seconds
           setTimeout(() => setActiveNotification(null), 5000);
        }
      }
    });

    return () => unsub();
  }, [currentUser?.uid, loading]);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    if (activeNotification?.id === id) setActiveNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ notifications, handleMarkAsRead }}>
      {children}
      
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            style={{
              position: 'fixed', top: 20, left: 20, right: 20, zIndex: 10000,
              maxWidth: 400, margin: '0 auto',
              background: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 223, 216, 0.3)',
              borderRadius: 20, padding: 16,
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0, 223, 216, 0.1)'
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(0, 223, 216, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bell size={20} color="#00dfd8" />
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>{activeNotification.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeNotification.body}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
               <button 
                onClick={() => handleMarkAsRead(activeNotification.id)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => setActiveNotification(null)}
                style={{ background: 'none', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

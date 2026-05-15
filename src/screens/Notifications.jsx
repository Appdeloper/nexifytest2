import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, MessageSquare, UserPlus, Heart, 
  Zap, Trophy, CheckCircle2, MoreHorizontal, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

import { useNotifications } from '../components/NotificationProvider';

const Notifications = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { notifications, handleMarkAsRead } = useNotifications();

  const markAllRead = async () => {
    notifications.forEach(n => {
      if (!n.read) handleMarkAsRead(n.id);
    });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST': return <UserPlus size={18} color="#00e5ff" />;
      case 'FRIEND_ACCEPTED': return <Heart size={18} color="#ff4081" />;
      case 'NEW_MESSAGE': return <MessageSquare size={18} color="#00dfd8" />;
      case 'ACHIEVEMENT': return <Trophy size={18} color="#ffd700" />;
      case 'ROOM_INVITE': return <Zap size={18} color="#8b5cf6" />;
      default: return <Bell size={18} color="var(--primary)" />;
    }
  };

  const formatNotifTime = (createdAt) => {
    if (!createdAt) return 'Recently';
    const ms = createdAt.toMillis ? createdAt.toMillis() : Date.now();
    const diff = Date.now() - ms;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ms).toLocaleDateString();
  };

  return (
    <div style={{ height: '100dvh', background: '#000', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', zIndex: 10
      }}>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)} 
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <h1 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>Alert Center</h1>
        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>MARK ALL READ</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 100px' }}>
        <AnimatePresence>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} color="var(--text-muted)" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>All caught up!</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No new alerts at the moment.</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !n.read && handleMarkAsRead(n.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                  background: !n.read ? 'rgba(0,223,216,0.05)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 20, marginBottom: 12, border: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative', cursor: 'pointer'
                }}
              >
                <div style={{ 
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: !n.read ? 'white' : 'rgba(255,255,255,0.6)' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontWeight: 800 }}>{formatNotifTime(n.createdAt)}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notifications;

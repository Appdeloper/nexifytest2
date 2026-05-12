import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, MessageSquare, UserPlus, Heart, 
  Zap, Trophy, CheckCircle2, MoreHorizontal, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const Notifications = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'friend_request', user: 'Alex Rivera', time: '2m ago', unread: true },
    { id: 2, type: 'reaction', user: 'Sarah Chen', detail: '❤️ on your message', time: '15m ago', unread: true },
    { id: 3, type: 'rank_up', detail: 'Reached Silver II', time: '1h ago', unread: false },
    { id: 4, type: 'room_invite', user: 'Dev Team', detail: 'invited you to "Vibe Check"', time: '3h ago', unread: false },
    { id: 5, type: 'system', detail: 'Nexify AI: Your daily summary is ready.', time: '5h ago', unread: false },
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const deleteNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'friend_request': return <UserPlus size={18} color="#00e5ff" />;
      case 'reaction': return <Heart size={18} color="#ff4081" />;
      case 'rank_up': return <Trophy size={18} color="#ffd700" />;
      case 'room_invite': return <Zap size={18} color="#8b5cf6" />;
      default: return <Bell size={18} color="var(--primary)" />;
    }
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
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                  background: n.unread ? 'rgba(0,223,216,0.05)' : 'rgba(255,255,255,0.02)',
                  borderRadius: 20, marginBottom: 12, border: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative'
                }}
              >
                <div style={{ 
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {n.user && <span style={{ color: 'var(--primary)' }}>{n.user} </span>}
                    {n.type === 'friend_request' ? 'sent you a friend request' : n.detail}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</div>
                </div>
                {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />}
                <button onClick={() => deleteNotif(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <MoreHorizontal size={16} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notifications;

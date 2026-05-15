import React, { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subscribeUserChats } from '../services/chat';
import { getUserData } from '../services/users';
import GlassCard from '../components/GlassCard';
import { RoleBadge, RankBadge } from '../components/Badges';


const TABS = ['All', 'DMs', 'Groups', 'Unread'];

import Avatar from '../components/Avatar';

const Chats = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [chatUsersMap, setChatUsersMap] = useState({});

  const fetchedIds = React.useRef(new Set());

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeUserChats(currentUser.uid, async (fetchedChats) => {
      setChats(fetchedChats);
      const map = {};
      for (const chat of fetchedChats) {
        const otherUserId = chat.members.find(id => id !== currentUser.uid);
        if (otherUserId && !fetchedIds.current.has(otherUserId)) {
          fetchedIds.current.add(otherUserId);
          const userData = await getUserData(otherUserId);
          if (userData) map[otherUserId] = userData;
        }
      }
      if (Object.keys(map).length > 0) {
        setChatUsersMap(prev => ({ ...prev, ...map }));
      }
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const filteredChats = chats.filter(chat => {
    if (activeTab === 'DMs' && chat.type !== 'dm') return false;
    if (activeTab === 'Groups' && chat.type !== 'group') return false;
    if (activeTab === 'Unread' && (!chat.unreadCount?.[currentUser.uid])) return false;
    if (search) {
      const otherUserId = chat.members.find(id => id !== currentUser.uid);
      const otherUser = chatUsersMap[otherUserId];
      if (otherUser && !otherUser.displayName?.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const pinnedChats = filteredChats.filter(c => c.isPinned?.[currentUser.uid]);
  const normalChats = filteredChats.filter(c => !c.isPinned?.[currentUser.uid]);

  const renderChatCard = (chat) => {
    const otherUserId = chat.members.find(id => id !== currentUser.uid);
    const otherUser = chatUsersMap[otherUserId] || { uid: otherUserId };
    const unreadCount = chat.unreadCount?.[currentUser.uid] || 0;
    const isOnline = otherUser.online;
    
    let timeStr = '';
    if (chat.lastMessageAt) {
      const date = chat.lastMessageAt.toDate();
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        timeStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={chat.id}
        onClick={() => navigate(`/chat-conversation/${chat.id}`)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 14px', borderRadius: 20, cursor: 'pointer',
          background: unreadCount > 0 ? 'rgba(0,223,216,0.04)' : 'rgba(255,255,255,0.03)',
          border: unreadCount > 0 ? '1px solid rgba(0,223,216,0.15)' : '1px solid rgba(255,255,255,0.05)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden'
        }}
        whileTap={{ scale: 0.98 }}
        className="ripple"
      >
        <div style={{ position: 'relative' }}>
          <Avatar user={otherUser} size={50} />
          {isOnline && (
            <div style={{
              position: 'absolute', bottom: 2, right: 2, width: 12, height: 12,
              background: '#00dfd8', borderRadius: '50%', border: '2px solid #000',
              boxShadow: '0 0 10px rgba(0,223,216,0.5)'
            }} />
          )}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 13.5, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {otherUser.displayName || 'Loading...'}
              </span>
              {otherUser.role && otherUser.role !== 'member' && <RoleBadge role={otherUser.role} size="xs" hideLabel />}
              {chat.isPinned?.[currentUser.uid] && <div style={{ fontSize: 10, opacity: 0.5 }}>📌</div>}
            </div>
            <span style={{ fontSize: 10, color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700 }}>{timeStr}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12, color: unreadCount > 0 ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unreadCount > 0 ? 600 : 400 }}>
              {chat.lastMessage || 'Start a conversation'}
            </span>
            {unreadCount > 0 && (
              <div style={{
                background: 'var(--primary-gradient)', color: 'black',
                fontSize: 10, fontWeight: 900, borderRadius: 10,
                padding: '2px 6px', minWidth: 18, textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,223,216,0.3)'
              }}>
                {unreadCount}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fade-in col" style={{ height: '100%', position: 'relative', background: '#000' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(30px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} alt="Logo" />
          </div>
          <h1 style={{ fontSize: 19, fontWeight: 900, letterSpacing: -0.5 }}>Conversations</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/friends')}
            style={{ background: 'var(--primary-gradient)', border: 'none', borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'black', boxShadow: '0 4px 15px rgba(0,223,216,0.3)' }}
          >
            <Plus size={20} />
          </motion.button>
        </div>
      </div>

      {/* Search + Tabs */}
      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '10px 16px', marginBottom: 16, transition: 'all 0.3s' }}>
          <Search size={16} color="var(--primary)" style={{ opacity: 0.8 }} />
          <input
            type="text"
            placeholder="Search messages or people..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: 14, fontWeight: 500 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map(tab => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', borderRadius: 24,
                background: activeTab === tab ? 'linear-gradient(135deg, #00dfd8, #0070f3)' : 'rgba(255,255,255,0.05)',
                border: activeTab === tab ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === tab ? 'black' : 'white',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s',
                fontWeight: 900, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                flexShrink: 0,
                boxShadow: activeTab === tab ? '0 4px 15px rgba(0,223,216,0.3)' : 'none'
              }}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 col" style={{ overflowY: 'auto', padding: '4px 16px 16px' }}>
        {chats.length === 0 ? (
          <EmptyState 
            icon={MessageSquare}
            title="Silence..."
            description="Your inbox is empty. Time to spark a conversation!"
            actionText="Find People"
            onAction={() => navigate('/friends')}
          />
        ) : (
          <div className="col gap-2">
            {pinnedChats.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary)', letterSpacing: 1.5, marginTop: 12, marginBottom: 8, opacity: 0.8 }}>PINNED</div>
                {pinnedChats.map(chat => renderChatCard(chat))}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />
              </>
            )}
            
            {pinnedChats.length > 0 && normalChats.length > 0 && (
              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 8 }}>RECENT</div>
            )}

            {normalChats.map(chat => renderChatCard(chat))}

            {filteredChats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.5 }}>
                <Search size={32} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13 }}>No conversations found for "{search}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;

import React, { useEffect, useState, useRef } from 'react';
import EmptyState from '../components/EmptyState';
import { MessageSquare, Plus, Search, X, Users, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subscribeUserChats, subscribeUserGroups, createGroup } from '../services/chat';
import { getUserData } from '../services/users';
import { subscribeFriends } from '../services/friends';
import { RoleBadge } from '../components/Badges';
import Avatar from '../components/Avatar';
import { useToast } from '../components/ToastProvider';

const TABS = ['All', 'DMs', 'Groups', 'Unread'];

const getChatMembers = (chat) => chat.members || chat.participants || [];

const Chats = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUid = currentUser?.uid;
  const { showToast } = useToast();

  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [chatUsersMap, setChatUsersMap] = useState({});

  // Group creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [friendsList, setFriendsList] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const fetchedIds = useRef(new Set());

  // Subscribe to DMs & Groups
  useEffect(() => {
    if (!currentUid) return;

    const unsubChats = subscribeUserChats(currentUid, async (fetchedChats) => {
      setChats(fetchedChats.map(c => ({ ...c, type: 'dm' })));
      const map = {};
      for (const chat of fetchedChats) {
        const otherUserId = getChatMembers(chat).find(id => id !== currentUid);
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

    const unsubGroups = subscribeUserGroups(currentUid, (fetchedGroups) => {
      setGroups(fetchedGroups.map(g => ({ ...g, type: 'group' })));
    });

    return () => {
      unsubChats();
      unsubGroups();
    };
  }, [currentUid]);

  // Subscribe to friends when group creation modal is open
  useEffect(() => {
    if (!currentUid || !showCreateModal) return;
    const unsubFriends = subscribeFriends(currentUid, async (frList) => {
      const friendIds = frList.map(f => f.users.find(id => id !== currentUid));
      const profiles = await Promise.all(friendIds.map(async id => {
         try { return await getUserData(id); } catch { return null; }
      }));
      setFriendsList(profiles.filter(p => p !== null));
    });
    return () => unsubFriends();
  }, [currentUid, showCreateModal]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showToast('Pod name cannot be empty');
      return;
    }
    setIsCreatingGroup(true);
    try {
      const groupId = await createGroup(newGroupName.trim(), selectedFriends, '', currentUid);
      showToast('Pod initialized successfully!');
      setShowCreateModal(false);
      setNewGroupName('');
      setSelectedFriends([]);
      navigate(`/group-chat/${groupId}`);
    } catch (e) {
      showToast(e.message);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleSelectFriend = (uid) => {
    setSelectedFriends(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  // Merge DMs & Groups, sort by timestamp descending
  const allConversations = [...chats, ...groups];
  const getMillis = (timestamp) => {
    if (!timestamp) return 0;
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
    if (timestamp.seconds) return timestamp.seconds * 1000;
    return new Date(timestamp).getTime() || 0;
  };
  allConversations.sort((a, b) => {
    const timeA = a.lastMessageAt || a.updatedAt || a.timestamp;
    const timeB = b.lastMessageAt || b.updatedAt || b.timestamp;
    return getMillis(timeB) - getMillis(timeA);
  });

  const filteredChats = allConversations.filter(chat => {
    if (activeTab === 'DMs' && chat.type !== 'dm') return false;
    if (activeTab === 'Groups' && chat.type !== 'group') return false;
    if (activeTab === 'Unread' && (!chat.unreadCount?.[currentUid])) return false;
    if (search) {
      if (chat.type === 'group') {
        return chat.name?.toLowerCase().includes(search.toLowerCase());
      } else {
        const otherUserId = getChatMembers(chat).find(id => id !== currentUid);
        const otherUser = chatUsersMap[otherUserId];
        if (otherUser && !otherUser.displayName?.toLowerCase().includes(search.toLowerCase())) return false;
      }
    }
    return true;
  });

  const pinnedChats = filteredChats.filter(c => c.isPinned?.[currentUid]);
  const normalChats = filteredChats.filter(c => !c.isPinned?.[currentUid]);

  const renderChatCard = (chat) => {
    if (chat.type === 'group') {
      let timeStr = '';
      if (chat.lastMessageAt || chat.updatedAt) {
        const date = (chat.lastMessageAt || chat.updatedAt).toDate ? (chat.lastMessageAt || chat.updatedAt).toDate() : new Date(getMillis(chat.lastMessageAt || chat.updatedAt));
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
          onClick={() => navigate(`/group-chat/${chat.id}`)}
          whileHover={{ y: -2, borderColor: 'rgba(123, 97, 255, 0.25)', boxShadow: '0 8px 25px rgba(123, 97, 255, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 14px', borderRadius: 20, cursor: 'pointer',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)'
          }}
          className="ripple"
        >
          <div style={{ position: 'relative' }}>
            <img 
              src={chat.groupImage || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`} 
              style={{ width: 48, height: 48, borderRadius: 14, border: '2px solid var(--primary-purple)', objectFit: 'cover', boxShadow: '0 0 10px rgba(123, 97, 255, 0.2)' }} 
              alt="" 
            />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 13.5, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {chat.name}
                </span>
                <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(123, 97, 255, 0.15)', color: 'var(--primary-purple)', padding: '2px 6px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  POD
                </span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{timeStr}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {chat.lastMessage || 'Start a conversation'}
              </span>
            </div>
          </div>
        </motion.div>
      );
    }

    const otherUserId = getChatMembers(chat).find(id => id !== currentUid);
    const otherUser = chatUsersMap[otherUserId] || { uid: otherUserId };
    const unreadCount = chat.unreadCount?.[currentUid] || 0;
    const isOnline = otherUser.online;
    
    let timeStr = '';
    if (chat.lastMessageAt && typeof chat.lastMessageAt.toDate === 'function') {
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
        whileHover={{ 
          y: -2, 
          borderColor: unreadCount > 0 ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)',
          boxShadow: unreadCount > 0 ? '0 8px 25px rgba(0, 229, 255, 0.15)' : '0 8px 25px rgba(0, 0, 0, 0.3)'
        }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 14px', borderRadius: 20, cursor: 'pointer',
          background: unreadCount > 0 ? 'rgba(0, 229, 255, 0.04)' : 'var(--bg-card)',
          border: unreadCount > 0 ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid var(--border-glass)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)'
        }}
        className="ripple"
      >
        <div style={{ position: 'relative' }}>
          <Avatar user={otherUser} size={48} />
          {isOnline && (
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
              background: 'var(--primary-cyan)', borderRadius: '50%', border: '2px solid #0A0A0F',
              boxShadow: '0 0 10px rgba(0,229,255,0.6)'
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
              {chat.isPinned?.[currentUid] && <div style={{ fontSize: 10, opacity: 0.5 }}>📌</div>}
            </div>
            <span style={{ fontSize: 10, color: unreadCount > 0 ? 'var(--primary-cyan)' : 'var(--text-muted)', fontWeight: 700 }}>{timeStr}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12, color: unreadCount > 0 ? 'rgba(255,255,255,0.95)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unreadCount > 0 ? 600 : 400 }}>
              {chat.lastMessage || 'Start a conversation'}
            </span>
            {unreadCount > 0 && (
              <div style={{
                background: 'var(--primary-gradient)', color: 'black',
                fontSize: 10, fontWeight: 900, borderRadius: 10,
                padding: '2px 6px', minWidth: 18, textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,229,255,0.3)'
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
    <div className="fade-in col" style={{ height: '100%', position: 'relative', background: 'var(--bg-dark)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--border-glass)',
        background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.5))' }} alt="Logo" />
          </div>
          <h1 style={{ fontSize: 19, fontWeight: 900, letterSpacing: -0.5 }}>Conversations</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {activeTab === 'Groups' ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCreateModal(true)}
              className="neon-btn"
              style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', color: 'black', minWidth: 38 }}
            >
              <Plus size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/friends')}
              className="neon-btn"
              style={{ width: 38, height: 38, padding: 0, borderRadius: '50%', color: 'black', minWidth: 38 }}
            >
              <Plus size={20} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Search + Tabs */}
      <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 10, 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-glass)', 
          borderRadius: 14, 
          padding: '10px 16px', 
          marginBottom: 16, 
          transition: 'all 0.3s' 
        }}>
          <Search size={16} color="var(--primary-cyan)" style={{ opacity: 0.8 }} />
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
                padding: '8px 18px', borderRadius: 24,
                background: activeTab === tab ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.04)',
                border: activeTab === tab ? 'none' : '1px solid var(--border-glass)',
                color: activeTab === tab ? 'black' : 'rgba(255, 255, 255, 0.65)',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s',
                fontWeight: 900, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                flexShrink: 0,
                boxShadow: activeTab === tab ? '0 4px 15px rgba(0, 229, 255, 0.25)' : 'none'
              }}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 col" style={{ overflowY: 'auto', padding: '4px 16px 16px' }}>
        {allConversations.length === 0 ? (
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

      {/* ── Initialize Pod Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 380,
                background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-glass)',
                borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 18,
                backdropFilter: 'blur(30px)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>Initialize Chat Pod</h3>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1.5 }}>POD NAME</label>
                <input 
                  type="text" 
                  placeholder="e.g. ALPHA TEAM" 
                  value={newGroupName} 
                  onChange={e => setNewGroupName(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', borderRadius: 12, height: 44, color: 'white', padding: '0 14px', outline: 'none', fontSize: 14, fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1.5 }}>SELECT CITIZENS</label>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {friendsList.length === 0 ? (
                    <span style={{ fontSize: 12, opacity: 0.4 }}>No friends available.</span>
                  ) : (
                    friendsList.map(friend => {
                      const isSelected = selectedFriends.includes(friend.uid);
                      return (
                        <div 
                          key={friend.uid} 
                          onClick={() => toggleSelectFriend(friend.uid)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 12, background: isSelected ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                            border: isSelected ? '1px solid rgba(0, 229, 255, 0.25)' : '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`} style={{ width: 28, height: 28, borderRadius: 8 }} alt="" />
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{friend.displayName}</span>
                          </div>
                          <div style={{
                            width: 18, height: 18, borderRadius: 6,
                            background: isSelected ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
                          }}>
                            {isSelected && <Check size={12} color="black" strokeWidth={4} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateGroup}
                disabled={isCreatingGroup}
                className="neon-btn"
                style={{
                  height: 44,
                  fontWeight: 900,
                  color: 'black',
                  letterSpacing: 0.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                {isCreatingGroup ? 'INITIALIZING...' : 'INITIALIZE POD'}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chats;

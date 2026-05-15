import React, { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { Users, Plus, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subscribeMyRooms, subscribePublicRooms, joinRoom } from '../services/rooms';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { RoleBadge, RankBadge } from '../components/Badges';

const TABS = ['My Rooms', 'Public', 'Study', 'Gaming', 'Focus'];

const Rooms = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [myRooms, setMyRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('My Rooms');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let unsubMy, unsubPublic;
    unsubMy = subscribeMyRooms(currentUser.uid, rooms => { setMyRooms(rooms); setLoading(false); });
    unsubPublic = subscribePublicRooms(rooms => { setPublicRooms(rooms); setLoading(false); });
    return () => { if (unsubMy) unsubMy(); if (unsubPublic) unsubPublic(); };
  }, [currentUser?.uid]);

  const handleJoin = async (roomId) => {
    try { await joinRoom(roomId, currentUser.uid); navigate(`/room-chat/${roomId}`); }
    catch (e) { console.error(e); }
  };

  const getDisplayedRooms = () => {
    let src = myRooms;
    if (activeTab === 'Public') src = publicRooms;
    if (activeTab === 'Study') src = publicRooms.filter(r => r.type === 'Study');
    if (activeTab === 'Gaming') src = publicRooms.filter(r => r.type === 'Gaming');
    if (activeTab === 'Focus') src = publicRooms.filter(r => r.type === 'Focus');
    if (search) src = src.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()));
    return src;
  };

  const displayedRooms = getDisplayedRooms();

  const typeColors = { Study: '#00dfd8', Gaming: '#8b5cf6', Focus: '#10b981', Professional: '#3b82f6', Public: '#f59e0b' };

  return (
    <div className="fade-in col" style={{ height: '100%', background: 'var(--bg-main)' }}>
      {/* ── Immersive Rooms Header ── */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border-glass)',
          background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)',
          position: 'sticky', top: 0, zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#10b981', borderRadius: '50%', border: '2px solid black' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="header-title" style={{ fontSize: 20 }}>Nexify Rooms</h1>
            {currentUser && (
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <RoleBadge role={currentUser.role} size="xs" hideLabel />
                <RankBadge rankId={currentUser.rank} size="xs" />
              </div>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/create-room')}
          style={{ background: 'var(--grad-premium)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'black', boxShadow: '0 4px 15px rgba(0,223,216,0.4)' }}
        >
          <Plus size={24} strokeWidth={3} />
        </motion.button>
      </motion.div>

      {/* ── Futuristic Browser Controls ── */}
      <div style={{ padding: '20px 20px 0', background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '18px', padding: '12px 18px', marginBottom: 20 }}>
          <Search size={18} color="var(--text-dim)" />
          <input
            type="text" placeholder="Explore futuristic dimensions..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: 14, fontWeight: 600 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <motion.button
              key={tab} 
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab(tab); setLoading(true); setTimeout(() => setLoading(false), 300); }}
              style={{
                background: activeTab === tab ? 'linear-gradient(135deg, #00dfd8, #0070f3)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? 'black' : 'white',
                border: activeTab === tab ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                padding: '10px 22px', borderRadius: 24,
                whiteSpace: 'nowrap', cursor: 'pointer',
                fontWeight: 900, fontSize: 11, letterSpacing: 1,
                boxShadow: activeTab === tab ? '0 10px 20px rgba(0,223,216,0.3)' : 'none',
                flexShrink: 0, textTransform: 'uppercase'
              }}
            >{tab}</motion.button>
          ))}
        </div>
      </div>

      {/* ── Cinematic Rooms List ── */}
      <div className="flex-1 col" style={{ overflowY: 'auto', padding: '0 20px 40px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 24 }} />)}
          </div>
        )}

        {!loading && displayedRooms.length === 0 && (
          <EmptyState 
            icon={Users}
            title={activeTab === 'My Rooms' ? "No dimensions discovered" : "The void is empty"}
            description={activeTab === 'My Rooms' 
              ? "You haven't initialized any rooms. Create a new dimension to start your journey." 
              : "No public dimensions found in this frequency. Try another frequency."}
            actionText={activeTab === 'My Rooms' ? "INITIALIZE" : "RESCAN"}
            onAction={() => activeTab === 'My Rooms' ? navigate('/create-room') : setLoading(true)}
          />
        )}

        {!loading && displayedRooms.length > 0 && (
          <div className="col gap-4">
            {displayedRooms.map((room, i) => {
              const isMember = room.memberMap?.[currentUser?.uid];
              const typeColor = typeColors[room.type] || 'var(--primary)';
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="premium-card"
                  style={{ padding: '20px', border: `1px solid ${typeColor}33`, position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${typeColor}22, transparent 70%)` }} />
                  
                  <div className="row align-center flex-between mb-4">
                    <div className="row align-center gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        style={{ width: 56, height: 56, borderRadius: 16, background: `${typeColor}15`, border: `2px solid ${typeColor}44`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${typeColor}11` }}
                      >
                        {room.iconURL ? (
                          <img src={room.iconURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Users size={28} color={typeColor} />
                        )}
                      </motion.div>
                      <div className="col">
                        <span className="header-title" style={{ fontSize: 17 }}>{room.name}</span>
                        <div className="row gap-3 align-center" style={{ marginTop: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', background: `${typeColor}20`, color: typeColor, borderRadius: 12, letterSpacing: 1, textTransform: 'uppercase' }}>{room.type}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Users size={12} strokeWidth={3} /> {room.members?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isMember ? (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(`/room-chat/${room.id}`)}
                        className="glass-btn"
                        style={{ padding: '10px 20px', fontSize: 13, fontWeight: 800 }}
                      >
                        ENTER
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleJoin(room.id)}
                        className="neon-btn"
                        style={{ padding: '10px 20px', fontSize: 13, fontWeight: 900 }}
                      >
                        JOIN
                      </motion.button>
                    )}
                  </div>
                  
                  {room.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginTop: 10, fontWeight: 500 }} className="line-clamp-2">{room.description}</p>
                  )}
                  
                  {room.lastMessage && (
                    <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-glass)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={12} />
                      <span style={{ opacity: 0.7, color: 'white' }}>Latest:</span>
                      <span className="line-clamp-1" style={{ flex: 1 }}>{room.lastMessage}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;

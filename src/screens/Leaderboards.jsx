import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Zap, Target, Dumbbell, Clock, ChevronRight, Search, Crown, Medal, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subscribeLeaderboard } from '../services/admin';
import { RoleBadge, RankBadge } from '../components/Badges';
import EmptyState from '../components/EmptyState';
import GlassCard from '../components/GlassCard';

const TABS = [
  { id: 'global', label: 'Global XP', icon: Zap, sortKey: 'xp', unit: 'XP' },
  { id: 'fitness', label: 'Steps', icon: Dumbbell, sortKey: 'steps', unit: 'Steps' },
  { id: 'focus', label: 'Focus', icon: Target, sortKey: 'focusMinutes', unit: 'Mins' },
  { id: 'streak', label: 'Streaks', icon: Clock, sortKey: 'streak', unit: 'Days' },
];

const Leaderboards = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const tabData = TABS.find(t => t.id === activeTab);
    const sortKey = tabData ? tabData.sortKey : 'xp';
    const unsub = subscribeLeaderboard((data) => {
      // filter out users with 0 or missing values for this metric
      const validUsers = data.filter(u => (u[sortKey] || 0) > 0);
      // sort manually just in case firestore composite index is missing initially
      validUsers.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
      setUsers(validUsers);
      setLoading(false);
    }, sortKey);
    return () => unsub();
  }, [activeTab]);

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const { currentUser } = useAuth();
  const userRank = users.findIndex(u => u.uid === currentUser?.uid) + 1;

  const getRankIcon = (index) => {
    if (index === 0) return <Crown size={20} color="#ffd700" />;
    if (index === 1) return <Medal size={18} color="#c0c0c0" />;
    if (index === 2) return <Medal size={18} color="#cd7f32" />;
    return <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>#{index + 1}</span>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ height: '100%', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Immersive Leaderboard Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => navigate('/home')} 
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ position: 'relative' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} alt="Logo" />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, background: '#10b981', borderRadius: '50%', border: '1.5px solid black' }} />
          </div>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>The Arena</h1>
        <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Trophy size={12} color="#ffd700" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#ffd700' }}>#{userRank || '?'}</span>
        </div>
      </div>

        {/* Masterpiece Tabs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 16px 4px 16px' }}>
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', borderRadius: 24,
                background: activeTab === tab.id ? 'linear-gradient(135deg, #00dfd8, #0070f3)' : 'rgba(255,255,255,0.05)',
                border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === tab.id ? 'black' : 'white',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s',
                fontWeight: 900, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                flexShrink: 0
              }}
            >
              <tab.icon size={14} strokeWidth={3} />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>

      {/* List Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Search */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Search size={16} color="rgba(255,255,255,0.3)" />
          <input 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              background: 'transparent', border: 'none', color: 'white', 
              outline: 'none', fontSize: 14, flex: 1 
            }} 
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton" style={{ height: 70, borderRadius: 16 }} />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState 
            icon={Trophy}
            title="No rankings found"
            description={activeTab === 'global' ? "Be the first to climb the ranks!" : "Ranking data coming soon."}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 24 }}>
            {/* ── Legendary Podium ── */}
            {filteredUsers.length >= 3 && search === '' && (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, marginBottom: 40, paddingTop: 40 }}>
                {/* 2nd Place */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <img src={filteredUsers[1].photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${filteredUsers[1].uid}`} style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #c0c0c0', boxShadow: '0 0 20px rgba(192,192,192,0.2)' }} />
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}><Medal size={22} color="#c0c0c0" /></div>
                  </div>
                  <div style={{ background: 'rgba(192,192,192,0.1)', border: '1px solid rgba(192,192,192,0.2)', width: 85, height: 70, borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(192,192,192,0.1), transparent)' }} />
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#c0c0c0', zIndex: 1 }}>2</span>
                  </div>
                </motion.div>

                {/* 1st Place - The King */}
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <motion.div 
                      animate={{ 
                        boxShadow: [`0 0 20px rgba(255,215,0,0.3)`, `0 0 50px rgba(255,215,0,0.6)`, `0 0 20px rgba(255,215,0,0.3)`]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      style={{ borderRadius: '50%', padding: 4, background: 'linear-gradient(135deg, #ffd700, #fff)' }}
                    >
                      <img src={filteredUsers[0].photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${filteredUsers[0].uid}`} style={{ width: 90, height: 90, borderRadius: '50%', border: '4px solid #000' }} />
                    </motion.div>
                    <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)' }}><Crown size={32} color="#ffd700" fill="#ffd700" className="animate-float" /></div>
                  </div>
                  <div style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)', width: 110, height: 110, borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(255,215,0,0.2), transparent)' }} />
                    <span style={{ fontSize: 48, fontWeight: 900, color: '#ffd700', zIndex: 1 }}>1</span>
                  </div>
                </motion.div>

                {/* 3rd Place */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <img src={filteredUsers[2].photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${filteredUsers[2].uid}`} style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #cd7f32', boxShadow: '0 0 20px rgba(205,127,50,0.2)' }} />
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}><Medal size={22} color="#cd7f32" /></div>
                  </div>
                  <div style={{ background: 'rgba(205,127,50,0.1)', border: '1px solid rgba(205,127,50,0.2)', width: 85, height: 50, borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(205,127,50,0.1), transparent)' }} />
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#cd7f32', zIndex: 1 }}>3</span>
                  </div>
                </motion.div>
              </div>
            )}
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/profile/${user.uid}`)}
              >
                <div className="premium-card" style={{ 
                  display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                  background: index < 3 ? `linear-gradient(90deg, ${index===0?'rgba(255,215,0,0.1)':index===1?'rgba(192,192,192,0.1)':'rgba(205,127,50,0.1)'}, transparent)` : 'var(--bg-glass)',
                  border: index === 0 ? '1px solid rgba(255,215,0,0.3)' : '1px solid var(--border-glass)'
                }}>
                  <div style={{ width: 30, display: 'flex', justifyContent: 'center' }}>
                    {getRankIcon(index)}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <motion.img 
                      whileHover={{ scale: 1.1 }}
                      src={user.photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${user.uid}`}
                      style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover', border: '2px solid var(--border-glass)' }}
                      alt=""
                    />
                    {user.verified && (
                      <div style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--primary)', borderRadius: '50%', padding: 3, boxShadow: '0 4px 10px rgba(0,223,216,0.4)' }}>
                        <ShieldCheck size={10} color="black" />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="header-title" style={{ fontSize: 16 }}>{user.displayName}</span>
                      <RoleBadge role={user.role} size="xs" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 700 }}>@{user.username}</span>
                      <RankBadge xp={user.xp || 0} size="xs" />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)', textShadow: '0 0 10px rgba(0,223,216,0.3)' }}>
                      {Number(user[TABS.find(t => t.id === activeTab)?.sortKey || 'xp'] || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-dim)', letterSpacing: 1 }}>
                      {TABS.find(t => t.id === activeTab)?.unit || 'XP'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Leaderboards;

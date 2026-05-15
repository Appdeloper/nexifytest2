import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Edit3, LogOut, ChevronRight,
  Users, Clock, Dumbbell, MessageSquare, Palette, Lock, Bell,
  Bookmark, HelpCircle, Info, AlertTriangle, X, Trophy, Target, Zap,
  ArrowLeft, Camera, Share2, ShieldCheck, Music, Play, Pause, 
  Volume2, Disc, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUser } from '../services/auth';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { subscribeFriends } from '../services/friends';
import { RoleBadge, RankBadge } from '../components/Badges';
import { getRankForXP, getNextRank, getRankProgress } from '../services/xp';
import { uploadAvatar } from '../services/profile';
import { subscribeUserMusicStatus } from '../services/waves';
import { useFitness } from '../hooks/useFitness';
import { subscribeFocusData } from '../services/focus';

const ProfileRow = ({ icon: Icon, color, label, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className="ripple"
    style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer'
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 12, background: `${color}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      border: `1px solid ${color}25`
    }}>
      <Icon size={20} color={color} />
    </div>
    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>{label}</span>
    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
  </motion.div>
);

import PresenceIndicator from '../components/PresenceIndicator';
import StatusSelector from '../components/StatusSelector';
import { updateUserProfile } from '../services/profile';

const Profile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const [friendCount, setFriendCount] = useState(0);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeFriends(currentUser.uid, list => setFriendCount(list.length));
    const unsubMusic = subscribeUserMusicStatus(currentUser.uid, setMusicStatus);
    const unsubFocus = subscribeFocusData(currentUser.uid, setFocusStats);
    return () => { unsub(); unsubMusic(); unsubFocus(); };
  }, [currentUser?.uid]);

  const [musicStatus, setMusicStatus] = useState(null);
  const { stats: fitStats } = useFitness();
  const [focusStats, setFocusStats] = useState({ focusMinutes: 0 });

  const handleStatusUpdate = async (updates) => {
    try {
      await updateUserProfile(currentUser.uid, updates);
      showToast('Status updated!');
      setShowStatusModal(false);
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Uploading profile picture...');
      await uploadAvatar(currentUser.uid, file);
      showToast('Profile picture updated! 📸');
    } catch (err) {
      showToast(err.message || 'Upload failed');
    }
  };

  const rank = getRankForXP(currentUser?.xp || 0);
  const nextRank = getNextRank(currentUser?.xp || 0);
  const progress = getRankProgress(currentUser?.xp || 0);

  const stats = [
    { label: 'Friends', value: friendCount, color: '#00e5ff', icon: Users },
    { label: 'Level', value: rank.priority + 1, color: '#d000ff', icon: Zap },
    { label: 'Focus', value: `${focusStats.focusMinutes}m`, color: '#7928ca', icon: Clock },
    { label: 'Workouts', value: fitStats.workoutsCompleted, color: '#10b981', icon: Dumbbell },
  ];

  const THEMES = [
    { id: 'default', primary: '#00dfd8', gradient: 'linear-gradient(135deg, #050a1a, #000)' },
    { id: 'purple-haze', primary: '#7928ca', gradient: 'linear-gradient(135deg, #1a0525, #000)' },
    { id: 'midnight-blue', primary: '#0070f3', gradient: 'linear-gradient(135deg, #050b25, #000)' },
    { id: 'cyber-pink', primary: '#ff0080', gradient: 'linear-gradient(135deg, #250514, #000)' },
    { id: 'emerald-city', primary: '#10b981', gradient: 'linear-gradient(135deg, #052514, #000)' },
  ];

  const currentTheme = THEMES.find(t => t.id === currentUser?.profileTheme) || THEMES[0];
  const accentColor = currentUser?.profileColor || currentTheme.primary;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ height: '100%', overflowY: 'auto', background: '#000', color: 'white' }}
    >
      {/* ── Status Modal ── */}
      <AnimatePresence>
        {showStatusModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatusModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: '24px 16px 40px', zIndex: 101, boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}
            >
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 20px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, textAlign: 'center' }}>Set Status</h3>
              <StatusSelector 
                currentPresence={currentUser?.presence} 
                currentStatus={currentUser?.statusText}
                onUpdate={handleStatusUpdate} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Legendary Header ── */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', position: 'sticky', top: 0, zIndex: 100,
          background: 'var(--bg-glass-heavy)', backdropFilter: 'blur(30px)',
          borderBottom: '1px solid var(--border-glass)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => navigate('/home')} 
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ position: 'relative' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: 36, height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} alt="Logo" />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#10b981', borderRadius: '50%', border: '2px solid black' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>NEXIFY</span>
            <span style={{ fontWeight: 800, fontSize: 7, letterSpacing: 2, opacity: 0.5, color: 'var(--primary)' }}>CONNECT</span>
          </div>
        </div>
        <div className="header-title" style={{ fontSize: 18, letterSpacing: 1 }}>MY PROFILE</div>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/settings')} 
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <SettingsIcon size={20} />
        </motion.button>
      </motion.div>

      {/* ── Cinematic Profile Hero ── */}
      <div style={{ paddingBottom: '32px', textAlign: 'center', position: 'relative' }}>
        {/* Animated Banner */}
        <div style={{ 
          height: 220, width: '100%', position: 'relative', overflow: 'hidden',
          background: currentUser?.bannerURL ? `url(${currentUser.bannerURL}) center/cover` : currentTheme.gradient,
          borderBottom: '1px solid var(--border-glass)'
        }}>
          {!currentUser?.bannerURL && (
            <motion.div 
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              style={{ 
                position: 'absolute', inset: -40, 
                background: `radial-gradient(circle at 20% 30%, ${accentColor}44, transparent 50%), radial-gradient(circle at 80% 70%, var(--primary-purple)33, transparent 50%)`,
                filter: 'blur(30px)'
              }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.9))' }} />
        </div>

        <div style={{ marginTop: -60, position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <motion.div
              animate={{ 
                boxShadow: [`0 0 20px ${accentColor}33`, `0 0 60px ${accentColor}66`, `0 0 20px ${accentColor}33`],
                scale: [1, 1.02, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ borderRadius: '50%', padding: 6, background: `linear-gradient(135deg, ${accentColor}, #fff)` }}
            >
              <img
                src={currentUser?.photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${currentUser?.uid}`}
                style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '6px solid #000' }}
                alt="Profile"
              />
            </motion.div>
            <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
              <PresenceIndicator status={currentUser?.presence} size={28} border={5} />
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile-customization')}
            style={{ position: 'absolute', top: 60, right: -45, background: 'var(--bg-glass)', backdropFilter: 'blur(15px)', color: 'white', border: '1px solid var(--border-glass)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
          >
            <Palette size={20} />
          </motion.button>
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 }}>
            <h2 className="header-title" style={{ fontSize: 32 }}>{currentUser?.displayName || 'Nexify User'}</h2>
            {currentUser?.verified && <ShieldCheck size={26} color="var(--primary)" />}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>@{currentUser?.username || 'user'}</p>
          
          {/* Custom Status Display */}
          <motion.div 
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowStatusModal(true)}
            className="glass-morphism"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              padding: '10px 20px', borderRadius: 24, cursor: 'pointer', marginBottom: 24
            }}
          >
            {currentUser?.statusEmoji ? (
              <span style={{ fontSize: 18 }}>{currentUser.statusEmoji}</span>
            ) : (
              <Sparkles size={16} color="var(--primary)" className="animate-float" />
            )}
            <span style={{ 
              fontSize: 14, fontWeight: 700, 
              color: currentUser?.statusText ? 'white' : 'var(--text-dim)',
            }}>
              {currentUser?.statusText || 'Broadcast your vibe...'}
            </span>
          </motion.div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
            <RoleBadge role={currentUser?.role || 'member'} />
            <RankBadge xp={currentUser?.xp || 0} />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile-customization')}
              className="neon-btn"
              style={{ flex: 1, maxWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Palette size={18} /> Customize
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              style={{ flex: 1, maxWidth: 160, padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <SettingsIcon size={18} /> Settings
            </motion.button>
          </div>

          {/* Now Playing Status */}
          <AnimatePresence>
            {musicStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ 
                  marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '10px 16px', background: 'rgba(0, 223, 216, 0.05)', borderRadius: 20,
                  border: '1px solid rgba(0, 223, 216, 0.15)'
                }}
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Disc size={16} color="#00dfd8" />
                </motion.div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#00dfd8' }}>
                  NOW PLAYING: {musicStatus.title} • {musicStatus.artist}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── XP Progress ── */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>CURRENT RANK</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: rank.color }}>{rank.name.toUpperCase()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>NEXT RANK</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{nextRank ? nextRank.name : 'MAX'}</div>
            </div>

          </div>
          
          <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${rank.color}, #fff)`, borderRadius: 5, boxShadow: `0 0 10px ${rank.color}` }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
            <span>{currentUser?.xp || 0} XP</span>
            <span>{nextRank ? `${nextRank.xpRequired} XP` : 'MAX LEVEL'}</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '0 16px 32px' }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i }}
            style={{ 
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 12
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Menu Rows ── */}
      <div style={{ padding: '0 16px 40px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 }}>DASHBOARD</h3>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: '4px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <ProfileRow icon={Target} color="#00dfd8" label="My Tasks" onClick={() => navigate('/tasks')} delay={0.1} />
          <ProfileRow icon={Trophy} color="#f59e0b" label="Leaderboards" onClick={() => navigate('/leaderboards')} delay={0.15} />
          <ProfileRow icon={Zap} color="#0070f3" label="My Activity" onClick={() => navigate('/nexify-edge')} delay={0.25} />
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 24, marginBottom: 12, paddingLeft: 4 }}>SYSTEM</h3>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: '4px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <ProfileRow icon={Bell} color="#ff5555" label="Notifications" onClick={() => navigate('/settings')} delay={0.3} />
          <ProfileRow icon={Palette} color="#d000ff" label="Appearance" onClick={() => navigate('/appearance')} delay={0.35} />
          <ProfileRow icon={HelpCircle} color="#a78bfa" label="Help & Support" onClick={() => navigate('/settings')} delay={0.4} />
        </div>

        {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin')}
            style={{
              width: '100%', marginTop: 24, background: 'rgba(208,0,255,0.1)',
              border: '1px solid rgba(208,0,255,0.3)', borderRadius: 16, padding: 16,
              color: '#d000ff', cursor: 'pointer', fontWeight: 800, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 20px rgba(208,0,255,0.15)'
            }}
          >
            <SettingsIcon size={18} /> Admin Control Panel
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            try {
              await logoutUser();
              navigate('/login');
            } catch (e) {
              showToast(e.message);
            }
          }}
          style={{
            width: '100%', marginTop: 12, background: 'rgba(255,85,85,0.08)',
            border: '1px solid rgba(255,85,85,0.25)', borderRadius: 16, padding: 16,
            color: '#ff5555', cursor: 'pointer', fontWeight: 800, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}
        >
          <LogOut size={18} /> Sign Out
        </motion.button>

      </div>
    </motion.div>
  );
};

export default Profile;

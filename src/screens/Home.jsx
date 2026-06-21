import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, Clock, Dumbbell, Zap, Phone,
  Search, Bell, Sparkles, ChevronRight, Target, Trophy,
  Plus, Play, LayoutGrid, Brain, Activity, Radio, 
  Flame, Star, TrendingUp, CheckCircle2, Music,
  Shield, ArrowRight, Headphones, Timer, Heart, Monitor,
  Snowflake, X, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { buyStreakFreeze } from '../services/auth';
import { subscribeUserChats } from '../services/chat';
import { subscribeFriends } from '../services/friends';
import { subscribeTasks, completeTask } from '../services/tasks';
import { getRankForXP, getNextRank, getRankProgress } from '../services/xp';
import { subscribeActivityFeed, ACTIVITY_TYPES } from '../services/activity';
import { RoleBadge, RankBadge } from '../components/Badges';
import { subscribeLeaderboard } from '../services/admin';
import { useFitness } from '../hooks/useFitnessContext';
import { subscribeNotifications } from '../services/notifications';

/* ── Animated Waving Hand Component ── */
const WavingHand = () => (
  <motion.span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '10px',
      verticalAlign: 'middle',
      cursor: 'default',
      userSelect: 'none',
      WebkitTextFillColor: 'initial'
    }}
    animate={{
      rotate: [0, 15, -10, 15, 0]
    }}
    transition={{
      duration: 1.8,
      repeat: Infinity,
      repeatDelay: 0.5,
      ease: "easeInOut"
    }}
  >
    <svg
      width="32"
      height="32"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="60%" stopColor="#FFB300" />
          <stop offset="100%" stopColor="#FF6F00" />
        </linearGradient>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#8E24AA" />
        </linearGradient>
      </defs>

      {/* Wave 1 */}
      <motion.path
        d="M 4,14 C 2.5,16 2.5,20 4,22"
        stroke="url(#waveGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Wave 2 */}
      <motion.path
        d="M 8,10 C 5.5,13.5 5.5,22.5 8,26"
        stroke="url(#waveGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />

      {/* Hand */}
      <g transform="translate(10, 2)">
        <path
          d="M19.6,9.1c0-0.9-0.7-1.6-1.6-1.6s-1.6,0.7-1.6,1.6v6.2c0,0.3-0.2,0.5-0.5,0.5s-0.5-0.2-0.5-0.5V5.5c0-0.9-0.7-1.6-1.6-1.6S12.2,4.6,12.2,5.5v9.8c0,0.3-0.2,0.5-0.5,0.5s-0.5-0.2-0.5-0.5V2.4C11.2,1.5,10.5,0.8,9.6,0.8S8,1.5,8,2.4v12.9c0,0.3-0.2,0.5-0.5,0.5s-0.5-0.2-0.5-0.5V6.2C7,5.3,6.3,4.6,5.4,4.6S3.8,5.3,3.8,6.2v14.4c0,5.7,4.6,10.3,10.3,10.3c3.4,0,6.5-1.7,8.3-4.5c1.1-1.7,1.8-3.7,1.8-5.8V17.3c0-0.9-0.7-1.6-1.6-1.6s-1.6,0.7-1.6,1.6v2c0,0.3-0.2,0.5-0.5,0.5s-0.5-0.2-0.5-0.5V9.1z"
          fill="url(#handGrad)"
        />
      </g>
    </svg>
  </motion.span>
);

/* ── Ultra-Premium Particle System ── */
const ParticleSystem = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ 
          x: Math.random() * 400, 
          y: Math.random() * 800 + 400,
          opacity: 0,
          scale: 0
        }}
        animate={{ 
          y: [null, -200],
          x: [null, (Math.random() - 0.5) * 150],
          opacity: [0, 0.4, 0],
          scale: [0, Math.random() * 1.5 + 0.5, 0]
        }}
        transition={{ 
          duration: Math.random() * 15 + 10, 
          repeat: Infinity, 
          ease: "linear",
          delay: Math.random() * 10
        }}
        style={{
          position: 'absolute',
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#00dfd8' : (i % 3 === 1 ? '#7928ca' : '#fff'),
          filter: 'blur(1px)',
          boxShadow: `0 0 10px ${i % 3 === 0 ? '#00dfd8' : '#7928ca'}`,
        }}
      />
    ))}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { stats: fitnessStats } = useFitness();

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeActivityFeed((data) => {
      setActivities(data.slice(0, 4));
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const [timerProgress, setTimerProgress] = useState(0.75);
  const [leaderboard, setLeaderboard] = useState([]);
  const accentColor = currentUser?.profileColor || '#00dfd8';

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeNotifications(currentUser.uid, (data) => {
      setUnreadCount(data.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeLeaderboard((data) => {
      setLeaderboard(data.slice(0, 3));
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const [showStreakModal, setShowStreakModal] = useState(false);
  const [buyingFreeze, setBuyingFreeze] = useState(false);
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    if (currentUser?.streakUpdateToast) {
      setActiveToast(currentUser.streakUpdateToast);
      const clearToast = async () => {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { streakUpdateToast: null });
        } catch (e) {
          console.warn("Failed to clear streak toast flag:", e);
        }
      };
      clearToast();
    }
  }, [currentUser?.streakUpdateToast]);

  const handleBuyFreeze = async () => {
    if (!currentUser) return;
    if (buyingFreeze) return;
    setBuyingFreeze(true);
    try {
      const res = await buyStreakFreeze(currentUser.uid);
      if (res.success) {
        showToast("❄️ Streak Freeze purchased!", "success");
        if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
      } else {
        showToast(res.error, "error");
      }
    } catch (e) {
      showToast("Purchase failed: " + e.message, "error");
    } finally {
      setBuyingFreeze(false);
    }
  };

  useEffect(() => {
    console.log("[NexifyHome] HOME SCREEN LOADED");
  }, []);

  // Safe data extraction with fallbacks to prevent crashes
  let userRankName = 'Citizen';
  let nextRankName = 'Max Rank';
  let rankProgressPercent = 0;
  let nextRankXpRequired = 0;
  let isMaxRank = false;

  try {
    if (currentUser) {
      const xpVal = currentUser.xp || 0;
      const rankObj = getRankForXP(xpVal);
      if (rankObj) userRankName = rankObj.name;
      
      const nextRankObj = getNextRank(xpVal);
      if (nextRankObj) {
        nextRankName = nextRankObj.name;
        nextRankXpRequired = nextRankObj.xpRequired;
        rankProgressPercent = getRankProgress(xpVal);
      } else {
        isMaxRank = true;
        rankProgressPercent = 100;
      }
    }
  } catch (err) {
    console.error("[NexifyHome] Error processing rank/xp values:", err);
  }

  // If currentUser is null (still loading), show the Welcome fallback UI to prevent blank screens
  if (!currentUser) {
    return (
      <div style={{ 
        height: '100dvh', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#0A0A0F', 
        color: 'white', 
        gap: 20,
        fontFamily: 'Inter, sans-serif',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        
        <img 
          src="logo.png" 
          className="logo-squircle" 
          alt="Logo" 
          style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(0, 229, 255, 0.5))' }} 
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Welcome</h2>
          <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', margin: 0 }}>Loading your workspace profile...</p>
        </div>
        
        <div style={{ display: 'flex', gap: 6, zIndex: 1 }}>
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                background: '#00dfd8', 
                animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                boxShadow: '0 0 6px #00dfd8'
              }} 
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#000', color: 'white', position: 'relative', overflow: 'hidden' }}>
      <ParticleSystem />

      {/* ── Background Cinematic Lighting ── */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '50%', background: 'radial-gradient(circle at 50% 0%, rgba(121, 40, 202, 0.15) 0%, rgba(0, 223, 216, 0.05) 40%, transparent 80%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40vh', background: 'linear-gradient(to top, #000 0%, transparent 100%)', zIndex: 1 }} />

      {/* ── TOP HEADER ── */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '20px 24px', zIndex: 100, position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.05)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
          >
            <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} alt="Nexify" />
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 2, textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>NEXIFY</span>
            <span style={{ fontWeight: 800, fontSize: 9, letterSpacing: 4, opacity: 0.5, color: '#00dfd8' }}>CONNECT</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => navigate('/nexify-edge')}
            style={{ 
              background: 'rgba(0, 223, 216, 0.1)', 
              border: '1px solid rgba(0, 223, 216, 0.35)', 
              borderRadius: '50%', 
              width: 42, 
              height: 42, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#00dfd8', 
              position: 'relative', 
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 10px rgba(0, 223, 216, 0.2)' 
            }}
          >
            <Zap size={20} fill="#00dfd8" />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => navigate('/global-search')}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(10px)' }}
          >
            <Search size={20} />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => navigate('/notifications')}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative', backdropFilter: 'blur(10px)' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: 0, right: 0, background: '#ff0080', color: 'white', fontSize: 10, fontWeight: 900, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid black', boxShadow: '0 0 10px rgba(255, 0, 128, 0.5)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </motion.button>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')} 
            style={{ position: 'relative', cursor: 'pointer', padding: 2, background: 'linear-gradient(135deg, #00dfd8, #7928ca)', borderRadius: '50%' }}
          >
            <img src={currentUser?.photoURL || "https://i.pravatar.cc/150?u=denzil"} style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid black', objectFit: 'cover' }} alt="" />
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, background: '#10b981', borderRadius: '50%', border: '2px solid black', boxShadow: '0 0 5px #10b981' }} />
          </motion.div>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div 
        style={{ flex: 1, overflowY: 'auto', padding: '0 24px 140px', position: 'relative', zIndex: 10, scrollbarWidth: 'none' }}
      >
        {/* GREETING */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 16, marginBottom: 28 }}
        >
          <div style={{ fontSize: 13, color: 'var(--primary-cyan)', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
            {new Date().getHours() < 5 ? 'Working late?' : 
             new Date().getHours() < 12 ? 'Good Morning Citizen' : 
             new Date().getHours() < 17 ? 'Good Afternoon Citizen' : 
             new Date().getHours() < 21 ? 'Good Evening Citizen' : 'Good Night Citizen'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, display: 'flex', alignItems: 'center' }}>
              <span style={{ background: 'linear-gradient(135deg, #ffffff, #8F9CAE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {currentUser?.displayName?.split(' ')[0] || 'Citizen'}
              </span>
              <WavingHand />
            </h1>
            {currentUser && (
              <div style={{ display: 'flex', gap: 8 }}>
                <RoleBadge role={currentUser.role} size="sm" />
                <RankBadge rankId={currentUser.rank} size="sm" />
              </div>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>Let's connect, focus, and ascend.</div>
        </motion.div>

        {/* RANK + XP SECTION (4 Stat Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
          {/* Card 1: Rank */}
          <motion.div 
            whileHover={{ y: -4 }}
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid rgba(0, 229, 255, 0.15)', 
              borderRadius: 20, 
              padding: '16px 20px', 
              position: 'relative', 
              overflow: 'hidden', 
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ background: 'rgba(0, 229, 255, 0.1)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(0, 229, 255, 0.25)', boxShadow: '0 0 10px rgba(0, 229, 255, 0.15)' }}>
              <Trophy size={18} color="var(--primary-cyan)" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary-cyan)', letterSpacing: 1.5, marginBottom: 4 }}>RANK</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{userRankName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Level {currentUser?.level || 1}</div>
          </motion.div>

          {/* Card 2: Streak */}
          <motion.div 
            whileHover={{ y: -4 }} 
            onClick={() => setShowStreakModal(true)}
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid rgba(255, 0, 127, 0.15)', 
              borderRadius: 20, 
              padding: '16px 20px', 
              backdropFilter: 'blur(20px)',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(255, 0, 127, 0.1)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(255, 0, 127, 0.25)', boxShadow: '0 0 10px rgba(255, 0, 127, 0.15)' }}>
                <Flame 
                  size={18} 
                  color="#FF007F" 
                  fill={currentUser?.streak > 0 ? "#FF007F" : "transparent"} 
                  style={{ filter: currentUser?.streak > 0 ? 'drop-shadow(0 0 8px #FF007F)' : 'none' }}
                />
              </div>
              {currentUser?.streakFreezes > 0 && (
                <div style={{ background: 'rgba(0, 229, 255, 0.15)', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: 12, padding: '2px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary-cyan)', fontWeight: 800 }}>
                  <Snowflake size={10} color="var(--primary-cyan)" />
                  <span>x{currentUser.streakFreezes}</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#FF007F', letterSpacing: 1.5, marginBottom: 4 }}>STREAK</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{currentUser?.streak || 0} Days</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Tap to freeze</div>
          </motion.div>

          {/* Card 3: XP */}
          <motion.div 
            whileHover={{ y: -4 }}
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid rgba(123, 97, 255, 0.15)', 
              borderRadius: 20, 
              padding: '16px 20px', 
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ background: 'rgba(123, 97, 255, 0.1)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(123, 97, 255, 0.25)', boxShadow: '0 0 10px rgba(123, 97, 255, 0.15)' }}>
              <Zap size={18} color="var(--primary-purple)" fill="var(--primary-purple)" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary-purple)', letterSpacing: 1.5, marginBottom: 4 }}>XP</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{(currentUser?.xp || 0).toLocaleString()} <span style={{ fontWeight: 400, opacity: 0.4, fontSize: 12 }}>XP</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Total XP</div>
          </motion.div>

          {/* Card 4: Next Rank */}
          <motion.div 
            whileHover={{ y: -4 }}
            style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid rgba(16, 185, 129, 0.15)', 
              borderRadius: 20, 
              padding: '16px 20px', 
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)' }}>
              <Shield size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#10b981', letterSpacing: 1.5, marginBottom: 4 }}>NEXT RANK</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{nextRankName}</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${rankProgressPercent}%` }} transition={{ duration: 1.5 }} style={{ height: '100%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{isMaxRank ? 'Fully Ascended' : `${(nextRankXpRequired - (currentUser?.xp || 0)).toLocaleString()} XP left`}</div>
            </div>
          </motion.div>
        </div>

        {/* MAIN HERO CARD: Focus Now */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.15) 0%, rgba(18, 24, 38, 0.75) 100%)',
            border: '1px solid rgba(123, 97, 255, 0.25)', 
            borderRadius: 24, 
            padding: '24px 28px',
            position: 'relative', 
            overflow: 'hidden', 
            marginBottom: 32,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(123, 97, 255, 0.05)'
          }}
        >
          {/* Subtle Reflective Shine */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%)', pointerEvents: 'none' }} />
          
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Timer size={20} color="var(--primary-purple)" />
                <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>Focus Now</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>Join a focus room and level up with other creators.</p>
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/focus-pods')}
                style={{ 
                  background: 'var(--gradient-primary)', 
                  border: 'none', 
                  borderRadius: 24, 
                  padding: '12px 24px', 
                  color: 'black', 
                  fontWeight: 900, 
                  fontSize: 13, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(0, 229, 255, 0.3)' 
                }}
              >
                Join Focus Pod <ArrowRight size={16} />
              </motion.button>
            </div>

            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {/* Outer Glow Ring */}
              <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 3, repeat: Infinity }} style={{ position: 'absolute', inset: -6, border: '1px solid rgba(0, 229, 255, 0.15)', borderRadius: '50%' }} />
              
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                <motion.circle 
                  cx="60" cy="60" r="52" fill="none" stroke="url(#focusGrad)" strokeWidth="6" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: timerProgress }} transition={{ duration: 2.5, ease: "circOut" }}
                />
                <defs>
                  <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary-purple)" />
                    <stop offset="100%" stopColor="var(--primary-cyan)" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>25:00</div>
                <div style={{ fontSize: 8, opacity: 0.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>SESSION</div>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4, height: 10, alignItems: 'center' }}>
                  {[1,2,3,4,3,2,1].map((h, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: [h*2, h*3, h*2] }} 
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      style={{ width: 1.5, background: 'var(--primary-cyan)', borderRadius: 1, boxShadow: '0 0 4px var(--primary-cyan)' }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* QUICK ACCESS GRID */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, letterSpacing: -0.3 }}>Quick Access</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { icon: MessageSquare, label: 'Chat', color: 'var(--primary-cyan)', path: '/chats' },
              { icon: Users, label: 'Rooms', color: 'var(--primary-purple)', path: '/rooms' },
              { icon: Activity, label: 'Fit', color: '#10b981', path: '/nexify-fit' },
              { icon: Target, label: 'Pods', color: '#a78bfa', path: '/focus-pods' },
              { icon: Music, label: 'Waves', color: '#FF007F', path: '/nexify-waves' },
              { icon: Phone, label: 'Calls', color: '#0072ff', path: '/calls' },
              { icon: Sparkles, label: 'AI', color: '#facc15', path: '/nexify-ai' },
              { icon: Zap, label: 'Edge', color: 'var(--primary-cyan)', path: '/nexify-edge' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.path)}
                style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid rgba(255,255,255,0.05)', 
                  borderRadius: 18, 
                  padding: '14px 6px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer', 
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ 
                  width: 44, height: 44, borderRadius: 14, background: `${item.color}12`, 
                  border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', position: 'relative'
                }}>
                  <item.icon size={20} color={item.color} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'white', opacity: 0.8 }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* LIVE ACTIVITY SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 40 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: 24, backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity size={20} color="#7928ca" />
                <span style={{ fontSize: 18, fontWeight: 900 }}>Live Activity</span>
              </div>
              <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {activities.length > 0 ? activities.map((act) => (
                <motion.div key={act.id} whileHover={{ x: 5 }} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={act.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.userName}`} style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} alt="" />
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: '#10b981', borderRadius: '50%', border: '2px solid black' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 900 }}>{act.userName} <span style={{ fontWeight: 400, opacity: 0.6 }}>{act.text}</span></span>
                      <span style={{ fontSize: 10, opacity: 0.3, fontWeight: 700 }}>{act.timestamp?.toMillis ? new Date(act.timestamp.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</span>
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.4, marginTop: 4, fontWeight: 600 }}>{act.sub}</div>
                  </div>
                </motion.div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>No live activity yet</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>Be the first to start a session!</div>
                </div>
              )}
            </div>
          </div>

          {/* NEXIFY AI CARD */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            style={{ 
              background: 'linear-gradient(135deg, rgba(121, 40, 202, 0.1), rgba(0, 0, 0, 0.4))',
              border: '1px solid rgba(121, 40, 202, 0.2)', borderRadius: 28, padding: 24,
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle, rgba(121, 40, 202, 0.2) 0%, transparent 70%)', zIndex: 0 }} />
            
            <div style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, zIndex: 1 }}>
              <Sparkles size={20} color="#7928ca" />
              <span style={{ fontSize: 18, fontWeight: 900 }}>Nexify AI</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.4, width: '100%', textAlign: 'left', marginBottom: 24, fontWeight: 500, zIndex: 1 }}>Your personal futuristic assistant</div>
            
            {/* Glowing AI Orb Face */}
            <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 24 }}>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
                transition={{ duration: 4, repeat: Infinity }} 
                style={{ position: 'absolute', inset: -15, background: 'radial-gradient(circle, rgba(121, 40, 202, 0.4) 0%, transparent 70%)', borderRadius: '50%' }} 
              />
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ position: 'absolute', inset: -2, border: '2px dashed rgba(121, 40, 202, 0.3)', borderRadius: '50%' }}
              />
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 3, repeat: Infinity }}
                style={{ width: '100%', height: '100%', background: '#000', borderRadius: '50%', border: '2px solid #7928ca', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 0 30px rgba(121, 40, 202, 0.4)' }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.div animate={{ height: [12, 16, 12] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 8, height: 12, background: '#7928ca', borderRadius: 4, boxShadow: '0 0 10px #7928ca' }} />
                  <motion.div animate={{ height: [12, 16, 12] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} style={{ width: 8, height: 12, background: '#7928ca', borderRadius: 4, boxShadow: '0 0 10px #7928ca' }} />
                </div>
              </motion.div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: '14px 20px', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)', fontWeight: 500, width: '100%', backdropFilter: 'blur(10px)' }}>
              How can I help you today?
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/nexify-ai')}
              style={{ width: '100%', background: 'linear-gradient(135deg, #7928ca, #ff0080)', border: 'none', borderRadius: 20, padding: '14px', color: 'white', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 10px 20px rgba(121, 40, 202, 0.3)' }}
            >
              Chat with AI <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>

        {/* FITNESS & MUSIC ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          {/* Nexify Fit */}
          <motion.div 
            whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
            transition={{ duration: 0.2 }}
            onClick={() => navigate('/nexify-fit')}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: 20, backdropFilter: 'blur(20px)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <Activity size={20} color="#10b981" />
              <span style={{ fontSize: 15, fontWeight: 900 }}>Nexify Fit</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{(fitnessStats?.steps || 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginTop: 2 }}>Steps Today</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 30 }}>
                  {[4,7,3,9,5,8,6,10,4,7].map((h, i) => <div key={i} style={{ width: 4, height: h * 2.5, background: i === 7 ? '#10b981' : 'rgba(16, 185, 129, 0.15)', borderRadius: 2 }} />)}
                </div>
                <div style={{ position: 'relative', width: 50, height: 50 }}>
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="4" />
                    <motion.circle 
                      cx="25" cy="25" r="22" fill="none" stroke="#10b981" strokeWidth="4" 
                      strokeDasharray="138" initial={{ strokeDashoffset: 138 }} 
                      animate={{ strokeDashoffset: 138 * (1 - Math.min((fitnessStats?.steps || 0) / (fitnessStats?.stepGoal || 10000), 1)) }} 
                      transition={{ duration: 2 }} strokeLinecap="round" 
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
                    {Math.min(Math.round(((fitnessStats?.steps || 0) / (fitnessStats?.stepGoal || 10000)) * 100), 100)}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Nexify Waves */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.1), rgba(0, 0, 0, 0.4))',
            border: '1px solid rgba(255, 0, 128, 0.2)', borderRadius: 28, padding: 20,
            position: 'relative', overflow: 'hidden', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Music size={20} color="#ff0080" />
              <span style={{ fontSize: 15, fontWeight: 900 }}>Nexify Waves</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>Good Vibes</div>
            <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 20, fontWeight: 500 }}>LoFi Synthwave</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 24 }}>
                {[1,2,3,4,3,2,1,2,3,4,3,2,1,2,3].map((h, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ height: [h*2, h*5, h*2] }} 
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }} 
                    style={{ width: 2, background: '#ff0080', borderRadius: 1, boxShadow: '0 0 5px #ff0080' }} 
                  />
                ))}
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(5px)' }}
              >
                <Play size={16} fill="white" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* LEADERBOARD SECTION */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 32, padding: 28, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} alt="Logo" />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, background: '#10b981', borderRadius: '50%', border: '1.5px solid black' }} />
              </div>
              <span className="header-title" style={{ fontSize: 18, letterSpacing: 1.5 }}>NEXIFY</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#00dfd8', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,223,216,0.1)', padding: '6px 12px', borderRadius: 12 }}>Global XP <ChevronRight size={14} /></div>
          </div>

          {/* Podium */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 24, marginBottom: 40 }}>
            {leaderboard.length >= 2 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <motion.div
                    animate={currentUser?.prefs?.avatarRing !== false ? { 
                      boxShadow: [`0 0 20px ${accentColor}33`, `0 0 60px ${accentColor}66`, `0 0 20px ${accentColor}33`],
                      scale: [1, 1.02, 1]
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{ borderRadius: '50%', padding: 6, background: `linear-gradient(135deg, ${accentColor}, #fff)` }}
                  >
                    <img
                      src={leaderboard[1].photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${leaderboard[1].uid}`}
                      style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #000' }}
                      alt="Profile"
                    />
                  </motion.div>
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#c0c0c0', color: 'black', fontSize: 11, fontWeight: 900, width: 22, height: 22, borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{(leaderboard[1].displayName || 'Anonymous').split(' ')[0]}</div>
                <div style={{ fontSize: 12, color: '#00dfd8', fontWeight: 700, marginTop: 2 }}>{(leaderboard[1].xp || 0).toLocaleString()}</div>
              </div>
            )}
            {leaderboard.length >= 1 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)' }}>
                    <Star size={28} color="#facc15" fill="#facc15" style={{ filter: 'drop-shadow(0 0 10px #facc15)' }} />
                  </motion.div>
                  <img src={leaderboard[0].photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${leaderboard[0].uid}`} style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #facc15', padding: 4 }} alt="" />
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: 'black', fontSize: 12, fontWeight: 900, width: 26, height: 26, borderRadius: '50%', border: '2.5px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px #facc15' }}>1</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{(leaderboard[0].displayName || 'Anonymous').split(' ')[0]}</div>
                <div style={{ fontSize: 14, color: '#00dfd8', fontWeight: 800, marginTop: 2 }}>{(leaderboard[0].xp || 0).toLocaleString()}</div>
              </div>
            )}
            {leaderboard.length >= 3 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <img src={leaderboard[2].photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${leaderboard[2].uid}`} style={{ width: 52, height: 52, borderRadius: '50%', border: '2.5px solid #cd7f32', padding: 2 }} alt="" />
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#cd7f32', color: 'black', fontSize: 11, fontWeight: 900, width: 22, height: 22, borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{(leaderboard[2].displayName || 'Anonymous').split(' ')[0]}</div>
                <div style={{ fontSize: 12, color: '#00dfd8', fontWeight: 700, marginTop: 2 }}>{(leaderboard[2].xp || 0).toLocaleString()}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {leaderboard.length > 3 && leaderboard.slice(3, 6).map((u, i) => (
              <motion.div key={u.uid} whileHover={{ x: 5 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 13, opacity: 0.3, fontWeight: 900, width: 14 }}>{i + 4}</span>
                  <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} alt="" />
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{(u.displayName || 'Anonymous').split(' ')[0]}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>{(u.xp || 0).toLocaleString()}</span>
              </motion.div>
            ))}
            {leaderboard.length <= 3 && (
              <div style={{ textAlign: 'center', padding: '20px', opacity: 0.4, fontSize: 13 }}>More rankings coming soon...</div>
            )}
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/leaderboards')} 
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '14px', color: '#00dfd8', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            See full leaderboard <ArrowRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* ── Streak Modal ── */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setShowStreakModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={{
                width: '100%',
                maxWidth: 400,
                background: 'rgba(10,6,18,0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(121,40,202,0.1)',
                borderRadius: 32,
                padding: 24,
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background glow lines */}
              <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '50%', background: 'radial-gradient(circle, rgba(255,0,128,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

              {/* Title Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={20} color="#ff0080" fill="#ff0080" />
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#ff0080', letterSpacing: 1.5 }}>FLAME STATUS</span>
                </div>
                <button 
                  onClick={() => setShowStreakModal(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Main Flame Card */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    filter: ['drop-shadow(0 0 15px rgba(255,0,128,0.4))', 'drop-shadow(0 0 25px rgba(255,0,128,0.7))', 'drop-shadow(0 0 15px rgba(255,0,128,0.4))']
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background: 'radial-gradient(circle, rgba(255,0,128,0.15) 0%, transparent 70%)',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16
                  }}
                >
                  <Flame size={64} color="#ff0080" fill="#ff0080" />
                </motion.div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>{currentUser?.streak || 0} Day Streak</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  Personal Best: <span style={{ color: '#fff', fontWeight: 600 }}>{currentUser?.highestStreak || currentUser?.streak || 0} days</span>
                </div>
              </div>

              {/* Weekly History */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' }}>Weekly Activity</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {(() => {
                    const days = [];
                    const today = new Date();
                    for (let i = 6; i >= 0; i--) {
                      const d = new Date();
                      d.setDate(today.getDate() - i);
                      days.push(d);
                    }
                    
                    const activeDates = currentUser?.activeDates || [];
                    const frozenDates = currentUser?.frozenDates || [];
                    const todayStr = today.toLocaleDateString('en-CA');

                    return days.map((day, idx) => {
                      const dayStr = day.toLocaleDateString('en-CA');
                      const isToday = dayStr === todayStr;
                      const isActive = activeDates.includes(dayStr);
                      const isFrozen = frozenDates.includes(dayStr);
                      
                      const dayName = day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);

                      let bgColor = 'rgba(255,255,255,0.02)';
                      let borderColor = 'rgba(255,255,255,0.05)';
                      let iconColor = 'rgba(255,255,255,0.2)';
                      let displayIcon = null;

                      if (isActive) {
                        bgColor = 'rgba(255,0,128,0.1)';
                        borderColor = 'rgba(255,0,128,0.3)';
                        displayIcon = <Flame size={12} color="#ff0080" fill="#ff0080" />;
                      } else if (isFrozen) {
                        bgColor = 'rgba(56,189,248,0.1)';
                        borderColor = 'rgba(56,189,248,0.3)';
                        displayIcon = <Snowflake size={12} color="#38bdf8" />;
                      } else if (isToday) {
                        bgColor = 'rgba(255,255,255,0.05)';
                        borderColor = '#00dfd8';
                        displayIcon = <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00dfd8', animation: 'ping 1s infinite alternate' }} />;
                      } else {
                        displayIcon = <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>•</span>;
                      }

                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 10, color: isToday ? '#00dfd8' : 'rgba(255,255,255,0.4)', fontWeight: isToday ? 800 : 500 }}>{dayName}</div>
                          <div style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 12, 
                            background: bgColor, 
                            border: `1px solid ${borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isActive ? '0 0 10px rgba(255,0,128,0.1)' : (isFrozen ? '0 0 10px rgba(56,189,248,0.1)' : 'none')
                          }}>
                            {displayIcon}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Streak Freezes Section */}
              <div style={{ background: 'rgba(56,189,248,0.03)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: 20, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: 'rgba(56,189,248,0.1)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Snowflake size={14} color="#38bdf8" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8' }}>Streak Freezes</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{currentUser?.streakFreezes || 0} available</div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBuyFreeze}
                    disabled={buyingFreeze || (currentUser?.xp || 0) < 200}
                    style={{
                      background: (currentUser?.xp || 0) >= 200 ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(255,255,255,0.03)',
                      border: (currentUser?.xp || 0) >= 200 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: '6px 12px',
                      fontSize: 11,
                      color: (currentUser?.xp || 0) >= 200 ? '#fff' : 'rgba(255,255,255,0.3)',
                      fontWeight: 800,
                      cursor: (currentUser?.xp || 0) >= 200 && !buyingFreeze ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    Buy <span style={{ opacity: 0.8 }}>200 XP</span>
                  </motion.button>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
                  Streak Freezes are automatically applied to preserve your active login streak if you miss a day.
                </div>
              </div>

              {/* Milestones Info */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' }}>Milestone Rewards</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { days: 3, reward: '50 XP' },
                    { days: 7, reward: '150 XP + ❄️ 1 Freeze' },
                    { days: 14, reward: '250 XP + ❄️ 1 Freeze' },
                    { days: 30, reward: '500 XP + ❄️ 2 Freezes' }
                  ].map((milestone, mIdx) => {
                    const isReached = (currentUser?.streak || 0) >= milestone.days;
                    return (
                      <div 
                        key={mIdx} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          background: isReached ? 'rgba(255,0,128,0.02)' : 'transparent',
                          border: isReached ? '1px solid rgba(255,0,128,0.1)' : '1px solid rgba(255,255,255,0.02)',
                          borderRadius: 12,
                          padding: '8px 12px',
                          opacity: isReached ? 1 : 0.5
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle2 size={14} color={isReached ? '#ff0080' : 'rgba(255,255,255,0.2)'} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: isReached ? '#ff0080' : '#fff' }}>{milestone.days} Day Milestone</span>
                        </div>
                        <span style={{ fontSize: 10, color: isReached ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{milestone.reward}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Streak Milestone / Action Popups ── */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              style={{
                width: '100%',
                maxWidth: 360,
                background: 'rgba(10,6,18,0.9)',
                border: '2px solid rgba(255,255,255,0.1)',
                boxShadow: '0 0 30px rgba(255,0,128,0.2)',
                borderRadius: 28,
                padding: 32,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Confetti Glow Background */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,0,128,0.15) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                {activeToast.type === 'milestone' && (
                  <>
                    <motion.div 
                      animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1] }} 
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ fontSize: 48, marginBottom: 16 }}
                    >
                      🎉
                    </motion.div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#ff0080', letterSpacing: 2, marginBottom: 8 }}>STREAK MILESTONE</div>
                    <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>{activeToast.streak} Days Burning!</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                      Outstanding consistency! You've unlocked exclusive milestone rewards:
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Bonus Rewards</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#ff0080' }}>+{activeToast.xp} XP</span>
                      </div>
                      {activeToast.freezes > 0 && (
                        <div style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: 16, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Streak Freeze</span>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Snowflake size={14} color="#38bdf8" /> +{activeToast.freezes}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeToast.type === 'freeze_used' && (
                  <>
                    <motion.div 
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ fontSize: 48, marginBottom: 16 }}
                    >
                      ❄️
                    </motion.div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#38bdf8', letterSpacing: 2, marginBottom: 8 }}>STREAK PROTECTED</div>
                    <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>Streak Frozen!</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                      You missed yesterday, but a **Streak Freeze** was consumed to save your **{activeToast.streak}-Day Streak**!
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
                      Remaining Freezes: <span style={{ color: '#fff', fontWeight: 700 }}>{activeToast.remainingFreezes}</span>
                    </div>
                  </>
                )}

                {activeToast.type === 'reset' && (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💨</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 8 }}>STREAK COOLED DOWN</div>
                    <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>Streak Reset</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>
                      Your previous streak of **{activeToast.oldStreak} days** has ended. Keep logging in daily to rebuild your fire!
                    </div>
                  </>
                )}

                {activeToast.type === 'welcome' && (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔥</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#ff0080', letterSpacing: 2, marginBottom: 8 }}>STREAK STARTED</div>
                    <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>Flame Ignited!</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>
                      Welcome! You've started a **1-Day Streak**. Log in every day to earn rewards and keep your flame alive.
                    </div>
                  </>
                )}

                {activeToast.type === 'daily' && (
                  <>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔥</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#ff0080', letterSpacing: 2, marginBottom: 8 }}>DAILY LOGIN</div>
                    <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>Streak: {activeToast.streak} Days!</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                      Your flame is burning bright at {activeToast.streak} days.
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 16px', fontSize: 12, color: '#00dfd8', fontWeight: 800, marginBottom: 28 }}>
                      Earned +10 XP for checking in!
                    </div>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveToast(null)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #7928ca 0%, #b800b8 100%)',
                    border: 'none',
                    borderRadius: 16,
                    padding: '14px',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(121,40,202,0.4)'
                  }}
                >
                  Awesome!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shine {
          from { transform: translateX(-100%); }
          to { transform: translateX(200%); }
        }
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);
          transform: skewX(-20deg);
          animation: shine 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;

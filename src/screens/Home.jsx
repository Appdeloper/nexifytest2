import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, Clock, Dumbbell, Zap, Phone,
  Search, Bell, Sparkles, ChevronRight, Target, Trophy,
  Plus, Play, LayoutGrid, Brain, Activity, Radio, 
  Flame, Star, TrendingUp, CheckCircle2, Music,
  Shield, ArrowRight, Headphones, Timer, Heart, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { subscribeUserChats } from '../services/chat';
import { subscribeFriends } from '../services/friends';
import { subscribeTasks, completeTask } from '../services/tasks';
import { getRankForXP, getNextRank, getRankProgress } from '../services/xp';
import { subscribeActivityFeed, ACTIVITY_TYPES } from '../services/activity';
import { RoleBadge, RankBadge } from '../components/Badges';
import PresenceIndicator from '../components/PresenceIndicator';
import { subscribeLeaderboard } from '../services/admin';
import { useFitness } from '../hooks/useFitness';

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
    const unsub = subscribeActivityFeed((data) => {
      setActivities(data.slice(0, 4));
    });
    return () => unsub();
  }, []);

  const [timerProgress, setTimerProgress] = useState(0.75);
  const [leaderboard, setLeaderboard] = useState([]);
  const accentColor = currentUser?.profileColor || '#00dfd8';

  useEffect(() => {
    const unsub = subscribeLeaderboard((data) => {
      setLeaderboard(data.slice(0, 3));
    });
    return () => unsub();
  }, []);

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
            <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Nexify" />
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 2, textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>NEXIFY</span>
            <span style={{ fontWeight: 800, fontSize: 9, letterSpacing: 4, opacity: 0.5, color: '#00dfd8' }}>CONNECT</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => navigate('/search')}
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
            <div style={{ position: 'absolute', top: 0, right: 0, background: '#ff0080', color: 'white', fontSize: 10, fontWeight: 900, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid black', boxShadow: '0 0 10px rgba(255, 0, 128, 0.5)' }}>3</div>
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
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginTop: 10, marginBottom: 32 }}
        >
          <div style={{ fontSize: 16, color: '#7928ca', fontWeight: 600, letterSpacing: 0.5 }}>
            {new Date().getHours() < 12 ? 'Good Morning,' : new Date().getHours() < 17 ? 'Good Afternoon,' : 'Good Evening,'}
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginTop: 4, letterSpacing: -1 }}>{currentUser?.displayName?.split(' ')[0] || 'Citizen'} 👋</h1>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6, fontWeight: 500 }}>Ready to connect, focus and grow?</div>
        </motion.div>

        {/* RANK + XP SECTION (4 Stat Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
          {/* Card 1: Rank */}
          <motion.div whileHover={{ scale: 1.02 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
            <div style={{ background: 'rgba(0,223,216,0.1)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(0,223,216,0.2)' }}>
              <Trophy size={18} color="#00dfd8" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#00dfd8', letterSpacing: 1, marginBottom: 4 }}>RANK</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{getRankForXP(currentUser?.xp || 0).name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Level {currentUser?.level || 1}</div>
          </motion.div>
          {/* Card 2: Streak */}
          <motion.div whileHover={{ scale: 1.02 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, backdropFilter: 'blur(20px)' }}>
            <div style={{ background: 'rgba(255,0,128,0.1)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(255,0,128,0.2)' }}>
              <Flame size={18} color="#ff0080" fill="#ff0080" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#ff0080', letterSpacing: 1, marginBottom: 4 }}>STREAK</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{currentUser?.streak || 0} Days</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Current Streak</div>
          </motion.div>
          {/* Card 3: XP */}
          <motion.div whileHover={{ scale: 1.02 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, backdropFilter: 'blur(20px)' }}>
            <div style={{ background: 'rgba(121, 40, 202, 0.1)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(121, 40, 202, 0.2)' }}>
              <Zap size={18} color="#7928ca" fill="#7928ca" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#7928ca', letterSpacing: 1, marginBottom: 4 }}>XP</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{(currentUser?.xp || 0).toLocaleString()} <span style={{ fontWeight: 400, opacity: 0.4, fontSize: 12 }}>XP</span></div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Total Earned</div>
          </motion.div>
          {/* Card 4: Next Rank */}
          <motion.div whileHover={{ scale: 1.02 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 20, backdropFilter: 'blur(20px)' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <Shield size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: 1, marginBottom: 4 }}>NEXT RANK</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{getNextRank(currentUser?.xp || 0)?.name || 'Max Rank'}</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${getRankProgress(currentUser?.xp || 0)}%` }} transition={{ duration: 1.5 }} style={{ height: '100%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>{getNextRank(currentUser?.xp || 0) ? `${(getNextRank(currentUser?.xp || 0).xpRequired - (currentUser?.xp || 0)).toLocaleString()} XP left` : 'Fully Ascended'}</div>
            </div>
          </motion.div>
        </div>

        {/* MAIN HERO CARD: Focus Now */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'linear-gradient(135deg, rgba(121, 40, 202, 0.15), rgba(0, 0, 0, 0.6))',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 32, padding: 32,
            position: 'relative', overflow: 'hidden', marginBottom: 40,
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(121, 40, 202, 0.1)'
          }}
        >
          {/* Subtle Reflective Shine */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%)', pointerEvents: 'none' }} />
          
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Timer size={20} color="#7928ca" />
                <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>Focus Now</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 180, lineHeight: 1.5, marginBottom: 24 }}>Join a focus room and boost your productivity with others.</p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/focus-pods')}
                style={{ background: 'linear-gradient(135deg, #7928ca, #0070f3)', border: 'none', borderRadius: 24, padding: '14px 28px', color: 'white', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 25px rgba(121, 40, 202, 0.4)' }}
              >
                Join Focus Pod <ArrowRight size={18} />
              </motion.button>
            </div>

            <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer Glow Ring */}
              <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 3, repeat: Infinity }} style={{ position: 'absolute', inset: -10, border: '1px solid rgba(0, 223, 216, 0.2)', borderRadius: '50%' }} />
              
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle 
                  cx="70" cy="70" r="62" fill="none" stroke="url(#focusGrad)" strokeWidth="8" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: timerProgress }} transition={{ duration: 2.5, ease: "circOut" }}
                />
                <defs>
                  <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7928ca" />
                    <stop offset="100%" stopColor="#00dfd8" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>25:00</div>
                <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Focus Session</div>
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 8, height: 12, alignItems: 'center' }}>
                  {[1,2,3,4,5,4,3,2,1].map((h, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: [h*2, h*4, h*2] }} 
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                      style={{ width: 2, background: '#00dfd8', borderRadius: 1, boxShadow: '0 0 5px #00dfd8' }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* QUICK ACCESS GRID */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900 }}>Quick Access</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { icon: MessageSquare, label: 'Chat', color: '#00dfd8', path: '/chats' },
              { icon: Users, label: 'Rooms', color: '#7928ca', path: '/rooms' },
              { icon: Activity, label: 'Fit', color: '#10b981', path: '/nexify-fit' },
              { icon: Music, label: 'Waves', color: '#ff0080', path: '/nexify-waves' },
              { icon: Phone, label: 'Calls', color: '#0070f3', path: '/calls' },
              { icon: Sparkles, label: 'AI', color: '#facc15', path: '/nexify-ai' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.path)}
                style={{ 
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: 24, padding: '20px 10px', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', gap: 12, cursor: 'pointer', backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ 
                  width: 48, height: 48, borderRadius: 16, background: `${item.color}10`, 
                  border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', position: 'relative'
                }}>
                  <item.icon size={24} color={item.color} strokeWidth={2} />
                  <div style={{ position: 'absolute', inset: -4, border: `1px solid ${item.color}10`, borderRadius: 18, pointerEvents: 'none' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, letterSpacing: 0.5 }}>{item.label}</span>
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
              style={{ width: '100%', background: 'linear-gradient(135deg, #7928ca, #ff0080)', border: 'none', borderRadius: 20, padding: '14px', color: 'white', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 10px 20px rgba(121, 40, 202, 0.3)' }}
            >
              Chat with AI <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>

        {/* FITNESS & MUSIC ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          {/* Nexify Fit */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 28, padding: 20, backdropFilter: 'blur(20px)' }}>
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
                      strokeDasharray="138" initial={{ strokeDashoffset: 138 }} animate={{ strokeDashoffset: 138 * (1 - 0.68) }} 
                      transition={{ duration: 2 }} strokeLinecap="round" 
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>68%</div>
                </div>
              </div>
            </div>
          </div>

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
                <img src="/logo.png" style={{ width: 32, height: 32, borderRadius: 8 }} alt="Logo" />
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
                <div style={{ fontSize: 14, fontWeight: 800 }}>{leaderboard[1].displayName.split(' ')[0]}</div>
                <div style={{ fontSize: 12, color: '#00dfd8', fontWeight: 700, marginTop: 2 }}>{leaderboard[1].xp.toLocaleString()}</div>
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
                <div style={{ fontSize: 16, fontWeight: 900 }}>{leaderboard[0].displayName.split(' ')[0]}</div>
                <div style={{ fontSize: 14, color: '#00dfd8', fontWeight: 800, marginTop: 2 }}>{leaderboard[0].xp.toLocaleString()}</div>
              </div>
            )}
            {leaderboard.length >= 3 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <img src={leaderboard[2].photoURL || `https://api.dicebear.com/7.x/big-smile/svg?seed=${leaderboard[2].uid}`} style={{ width: 52, height: 52, borderRadius: '50%', border: '2.5px solid #cd7f32', padding: 2 }} alt="" />
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#cd7f32', color: 'black', fontSize: 11, fontWeight: 900, width: 22, height: 22, borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{leaderboard[2].displayName.split(' ')[0]}</div>
                <div style={{ fontSize: 12, color: '#00dfd8', fontWeight: 700, marginTop: 2 }}>{leaderboard[2].xp.toLocaleString()}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {leaderboard.length > 3 && leaderboard.slice(3, 6).map((u, i) => (
              <motion.div key={u.uid} whileHover={{ x: 5 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 13, opacity: 0.3, fontWeight: 900, width: 14 }}>{i + 4}</span>
                  <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} alt="" />
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{u.displayName.split(' ')[0]}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>{u.xp.toLocaleString()}</span>
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

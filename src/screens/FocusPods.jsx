import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { Play, Pause, Square, Headphones, FileText, Bell, BellOff, Users, BrainCircuit, Sparkles } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import GlassCard from '../components/GlassCard';
import { RoleBadge, RankBadge } from '../components/Badges';
import { useAuth } from '../hooks/useAuth';
import { subscribeFocusData, updateFocusStats } from '../services/focus';

const MOCK_PODS = [
  { id: 1, title: 'Deep Work Pod', desc: 'Distraction-free environment for intense focus.', category: 'Work', time: 60, icon: '🧠' },
  { id: 2, title: 'Study Sprint', desc: 'Pomodoro-style study sessions with breaks.', category: 'Study', time: 25, icon: '📚' },
  { id: 3, title: 'Code Chamber', desc: 'Silent coding session. Headphones on.', category: 'Code', time: 45, icon: '💻' },
  { id: 4, title: 'Exam Zone', desc: 'Strict prep environment for upcoming exams.', category: 'Exam', time: 60, icon: '📝' },
  { id: 5, title: 'Silent Flow', desc: 'Absolute silence for reading and writing.', category: 'Silent', time: 45, icon: '🤫' },
  { id: 6, title: 'Creator Lab', desc: 'Creative work session. Music allowed.', category: 'Creator', time: 25, icon: '🎨' }
];

const FocusPods = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePod, setActivePod] = useState(null);
  const [stats, setStats] = useState({ focusMinutes: 0, focusSessions: 0 });
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [note, setNote] = useState('');
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeFocusData(currentUser.uid, setStats);
    return () => unsub();
  }, [currentUser]);

  const categories = ['All', 'Study', 'Work', 'Code', 'Exam', 'Silent', 'Creator'];
  const pods = MOCK_PODS.filter(p => activeCategory === 'All' || p.category === activeCategory);

  const joinFocusPod = (pod) => {
    setActivePod(pod);
    setTimeLeft(pod.time * 60);
    setTotalTime(pod.time * 60);
    setIsRunning(false);
  };

  const startFocusSession = () => {
    if (timeLeft <= 0) return;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsRunning(false);
          const mins = Math.round(totalTime / 60);
          updateFocusStats(currentUser.uid, mins);
          showToast('Session complete! Great focus.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseFocusSession = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
  };

  const resetFocusSession = () => {
    pauseFocusSession();
    setTimeLeft(totalTime);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100 || 0;

  if (activePod) {
    return (
      <div className="fade-in col" style={{ height: '100dvh', background: '#000', position: 'relative' }}>
        <Header 
          title={activePod.title} 
          rightElement={
            <button className="ripple" onClick={() => { pauseFocusSession(); setActivePod(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, padding: '6px 14px', color: 'white', fontWeight: 700, fontSize: 13 }}>
              Leave
            </button>
          } 
        />
        
        <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(0,223,216,0.12) 0%, rgba(0,0,0,0) 70%)', zIndex: 0, pointerEvents: 'none' }} />

        <div className="flex-1 col flex-center p-4" style={{ zIndex: 1, overflowY: 'auto' }}>
          
          <button className="ripple mb-6" onClick={() => setSilentMode(!silentMode)} style={{ background: silentMode ? 'var(--primary)' : 'rgba(255,255,255,0.08)', color: silentMode ? '#000' : '#fff', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {silentMode ? <BellOff size={20} /> : <Bell size={20} />}
          </button>

          <div style={{ position: 'relative', width: '260px', height: '260px' }} className="flex-center mb-8">
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', position: 'absolute' }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle 
                cx="50" cy="50" r="46" fill="none" 
                stroke="var(--primary)" strokeWidth="4" 
                strokeDasharray="289" 
                strokeDashoffset={289 - (289 * progress) / 100} 
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="col flex-center">
              <span style={{ fontSize: '52px', fontWeight: 900, letterSpacing: -1, textShadow: isRunning ? '0 0 25px rgba(0,223,216,0.4)' : 'none', transition: 'text-shadow 0.3s' }}>
                {formatTime(timeLeft)}
              </span>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: 20, marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{activePod.category}</span>
              </div>
            </div>
          </div>

          <div className="row gap-4 mb-8">
            {!isRunning ? (
              <button onClick={startFocusSession} className="ripple flex-center" style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'var(--primary-gradient)', color: 'black', border: 'none', boxShadow: '0 4px 20px rgba(0,223,216,0.35)' }}>
                <Play size={32} fill="black" style={{ marginLeft: '4px' }} />
              </button>
            ) : (
              <button onClick={pauseFocusSession} className="ripple flex-center" style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
                <Pause size={32} fill="white" />
              </button>
            )}
            <button onClick={resetFocusSession} className="ripple flex-center" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', alignSelf: 'center' }}>
              <Square size={20} fill="white" />
            </button>
          </div>

          <div className="glass-panel p-4 mb-4" style={{ borderRadius: 20, width: '100%', maxWidth: 340 }}>
            <div className="row align-center gap-2 mb-3">
              <FileText size={16} color="var(--primary)" />
              <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1 }}>SESSION INTENT</span>
            </div>
            <input 
              type="text" 
              placeholder="What are you focusing on?" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: 14, fontWeight: 600 }} 
            />
          </div>

          <div className="row gap-2 mt-4">
            {[25, 45, 60].map(min => (
              <button 
                key={min}
                onClick={() => { pauseFocusSession(); setTimeLeft(min * 60); setTotalTime(min * 60); }}
                style={{ padding: '8px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {min}m
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in col" style={{ height: '100%', background: '#000' }}>
      <Header title="Focus Pods" />
      
      <div className="p-4" style={{ paddingBottom: '0' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Deep work. Study. Create.</p>
        
        <div className="row gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setActiveCategory(c)}
              style={{
                background: activeCategory === c ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: activeCategory === c ? 'black' : 'var(--text-muted)',
                border: 'none', padding: '8px 18px', borderRadius: 20,
                whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 800, fontSize: 12,
                transition: 'all 0.2s'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 col p-4 gap-4" style={{ overflowY: 'auto' }}>
        <div style={{ background: 'rgba(0,223,216,0.05)', border: '1px solid rgba(0,223,216,0.2)', borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,223,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={22} color="var(--primary)" />
          </div>
          <div className="col">
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--primary)', letterSpacing: 0.5 }}>NEXIFY AI INSIGHT</span>
            <span style={{ fontSize: 13, color: 'white', fontWeight: 500, marginTop: 2 }}>You've focused for <strong style={{ color: 'var(--primary)' }}>{stats.focusMinutes || 0}m</strong> this week!</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL SESSIONS</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.focusSessions || 0}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL MINUTES</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.focusMinutes || 0}m</div>
          </div>
        </div>

        <div className="col gap-3">
          {pods.map(pod => (
            <div key={pod.id} onClick={() => joinFocusPod(pod)} style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {pod.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{pod.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pod.desc}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>{pod.time} min</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,223,216,0.1)', color: 'var(--primary)' }}>{pod.category}</span>
                </div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                <Play size={14} fill="black" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FocusPods;

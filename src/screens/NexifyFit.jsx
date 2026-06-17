import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, CheckCircle, Trophy, Flame, Droplets, Moon, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { updateFitnessData } from '../services/fitness';
import { Footprints } from 'lucide-react';
import { useFitness } from '../hooks/useFitnessContext';

const WORKOUTS = [
  { id: 1, title: 'Full Body Beginner', category: 'Beginner', duration: 45, calories: 320, exercises: 8, level: 'Beginner', color: '#10b981',
    routine: [{ name: 'Jumping Jacks', reps: '45s', rest: '15s' }, { name: 'Pushups', reps: '12 reps', rest: '45s' }, { name: 'Squats', reps: '15 reps', rest: '45s' }, { name: 'Plank', reps: '30s', rest: '30s' }, { name: 'Lunges', reps: '10 each', rest: '45s' }, { name: 'Mountain Climbers', reps: '30s', rest: '30s' }, { name: 'Burpees', reps: '8 reps', rest: '60s' }, { name: 'Cool Down Stretch', reps: '60s', rest: '0s' }] },
  { id: 2, title: 'Calisthenics Power', category: 'Calisthenics', duration: 40, calories: 400, exercises: 6, level: 'Intermediate', color: '#3b82f6',
    routine: [{ name: 'Pullups', reps: '8 reps', rest: '60s' }, { name: 'Dips', reps: '12 reps', rest: '60s' }, { name: 'Pike Pushups', reps: '10 reps', rest: '45s' }, { name: 'L-Sit Hold', reps: '20s', rest: '60s' }, { name: 'Muscle-Up Practice', reps: '5 reps', rest: '90s' }, { name: 'Dead Hang', reps: '45s', rest: '30s' }] },
  { id: 3, title: 'Morning Mobility', category: 'Mobility', duration: 15, calories: 80, exercises: 5, level: 'Beginner', color: '#f59e0b',
    routine: [{ name: 'Neck Rolls', reps: '30s', rest: '10s' }, { name: 'Cat-Cow Stretch', reps: '60s', rest: '15s' }, { name: 'Hip Circles', reps: '30s each', rest: '10s' }, { name: 'Spinal Twist', reps: '45s', rest: '15s' }, { name: "Child's Pose", reps: '60s', rest: '0s' }] },
  { id: 4, title: 'Athlete Sprint Prep', category: 'Cardio', duration: 30, calories: 500, exercises: 5, level: 'Advanced', color: '#ef4444',
    routine: [{ name: 'High Knees', reps: '45s', rest: '15s' }, { name: 'Burpees', reps: '20 reps', rest: '30s' }, { name: 'Box Jumps', reps: '15 reps', rest: '45s' }, { name: 'Russian Twists', reps: '40 reps', rest: '30s' }, { name: 'Sprint Intervals', reps: '8x30s', rest: '30s' }] },
];

const CATS = ['All', 'Beginner', 'Calisthenics', 'Mobility', 'Cardio'];

const Ring = ({ pct, size = 100, stroke = 8, color = '#10b981', children }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ - (circ * Math.min(pct,100)) / 100}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{children}</div>
    </div>
  );
};

const NexifyFit = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  
  const { stats, setStats } = useFitness();

  const [cat, setCat] = useState('All');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [exIdx, setExIdx] = useState(0);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startWorkout = (w) => {
    setActiveWorkout(w); setExIdx(0); setTimer(0); setRunning(true);
    timerRef.current = setInterval(() => setTimer(p => p + 1), 1000);
  };

  const completeEx = async () => {
    if (!activeWorkout || !currentUser) return;
    if (exIdx < activeWorkout.routine.length - 1) { setExIdx(p => p + 1); return; }
    clearInterval(timerRef.current);
    const mins = Math.round(timer / 60) || 1;
    
    const newStats = {
      workoutsCompleted: stats.workoutsCompleted + 1,
      minutesTrained: (stats.minutesTrained || 0) + mins,
      calories: stats.calories + activeWorkout.calories,
      xp: (stats.xp || 0) + 100,
      streak: stats.streak + 1
    };

    await updateFitnessData(currentUser.uid, newStats);
    setActiveWorkout(null);
    showToast('Workout complete! +100 XP 🔥');
  };

  const addWater = async () => {
    if (!currentUser) return;
    const w = stats.hydration + 1;
    await updateFitnessData(currentUser.uid, { hydration: w });
    showToast(`${w}/${stats.hydrationGoal} glasses today 💧`);
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const pct = (stats.workoutsCompleted % 5) / 5 * 100;
  const xpPct = ((stats.xp || 0) % 500) / 500 * 100;
  const filtered = cat === 'All' ? WORKOUTS : WORKOUTS.filter(w => w.category === cat);

  /* ── Active workout view ── */
  if (activeWorkout) {
    const ex = activeWorkout.routine[exIdx];
    const progress = (exIdx / activeWorkout.routine.length) * 100;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => { clearInterval(timerRef.current); setActiveWorkout(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><ArrowLeft size={18} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{activeWorkout.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{exIdx + 1} / {activeWorkout.routine.length} exercises</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{fmt(timer)}</div>
        </div>

        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, #10b981, #00dfd8)`, transition: 'width 0.4s' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', gap: 24 }}>
          <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)', width: 250, height: 250, background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <Ring pct={((exIdx + 1) / activeWorkout.routine.length) * 100} size={200} stroke={10} color="#10b981">
            <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Exercise</div>
            <div style={{ fontWeight: 800, fontSize: 22, textAlign: 'center', maxWidth: 120, lineHeight: 1.2 }}>{ex.name}</div>
          </Ring>

          <div style={{ display: 'flex', gap: 16 }}>
            {[['Target', ex.reps, '#10b981'], ['Rest', ex.rest, '#a78bfa']].map(([label, val, color]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>

          <button
            onClick={completeEx}
            style={{ width: '100%', maxWidth: 300, background: 'linear-gradient(135deg, #10b981, #00dfd8)', border: 'none', borderRadius: 16, padding: '16px', color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <CheckCircle size={20} />
            {exIdx === activeWorkout.routine.length - 1 ? 'Finish Workout 🎉' : 'Complete Set'}
          </button>
        </div>
      </div>
    );
  }

  /* ── Dashboard view ── */
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
        <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><ArrowLeft size={20} /></button>
        <div style={{ position: 'relative' }}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#10b981', borderRadius: '50%', border: '2px solid black' }} />
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Nexify Fit</h1>
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Zap size={11} color="#10b981" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{stats.xp || 0} XP</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Today's Progress (Steps & Calories) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Steps */}
          <div style={{ background: 'linear-gradient(140deg, rgba(10,15,31,0.95), rgba(5,20,15,0.95))', border: '1px solid rgba(0,223,216,0.2)', borderRadius: 20, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, left: 12 }}><Footprints size={16} color="#00dfd8" /></div>
            <Ring pct={(stats.steps / stats.stepGoal) * 100} size={100} stroke={8} color="#00dfd8">
              <div style={{ fontSize: 18, fontWeight: 800, color: '#00dfd8' }}>{stats.steps}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Steps</div>
            </Ring>
            <div style={{ fontSize: 10, color: '#00dfd8', marginTop: 8, fontWeight: 700 }}>Active: {Math.floor(stats.steps / 100)}m {stats.steps % 60}s</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Goal: {stats.stepGoal}</div>
          </div>
          
          {/* Calories */}
          <div style={{ background: 'linear-gradient(140deg, rgba(10,15,31,0.95), rgba(20,5,5,0.95))', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, left: 12 }}><Flame size={16} color="#ef4444" /></div>
            <Ring pct={(stats.calories / stats.calorieGoal) * 100} size={100} stroke={8} color="#ef4444">
              <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>{stats.calories}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Kcal</div>
            </Ring>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Goal: {stats.calorieGoal}</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { icon: Flame, label: 'Streak', value: `${stats.streak || 0}d`, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            { icon: Trophy, label: 'Workouts', value: stats.workoutsCompleted || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { icon: TrendingUp, label: 'Level', value: `Lv ${Math.floor((stats.xp || 0) / 500) + 1}`, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} style={{ background: 'rgba(10,15,31,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color }}>{value}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* XP Bar */}
        <div style={{ background: 'rgba(10,15,31,0.8)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 16, padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Fitness XP</span>
            <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700 }}>{(stats.xp || 0) % 500} / 500 XP</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, #7928ca, #a78bfa)', borderRadius: 4, transition: 'width 1s ease', boxShadow: '0 0 8px rgba(167,139,250,0.4)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Level {Math.floor((stats.xp || 0) / 500) + 1}</span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Level {Math.floor((stats.xp || 0) / 500) + 2}</span>
          </div>
        </div>

        {/* Water tracker */}
        <div style={{ background: 'rgba(10,15,31,0.8)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16, padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Droplets size={16} color="#3b82f6" />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Water Intake</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{stats.hydration} / {stats.hydrationGoal} glasses</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 28, borderRadius: 6, background: i < stats.hydration ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)' : 'rgba(255,255,255,0.07)', border: `1px solid ${i < stats.hydration ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.3s', boxShadow: i < stats.hydration ? '0 0 6px rgba(59,130,246,0.3)' : 'none' }} />
            ))}
          </div>
          <button onClick={addWater} style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '9px', color: '#3b82f6', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Droplets size={14} /> Log Glass of Water
          </button>
        </div>

        {/* Sleep tracker */}
        <div style={{ background: 'rgba(10,15,31,0.8)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 16, padding: '14px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Ring pct={75} size={72} stroke={6} color="#a78bfa">
            <Moon size={18} color="#a78bfa" />
          </Ring>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Sleep Quality</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#a78bfa' }}>7h 30m</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Recommended: 7–9 hours</div>
          </div>
        </div>

        {/* Workouts list */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Today's Workout</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, border: 'none', background: cat === c ? 'linear-gradient(135deg, #10b981, #00dfd8)' : 'rgba(255,255,255,0.07)', color: cat === c ? 'white' : 'var(--text-muted)', fontSize: 12, fontWeight: cat === c ? 700 : 500, cursor: 'pointer', boxShadow: cat === c ? '0 2px 10px rgba(16,185,129,0.3)' : 'none', flexShrink: 0 }}>
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(w => (
              <div key={w.id} style={{ background: 'rgba(10,15,31,0.9)', border: `1px solid ${w.color}25`, borderRadius: 18, padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${w.color}15`, border: `1px solid ${w.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 14px ${w.color}25` }}>
                  <Flame size={24} color={w.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{w.title}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{w.exercises} exercises</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>• {w.duration} min</span>
                    <span style={{ fontSize: 10, color: w.color, fontWeight: 600 }}>• {w.calories} kcal</span>
                  </div>
                  <span style={{ display: 'inline-block', marginTop: 5, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${w.color}15`, color: w.color }}>{w.level}</span>
                </div>
                <button onClick={() => startWorkout(w)} style={{ background: `linear-gradient(135deg, ${w.color}, ${w.color}cc)`, border: 'none', borderRadius: 12, padding: '10px 14px', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, boxShadow: `0 4px 14px ${w.color}40` }}>
                  <Play size={14} /> Start
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Achievements</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { emoji: '🔥', title: 'First Workout', desc: 'Complete 1 workout', done: stats.workoutsCompleted >= 1 },
              { emoji: '💪', title: 'Consistent', desc: 'Complete 5 workouts', done: stats.workoutsCompleted >= 5 },
              { emoji: '🏆', title: 'Champion', desc: 'Reach 500 XP', done: (stats.xp || 0) >= 500 },
              { emoji: '💧', title: 'Hydrated', desc: 'Log 8 glasses', done: stats.hydration >= 8 },
            ].map(({ emoji, title, desc, done }) => (
              <div key={title} style={{ background: done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${done ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '12px', opacity: done ? 1 : 0.5 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: done ? '#10b981' : 'white', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NexifyFit;

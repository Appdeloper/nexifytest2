import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, CheckCircle, Trash2, Zap, Target, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { subscribeTasks, createTask, completeTask, deleteTask, TASK_TYPES, SUGGESTED_TASKS } from '../services/tasks';
import { awardXPWithLimit } from '../services/admin';
import { RankBadge } from '../components/Badges';

const FILTER_TABS = ['All', 'Active', 'Completed'];
const CATEGORIES = [
  { id: 'daily', label: 'Daily', color: '#00dfd8', icon: '📅' },
  { id: 'focus', label: 'Focus', color: '#7928ca', icon: '🧠' },
  { id: 'fitness', label: 'Fitness', color: '#10b981', icon: '💪' },
  { id: 'social', label: 'Social', color: '#ff0080', icon: '🤝' },
];

const TaskCard = ({ task, onComplete, onDelete }) => {
  const def = TASK_TYPES[task.type] || TASK_TYPES.daily;
  return (
    <div style={{
      background: 'rgba(10,15,31,0.9)', border: task.completed
        ? '1px solid rgba(16,185,129,0.2)'
        : `1px solid ${def.color}20`,
      borderRadius: 16, padding: '14px', display: 'flex', alignItems: 'center', gap: 12,
      opacity: task.completed ? 0.7 : 1, transition: 'all 0.3s'
    }}>
      <button
        onClick={() => !task.completed && onComplete(task)}
        style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: task.completed ? '#10b981' : 'rgba(255,255,255,0.06)',
          border: task.completed ? 'none' : `2px solid ${def.color}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: task.completed ? 'default' : 'pointer', transition: 'all 0.2s'
        }}
      >
        {task.completed && <CheckCircle size={14} color="white" />}
      </button>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.icon || def.icon} {task.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: `${def.color}15`, color: def.color }}>
            {def.label}
          </span>
          <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>+{task.xpReward} XP</span>
          {task.deadline && (
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              Due: {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        {!task.completed && task.progress > 0 && (
          <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${task.progress}%`, background: `linear-gradient(90deg, ${def.color}, ${def.color}cc)`, borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
        )}
      </div>

      <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,85,85,0.5)', padding: 4, flexShrink: 0 }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const Tasks = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', type: 'daily', xpReward: 50, deadline: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeTasks(currentUser.uid, setTasks);
    return () => unsub();
  }, [currentUser]);

  const userXP = currentUser?.xp || 0;

  const filtered = tasks.filter(t => {
    if (filter === 'Active') return !t.completed;
    if (filter === 'Completed') return t.completed;
    return true;
  });

  const active = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);
  const totalXP = done.reduce((s, t) => s + (t.xpReward || 0), 0);

  const handleComplete = async (task) => {
    await completeTask(currentUser.uid, task.id);
    // Award actual task XP directly to Firestore (bypasses daily limit for tasks)
    await awardXPWithLimit(currentUser.uid, 'COMPLETE_TASK');
    showToast(`+${task.xpReward} XP earned! 🎉`);
  };

  const handleDelete = async (taskId) => {
    await deleteTask(currentUser.uid, taskId);
    showToast('Task removed');
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) { showToast('Enter a task name'); return; }
    setCreating(true);
    try {
      await createTask(currentUser.uid, { ...newTask, title: newTask.title.trim() });
      setNewTask({ title: '', type: 'daily', xpReward: 50, deadline: '' });
      setShowCreate(false);
      showToast('Task created! ✅');
    } catch { showToast('Failed to create task'); }
    finally { setCreating(false); }
  };

  const addSuggested = async (s) => {
    await createTask(currentUser.uid, { title: s.title, type: s.type, xpReward: s.xpReward, icon: s.icon });
    showToast(`"${s.title}" added!`);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><ArrowLeft size={18} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <img src="/logo.png" alt="Logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#10b981', borderRadius: '50%', border: '2px solid black' }} />
          </div>
          <h1 className="header-title" style={{ fontSize: 20 }}>Nexify Tasks</h1>
        </div>
        <RankBadge xp={userXP} size="sm" />
        <button onClick={() => setShowCreate(true)} style={{ background: 'var(--grad-premium)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,223,216,0.3)' }}>
          <Plus size={18} color="white" />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, padding: '14px 14px 28px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Active', value: active.length, color: '#00dfd8', bg: 'rgba(0,223,216,0.08)' },
            { label: 'Done', value: done.length, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
            { label: 'XP Earned', value: `${totalXP}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${color}20`, borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          {FILTER_TABS.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              flex: 1, padding: '8px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              background: filter === t ? 'linear-gradient(135deg,#7928ca,#00dfd8)' : 'rgba(255,255,255,0.06)',
              color: filter === t ? 'white' : 'var(--text-muted)',
              boxShadow: filter === t ? '0 2px 10px rgba(0,223,216,0.2)' : 'none'
            }}>{t}</button>
          ))}
        </div>

        {/* Suggested Tasks */}
        {filter === 'All' && active.length < 3 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>⚡ SUGGESTED TODAY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTED_TASKS.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,223,216,0.04)', border: '1px dashed rgba(0,223,216,0.2)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }} onClick={() => addSuggested(s)}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>+{s.xpReward} XP</div>
                  </div>
                  <Plus size={16} color="#00dfd8" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12, textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={28} color="#00e5ff" strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No tasks here</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add tasks to earn XP and track progress.</p>
              </div>
              <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg,#7928ca,#00dfd8)', border: 'none', borderRadius: 14, padding: '12px 24px', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Create Task
              </button>
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>

      {/* Create Task bottom sheet */}
      {showCreate && (
        <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{ width: '100%', background: '#0a0f1f', borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom,12px))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16 }}>New Task</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <input
              type="text" placeholder="Task title..."
              value={newTask.title}
              onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: 'white', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
              autoFocus
            />

            <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
              {Object.entries(TASK_TYPES).map(([key, def]) => (
                <button key={key} onClick={() => setNewTask(p => ({ ...p, type: key }))} style={{
                  whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: newTask.type === key ? `${def.color}25` : 'rgba(255,255,255,0.06)',
                  color: newTask.type === key ? def.color : 'var(--text-muted)',
                  fontWeight: newTask.type === key ? 700 : 500, fontSize: 11,
                  boxShadow: newTask.type === key ? `0 0 8px ${def.color}40` : 'none',
                  flexShrink: 0
                }}>{def.icon} {def.label}</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={14} color="#f59e0b" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>XP:</span>
                <select value={newTask.xpReward} onChange={e => setNewTask(p => ({ ...p, xpReward: Number(e.target.value) }))} style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontWeight: 700, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                  {[10,25,50,75,100].map(v => <option key={v} value={v} style={{ background: '#0a0f1f' }}>{v}</option>)}
                </select>
              </div>
              <input type="date" value={newTask.deadline} onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value }))} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12, outline: 'none' }} />
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              style={{ width: '100%', background: 'linear-gradient(135deg,#7928ca,#00dfd8)', border: 'none', borderRadius: 14, padding: '14px', color: 'white', fontWeight: 800, fontSize: 15, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.6 : 1, boxShadow: '0 4px 16px rgba(0,223,216,0.25)' }}
            >
              {creating ? 'Creating...' : 'Create Task ✅'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

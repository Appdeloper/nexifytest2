import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Bookmark, MessageSquare, AlertCircle, CheckCircle, Clock, Sparkles, BrainCircuit, TrendingUp } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import edgeData from '../data/edgeData.json';
import { useAuth } from '../hooks/useAuth';
import { subscribeTasks, completeTask, createTask } from '../services/tasks';
import { Target, CheckCircle2, ChevronRight } from 'lucide-react';

const CATEGORIES = ['All', 'State', 'India', 'World', 'Politics', 'Students', 'Tech'];

export const loadEdgeUpdates = () => {
  return edgeData;
};

export const filterEdgeCategory = (updates, category) => {
  if (category === 'All') return updates;
  return updates.filter(u => u.category === category);
};

export const saveEdgeArticle = (id) => {
  const saved = JSON.parse(localStorage.getItem('savedEdge') || '[]');
  if (!saved.includes(id)) {
    saved.push(id);
    localStorage.setItem('savedEdge', JSON.stringify(saved));
  }
};

export const getSavedArticles = () => {
  return JSON.parse(localStorage.getItem('savedEdge') || '[]');
};

const NexifyEdge = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeBrief, setActiveBrief] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // In future this would be a fetch
    setUpdates(loadEdgeUpdates());
    setSavedIds(getSavedArticles());

    if (currentUser) {
      const unsub = subscribeTasks(currentUser.uid, setTasks);
      return () => unsub();
    }
  }, [currentUser?.uid]);

  const handleCompleteTask = async (taskId) => {
    if (!currentUser) return;
    try {
      await completeTask(currentUser.uid, taskId);
      showToast('Task completed! +50 XP');
    } catch (e) {
      showToast('Error completing task');
    }
  };

  const handleAddDemoTasks = async () => {
    if (!currentUser) return;
    try {
      await createTask(currentUser.uid, { title: 'Complete 20 min focus session', category: 'Study', xpReward: 50 });
      await createTask(currentUser.uid, { title: 'Walk 5000 steps', category: 'Fitness', xpReward: 50 });
      await createTask(currentUser.uid, { title: 'Drink water', category: 'Health', xpReward: 20 });
      showToast('Suggested tasks added!');
    } catch (e) {
      showToast('Error adding tasks');
    }
  };

  const openEdgeBrief = (brief) => {
    setActiveBrief(brief);
  };

  const handleSave = (id) => {
    saveEdgeArticle(id);
    setSavedIds([...savedIds, id]);
    showToast('Brief saved for later');
  };

  const displayedUpdates = filterEdgeCategory(updates, activeCategory);

  if (activeBrief) {
    const isSaved = savedIds.includes(activeBrief.id);
    return (
      <div className="fade-in col" style={{ height: '100%', background: 'var(--bg-main)' }}>
        <Header 
          title="Edge Brief" 
          rightElement={
            <button className="icon-btn" onClick={() => setActiveBrief(null)}>
              <span className="text-sm font-bold text-muted">Close</span>
            </button>
          } 
        />
        
        <div className="flex-1 col p-4 gap-6" style={{ overflowY: 'auto' }}>
          <div>
            <div className="row align-center gap-2 mb-3">
              <span className="text-xs px-2 py-1 font-bold" style={{ background: 'var(--primary)', color: 'black', borderRadius: '4px' }}>
                {activeBrief.category}
              </span>
              <span className="text-xs text-muted px-2 py-1" style={{ border: '1px solid var(--border-glass)', borderRadius: '4px' }}>
                {activeBrief.status}
              </span>
              <span className="text-xs text-muted">{activeBrief.time}</span>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">{activeBrief.title}</h1>
            <div className="glass-panel p-3 mb-4" style={{ borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
              <div className="row align-center gap-2 mb-2">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary">AI SUMMARY</span>
              </div>
              <p className="text-sm leading-relaxed">{activeBrief.summary}</p>
            </div>
          </div>

          <div className="col gap-6">
            <section>
              <h3 className="font-bold text-sm text-primary mb-2">WHAT HAPPENED?</h3>
              <p className="text-sm leading-relaxed">{activeBrief.whatHappened}</p>
            </section>

            <section className="glass-panel p-4" style={{ borderRadius: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <h3 className="font-bold text-sm text-primary mb-2 flex align-center gap-2" style={{ color: '#8b5cf6' }}>
                <BrainCircuit size={16} /> WHY IT MATTERS
              </h3>
              <p className="text-sm leading-relaxed">{activeBrief.whyItMatters}</p>
            </section>

            <section className="glass-panel p-4" style={{ borderRadius: '16px' }}>
              <h3 className="font-bold text-sm text-primary mb-3">KEY FACTS</h3>
              <ul className="text-sm col gap-2" style={{ paddingLeft: '16px', listStyleType: 'disc' }}>
                {activeBrief.keyFacts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-sm text-primary mb-2 flex align-center gap-2">
                <AlertCircle size={16} /> WHAT IS UNCLEAR
              </h3>
              <p className="text-sm leading-relaxed text-muted">{activeBrief.whatIsUnclear}</p>
            </section>

            <section>
              <h3 className="font-bold text-sm text-primary mb-2">SOURCES</h3>
              <div className="row gap-2 flex-wrap">
                {activeBrief.sources.map((src, i) => (
                  <span key={i} className="text-xs px-2 py-1" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{src}</span>
                ))}
              </div>
            </section>
          </div>

          <div className="row gap-4 mt-4 pb-8">
            <button 
              onClick={() => handleSave(activeBrief.id)} 
              className="icon-btn flex-1 flex-center glass-panel" 
              style={{ height: '56px', borderRadius: '16px', border: isSaved ? '1px solid var(--primary)' : '1px solid var(--border-glass)' }}
            >
              <Bookmark size={20} className={isSaved ? "text-primary" : "text-muted"} style={{ fill: isSaved ? "var(--primary)" : "none" }} />
              <span className="ml-2 font-bold text-sm" style={{ color: isSaved ? "var(--primary)" : "white" }}>{isSaved ? "Saved" : "Save"}</span>
            </button>
            <GradientButton onClick={() => showToast('Discussions not available in Demo Mode')} className="flex-2" style={{ height: '56px', borderRadius: '16px' }}>
              <MessageSquare size={20} className="mr-2" /> Discuss
            </GradientButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in col" style={{ height: '100%', position: 'relative' }}>
      <Header title="Nexify Edge" showBack={true} />
      

      
      <div className="p-4" style={{ paddingBottom: '0' }}>
        <div className="row flex-between align-center mb-4">
          <p className="text-muted m-0">Stay aware. Stay sharp.</p>
          <div className="row align-center gap-1 px-2 py-1" style={{ background: 'rgba(255,85,85,0.1)', color: '#ff5555', borderRadius: '16px' }}>
            <TrendingUp size={12} />
            <span className="text-xs font-bold">Trending</span>
          </div>
        </div>
        
        <div className="row gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                color: activeCategory === cat ? 'black' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '16px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: activeCategory === cat ? 'bold' : '400'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* Suggested Tasks Section */}
        <div className="mb-4">
          <div className="row flex-between align-center mb-2">
            <h3 className="font-bold text-sm row align-center gap-2"><Target size={16} className="text-primary"/> Suggested Tasks</h3>
            {tasks.length === 0 && (
               <button onClick={handleAddDemoTasks} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Load Suggestions</button>
            )}
          </div>
          <div className="row gap-3" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
            {tasks.filter(t => !t.completed).map(task => (
              <div key={task.id} className="glass-panel col p-3" style={{ minWidth: '160px', borderRadius: '16px', border: '1px solid rgba(0, 223, 216, 0.2)' }}>
                <span className="text-xs font-bold mb-1" style={{ color: 'var(--primary)' }}>{task.category}</span>
                <span className="text-sm font-bold mb-3">{task.title}</span>
                <div className="row flex-between align-center mt-auto">
                  <span className="text-xs text-muted">+{task.xpReward} XP</span>
                  <button onClick={() => handleCompleteTask(task.id)} className="icon-btn" style={{ width: '28px', height: '28px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {tasks.filter(t => !t.completed).length === 0 && tasks.length > 0 && (
              <div className="glass-panel col p-3 flex-center text-center" style={{ minWidth: '100%', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle2 size={24} color="#10b981" className="mb-2" />
                <span className="text-sm font-bold text-muted">All caught up! Great job.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="flex-1 col p-4 gap-4" style={{ overflowY: 'auto' }}>
        {displayedUpdates.length === 0 ? (
          <div className="flex-1 flex-center col">
            <Clock size={40} className="text-muted mb-4" />
            <span className="text-muted text-sm">No updates available in this category.</span>
          </div>
        ) : (
          displayedUpdates.map(update => (
            <GlassCard key={update.id} className="col p-4 gap-3">
              <div className="row flex-between align-center">
                <span className="text-xs px-2 py-1 font-bold" style={{ background: 'var(--primary-gradient)', color: 'black', borderRadius: '4px' }}>
                  {update.category}
                </span>
                <span className="text-xs text-muted row align-center gap-1">
                  <CheckCircle size={12} /> {update.status}
                </span>
              </div>
              
              <h3 className="font-bold text-lg">{update.title}</h3>
              <p className="text-sm text-muted">{update.summary}</p>
              
              <div className="row flex-between align-center mt-2">
                <span className="text-xs text-muted">{update.sourceLabel} • {update.time}</span>
                <button 
                  onClick={() => openEdgeBrief(update)}
                  style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                >
                  Read Brief
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};

export default NexifyEdge;

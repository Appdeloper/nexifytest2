import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { 
  Bookmark, MessageSquare, AlertCircle, CheckCircle, Clock, 
  Sparkles, BrainCircuit, TrendingUp, Target, CheckCircle2, 
  ChevronRight, Compass, Settings, Zap, ArrowRight, BookOpen, Loader2
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../hooks/useAuth';
import { createTask } from '../services/tasks';
import { 
  subscribeUserPreferences, updateUserPreferences, 
  subscribeSavedEdgePosts, saveEdgePost, unsaveEdgePost, 
  subscribeEdgePosts, seedEdgePostsIfEmpty 
} from '../services/edge';
import { explainEdgeUpdate } from '../services/gemini';

const ALL_INTEREST_TAGS = ['Tech', 'Focus', 'Students', 'Motivation', 'Design', 'Science'];

const NexifyEdge = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Firestore state
  const [posts, setPosts] = useState([]);
  const [preferences, setPreferences] = useState({ interests: ['Tech', 'Focus', 'Students', 'Motivation'] });
  const [savedIds, setSavedIds] = useState([]);
  
  // UI filter state
  const [activeTab, setActiveTab] = useState('Personalized');
  const [showPrefPanel, setShowPrefPanel] = useState(false);
  
  // AI Explain state
  const [explainPost, setExplainPost] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');

  // 1. Seed database & subscribe to Firestore collections
  useEffect(() => {
    // Seed initial posts if Firestore collection is empty
    seedEdgePostsIfEmpty();

    // Subscribe to global edge posts
    const unsubPosts = subscribeEdgePosts((fetchedPosts) => {
      setPosts(fetchedPosts);
    });

    if (currentUser) {
      // Subscribe to user personalized preferences
      const unsubPrefs = subscribeUserPreferences(currentUser.uid, (prefs) => {
        if (prefs) setPreferences(prefs);
      });

      // Subscribe to saved posts list
      const unsubSaved = subscribeSavedEdgePosts(currentUser.uid, (saved) => {
        setSavedIds(saved);
      });

      return () => {
        unsubPosts();
        unsubPrefs();
        unsubSaved();
      };
    }

    return () => {
      unsubPosts();
    };
  }, [currentUser?.uid]);

  // 2. Personalization Toggles
  const handleToggleInterest = async (interest) => {
    if (!currentUser) {
      showToast('Log in to personalize your feed');
      return;
    }
    const currentInterests = preferences.interests || [];
    let updatedInterests;
    if (currentInterests.includes(interest)) {
      updatedInterests = currentInterests.filter(i => i !== interest);
    } else {
      updatedInterests = [...currentInterests, interest];
    }
    try {
      await updateUserPreferences(currentUser.uid, updatedInterests);
      showToast(`Interests updated!`);
    } catch (e) {
      showToast('Failed to update preferences');
    }
  };

  // 3. Save / Unsave Article
  const handleToggleSave = async (postId) => {
    if (!currentUser) {
      showToast('Log in to save updates');
      return;
    }
    const isSaved = savedIds.includes(postId);
    try {
      if (isSaved) {
        await unsaveEdgePost(currentUser.uid, postId);
        showToast('Brief removed from saved list');
      } else {
        await saveEdgePost(currentUser.uid, postId);
        showToast('Brief saved successfully!');
      }
    } catch (e) {
      showToast('Error modifying saved list');
    }
  };

  // 4. AI Explain Modal Action
  const handleExplain = async (post) => {
    setExplainPost(post);
    setExplainLoading(true);
    setAiExplanation('');
    try {
      const explanation = await explainEdgeUpdate(post.title, post.content, post.type);
      setAiExplanation(explanation);
    } catch (e) {
      setAiExplanation('Unable to fetch detailed explanation. Please check your network or try again.');
    } finally {
      setExplainLoading(false);
    }
  };

  // 5. Apply Actions: Convert to Task or Launch Focus Pods
  const handleApplyAction = async (post) => {
    if (!currentUser) {
      showToast('Log in to apply this action');
      return;
    }
    
    // Check type of post for context-specific actions
    if (post.type === 'tip' || post.type === 'tool' || post.type === 'motivation') {
      try {
        await createTask(currentUser.uid, {
          title: `Apply Edge: ${post.title}`,
          category: post.category || 'Productivity',
          xpReward: 50,
        });
        showToast('Added to your tasks! +50 XP target');
      } catch (e) {
        showToast('Error converting to task');
      }
    } else {
      showToast('Applying this insight...');
    }
  };

  const handleStartFocus = () => {
    navigate('/focus-pods');
    showToast('Redirected to Focus Pods!');
  };

  // 6. Compute Daily Edge Brief: Exactly 1 AI, 1 Tip, 1 Motivation, 1 Tool
  const getDailyBrief = () => {
    const brief = [];
    const aiPost = posts.find(p => p.type === 'ai');
    const tipPost = posts.find(p => p.type === 'tip');
    const motivationPost = posts.find(p => p.type === 'motivation');
    const toolPost = posts.find(p => p.type === 'tool');

    if (aiPost) brief.push({ ...aiPost, label: '1. AI Insight' });
    if (tipPost) brief.push({ ...tipPost, label: '2. Actionable Tip' });
    if (motivationPost) brief.push({ ...motivationPost, label: '3. Daily Motivation' });
    if (toolPost) brief.push({ ...toolPost, label: '4. Essential Tool' });

    return brief;
  };

  const dailyBrief = getDailyBrief();

  // 7. Compute Filtered Feed based on user preferences and tab
  const getFilteredFeed = () => {
    if (activeTab === 'Saved') {
      return posts.filter(p => savedIds.includes(p.id));
    }
    
    if (activeTab === 'Personalized') {
      const interests = preferences.interests || [];
      return posts.filter(p => interests.includes(p.category));
    }

    // Otherwise activeTab represents a specific interest category (e.g. 'Tech', 'Focus', etc.)
    return posts.filter(p => p.category === activeTab);
  };

  const filteredFeed = getFilteredFeed();
  const trendingTools = posts.filter(p => p.type === 'tool').slice(0, 4);

  return (
    <div className="fade-in col" style={{ height: '100%', background: '#08080c', color: '#f3f4f6', overflowY: 'auto' }}>
      <Header title="Nexify Edge" showBack={true} />
      
      {/* ── Top Hero Welcome ────────────────────────────────────── */}
      <div className="p-4" style={{ background: 'linear-gradient(180deg, rgba(0, 223, 216, 0.05) 0%, rgba(8, 8, 12, 0) 100%)' }}>
        <div className="row flex-between align-center mb-1">
          <div className="row align-center gap-2">
            <Zap className="text-primary" size={20} />
            <h2 className="m-0 text-xl font-bold tracking-tight">AI Insights Feed</h2>
          </div>
          <button 
            onClick={() => setShowPrefPanel(!showPrefPanel)} 
            className="icon-btn" 
            style={{ 
              background: showPrefPanel ? 'rgba(0, 223, 216, 0.15)' : 'rgba(255,255,255,0.05)', 
              color: 'var(--primary)', 
              padding: '8px 12px', 
              borderRadius: '12px',
              border: showPrefPanel ? '1px solid var(--primary)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Settings size={14} />
            <span className="text-xs font-bold">Preferences</span>
          </button>
        </div>
        <p className="text-xs text-muted m-0">Personalized intelligence curated to boost your performance.</p>

        {/* ── Personalization Panel ────────────────────────────────── */}
        {showPrefPanel && (
          <div className="mt-3 p-4 glass-panel fade-in" style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 className="text-xs font-bold tracking-wider text-muted mb-2 uppercase">Custom Interest Engine</h4>
            <p className="text-xs text-muted mb-3">Select categories to train your real-time personalization model.</p>
            <div className="row gap-2 flex-wrap">
              {ALL_INTEREST_TAGS.map(interest => {
                const isActive = (preferences.interests || []).includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => handleToggleInterest(interest)}
                    style={{
                      background: isActive ? 'rgba(0, 223, 216, 0.15)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                      border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      boxShadow: isActive ? '0 0 10px rgba(0, 223, 216, 0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Daily Edge Brief ─────────────────────────────────────── */}
      {dailyBrief.length > 0 && (
        <div className="px-4 mb-5">
          <div className="row align-center gap-2 mb-3">
            <Sparkles size={16} className="text-primary" />
            <h3 className="m-0 text-sm font-bold tracking-wider uppercase text-muted">Daily Edge Brief</h3>
            <span className="text-xs px-2 py-0.5" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', borderRadius: '4px', fontWeight: 'bold' }}>4 Updates</span>
          </div>
          
          <div className="row gap-3" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
            {dailyBrief.map(brief => {
              const isSaved = savedIds.includes(brief.id);
              return (
                <div 
                  key={brief.id} 
                  className="glass-panel col p-4" 
                  style={{ 
                    minWidth: '280px', 
                    maxWidth: '280px', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(0, 223, 216, 0.15)',
                    background: 'linear-gradient(135deg, rgba(8, 8, 12, 0.8) 0%, rgba(139, 92, 246, 0.03) 100%)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                    position: 'relative'
                  }}
                >
                  <div className="row flex-between align-center mb-2">
                    <span className="text-xs font-bold text-primary tracking-wide uppercase">{brief.label}</span>
                    <button 
                      onClick={() => handleToggleSave(brief.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? 'var(--primary)' : 'var(--text-muted)' }}
                    >
                      <Bookmark size={16} style={{ fill: isSaved ? 'var(--primary)' : 'none' }} />
                    </button>
                  </div>
                  
                  <h4 className="text-sm font-bold mb-2 line-clamp-2" style={{ height: '40px', lineHeight: '1.4' }}>{brief.title}</h4>
                  <p className="text-xs text-muted mb-4 line-clamp-3" style={{ height: '54px', overflow: 'hidden' }}>{brief.summary || brief.content}</p>
                  
                  <div className="row gap-2 mt-auto">
                    <button 
                      onClick={() => handleExplain(brief)}
                      style={{ 
                        flex: 1, 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'white', 
                        padding: '8px', 
                        borderRadius: '10px', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <BrainCircuit size={12} /> AI Explain
                    </button>
                    <button 
                      onClick={() => handleApplyAction(brief)}
                      style={{ 
                        flex: 1, 
                        background: 'var(--primary-gradient)', 
                        border: 'none', 
                        color: 'black', 
                        padding: '8px', 
                        borderRadius: '10px', 
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(0, 223, 216, 0.2)'
                      }}
                    >
                      Apply Action
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Trending Section ─────────────────────────────────────── */}
      {trendingTools.length > 0 && (
        <div className="px-4 mb-5">
          <div className="row flex-between align-center mb-3">
            <div className="row align-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="m-0 text-sm font-bold tracking-wider uppercase text-muted">Trending Tech & Tools</h3>
            </div>
            {briefHasFocusType(posts) && (
              <button 
                onClick={handleStartFocus}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  fontSize: '11px', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  cursor: 'pointer'
                }}
              >
                Start Focus <ArrowRight size={12} />
              </button>
            )}
          </div>
          <div className="row gap-3" style={{ overflowX: 'auto', paddingBottom: '6px' }}>
            {trendingTools.map(tool => (
              <div 
                key={tool.id} 
                className="glass-panel p-3 col gap-1" 
                style={{ 
                  minWidth: '180px', 
                  borderRadius: '16px', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid rgba(0, 223, 216, 0.08)' 
                }}
              >
                <div className="row flex-between align-center">
                  <span className="text-xs font-bold text-muted" style={{ fontSize: '10px' }}>{tool.category}</span>
                  <span className="text-xs" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>TOOL</span>
                </div>
                <h4 className="text-xs font-bold mt-1 line-clamp-1">{tool.title}</h4>
                <p className="text-xs text-muted mb-2 line-clamp-2" style={{ fontSize: '10px' }}>{tool.summary}</p>
                <button 
                  onClick={() => handleApplyAction(tool)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    padding: '6px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: 'auto',
                    textAlign: 'center'
                  }}
                >
                  Install/Add Task
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Curated Feed Tabs ────────────────────────────────────── */}
      <div className="px-4">
        <div className="row gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          {['Personalized', 'Saved', 'Tech', 'Focus', 'Students', 'Motivation'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? 'black' : 'var(--text-muted)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '16px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                boxShadow: activeTab === tab ? '0 0 10px rgba(0, 223, 216, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Curated Feed Card List ──────────────────────────────── */}
        <div className="col gap-4 pb-8">
          {filteredFeed.length === 0 ? (
            <div className="col flex-center py-8 text-center">
              <BookOpen size={32} className="text-muted mb-2" />
              <p className="text-sm text-muted">No insights available here.</p>
              {activeTab === 'Personalized' && (
                <button 
                  onClick={() => setShowPrefPanel(true)} 
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  Configure interests to train model
                </button>
              )}
            </div>
          ) : (
            filteredFeed.map(post => {
              const isSaved = savedIds.includes(post.id);
              return (
                <GlassCard key={post.id} className="col p-4 gap-3" style={{ border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.015)' }}>
                  <div className="row flex-between align-center">
                    <div className="row align-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider" style={{ background: 'rgba(0, 223, 216, 0.1)', color: 'var(--primary)', borderRadius: '4px', fontSize: '9px' }}>
                        {post.category}
                      </span>
                      <span className="text-xs text-muted font-mono" style={{ fontSize: '10px' }}>
                        {post.type.toUpperCase()}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleToggleSave(post.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? 'var(--primary)' : 'var(--text-muted)' }}
                    >
                      <Bookmark size={16} style={{ fill: isSaved ? 'var(--primary)' : 'none' }} />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-base m-0 leading-tight">{post.title}</h3>
                  <p className="text-xs text-muted leading-relaxed m-0">{post.content}</p>
                  
                  <div className="row flex-between align-center mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-xs text-muted font-mono" style={{ fontSize: '10px' }}>
                      {post.createdAt ? new Date(post.createdAt.seconds * 1000 || post.createdAt).toLocaleDateString() : 'Active Insights'}
                    </span>
                    
                    <div className="row gap-2">
                      <button 
                        onClick={() => handleExplain(post)}
                        style={{ 
                          background: 'none', 
                          border: '1px solid rgba(0, 223, 216, 0.3)', 
                          color: 'var(--primary)', 
                          padding: '6px 12px', 
                          borderRadius: '12px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold', 
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <BrainCircuit size={12} /> AI Explain
                      </button>
                      <button 
                        onClick={() => handleApplyAction(post)}
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          color: 'white', 
                          padding: '6px 12px', 
                          borderRadius: '12px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold', 
                          fontSize: '11px' 
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      </div>

      {/* ── AI Explain Modal Overlay ────────────────────────────── */}
      {explainPost && (
        <div 
          className="fade-in flex-center" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.85)', 
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            className="glass-panel col p-5 gap-4" 
            style={{ 
              width: '100%', 
              maxWidth: '480px', 
              maxHeight: '80vh', 
              borderRadius: '24px', 
              border: '1px solid rgba(0, 223, 216, 0.3)',
              background: '#0a0a0f',
              boxShadow: '0 0 30px rgba(0, 223, 216, 0.15)',
              overflowY: 'auto'
            }}
          >
            <div className="row flex-between align-center pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="row align-center gap-2">
                <Sparkles className="text-primary animate-pulse" size={18} />
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Nexify AI Neural Engine</span>
              </div>
              <button 
                onClick={() => setExplainPost(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  fontWeight: 'bold' 
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-2">
              <span className="text-xs text-muted uppercase tracking-wider">{explainPost.category} • {explainPost.type}</span>
              <h3 className="text-lg font-bold mt-1 mb-3">{explainPost.title}</h3>
              
              <div className="p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '3px solid var(--primary)', marginBottom: '16px' }}>
                <p className="text-xs text-muted italic m-0">"{explainPost.content}"</p>
              </div>

              {explainLoading ? (
                <div className="col flex-center py-6 gap-2">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-xs text-muted">Synthesizing deep breakdown...</span>
                </div>
              ) : (
                <div className="ai-explanation-content text-sm leading-relaxed" style={{ color: '#e5e7eb' }}>
                  {aiExplanation.split('\n').map((line, idx) => {
                    if (line.startsWith('###')) {
                      return <h4 key={idx} className="font-bold text-primary mt-4 mb-2" style={{ fontSize: '13px' }}>{line.replace('###', '').trim()}</h4>;
                    }
                    if (line.startsWith('**') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                      return <p key={idx} className="mb-2" style={{ fontWeight: 'bold', fontSize: '12px' }}>{line}</p>;
                    }
                    return <p key={idx} className="mb-2 text-muted" style={{ fontSize: '12px' }}>{line}</p>;
                  })}
                </div>
              )}
            </div>

            <div className="row gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button 
                onClick={() => {
                  handleApplyAction(explainPost);
                  setExplainPost(null);
                }}
                style={{ 
                  flex: 1, 
                  background: 'var(--primary-gradient)', 
                  color: 'black', 
                  border: 'none', 
                  padding: '12px', 
                  borderRadius: '14px', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(0, 223, 216, 0.2)'
                }}
              >
                Apply as Task
              </button>
              {explainPost.category === 'Focus' && (
                <button 
                  onClick={() => {
                    handleStartFocus();
                    setExplainPost(null);
                  }}
                  style={{ 
                    flex: 1, 
                    background: 'rgba(139, 92, 246, 0.15)', 
                    color: '#a78bfa', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    padding: '12px', 
                    borderRadius: '14px', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer' 
                  }}
                >
                  Start Focus Timer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to detect focus tags
const briefHasFocusType = (posts) => {
  return posts.some(p => p.category === 'Focus');
};

export default NexifyEdge;

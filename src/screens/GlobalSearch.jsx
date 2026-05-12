import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Search, Sparkles, Clock, ArrowRight, MessageSquare, Users, Dumbbell, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';

const RECENT_SEARCHES = ['Deep work pod', 'React developers', 'State updates', 'Morning mobility'];
const QUICK_FILTERS = ['All', 'Chats', 'Rooms', 'Edge', 'Fit', 'Pods'];

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timeout = setTimeout(() => {
      // Mock global search results based on query
      const lowerQuery = query.toLowerCase();
      const mockResults = [];
      
      if ('react developers'.includes(lowerQuery) || lowerQuery === 'react') {
        mockResults.push({ id: 1, type: 'Rooms', title: 'React Developers', desc: 'Public community room', icon: Users });
      }
      if ('morning mobility'.includes(lowerQuery) || lowerQuery === 'morning') {
        mockResults.push({ id: 2, type: 'Fit', title: 'Morning Mobility', desc: '15 min Beginner Routine', icon: Dumbbell });
      }
      if ('deep work pod'.includes(lowerQuery) || lowerQuery === 'deep') {
        mockResults.push({ id: 3, type: 'Pods', title: 'Deep Work Pod', desc: '60 min Focus Session', icon: Clock });
      }
      if ('state updates'.includes(lowerQuery) || lowerQuery === 'state') {
        mockResults.push({ id: 4, type: 'Edge', title: 'State Elections 2026', desc: 'Latest updates on local politics', icon: Zap });
      }
      if (mockResults.length === 0) {
        mockResults.push({ id: 5, type: 'Chats', title: `Discussion: ${query}`, desc: 'AI Suggested Group', icon: MessageSquare });
      }

      setResults(mockResults.filter(r => activeFilter === 'All' || r.type === activeFilter));
      setIsSearching(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [query, activeFilter]);

  return (
    <div className="fade-in col" style={{ height: '100dvh', background: 'var(--bg-main)' }}>
      <Header title="Smart Search" showBack rightElement={<Sparkles size={20} className="text-primary" />} />
      
      <div className="p-4" style={{ paddingBottom: '0' }}>
        <div className="row align-center glass-panel mb-4" style={{ padding: '12px 16px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(0,223,216,0.3)', background: 'rgba(0,223,216,0.05)' }}>
          <Search size={20} className="text-primary mr-2" />
          <input 
            type="text" 
            placeholder="Search anything (Chats, Rooms, Fit...)" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, marginLeft: '8px', fontSize: '16px' }} 
            autoFocus
          />
        </div>

        <div className="row gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
          {QUICK_FILTERS.map(filter => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              style={{
                background: activeFilter === filter ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: activeFilter === filter ? 'black' : 'var(--text-muted)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '16px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: activeFilter === filter ? 'bold' : '400'
              }}
              className="ripple"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 col p-4 gap-4" style={{ overflowY: 'auto' }}>
        {!query.trim() ? (
          <div className="col gap-4 fade-in">
            <h3 className="font-bold text-sm text-muted">RECENT SEARCHES</h3>
            <div className="col gap-2">
              {RECENT_SEARCHES.map((search, i) => (
                <div key={i} className="row align-center flex-between p-3 ripple" onClick={() => setQuery(search)} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer' }}>
                  <div className="row gap-3 align-center">
                    <Clock size={16} className="text-muted" />
                    <span className="text-sm">{search}</span>
                  </div>
                  <ArrowRight size={16} className="text-muted" />
                </div>
              ))}
            </div>
          </div>
        ) : isSearching ? (
          <div className="flex-center flex-1 col gap-3">
            <div className="loader"></div>
            <span className="text-muted text-sm animate-pulse">Searching universe...</span>
          </div>
        ) : (
          <div className="col gap-3 fade-in">
            {results.length === 0 ? (
              <div className="flex-center p-8 text-center text-muted">
                No results found for "{query}". Try a different filter.
              </div>
            ) : (
              results.map(result => (
                <GlassCard key={result.id} className="row align-center flex-between p-3 ripple" style={{ cursor: 'pointer', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  <div className="row gap-3 align-center">
                    <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0,223,216,0.1)' }}>
                      <result.icon size={20} className="text-primary" />
                    </div>
                    <div className="col">
                      <span className="font-bold text-sm">{result.title}</span>
                      <div className="row gap-2 align-center mt-1">
                        <span className="text-xs px-2 py-1 font-bold" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{result.type}</span>
                        <span className="text-xs text-muted truncate">{result.desc}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-primary" />
                </GlassCard>
              ))
            )}
          </div>
        )}
      </div>
      <style>{`
        .loader {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 223, 216, 0.2);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default GlobalSearch;

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Search, Sparkles, Clock, ArrowRight, MessageSquare, Users, Dumbbell, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { getAllUsers } from '../services/users';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const RECENT_SEARCHES = ['Deep work pod', 'React developers', 'State updates', 'Morning mobility'];
const QUICK_FILTERS = ['All', 'Chats', 'Rooms', 'Edge', 'Fit', 'Pods'];

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);

  const { currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [allRooms, setAllRooms] = useState([]);

  useEffect(() => {
    // Pre-fetch data for fast filtering
    const loadData = async () => {
      try {
        const users = await getAllUsers(currentUser?.uid);
        setAllUsers(users);

        const q = query(collection(db, 'rooms'), where('privacy', '==', 'public'));
        const roomsSnap = await getDocs(q);
        const rooms = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllRooms(rooms);
      } catch (e) {
        console.error("Search data load error:", e);
      }
    };
    if (currentUser) loadData();
  }, [currentUser]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const timeout = setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      const matched = [];
      
      // Match users
      allUsers.forEach(u => {
        if (u.displayName?.toLowerCase().includes(lowerQuery) || u.username?.toLowerCase().includes(lowerQuery)) {
          matched.push({
            id: `user_${u.uid}`,
            navId: u.uid,
            type: 'Users',
            title: u.displayName,
            desc: `@${u.username} • ${u.role || 'Member'}`,
            icon: Users,
            path: `/friends`
          });
        }
      });

      // Match rooms
      allRooms.forEach(r => {
        if (r.name?.toLowerCase().includes(lowerQuery) || r.description?.toLowerCase().includes(lowerQuery)) {
          matched.push({
            id: `room_${r.id}`,
            navId: r.id,
            type: 'Rooms',
            title: r.name,
            desc: `${r.members?.length || 0} members • Public`,
            icon: MessageSquare,
            path: `/room-chat/${r.id}`
          });
        }
      });

      // Default quick actions if no matches
      if (matched.length === 0) {
        if (lowerQuery.includes('fit') || lowerQuery.includes('step')) {
          matched.push({ id: 'quick_fit', type: 'Fit', title: 'Nexify Fit', desc: 'Track your steps', icon: Dumbbell, path: '/fit' });
        } else if (lowerQuery.includes('pod') || lowerQuery.includes('focus')) {
          matched.push({ id: 'quick_pod', type: 'Pods', title: 'Focus Pods', desc: 'Join a deep work session', icon: Clock, path: '/focus-pods' });
        }
      }

      setResults(matched.filter(r => activeFilter === 'All' || r.type === activeFilter));
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, activeFilter, allUsers, allRooms]);

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
                <GlassCard 
                  key={result.id} 
                  className="row align-center flex-between p-3 ripple" 
                  onClick={() => navigate(result.path)}
                  style={{ cursor: 'pointer', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                >
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

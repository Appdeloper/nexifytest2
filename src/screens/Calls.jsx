import React, { useEffect, useState } from 'react';
import { Phone, PhoneForwarded, PhoneMissed, Video, Search, PhoneCall, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../hooks/useAuth';
import { loadCallHistory } from '../services/calls';
import { getUserData } from '../services/users';
import GlassCard from '../components/GlassCard';
import { useCall } from '../components/CallProvider';
import EmptyState from '../components/EmptyState';
import { RoleBadge, RankBadge } from '../components/Badges';



const TABS = ['Recent Calls', 'Missed Calls'];

const Calls = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { startVoiceCall, startVideoCall } = useCall();
  const [calls, setCalls] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Recent Calls');
  const [usersCache, setUsersCache] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const unsub = loadCallHistory(currentUser.uid, async (callList) => {
      const newCache = { ...usersCache };
      let updated = false;
      for (const call of callList) {
        const otherId = call.callerId === currentUser.uid ? call.receiverId : call.callerId;
        if (!newCache[otherId]) {
          const user = await getUserData(otherId);
          newCache[otherId] = user;
          updated = true;
        }
      }
      if (updated) setUsersCache(newCache);
      setCalls(callList);
    });
    return () => { if (typeof unsub === 'function') unsub(); else unsub.then(fn => fn && fn()); };
  }, [currentUser?.uid]);

  const handleCallback = (uid, type) => {
    if (type === 'voice') startVoiceCall(uid);
    else startVideoCall(uid);
  };

  const displayedCalls = calls.filter(c => {
    if (activeTab === 'Missed Calls' && c.status !== 'missed' && !(c.status === 'declined' && c.receiverId === currentUser.uid)) return false;
    if (search) {
      const otherId = c.callerId === currentUser.uid ? c.receiverId : c.callerId;
      if (!usersCache[otherId]?.displayName?.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="fade-in col" style={{ height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} />
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Calls</h1>
        </div>
        <button
          onClick={() => showToast('Select a user from your friends list to start a call.')}
          style={{ background: 'var(--primary-gradient)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', boxShadow: '0 2px 10px rgba(0,223,216,0.35)' }}
        >
          <PhoneForwarded size={17} />
        </button>
      </div>

      <div style={{ margin: '12px 16px 0', background: 'rgba(255, 152, 0, 0.15)', border: '1px solid rgba(255, 152, 0, 0.5)', padding: '10px 14px', borderRadius: '12px', color: '#ffcc80', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontWeight: 800 }}>BETA:</span> WebRTC Calls are in beta. Expect connection instability.
      </div>

      {/* Search + Tabs */}
      <div style={{ padding: '12px 16px 0', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text" placeholder="Search recent calls..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: 13 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, paddingBottom: 12 }}>
          {TABS.map(tab => (
            <button
              key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.06)',
                color: activeTab === tab ? 'white' : 'var(--text-muted)',
                border: 'none', padding: '7px 16px', borderRadius: 20,
                whiteSpace: 'nowrap', cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 500, fontSize: 12,
                boxShadow: activeTab === tab ? '0 2px 10px rgba(0,223,216,0.3)' : 'none'
              }}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* Call List */}
      <div className="flex-1 col" style={{ overflowY: 'auto', padding: '8px 16px 16px' }}>
        {displayedCalls.length === 0 ? (
          <EmptyState 
            icon={Phone}
            title="No calls yet"
            description="Start a voice or video call with a friend. All your activity will appear here."
            actionText="Find Friends"
            onAction={() => showToast('Select a user from your friends list to start a call.')}
          />
        ) : (
          <div className="col gap-3">
            {displayedCalls.map(call => {
              const isOutgoing = call.callerId === currentUser.uid;
              const otherId = isOutgoing ? call.receiverId : call.callerId;
              const user = usersCache[otherId];
              const time = call.createdAt ? new Date(call.createdAt.toDate()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
              const isMissed = call.status === 'missed' || (call.status === 'declined' && !isOutgoing);
              const statusColor = isMissed ? '#ff4444' : 'var(--text-muted)';
              const statusText = isMissed ? 'Missed' : isOutgoing ? `Outgoing (${call.status})` : `Incoming (${call.status})`;

              return (
                <GlassCard key={call.id || call.callId} className="row align-center flex-between" style={{ padding: '12px 14px' }}>
                  <div className="row align-center gap-3">
                    <img
                      src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`}
                      alt="" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.07)' }}
                    />
                    <div className="col">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: isMissed ? '#ff4444' : 'white' }}>
                          {user?.displayName || 'Unknown User'}
                        </span>
                        {user?.role && user.role !== 'member' && <RoleBadge role={user.role} size="xs" hideLabel />}
                        {user && <RankBadge xp={user.xp || 0} size="xs" showIcon={false} />}
                      </div>

                      <div className="row align-center gap-2 mt-1">
                        {call.type === 'video' ? <Video size={11} color={statusColor} /> : <Phone size={11} color={statusColor} />}
                        <span style={{ fontSize: 11, color: statusColor }}>{statusText}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>• {time}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCallback(otherId, call.type)}
                    style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#00e5ff' }}
                  >
                    <PhoneCall size={16} />
                  </button>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calls;

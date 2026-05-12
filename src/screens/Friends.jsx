import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, UserPlus, UserCheck, UserX, ArrowLeft, Users,
  Clock, CheckCircle, X, MessageSquare, ChevronRight, Loader
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import {
  searchUsers, sendFriendRequest, cancelFriendRequest,
  acceptFriendRequest, declineFriendRequest, removeFriend,
  subscribeIncomingRequests, subscribeSentRequests, subscribeFriends,
  getFriendshipStatus,
} from '../services/friends';
import { getUserData } from '../services/users';
import { createOrGetDMChat } from '../services/chat';

/* ── helpers ── */
import Avatar from '../components/Avatar';

const Pill = ({ color, bg, children }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, color, background: bg }}>
    {children}
  </span>
);

const Btn = ({ onClick, color, bg, border, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: bg || 'transparent', border: border || 'none',
      color: color || 'white', borderRadius: 20, padding: '7px 14px',
      cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12,
      display: 'flex', alignItems: 'center', gap: 5, opacity: disabled ? 0.5 : 1,
      flexShrink: 0, transition: 'all 0.2s', whiteSpace: 'nowrap'
    }}
  >
    {children}
  </button>
);

const TABS = ['Friends', 'Requests', 'Find'];

const Friends = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState('Friends');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [friends, setFriends] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState({});
  const [incoming, setIncoming] = useState([]);
  const [incomingProfiles, setIncomingProfiles] = useState({});
  const [sent, setSent] = useState([]);
  const [sentProfiles, setSentProfiles] = useState({});

  const [loadingActions, setLoadingActions] = useState({});
  const [statuses, setStatuses] = useState({});

  /* subscriptions */
  useEffect(() => {
    if (!currentUser) return;
    const unsubFr = subscribeFriends(currentUser.uid, async list => {
      setFriends(list);
      const profiles = {};
      for (const fr of list) {
        const otherId = fr.users.find(u => u !== currentUser.uid);
        if (otherId && !profiles[otherId]) {
          profiles[otherId] = await getUserData(otherId);
        }
      }
      setFriendProfiles(profiles);
    });
    const unsubIn = subscribeIncomingRequests(currentUser.uid, async list => {
      setIncoming(list);
      const profiles = {};
      for (const r of list) {
        if (!profiles[r.from]) profiles[r.from] = await getUserData(r.from);
      }
      setIncomingProfiles(profiles);
    });
    const unsubSent = subscribeSentRequests(currentUser.uid, async list => {
      setSent(list);
      const profiles = {};
      for (const r of list) {
        if (!profiles[r.to]) profiles[r.to] = await getUserData(r.to);
      }
      setSentProfiles(profiles);
    });
    return () => { unsubFr(); unsubIn(); unsubSent(); };
  }, [currentUser]);

  /* search */
  useEffect(() => {
    if (tab !== 'Find') return;
    if (!searchQ || searchQ.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const results = await searchUsers(searchQ, currentUser.uid);
      // Fetch friendship status for each
      const statusMap = {};
      for (const u of results) {
        statusMap[u.uid] = await getFriendshipStatus(currentUser.uid, u.uid);
      }
      setStatuses(statusMap);
      setSearchResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ, tab]);

  const withLoading = async (key, fn) => {
    setLoadingActions(p => ({ ...p, [key]: true }));
    try { await fn(); } catch (e) { showToast(e.message); }
    finally { setLoadingActions(p => ({ ...p, [key]: false })); }
  };

  const handleAddFriend = (uid) => withLoading(uid, async () => {
    await sendFriendRequest(currentUser.uid, uid);
    setStatuses(p => ({ ...p, [uid]: 'sent' }));
    showToast('Friend request sent!');
  });

  const handleCancelRequest = (uid) => withLoading(uid, async () => {
    await cancelFriendRequest(currentUser.uid, uid);
    setStatuses(p => ({ ...p, [uid]: 'none' }));
    showToast('Request cancelled.');
  });

  const handleAccept = (fromUid) => withLoading(fromUid + '_accept', async () => {
    await acceptFriendRequest(fromUid, currentUser.uid);
    showToast('Friend added! 🎉');
  });

  const handleDecline = (fromUid) => withLoading(fromUid + '_decline', async () => {
    await declineFriendRequest(fromUid, currentUser.uid);
    showToast('Request declined.');
  });

  const handleRemoveFriend = (uid) => withLoading(uid + '_remove', async () => {
    await removeFriend(currentUser.uid, uid);
    showToast('Friend removed.');
  });

  const handleMessage = async (uid) => {
    const chatId = await createOrGetDMChat(currentUser.uid, uid);
    navigate(`/chat-conversation/${chatId}`);
  };

  /* ── render ── */
  return (
    <div className="fade-in col" style={{ height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => navigate('/home')} 
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ position: 'relative' }}>
            <img src="/logo.png" style={{ width: 32, height: 32, borderRadius: 8 }} alt="Logo" />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, background: '#10b981', borderRadius: '50%', border: '1.5px solid black' }} />
          </div>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Friends</h1>
        {incoming.length > 0 && (
          <div style={{ background: '#ff5555', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
            {incoming.length}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0', background: 'rgba(0,0,0,0.3)' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.06)',
              color: tab === t ? 'white' : 'var(--text-muted)',
              border: 'none', padding: '8px 18px', borderRadius: 20,
              cursor: 'pointer', fontWeight: tab === t ? 700 : 500, fontSize: 13,
              boxShadow: tab === t ? '0 2px 10px rgba(0,223,216,0.3)' : 'none',
              position: 'relative', transition: 'all 0.2s'
            }}
          >
            {t}
            {t === 'Requests' && incoming.length > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#ff5555', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {incoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── FRIENDS TAB ── */}
      {tab === 'Friends' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {friends.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: '40px 0', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,229,255,0.08)', border: '2px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={32} color="#00e5ff" strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>No friends yet</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>Search for users and send friend requests.</p>
              </div>
              <button onClick={() => setTab('Find')} style={{ background: 'var(--primary-gradient)', border: 'none', borderRadius: 14, padding: '12px 24px', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,223,216,0.3)' }}>
                Find Friends
              </button>
            </div>
          ) : (
            friends.map(fr => {
              const otherId = fr.users.find(u => u !== currentUser.uid);
              const profile = friendProfiles[otherId] || {};
              return (
                <div key={fr.id} style={{
                  background: 'var(--bg-card)', borderRadius: 16, padding: '12px 14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <Avatar user={profile} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{profile.displayName || 'User'}</div>
                    <div style={{ fontSize: 11, color: profile.presence === 'online' ? '#00dfd8' : 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {profile.statusText ? (
                        <span style={{ color: 'white' }}>{profile.statusText}</span>
                      ) : (
                        <span>{profile.presence === 'online' ? 'Online' : (profile.presence === 'away' ? 'Away' : (profile.presence === 'dnd' ? 'Busy' : 'Offline'))}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleMessage(otherId)} style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#00e5ff' }}>
                    <MessageSquare size={15} />
                  </button>
                  <button onClick={() => handleRemoveFriend(otherId)} style={{ background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ff5555' }}>
                    <UserX size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === 'Requests' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {incoming.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>
                INCOMING ({incoming.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {incoming.map(req => {
                  const profile = incomingProfiles[req.from] || {};
                  return (
                    <div key={req.id} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px', border: '1px solid rgba(0,223,216,0.12)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar user={profile} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{profile.displayName || 'User'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{profile.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn onClick={() => handleAccept(req.from)} color="black" bg="var(--primary-gradient)" disabled={loadingActions[req.from + '_accept']}>
                          {loadingActions[req.from + '_accept'] ? <Loader size={12} /> : <CheckCircle size={13} />} Accept
                        </Btn>
                        <Btn onClick={() => handleDecline(req.from)} color="#ff5555" border="1px solid rgba(255,85,85,0.3)" disabled={loadingActions[req.from + '_decline']}>
                          <X size={13} />
                        </Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sent.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>
                SENT ({sent.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sent.map(req => {
                  const profile = sentProfiles[req.to] || {};
                  return (
                    <div key={req.id} style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar user={profile} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{profile.displayName || 'User'}</div>
                        <Pill color="var(--text-muted)" bg="rgba(255,255,255,0.06)">Pending</Pill>
                      </div>
                      <Btn onClick={() => handleCancelRequest(req.to)} color="#ff5555" border="1px solid rgba(255,85,85,0.3)" disabled={loadingActions[req.to]}>
                        Cancel
                      </Btn>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {incoming.length === 0 && sent.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: '40px 0', textAlign: 'center' }}>
              <Clock size={40} color="var(--text-muted)" strokeWidth={1.5} />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>No pending requests</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Friend requests will appear here.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FIND TAB ── */}
      {tab === 'Find' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '11px 14px', marginBottom: 12 }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                autoFocus
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: 14 }}
              />
              {searching && <Loader size={14} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />}
              {searchQ && <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><X size={14} /></button>}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!searchQ && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: '40px 0', textAlign: 'center' }}>
                <Search size={40} color="var(--text-muted)" strokeWidth={1.5} />
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Find people on Nexify</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>Search by name or email address.</p>
                </div>
              </div>
            )}

            {searchQ && !searching && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                No users found for "{searchQ}"
              </div>
            )}

            {searchResults.map(user => {
              const status = statuses[user.uid] || 'none';
              return (
                <div key={user.uid} style={{
                  background: 'var(--bg-card)', borderRadius: 16, padding: '12px 14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <Avatar user={user} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.displayName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                  {status === 'none' && (
                    <Btn onClick={() => handleAddFriend(user.uid)} color="white" bg="var(--primary-gradient)" disabled={loadingActions[user.uid]}>
                      {loadingActions[user.uid] ? <Loader size={13} /> : <UserPlus size={13} />} Add
                    </Btn>
                  )}
                  {status === 'sent' && (
                    <Btn onClick={() => handleCancelRequest(user.uid)} color="var(--text-muted)" border="1px solid rgba(255,255,255,0.12)" disabled={loadingActions[user.uid]}>
                      <Clock size={13} /> Sent
                    </Btn>
                  )}
                  {status === 'received' && (
                    <Btn onClick={() => handleAccept(user.uid)} color="black" bg="var(--primary-gradient)" disabled={loadingActions[user.uid]}>
                      <CheckCircle size={13} /> Accept
                    </Btn>
                  )}
                  {status === 'friends' && (
                    <Btn color="#00dfd8" border="1px solid rgba(0,223,216,0.25)">
                      <UserCheck size={13} /> Friends
                    </Btn>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Friends;

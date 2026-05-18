import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Search, Shield, Star, Zap, Ban, RotateCcw,
  ChevronDown, ChevronRight, Clock, User, AlertTriangle,
  CheckCircle, X, Loader, Settings, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { db } from '../services/firebase';
import { collection, getDocs, query, orderBy, limit, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { RANKS, ROLES } from '../services/xp';
import {
  getCurrentUserRole, canManageRoles, canAssignRole,
  updateUserRole, updateUserRankManual, adjustUserXP,
  toggleUserVerification, banUser, unbanUser
} from '../services/admin';
import { RankBadge, RoleBadge } from '../components/Badges';

const ROLE_OPTIONS = ['member', 'verified', 'moderator', 'admin', 'owner'];
const RANK_OPTIONS = RANKS.map(r => r.id);

// ── Confirm modal ──────────────────────────────────────────
const ConfirmModal = ({ title, desc, confirmLabel, onConfirm, onClose, danger }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div onClick={e => e.stopPropagation()} className="pop-in" style={{ background: '#0a0f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: danger ? 'rgba(255,85,85,0.15)' : 'rgba(0,223,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={24} color={danger ? '#ff5555' : '#00dfd8'} />
        </div>
        <h3 style={{ fontWeight: 900, fontSize: 18 }}>{title}</h3>
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>{desc}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 14, padding: '14px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex: 1, background: danger ? 'linear-gradient(135deg, #ff5555, #b91c1c)' : 'linear-gradient(135deg, #00dfd8, #0070f3)', border: 'none', borderRadius: 14, padding: '14px', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: danger ? '0 8px 20px rgba(255,85,85,0.3)' : '0 8px 20px rgba(0,223,216,0.3)' }}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── User detail sheet ──────────────────────────────────────
const UserSheet = ({ user, actorRole, actorUid, onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState('');
  const [xpDelta, setXpDelta] = useState('');
  const [confirm, setConfirm] = useState(null);

  const act = async (label, fn) => {
    setLoading(label);
    try { 
      await fn(); 
      showToast(`${label} applied ✅`); 
      onRefresh(); 
    } catch (e) { 
      showToast(e.message); 
    } finally { 
      setLoading(''); 
      setConfirm(null); 
    }
  };

  const userRank = RANKS.find(r => r.id === user.rank) || RANKS[0];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{ width: '100%', background: '#000', borderRadius: '32px 32px 0 0', border: '1px solid rgba(255,255,255,0.1)', padding: '24px 16px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom,12px))', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
        
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="" style={{ width: 64, height: 64, borderRadius: 20, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'white' }}>{user.displayName || 'Unknown'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>@{user.username || 'user'}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <RoleBadge role={user.role || 'member'} />
              <RankBadge rankId={user.rank} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={20} /></button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'XP POINTS', value: (user.xp || 0).toLocaleString(), color: '#00dfd8' },
            { label: 'LEVEL', value: Math.floor((user.xp || 0) / 100) + 1, color: '#d000ff' },
            { label: 'VERIFIED', value: user.verified ? 'YES' : 'NO', color: user.verified ? '#2f80ff' : 'rgba(255,255,255,0.2)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 15, color }}>{value}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 0.5 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Verification Toggle */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, display: 'block', marginBottom: 10 }}>IDENTITY VERIFICATION</label>
            <button
              onClick={() => act(user.verified ? 'Unverify' : 'Verify', () => toggleUserVerification(actorUid, actorRole, user.uid, !user.verified))}
              style={{
                width: '100%', padding: '14px', borderRadius: 16, cursor: 'pointer', fontWeight: 800, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: user.verified ? 'rgba(47,128,255,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${user.verified ? 'rgba(47,128,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                color: user.verified ? '#2f80ff' : 'white'
              }}
            >
              {user.verified ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
              {user.verified ? 'Remove Verification Badge' : 'Verify User Account'}
            </button>
          </div>

          {/* Role selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, display: 'block', marginBottom: 10 }}>UPDATE SYSTEM ROLE</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLE_OPTIONS.filter(r => canAssignRole(actorRole, r)).map(r => (
                <button
                  key={r}
                  onClick={() => setConfirm({ title: `Set Role: ${r.toUpperCase()}`, desc: `Update ${user.displayName}'s system role to ${r.toUpperCase()}?`, action: () => act(`Role → ${r}`, () => updateUserRole(actorUid, actorRole, user.uid, r)) })}
                  style={{
                    padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                    background: user.role === r ? `${ROLES[r]?.color}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${user.role === r ? ROLES[r]?.color : 'rgba(255,255,255,0.1)'}`,
                    color: user.role === r ? ROLES[r]?.color : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.2s'
                  }}
                >
                  {ROLES[r]?.icon} {ROLES[r]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rank selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, display: 'block', marginBottom: 10 }}>MANUAL RANK OVERRIDE</label>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {RANKS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setConfirm({ title: `Set Rank: ${r.name}`, desc: `Manually set rank to ${r.name}. This will stop automatic XP progression until reset.`, action: () => act(`Rank → ${r.name}`, () => updateUserRankManual(actorUid, actorRole, user.uid, r.id)) })}
                  style={{
                    padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap',
                    background: user.rank === r.id ? `${r.color}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${user.rank === r.id ? r.color : 'rgba(255,255,255,0.1)'}`,
                    color: user.rank === r.id ? r.color : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {r.icon} {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* XP Adjustment */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, display: 'block', marginBottom: 10 }}>ADJUST XP POINTS</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <input
                type="number"
                placeholder="Amount (e.g. 500 or -200)"
                value={xpDelta}
                onChange={e => setXpDelta(e.target.value)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px', color: 'white', fontWeight: 600, fontSize: 14, outline: 'none' }}
              />
              <button
                onClick={() => { if (!xpDelta) return; act(`XP ${xpDelta > 0 ? '+' : ''}${xpDelta}`, () => adjustUserXP(actorUid, actorRole, user.uid, Number(xpDelta))); setXpDelta(''); }}
                disabled={!xpDelta || loading}
                style={{ background: 'linear-gradient(135deg, #7928ca, #00dfd8)', border: 'none', borderRadius: 14, padding: '14px 24px', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,223,216,0.2)' }}
              >
                Apply
              </button>
            </div>
            <button
              onClick={() => setConfirm({ title: 'Reset XP', desc: `Reset all XP for ${user.displayName}? This cannot be undone.`, action: () => act('XP Reset', () => adjustUserXP(actorUid, actorRole, user.uid, -(user.xp || 0))) })}
              style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <RotateCcw size={14} /> Reset XP to 0
            </button>
          </div>


          {/* Danger Zone */}
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setConfirm({ title: 'Ban User', desc: `Are you sure you want to ban ${user.displayName}? They will lose access to all Nexify services.`, action: () => act('Ban', () => banUser(actorUid, actorRole, user.uid, 'Administrative Action')), danger: true })}
              style={{ width: '100%', padding: '14px', borderRadius: 16, border: '1px solid rgba(255,85,85,0.3)', background: 'rgba(255,85,85,0.08)', color: '#ff5555', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <Ban size={18} /> Ban Permanent Account
            </button>
          </div>

        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.title} desc={confirm.desc}
          confirmLabel="Confirm Action" danger={confirm.danger}
          onConfirm={confirm.action} onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

// ── Admin Logs panel ────────────────────────────────────────
const LogsPanel = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    const qr = query(collection(db, 'adminLogs'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(qr, snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const ACTION_COLORS = { 
    ROLE_CHANGE: '#d000ff', RANK_CHANGE: '#f59e0b', XP_ADD: '#00dfd8', XP_REMOVE: '#ff5555', 
    XP_RESET: '#ff5555', BAN: '#ff5555', UNBAN: '#10b981', VERIFY: '#2f80ff', UNVERIFY: '#9ca3af'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {logs.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)' }}>No administrative logs recorded.</div>}
      {logs.map(log => (
        <div key={log.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 8, background: `${ACTION_COLORS[log.action] || '#9ca3af'}15`, color: ACTION_COLORS[log.action] || '#9ca3af', border: `1px solid ${ACTION_COLORS[log.action] || '#9ca3af'}30` }}>{log.action}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{log.createdAt?.toDate ? new Date(log.createdAt.toDate()).toLocaleTimeString() : 'Just now'}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            Action by <span style={{ color: 'white', fontWeight: 700 }}>{log.changedBy?.slice(0, 6)}</span> on <span style={{ color: 'white', fontWeight: 700 }}>{log.targetUid?.slice(0, 6)}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontFamily: 'monospace' }}>
            {log.oldValue} → <span style={{ color: '#00dfd8' }}>{log.newValue}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Main Admin Panel ────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [actorRole, setActorRole] = useState('member');
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tab, setTab] = useState('users');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getCurrentUserRole(currentUser.uid).then(role => {
      setActorRole(role);
      if (canManageRoles(role)) {
        setAuthorized(true);
      } else {
        showToast('Access Denied. Elevated privileges required.');
        navigate('/home');
      }
    });
  }, [currentUser?.uid]);

  const handleSeed = async () => {
    setLoading(true);
    const { seedSystemCollections } = await import('../services/seeding');
    const success = await seedSystemCollections();
    if (success) showToast('System collections initialized! ✅');
    else showToast('Seeding failed. Check console.');
    setLoading(false);
  };

  useEffect(() => {
    if (!authorized) return;
    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);
      setFiltered(list);
      setLoading(false);
    }, (err) => {
      console.error("AdminPanel users subscription failed:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [authorized]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.displayName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    ));
  }, [search, users]);

  if (!authorized) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', overflow: 'hidden' }}
    >
      {/* ── High-Tech Console Header ── */}
      <div style={{ 
        padding: '24px 20px', 
        background: 'var(--bg-glass-heavy)', 
        borderBottom: '1px solid var(--border-neon)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16,
        backdropFilter: 'blur(30px)',
        zIndex: 100
      }}>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)} 
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <ArrowLeft size={22} />
        </motion.button>
        
        <div style={{ flex: 1 }}>
          <h1 className="header-title" style={{ fontSize: 22, textShadow: '0 0 10px rgba(0,223,216,0.3)' }}>Nexus HQ</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div className="pulse-dot" style={{ background: 'var(--primary)' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary)', letterSpacing: 2 }}>ADMINISTRATIVE UPLINK</span>
          </div>
        </div>

        <RoleBadge role={actorRole} size="md" />
        
        {actorRole === 'owner' && (
          <motion.button 
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSeed}
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)' }}
            title="Seed System Data"
          >
            <Settings size={20} />
          </motion.button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '16px', gap: 10 }}>
        {[{ id: 'users', label: 'Citizens', icon: User }, { id: 'logs', label: 'Security Logs', icon: Clock }].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '14px', borderRadius: 16, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: tab === id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              border: tab === id ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
              color: tab === id ? 'white' : 'rgba(255,255,255,0.4)',
              fontWeight: 800, fontSize: 13, transition: 'all 0.2s'
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Search size={18} color="rgba(255,255,255,0.3)" />
              <input
                placeholder="Search by name, username or email..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none', fontSize: 14, fontWeight: 500 }}
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: 10, padding: '0 16px 20px' }}>
            {[
              { label: 'Active Users', value: users.length, color: '#00dfd8' },
              { label: 'Verified', value: users.filter(u => u.verified).length, color: '#2f80ff' },
              { label: 'Flagged', value: users.filter(u => u.banned).length, color: '#ff5555' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* User List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 24 }} />)
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-dim)' }}>No citizens found matching search criteria.</div>
            ) : (
              filtered.map((u, i) => (
                <motion.div
                  key={u.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedUser(u)}
                  className="premium-card"
                  style={{
                    background: u.banned ? 'rgba(255,85,85,0.05)' : 'var(--bg-glass)',
                    border: `1px solid ${u.banned ? 'rgba(255,85,85,0.2)' : 'var(--border-glass)'}`,
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} style={{ width: 52, height: 52, borderRadius: 16, objectFit: 'cover', border: '2px solid var(--border-glass)' }} alt="" />
                    {u.verified && <div style={{ position: 'absolute', bottom: -6, right: -6, background: 'var(--primary)', borderRadius: '50%', padding: 4, border: '2px solid var(--bg-main)', boxShadow: '0 4px 10px rgba(0,223,216,0.3)' }}><ShieldCheck size={12} color="black" /></div>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className="header-title" style={{ fontSize: 16 }}>{u.displayName || 'Unknown'}</span>
                      <RoleBadge role={u.role || 'member'} size="xs" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <RankBadge rankId={u.rank} size="xs" />
                      <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--primary)', textShadow: '0 0 10px rgba(0,223,216,0.2)' }}>{u.xp?.toLocaleString()} XP</span>
                    </div>
                  </div>
                  <ChevronRight size={20} color="var(--text-dim)" />
                </motion.div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
          <LogsPanel />
        </div>
      )}

      {selectedUser && (
        <UserSheet
          user={users.find(u => u.uid === selectedUser.uid) || selectedUser}
          actorRole={actorRole}
          actorUid={currentUser.uid}
          onClose={() => setSelectedUser(null)}
          onRefresh={() => setSelectedUser(null)}
        />
      )}
    </motion.div>
  );
};

export default AdminPanel;

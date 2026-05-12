import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Lock, Bell, Palette, MessageSquare, Phone,
  HardDrive, Shield, HelpCircle, Info, LogOut, ChevronRight,
  Eye, EyeOff, Volume2, Vibrate, Download, Trash2, CheckCircle2,
  X, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { logoutUser } from '../services/auth';
import { updateUserProfile, uploadAvatar, saveUserPrefs } from '../services/profile';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';

/* ─── tiny helpers ─── */
const Toggle = ({ value, onChange }) => (
  <div
    onClick={() => onChange(!value)}
    style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
      background: value ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
      position: 'relative', transition: 'background 0.3s',
      flexShrink: 0
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: value ? 23 : 3,
      width: 18, height: 18, borderRadius: '50%', background: 'white',
      transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
    }} />
  </div>
);

const Row = ({ icon: Icon, color = '#00dfd8', title, sub, right, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: onClick ? 'pointer' : 'default'
    }}
    className={onClick ? 'ripple' : ''}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Icon size={18} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
    {right || (onClick && <ChevronRight size={16} color="var(--text-muted)" />)}
  </div>
);

const Section = ({ label, children }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, padding: '16px 0 4px' }}>
      {label}
    </div>
    <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '0 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
      {children}
    </div>
  </div>
);

/* ─── Bottom Sheet ─── */
const Sheet = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column',
    justifyContent: 'flex-end', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
  }} onClick={onClose}>
    <div
      onClick={e => e.stopPropagation()}
      className="slide-up"
      style={{
        background: 'var(--bg-card)', borderRadius: '24px 24px 0 0',
        padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/* ─── Detail Sheets ─── */
const AccountSheet = ({ user, onClose }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    status: user?.status || "Hey, I'm using Nexify Connect"
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      await updateUserProfile(user.uid, formData);
      showToast('Profile updated successfully! 🎉');
      setEditing(false);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update profile.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Uploading photo...');
      await uploadAvatar(user.uid, file);
      showToast('Photo updated! 📸');
    } catch (err) {
      showToast(err.message || 'Failed to upload photo.');
    }
  };

  return (
    <Sheet title="Account" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <img
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
            style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--primary)', objectFit: 'cover' }}
            alt=""
          />
          {editing && (
            <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', color: 'black', border: '2px solid #000', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Palette size={14} />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>
          )}
        </div>
        {!editing && (
          <>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.displayName || 'User'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{user?.username || user?.email?.split('@')[0]}</div>
          </>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input name="displayName" value={formData.displayName} onChange={handleChange} placeholder="Display Name" className="input-base" />
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="input-base" />
          <input name="status" value={formData.status} onChange={handleChange} placeholder="Status" className="input-base" />
          <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio" className="input-base" style={{ height: '80px', resize: 'none' }} />
          
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={() => setEditing(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 12, padding: '14px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} style={{ flex: 1, background: 'var(--primary-gradient)', border: 'none', borderRadius: 12, padding: '14px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[['Display Name', user?.displayName || 'User'], ['Username', `@${user?.username || 'user'}`], ['Email', user?.email || '—'], ['Status', user?.status || '—']].map(([label, val]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{val}</div>
            </div>
          ))}
          <button
            onClick={() => setEditing(true)}
            style={{ background: 'var(--primary-gradient)', border: 'none', borderRadius: 12, padding: '14px', color: 'white', fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
          >
            Edit Profile
          </button>
        </div>
      )}
    </Sheet>
  );
};

const PrivacySheet = ({ user, onClose }) => {
  const [prefs, setPrefs] = useState({
    lastSeen: true, photo: true, receipts: true, twoStep: false,
    ...user?.prefs?.privacy
  });
  const set = k => v => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    saveUserPrefs(user.uid, { ...user?.prefs, privacy: next });
  };
  return (
    <Sheet title="Privacy" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '0 16px' }}>
        {[
          { key: 'lastSeen', label: 'Show Last Seen', sub: 'Let others see when you were last active' },
          { key: 'photo', label: 'Profile Photo Visible', sub: 'Show your photo to everyone' },
          { key: 'receipts', label: 'Read Receipts', sub: 'Send and receive blue ticks' },
          { key: 'twoStep', label: 'Two-Step Verification', sub: 'Extra account security' },
        ].map(({ key, label, sub }) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
            </div>
            <Toggle value={prefs[key]} onChange={set(key)} />
          </div>
        ))}
      </div>
      <button style={{ marginTop: 16, width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: 'white', cursor: 'pointer', fontWeight: 600 }}>
        Manage Blocked Users
      </button>
    </Sheet>
  );
};

const NotificationsSheet = ({ user, onClose }) => {
  const [n, setN] = useState({ messages: true, groups: true, calls: true, sound: true, vibration: true, ...user?.prefs?.notifications });
  const set = k => v => {
    const next = { ...n, [k]: v };
    setN(next);
    saveUserPrefs(user.uid, { ...user?.prefs, notifications: next });
  };
  return (
    <Sheet title="Notifications" onClose={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '0 16px' }}>
        {[
          { key: 'messages', label: 'Message Notifications', sub: 'Notify for new DMs' },
          { key: 'groups', label: 'Group Notifications', sub: 'Notify for group chats' },
          { key: 'calls', label: 'Call Notifications', sub: 'Ring for incoming calls' },
          { key: 'sound', label: 'Sound', sub: 'Play notification sounds' },
          { key: 'vibration', label: 'Vibration', sub: 'Vibrate on notifications' },
        ].map(({ key, label, sub }) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
            </div>
            <Toggle value={n[key]} onChange={set(key)} />
          </div>
        ))}
      </div>
    </Sheet>
  );
};

const ChatSheet = ({ user, onClose }) => {
  const [prefs, setPrefs] = useState({ enterSend: false, autoDownload: true, gifAutoplay: true, ...user?.prefs?.chat });
  const { showToast } = useToast();
  const set = k => v => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    saveUserPrefs(user.uid, { ...user?.prefs, chat: next });
  };
  return (
    <Sheet title="Chat Settings" onClose={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '0 16px', marginBottom: 16 }}>
        {[
          { key: 'enterSend', label: 'Enter to Send', sub: 'Press Enter key to send message' },
          { key: 'autoDownload', label: 'Media Auto-Download', sub: 'Auto-download images and videos' },
          { key: 'gifAutoplay', label: 'GIF Autoplay', sub: 'Automatically play GIFs' },
        ].map(({ key, label, sub }) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
            </div>
            <Toggle value={prefs[key]} onChange={set(key)} />
          </div>
        ))}
      </div>
      <button
        onClick={() => { localStorage.removeItem('chatCache'); showToast('Chat cache cleared ✓'); }}
        style={{ width: '100%', background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.3)', borderRadius: 12, padding: 14, color: '#ff5555', cursor: 'pointer', fontWeight: 600 }}
      >
        Clear Chat Cache
      </button>
    </Sheet>
  );
};

const CallsSheet = ({ user, onClose }) => {
  const [prefs, setPrefs] = useState({ hd: true, speaker: false, ...user?.prefs?.calls });
  const set = k => v => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    saveUserPrefs(user.uid, { ...user?.prefs, calls: next });
  };
  return (
    <Sheet title="Call Settings" onClose={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '0 16px', marginBottom: 16 }}>
        {[
          { key: 'hd', label: 'HD Call Mode', sub: 'Higher quality audio/video' },
          { key: 'speaker', label: 'Default to Speaker', sub: 'Auto-enable speaker on calls' },
        ].map(({ key, label, sub }) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
            </div>
            <Toggle value={prefs[key]} onChange={set(key)} />
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(0,223,216,0.08)', border: '1px solid rgba(0,223,216,0.2)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, color: '#00dfd8', fontWeight: 700, marginBottom: 4 }}>WebRTC Status</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calling UI is ready. Connect a WebRTC signaling server for live production calls.</div>
      </div>
    </Sheet>
  );
};

const StorageSheet = ({ onClose }) => {
  const { showToast } = useToast();
  const [cacheSize, setCacheSize] = useState(0);

  React.useEffect(() => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += ((localStorage[key].length + key.length) * 2);
      }
    }
    setCacheSize(total);
  }, []);

  const sizeMB = (cacheSize / (1024 * 1024)).toFixed(2);
  const pct = Math.min((cacheSize / (10 * 1024 * 1024)) * 100, 100);

  return (
    <Sheet title="Storage & Data" onClose={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Local Cache Used</div>
        <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 4 }}>{sizeMB} MB</div>
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sizeMB} MB of 10 MB used (browser quota)</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => { localStorage.clear(); setCacheSize(0); showToast('Cache cleared ✓'); }}
          style={{ width: '100%', background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.3)', borderRadius: 12, padding: 14, color: '#ff5555', cursor: 'pointer', fontWeight: 600 }}
        >
          Clear All Cache
        </button>
        <button style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: 'white', cursor: 'pointer', fontWeight: 600 }}>
          Media Download Settings
        </button>
      </div>
    </Sheet>
  );
};

const SecuritySheet = ({ user, onClose }) => {
  const { showToast } = useToast();
  
  const handlePasswordReset = async () => {
    if (!user?.email) return showToast('No email associated with account');
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast('Password reset email sent! Check your inbox.');
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <Sheet title="Security" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Active Sessions</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>This device — Active now</div>
        </div>
        <button
          onClick={handlePasswordReset}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: 'white', cursor: 'pointer', fontWeight: 600 }}
        >
          Send Password Reset Email
        </button>
        <button
          onClick={() => showToast('Session management coming soon')}
          style={{ width: '100%', background: 'rgba(255,85,85,0.1)', border: '1px solid rgba(255,85,85,0.3)', borderRadius: 12, padding: 14, color: '#ff5555', cursor: 'pointer', fontWeight: 600 }}
        >
          Logout All Other Devices
        </button>
      </div>
    </Sheet>
  );
};

const HelpSheet = ({ onClose }) => {
  const { showToast } = useToast();
  return (
    <Sheet title="Help & Support" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[['FAQ', 'Frequently asked questions'], ['Report a Bug', 'Help us improve'], ['Contact Support', 'Reach our team']].map(([t, s]) => (
          <button
            key={t}
            onClick={() => showToast(`${t} coming soon`)}
            style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', color: 'white', cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s}</div>
          </button>
        ))}
      </div>
    </Sheet>
  );
};

const AboutSheet = ({ onClose }) => (
  <Sheet title="About Nexify Connect" onClose={onClose}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <img src="/logo.png" alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(0,223,216,0.5))' }} />
      <div style={{ fontWeight: 700, fontSize: 20 }}>Nexify Connect</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Version 1.0.0 • Connect Smarter</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {['Terms of Service', 'Privacy Policy'].map(t => (
          <button
            key={t}
            style={{ background: 'rgba(0,223,216,0.1)', border: '1px solid rgba(0,223,216,0.2)', borderRadius: 20, padding: '8px 16px', color: '#00dfd8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  </Sheet>
);

const LogoutModal = ({ onConfirm, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', padding: 24
  }}>
    <div className="pop-in" style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 340, border: '1px solid rgba(255,85,85,0.2)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,85,85,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={28} color="#ff5555" />
        </div>
        <h2 style={{ fontSize: 18 }}>Logout?</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>You'll need to sign in again to access your account.</p>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 12, padding: 14, color: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        <button onClick={onConfirm} style={{ flex: 1, background: 'rgba(255,85,85,0.15)', border: '1px solid rgba(255,85,85,0.4)', borderRadius: 12, padding: 14, color: '#ff5555', cursor: 'pointer', fontWeight: 700 }}>Logout</button>
      </div>
    </div>
  </div>
);

/* ─── Main Settings Screen ─── */
const Settings = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [sheet, setSheet] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (e) {
      showToast(e.message);
    }
  };

  return (
    <div className="fade-in col" style={{ height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
          <ArrowLeft size={18} />
        </button>
        <img src="/logo.png" alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>Settings</h1>
      </div>

      <div style={{ overflowY: 'auto', padding: '0 16px 40px' }}>
        {/* Profile peek */}
        <div
          onClick={() => setSheet('account')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '20px 16px',
            background: 'var(--bg-card)', borderRadius: 16, margin: '16px 0',
            border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer'
          }}
          className="ripple"
        >
          <img
            src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`}
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
            alt=""
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{currentUser?.displayName || 'User'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{currentUser?.email}</div>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </div>

        <Section label="ACCOUNT & PRIVACY">
          <Row icon={User} color="#00e5ff" title="Account" sub="Name, email, profile" onClick={() => setSheet('account')} />
          <Row icon={Lock} color="#8b5cf6" title="Privacy" sub="Last seen, photo, read receipts" onClick={() => setSheet('privacy')} />
          <Row icon={Shield} color="#f59e0b" title="Security" sub="Active sessions, password" onClick={() => setSheet('security')} />
        </Section>

        <Section label="NOTIFICATIONS & DISPLAY">
          <Row icon={Bell} color="#00dfd8" title="Notifications" sub="Messages, calls, sounds" onClick={() => setSheet('notifications')} />
          <Row icon={Palette} color="#d000ff" title="Appearance" sub="Theme, bubble style, animations" onClick={() => navigate('/appearance')} />
        </Section>

        <Section label="CHAT & CALLS">
          <Row icon={MessageSquare} color="#10b981" title="Chat" sub="Enter to send, auto-download" onClick={() => setSheet('chat')} />
          <Row icon={Phone} color="#3b82f6" title="Calls" sub="HD mode, speaker, ringtone" onClick={() => setSheet('calls')} />
        </Section>

        <Section label="DATA & STORAGE">
          <Row icon={HardDrive} color="#f97316" title="Storage & Data" sub="Cache, media downloads" onClick={() => setSheet('storage')} />
        </Section>

        <Section label="SUPPORT">
          <Row icon={HelpCircle} color="#a78bfa" title="Help & Support" sub="FAQ, bug report, contact" onClick={() => setSheet('help')} />
          <Row icon={Info} color="#94a3b8" title="About Nexify Connect" sub="Version 1.0.0" onClick={() => setSheet('about')} />
        </Section>

        <button
          onClick={() => setShowLogout(true)}
          style={{
            width: '100%', marginTop: 8, background: 'rgba(255,85,85,0.08)',
            border: '1px solid rgba(255,85,85,0.25)', borderRadius: 14, padding: '16px',
            color: '#ff5555', cursor: 'pointer', fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Detail Sheets */}
      {sheet === 'account' && <AccountSheet user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'privacy' && <PrivacySheet user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'notifications' && <NotificationsSheet user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'chat' && <ChatSheet user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'calls' && <CallsSheet user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'storage' && <StorageSheet user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'security' && <SecuritySheet user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'help' && <HelpSheet user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'about' && <AboutSheet user={currentUser} onClose={() => setSheet(null)} />}
      {showLogout && <LogoutModal onConfirm={handleLogout} onClose={() => setShowLogout(false)} />}
    </div>
  );
};

export default Settings;

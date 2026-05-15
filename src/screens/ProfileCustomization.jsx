import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Palette, Image as ImageIcon, Sparkles, 
  Check, Shield, Zap, Star, Trophy, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { updateUserProfile, uploadBanner, uploadAvatar } from '../services/profile';

const THEMES = [
  { id: 'default', name: 'Nexify Dark', primary: '#00dfd8', gradient: 'linear-gradient(135deg, #050a1a, #000)' },
  { id: 'purple-haze', name: 'Purple Haze', primary: '#7928ca', gradient: 'linear-gradient(135deg, #1a0525, #000)' },
  { id: 'midnight-blue', name: 'Midnight Blue', primary: '#0070f3', gradient: 'linear-gradient(135deg, #050b25, #000)' },
  { id: 'cyber-pink', name: 'Cyber Pink', primary: '#ff0080', gradient: 'linear-gradient(135deg, #250514, #000)' },
  { id: 'emerald-city', name: 'Emerald City', primary: '#10b981', gradient: 'linear-gradient(135deg, #052514, #000)' },
];

const ProfileCustomization = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentUser?.profileTheme || 'default');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [status, setStatus] = useState(currentUser?.status || '');

  const handleUpdate = async (updates) => {
    setLoading(true);
    try {
      await updateUserProfile(currentUser.uid, updates);
      showToast('Profile updated! ✨');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Uploading banner...');
      await uploadBanner(currentUser.uid, file);
      showToast('Banner updated! 🖼️');
    } catch (err) {
      showToast(err.message);
    }
  };

  const currentTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

  return (
    <div style={{ height: '100dvh', background: '#000', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', zIndex: 10
      }}>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)} 
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <ArrowLeft size={18} />
        </motion.button>
        <h1 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>Customize Profile</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 120px' }}>
        
        {/* Preview Card */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 12 }}>PREVIEW</span>
          <div style={{ 
            borderRadius: 24, overflow: 'hidden', background: '#0a0a0a', 
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' 
          }}>
            <div style={{ height: 100, background: currentUser?.bannerURL ? `url(${currentUser.bannerURL}) center/cover` : currentTheme.gradient, position: 'relative' }}>
               <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))' }} />
            </div>
            <div style={{ padding: '0 20px 20px', textAlign: 'center', marginTop: -40 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`} 
                  style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #0a0a0a', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', inset: -4, border: `2px solid ${currentTheme.primary}`, borderRadius: '50%', opacity: 0.6 }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{currentUser?.displayName}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{currentUser?.username}</p>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 12 }}>BASIC INFO</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
               <span style={{ fontSize: 13, fontWeight: 700 }}>Profile Picture</span>
               <motion.label whileTap={{ scale: 0.95 }} style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}>
                 UPLOAD NEW
                 <input type="file" accept="image/*" onChange={async (e) => {
                   const file = e.target.files?.[0];
                   if (!file) return;
                   try { showToast('Uploading avatar...'); await uploadAvatar(currentUser.uid, file); showToast('Avatar updated!'); } catch(err) { showToast(err.message); }
                 }} style={{ display: 'none' }} />
               </motion.label>
            </div>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
              onBlur={() => handleUpdate({ displayName })}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: 'white', outline: 'none' }}
            />
            <input 
              type="text" 
              value={currentUser?.username || ''}
              onChange={(e) => handleUpdate({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              placeholder="Username"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: 'white', outline: 'none' }}
            />
            <input 
              type="text" 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Status (e.g. In the zone)"
              onBlur={() => handleUpdate({ status })}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: 'white', outline: 'none' }}
            />
          </div>
        </div>

        {/* Banner Section */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1 }}>PROFILE BANNER</span>
            <motion.label 
              whileTap={{ scale: 0.95 }}
              style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}
            >
              UPLOAD NEW
              <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
            </motion.label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
             <motion.div 
               whileTap={{ scale: 0.98 }}
               onClick={() => handleUpdate({ bannerURL: null })}
               style={{ 
                 height: 80, borderRadius: 16, border: !currentUser?.bannerURL ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                 background: currentTheme.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
               }}
             >
               <span style={{ fontSize: 12, fontWeight: 800 }}>Default</span>
             </motion.div>
             {currentUser?.bannerURL && (
               <div style={{ height: 80, borderRadius: 16, border: '2px solid var(--primary)', background: `url(${currentUser.bannerURL}) center/cover` }} />
             )}
          </div>
        </div>

        {/* Themes Section */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 12 }}>PROFILE THEME</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {THEMES.map(theme => (
              <motion.button
                key={theme.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedTheme(theme.id);
                  handleUpdate({ profileTheme: theme.id, profileColor: theme.primary });
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: selectedTheme === theme.id ? `1px solid ${theme.primary}` : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.gradient, border: '1px solid rgba(255,255,255,0.1)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{theme.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Accent: {theme.primary}</div>
                </div>
                {selectedTheme === theme.id && <Check size={18} color={theme.primary} />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Profile Decoration */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 12 }}>DECORATIONS</span>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', padding: 16 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                 <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Star size={18} color="#ffd700" />
                 </div>
                 <div>
                   <div style={{ fontSize: 13, fontWeight: 700 }}>Avatar Ring</div>
                   <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Glow effect around your photo</div>
                 </div>
               </div>
               <input 
                 type="checkbox" 
                 checked={currentUser?.prefs?.avatarRing !== false} 
                 onChange={(e) => handleUpdate({ 'prefs.avatarRing': e.target.checked })} 
               />
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                 <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,223,216,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Zap size={18} color="#00dfd8" />
                 </div>
                 <div>
                   <div style={{ fontSize: 13, fontWeight: 700 }}>Animated Status</div>
                   <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status text pulses when online</div>
                 </div>
               </div>
               <input 
                 type="checkbox" 
                 checked={currentUser?.prefs?.animatedStatus !== false} 
                 onChange={(e) => handleUpdate({ 'prefs.animatedStatus': e.target.checked })} 
               />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileCustomization;

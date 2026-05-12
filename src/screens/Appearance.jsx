import React from 'react';
import { ArrowLeft, CheckCircle2, Sparkles, Layout, Palette, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../components/ThemeProvider';

const THEMES = [
  { id: 'amoled', name: 'AMOLED Dark', color: '#00dfd8', desc: 'True black for OLED screens' },
  { id: 'cyber-blue', name: 'Cyber Blue', color: '#0070f3', desc: 'Vibrant blue tech aesthetics' },
  { id: 'neon-purple', name: 'Neon Purple', color: '#d000ff', desc: 'Electric purple glow' },
  { id: 'matrix-green', name: 'Matrix Green', color: '#00ff41', desc: 'Classic digital matrix style' },
  { id: 'midnight-glass', name: 'Midnight', color: '#64748b', desc: 'Soft navy glassmorphism' }
];

const Appearance = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ height: '100dvh', background: '#000', color: 'white', display: 'flex', flexDirection: 'column' }}
    >
      <header style={{ 
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px', 
        borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)' 
      }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>Appearance</h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Palette size={18} color="#00dfd8" />
          <h3 style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>VISUAL THEME</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {THEMES.map((t, i) => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme(t.id)} 
              style={{ 
                cursor: 'pointer', padding: '16px', borderRadius: 20,
                background: 'rgba(255,255,255,0.03)',
                border: theme === t.id ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: theme === t.id ? `0 0 20px ${t.color}22` : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: 14, background: `${t.color}15`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${t.color}30`
                }}>
                  <Layout size={22} color={t.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.desc}</div>
                </div>
              </div>
              {theme === t.id && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 size={22} color={t.color} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div style={{ marginTop: 40, padding: 20, borderRadius: 24, background: 'linear-gradient(135deg, rgba(0,223,216,0.1), rgba(121,40,202,0.1))', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Sparkles size={16} color="#00dfd8" />
            <h4 style={{ fontSize: 14, fontWeight: 800 }}>Premium Animations</h4>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 16 }}>
            Nexify Connect uses motion engine v2.0 for smooth, 60FPS transitions across all screens.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>SMOOTH MOTION</span>
            <div style={{ width: 40, height: 20, borderRadius: 10, background: '#00dfd8', position: 'relative' }}>
              <div style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 16, borderRadius: '50%', background: 'white' }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Appearance;

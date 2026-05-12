import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Bell, Palette, MessageSquare, Phone, Database, Lock, HelpCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const SETTINGS_PAGES = {
  account: { title: 'Account Settings', icon: User, color: '#00dfd8' },
  privacy: { title: 'Privacy', icon: Shield, color: '#10b981' },
  notifications: { title: 'Notifications', icon: Bell, color: '#f59e0b' },
  appearance: { title: 'Appearance', icon: Palette, color: '#7928ca' },
  chat: { title: 'Chat Settings', icon: MessageSquare, color: '#0070f3' },
  calls: { title: 'Call Settings', icon: Phone, color: '#00dfd8' },
  storage: { title: 'Storage & Data', icon: Database, color: '#94a3b8' },
  security: { title: 'Security', icon: Lock, color: '#ef4444' },
  help: { title: 'Help & Support', icon: HelpCircle, color: '#a78bfa' },
  about: { title: 'About Nexify', icon: Info, color: '#64748b' }
};

const SettingsDetail = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const page = SETTINGS_PAGES[type] || SETTINGS_PAGES.account;
  const Icon = page.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ height: '100dvh', background: '#000', color: 'white', display: 'flex', flexDirection: 'column' }}
    >
      <header style={{ 
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' 
      }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800 }}>{page.title}</h1>
        </div>
        <Icon size={20} color={page.color} style={{ opacity: 0.6 }} />
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: 24, background: `${page.color}15`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          border: `1px solid ${page.color}30`, boxShadow: `0 0 30px ${page.color}20` 
        }}>
          <Icon size={40} color={page.color} />
        </div>
        
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{page.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 280, lineHeight: 1.6 }}>
            This section is currently under development. In the next phase, you will find full customization options for your {page.title.toLowerCase()}.
          </p>
        </div>

        <button 
          onClick={() => navigate(-1)}
          style={{ 
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 14, padding: '12px 24px', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' 
          }}
        >
          Go Back
        </button>
      </div>

      <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>NEXIFY CONNECT v1.0.0-BETA</p>
      </div>
    </motion.div>
  );
};

export default SettingsDetail;

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, MessageSquare, Phone, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/leaderboards', icon: Trophy, label: 'Board' },
  { to: '/chats', icon: MessageSquare, label: 'Chats' },
  { to: '/rooms', icon: Users, label: 'Rooms' },
  { to: '/calls', icon: Phone, label: 'Calls' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)', maxWidth: 380,
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '10px 12px',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 70,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    }}>
      {ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to || (to !== '/home' && location.pathname.startsWith(to));
        return (
          <NavLink
            key={to}
            to={to}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              flex: 1, position: 'relative',
              height: '100%',
              zIndex: 1
            }}
          >
            <motion.div 
              animate={{ 
                scale: isActive ? 1.1 : 1,
                y: isActive ? -2 : 0
              }}
              style={{ 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'linear-gradient(135deg, rgba(121, 40, 202, 0.2), rgba(0, 223, 216, 0.2))' : 'transparent',
                border: isActive ? '1px solid rgba(0, 223, 216, 0.3)' : '1px solid transparent',
                transition: 'all 0.3s ease'
              }}>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? '#00dfd8' : 'rgba(255,255,255,0.4)'}
                  style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(0, 223, 216, 0.4))' : 'none' }}
                />
              </div>
              {isActive && (
                <span style={{
                  fontSize: 10, fontWeight: 800,
                  color: '#00dfd8',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase'
                }}>
                  {label}
                </span>
              )}
            </motion.div>
            
            {isActive && (
              <motion.div 
                layoutId="nav-glow"
                style={{
                  position: 'absolute', bottom: -15, width: 20, height: 20,
                  background: 'radial-gradient(circle, rgba(0, 223, 216, 0.4) 0%, transparent 70%)',
                  filter: 'blur(5px)', zIndex: -1
                }}
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;

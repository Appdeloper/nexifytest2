import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const Splash = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      console.log("NAVIGATION START");
      if (currentUser) {
        console.log("[NexifySplash] User already logged in. Routing directly to Home.");
        navigate('/home', { replace: true });
      } else {
        console.log("[NexifySplash] No active session. Routing to Login.");
        navigate('/login', { replace: true });
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentUser, loading, navigate]);

  return (
    <div style={{
      height: '100dvh', width: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#000000',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient glows */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 5, repeat: Infinity }}
        style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, background: 'radial-gradient(circle, rgba(0,223,216,0.6) 0%, transparent 70%)', pointerEvents: 'none' }} 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        style={{ position: 'absolute', bottom: '10%', right: '-10%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(121,40,202,0.6) 0%, transparent 70%)', pointerEvents: 'none' }} 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}
      >
        <div style={{
          position: 'relative',
          width: 150,
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 0 25px rgba(0, 229, 255, 0.35)) drop-shadow(0 0 15px rgba(123, 97, 255, 0.2))'
        }}>
          {/* Rotating Squircle Loader Ring */}
          <motion.svg 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', width: 136, height: 136 }}
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="react-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="50%" stopColor="#7B61FF" />
                <stop offset="100%" stopColor="#00E5FF" />
              </linearGradient>
            </defs>
            <path 
              d="M 6,50 C 6,6 6,6 50,6 S 94,6 94,50 94,94 50,94 6,94 6,50" 
              fill="none" 
              stroke="url(#react-ring-grad)" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
            />
          </motion.svg>

          {/* Logo with pulsing scale */}
          <motion.img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Nexify Connect"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 106, height: 106, objectFit: 'contain',
              clipPath: 'url(#squircleClip)',
              borderRadius: '26%',
              zIndex: 2
            }}
          />
        </div>
      </motion.div>

      {/* Loading dots */}
      <div style={{ position: 'absolute', bottom: '12%', display: 'flex', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <motion.div 
            key={i} 
            animate={{ y: [0, -10, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#00dfd8', boxShadow: '0 0 8px #00dfd8' }} 
          />
        ))}
      </div>
    </div>
  );
};

export default Splash;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => { navigate('/login'); }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

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
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <motion.img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Nexify Connect"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 130, height: 130, objectFit: 'contain',
            filter: 'drop-shadow(0 0 20px rgba(0,223,216,0.5)) drop-shadow(0 0 40px rgba(121,40,202,0.3))'
          }}
        />

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

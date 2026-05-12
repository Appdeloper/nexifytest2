import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        padding: '48px 24px', textAlign: 'center', flex: 1
      }}
    >
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ 
            position: 'absolute', inset: -20, borderRadius: '50%', 
            border: '1px dashed rgba(0,223,216,0.2)', opacity: 0.5 
          }}
        />
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,223,216,0.08)',
          border: '1px solid rgba(0,223,216,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0,223,216,0.1)', position: 'relative', zIndex: 1
        }}>
          {Icon && <Icon size={40} color="#00dfd8" strokeWidth={1.5} />}
        </div>
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'white' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, marginBottom: 24 }}>
        {description}
      </p>

      {actionText && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          style={{ 
            background: 'linear-gradient(135deg, #00dfd8, #0070f3)', border: 'none', 
            borderRadius: 14, padding: '12px 24px', color: 'white', fontWeight: 700, 
            fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,223,216,0.3)'
          }}
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;

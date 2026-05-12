import React from 'react';

const PresenceIndicator = ({ status = 'offline', size = 12, border = 2, showGlow = true }) => {
  const colors = {
    online: '#00dfd8',
    away: '#f59e0b',
    dnd: '#ef4444',
    offline: '#444'
  };

  const color = colors[status] || colors.offline;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: color,
      border: `${border}px solid #000`,
      boxShadow: (showGlow && status !== 'offline') ? `0 0 8px ${color}aa` : 'none',
      flexShrink: 0,
      position: 'relative'
    }}>
      {status === 'dnd' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60%',
          height: '20%',
          background: '#000',
          borderRadius: '1px'
        }} />
      )}
      {status === 'away' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          width: '50%',
          height: '50%',
          borderLeft: '1.5px solid #000',
          borderBottom: '1.5px solid #000'
        }} />
      )}
    </div>
  );
};

export default PresenceIndicator;

import React from 'react';
import PresenceIndicator from './PresenceIndicator';

const Avatar = ({ user, size = 44, presenceSize = 14 }) => {
  const seed = user?.uid || user?.id || 'u';
  const photoURL = user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <img
        src={photoURL}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.05)'
        }}
        onError={(e) => {
          e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        }}
      />
      <div style={{ position: 'absolute', bottom: -1, right: -1 }}>
        <PresenceIndicator status={user?.presence || user?.online ? 'online' : 'offline'} size={presenceSize} border={2} />
      </div>
      {user?.statusEmoji && (
        <div style={{ 
          position: 'absolute', 
          left: -4, 
          top: -4, 
          background: '#111', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: 10, 
          padding: '2px 4px', 
          fontSize: 10, 
          zIndex: 2 
        }}>
          {user.statusEmoji}
        </div>
      )}
    </div>
  );
};

export default Avatar;

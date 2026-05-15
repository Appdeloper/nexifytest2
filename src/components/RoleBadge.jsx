import React from 'react';
import { ROLES } from '../services/xp';

const RoleBadge = ({ role, size = 'sm' }) => {
  const def = ROLES[role] || ROLES.member;

  const isSpecial = ['owner', 'verified'].includes(role);

  const sizes = {
    xs: { fontSize: '0.6rem', padding: '1px 6px', gap: '4px' },
    sm: { fontSize: '0.7rem', padding: '2px 8px', gap: '5px' },
    md: { fontSize: '0.85rem', padding: '4px 12px', gap: '6px' },
  };

  const s = sizes[size] || sizes.sm;

  return (
    <span
      className={`role-badge-pill ${isSpecial ? 'pulse-anim' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        background: '#000000',
        border: `1px solid ${def.color}66`,
        borderRadius: '50px',
        padding: s.padding,
        fontWeight: 'bold',
        fontSize: s.fontSize,
        color: def.color,
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        boxShadow: `0 0 10px ${def.color}33`,
        textShadow: `0 0 5px ${def.color}88`,
        transition: 'all 0.3s ease'
      }}
    >
      <span style={{ fontSize: '1.2em' }}>{def.icon}</span>
      <span>{def.label}</span>

      <style>{`
        @keyframes badgePulse {
          0% { box-shadow: 0 0 5px ${def.color}44; border-color: ${def.color}44; }
          50% { box-shadow: 0 0 15px ${def.color}aa; border-color: ${def.color}ff; }
          100% { box-shadow: 0 0 5px ${def.color}44; border-color: ${def.color}44; }
        }
        .pulse-anim {
          animation: badgePulse 2s infinite ease-in-out;
        }
      `}</style>
    </span>
  );
};

export default RoleBadge;


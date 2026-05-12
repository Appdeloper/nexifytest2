import React from 'react';
import { calculateRankFromXP, RANKS } from '../services/xp';

const RankBadge = ({ xp = 0, rankId = null, size = 'sm', showIcon = true }) => {
  const rank = rankId ? RANKS.find(r => r.id === rankId) || RANKS[0] : calculateRankFromXP(xp);
  
  const isHighRank = rank.priority >= 9; // Founder, Nexus Legend

  const sizes = {
    xs: { fontSize: '0.6rem', padding: '1px 6px', gap: '3px', iconSize: '0.7rem' },
    sm: { fontSize: '0.7rem', padding: '2px 8px', gap: '4px', iconSize: '0.8rem' },
    md: { fontSize: '0.85rem', padding: '4px 12px', gap: '6px', iconSize: '1rem' },
    lg: { fontSize: '1rem', padding: '6px 16px', gap: '8px', iconSize: '1.2rem' },
  };
  
  const s = sizes[size] || sizes.sm;

  return (
    <span 
      className={`rank-badge-pill ${isHighRank ? 'rank-pulse' : ''}`}
      style={{
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: s.gap,
        background: '#000000', 
        borderRadius: '50px',
        padding: s.padding, 
        fontWeight: 'bold',
        fontSize: s.fontSize, 
        color: rank.color, 
        letterSpacing: '0.5px',
        whiteSpace: 'nowrap', 
        flexShrink: 0,
        border: `1px solid ${rank.color}66`,
        boxShadow: `0 0 10px ${rank.color}33`,
        textShadow: `0 0 5px ${rank.color}88`,
        transition: 'all 0.3s ease'
      }}
    >
      {showIcon && <span style={{ fontSize: s.iconSize }}>{rank.icon}</span>}
      <span>{rank.name}</span>

      <style>{`
        @keyframes rankPulseAnim {
          0% { box-shadow: 0 0 5px ${rank.color}44; border-color: ${rank.color}44; }
          50% { box-shadow: 0 0 15px ${rank.color}aa; border-color: ${rank.color}ff; }
          100% { box-shadow: 0 0 5px ${rank.color}44; border-color: ${rank.color}44; }
        }
        .rank-pulse {
          animation: rankPulseAnim 2.5s infinite ease-in-out;
        }
      `}</style>
    </span>
  );
};

export default RankBadge;


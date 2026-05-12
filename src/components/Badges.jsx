import React from 'react';
import { motion } from 'framer-motion';
import { ROLES, RANKS, calculateRankFromXP } from '../services/xp';

/**
 * RoleBadge - AMOLED dark pill with neon gradient border and pulse for special roles
 */
export const RoleBadge = ({ role, size = 'sm', hideLabel = false }) => {
  const roleData = ROLES[role] || ROLES.member;
  const isSpecial = ['owner', 'admin', 'verified'].includes(role);
  const isOwner = role === 'owner';
  
  const isXS = size === 'xs';
  const padding = isXS ? '2px 6px' : (size === 'md' ? '4px 12px' : '3px 10px');
  const fontSize = isXS ? 9 : (size === 'md' ? 12 : 10);
  const iconSize = isXS ? 11 : (size === 'md' ? 14 : 12);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      animate={isSpecial ? { 
        boxShadow: [
          `0 0 10px ${roleData.color}33`, 
          `0 0 25px ${roleData.color}88`, 
          `0 0 10px ${roleData.color}33`
        ],
        borderColor: [
          `${roleData.color}66`, 
          `${roleData.color}ff`, 
          `${roleData.color}66`
        ],
        scale: isOwner ? [1, 1.02, 1] : 1
      } : {}}
      transition={isSpecial ? { 
        duration: isOwner ? 1.5 : 2.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      } : {}}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: hideLabel ? 0 : 6,
        padding: padding,
        borderRadius: 50,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${roleData.color}44`,
        position: 'relative',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        boxShadow: `inset 0 0 10px ${roleData.color}11`
      }}
    >
      <span style={{ fontSize: iconSize }}>{roleData.icon}</span>
      {!hideLabel && (
        <span style={{ 
          fontSize: fontSize, 
          fontWeight: 900, 
          color: roleData.color,
          letterSpacing: 0.8,
          textShadow: `0 0 10px ${roleData.color}aa`
        }}>
          {roleData.label}
        </span>
      )}
    </motion.div>
  );
};

/**
 * RankBadge - AMOLED dark pill with neon glow and pulse for high ranks
 */
export const RankBadge = ({ xp = 0, rankId, size = 'sm', showIcon = true }) => {
  const rankData = rankId 
    ? (RANKS.find(r => r.id === rankId) || RANKS[0]) 
    : calculateRankFromXP(xp);

  const isHighRank = rankData.priority >= 9;
  const isXS = size === 'xs';
  const padding = isXS ? '2px 8px' : (size === 'md' ? '4px 12px' : '3px 10px');
  const fontSize = isXS ? 8 : (size === 'md' ? 11 : 10);
  const iconSize = isXS ? 10 : (size === 'md' ? 13 : 12);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      animate={isHighRank ? { 
        boxShadow: [`0 0 10px ${rankData.color}33`, `0 0 20px ${rankData.color}66`, `0 0 10px ${rankData.color}33`],
        scale: [1, 1.01, 1]
      } : {}}
      transition={isHighRank ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isXS ? 4 : 6,
        padding: padding,
        borderRadius: 50,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${rankData.color}55`,
        position: 'relative',
        whiteSpace: 'nowrap'
      }}
    >
      {showIcon && <span style={{ fontSize: iconSize }}>{rankData.icon}</span>}
      <span style={{ 
        fontSize: fontSize, 
        fontWeight: 800, 
        color: rankData.color,
        letterSpacing: 0.5,
        textShadow: `0 0 8px ${rankData.color}88`
      }}>
        {rankData.name.toUpperCase()}
      </span>
    </motion.div>
  );
};

export default { RoleBadge, RankBadge };

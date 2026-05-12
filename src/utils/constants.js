export const ROLES = {
  OWNER: { name: 'OWNER', color: '#ff00ff', glow: '0 0 10px #ff00ff, 0 0 20px #ff00ff', icon: '👑' },
  ADMIN: { name: 'ADMIN', color: '#ff3333', glow: '0 0 10px #ff3333, 0 0 20px #ff3333', icon: '🛡️' },
  MODERATOR: { name: 'MODERATOR', color: '#00ffff', glow: '0 0 10px #00ffff, 0 0 20px #00ffff', icon: '🛠️' },
  VERIFIED: { name: 'VERIFIED', color: '#3388ff', glow: '0 0 10px #3388ff, 0 0 20px #3388ff', icon: '✔️' },
  MEMBER: { name: 'MEMBER', color: '#ffffff', glow: '0 0 5px #ffffff', icon: '👤' }
};

export const RANKS = [
  { level: 1, name: 'Rookie', xpRequired: 0, color: '#a0a0a0', icon: '🌱' },
  { level: 2, name: 'Explorer', xpRequired: 500, color: '#4caf50', icon: '🧭' },
  { level: 3, name: 'Signal', xpRequired: 1500, color: '#00bcd4', icon: '📡' },
  { level: 4, name: 'Elite', xpRequired: 3500, color: '#3f51b5', icon: '⚔️' },
  { level: 5, name: 'Vanguard', xpRequired: 7000, color: '#9c27b0', icon: '⚡' },
  { level: 6, name: 'Nova', xpRequired: 12000, color: '#ff9800', icon: '🌟' },
  { level: 7, name: 'Pulse', xpRequired: 20000, color: '#ff5722', icon: '🔥' },
  { level: 8, name: 'Ascended', xpRequired: 35000, color: '#e91e63', icon: '✨' },
  { level: 9, name: 'Founder', xpRequired: 60000, color: '#ffd700', icon: '💎' },
  { level: 10, name: 'Nexus Legend', xpRequired: 100000, color: '#ff00ff', icon: '🌌' }
];

export const getRankByXp = (xp) => {
  let currentRank = RANKS[0];
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xpRequired) {
      currentRank = RANKS[i];
    } else {
      break;
    }
  }
  return currentRank;
};

export const getNextRank = (xp) => {
  for (let i = 0; i < RANKS.length; i++) {
    if (xp < RANKS[i].xpRequired) {
      return RANKS[i];
    }
  }
  return RANKS[RANKS.length - 1]; // Max rank
};

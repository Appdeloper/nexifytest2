
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, writeBatch, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGKGkyK9aI9gmyZtRlhivvMT4KFayADxU",
  authDomain: "nexify-connect-prod.firebaseapp.com",
  projectId: "nexify-connect-prod",
  storageBucket: "nexify-connect-prod.firebasestorage.app",
  messagingSenderId: "1055135318628",
  appId: "1:1055135318628:web:70e36377ac5d3b92769571",
  measurementId: "G-Y2F59CGTV9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RANKS = [
  { id: 'rookie',      name: 'Rookie',       xpRequired: 0,     icon: '🌱', color: '#ffffff', glow: 'white',  priority: 1 },
  { id: 'explorer',    name: 'Explorer',     xpRequired: 250,   icon: '🧭', color: '#38bdf8', glow: 'cyan',   priority: 2 },
  { id: 'signal',      name: 'Signal',       xpRequired: 750,   icon: '📡', color: '#00d4ff', glow: 'blue',   priority: 3 },
  { id: 'elite',       name: 'Elite',        xpRequired: 1500,  icon: '💠', color: '#8b5cf6', glow: 'purple', priority: 4 },
  { id: 'vanguard',    name: 'Vanguard',     xpRequired: 3000,  icon: '⚔️', color: '#a855f7', glow: 'violet', priority: 5 },
  { id: 'nova',        name: 'Nova',         xpRequired: 6000,  icon: '🌌', color: '#3b82f6', glow: 'blue',   priority: 6 },
  { id: 'pulse',       name: 'Pulse',        xpRequired: 10000, icon: '⚡', color: '#22d3ee', glow: 'cyan',   priority: 7 },
  { id: 'ascended',    name: 'Ascended',     xpRequired: 15000, icon: '🔥', color: '#f97316', glow: 'orange', priority: 8 },
  { id: 'founder',     name: 'Founder',      xpRequired: 25000, icon: '👑', color: '#a855f7', glow: 'purple', priority: 9 },
  { id: 'nexusLegend', name: 'Nexus Legend', xpRequired: 50000, icon: '🏆', color: '#facc15', glow: 'gold',   priority: 10 },
];

const ROLES = {
  owner: {
    id: 'owner',
    label: 'OWNER',
    icon: '👑',
    color: '#ff3df2',
    glow: 'purple',
    priority: 100,
    permissions: ["manageRoles","manageUsers","manageRooms","deleteMessages","viewAdminPanel","verifyUsers"]
  },
  admin: {
    id: 'admin',
    label: 'ADMIN',
    icon: '🛡️',
    color: '#ff3b3b',
    glow: 'red',
    priority: 80,
    permissions: ["manageUsers","manageRooms","deleteMessages","verifyUsers"]
  },
  moderator: {
    id: 'moderator',
    label: 'MOD',
    icon: '⚡',
    color: '#00d4ff',
    glow: 'cyan',
    priority: 60,
    permissions: ["moderateChats","muteUsers","manageReports"]
  },
  verified: {
    id: 'verified',
    label: 'VERIFIED',
    icon: '⭐',
    color: '#2f80ff',
    glow: 'blue',
    priority: 40,
    permissions: ["verifiedBadge"]
  },
  member: {
    id: 'member',
    label: 'MEMBER',
    icon: '🌐',
    color: '#ffffff',
    glow: 'white',
    priority: 10,
    permissions: []
  },
};

async function seed() {
  console.log("Starting Firestore seeding...");
  try {
    const batch = writeBatch(db);

    // Seed Roles
    Object.values(ROLES).forEach((role) => {
      const roleRef = doc(db, 'roles', role.id);
      batch.set(roleRef, {
        ...role,
        updatedAt: serverTimestamp(),
      });
      console.log(`- Queued role: ${role.id}`);
    });

    // Seed Ranks
    RANKS.forEach((rank) => {
      const rankRef = doc(db, 'ranks', rank.id);
      batch.set(rankRef, {
        ...rank,
        updatedAt: serverTimestamp(),
      });
      console.log(`- Queued rank: ${rank.id}`);
    });

    // Initialize Leaderboard document
    const lbRef = doc(db, 'leaderboards', 'global');
    batch.set(lbRef, {
      title: "Global XP",
      type: "xp",
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`- Queued leaderboard: global`);

    await batch.commit();
    console.log("✅ Successfully seeded roles, ranks, and leaderboards!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();

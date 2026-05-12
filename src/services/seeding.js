// Seeding service - PRODUCTION READY
import { db } from './firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { RANKS, ROLES } from './xp';

export const seedSystemCollections = async () => {
  try {
    const batch = writeBatch(db);

    // 1. Seed Roles
    Object.values(ROLES).forEach((role) => {
      const roleRef = doc(db, 'roles', role.id);
      batch.set(roleRef, {
        ...role,
        updatedAt: serverTimestamp(),
      });
    });

    // 2. Seed Ranks
    RANKS.forEach((rank) => {
      const rankRef = doc(db, 'ranks', rank.id);
      batch.set(rankRef, {
        ...rank,
        updatedAt: serverTimestamp(),
      });
    });

    // 3. Initialize Global Leaderboard
    const lbRef = doc(db, 'leaderboards', 'global');
    batch.set(lbRef, {
      title: "Global XP",
      type: "xp",
      updatedAt: serverTimestamp(),
    }, { merge: true });

    await batch.commit();
    console.log('System collections seeded successfully! ✅');
    return true;
  } catch (error) {
    console.error('Seeding failed:', error);
    return false;
  }
};

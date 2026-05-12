import React, { useEffect } from 'react';
import { seedSystemCollections } from '../services/seeding';
import { useToast } from './ToastProvider';

const SeedTrigger = () => {
  const { showToast } = useToast();

  useEffect(() => {
    const run = async () => {
      console.log('Auto-seeding triggered...');
      const success = await seedSystemCollections();
      if (success) {
        console.log('Seeding successful!');
        showToast('Firestore Seeding Successful! ✅');
      } else {
        console.error('Seeding failed.');
        showToast('Firestore Seeding Failed ❌');
      }
    };
    run();
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 10, right: 10, zIndex: 9999,
      background: 'rgba(0,223,216,0.2)', padding: '8px 12px',
      borderRadius: 8, fontSize: 10, color: '#00dfd8',
      border: '1px solid rgba(0,223,216,0.4)', backdropFilter: 'blur(10px)'
    }}>
      System Initializer Active
    </div>
  );
};

export default SeedTrigger;

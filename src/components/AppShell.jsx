import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { motion, AnimatePresence } from 'framer-motion';

const HIDE_NAV_PREFIXES = ['/chat-conversation', '/group-chat', '/room-chat', '/create-room', '/focus-pods', '/friends', '/tasks', '/nexify-fit', '/nexify-edge', '/nexify-ai', '/global-search', '/settings', '/appearance', '/admin'];

import { useAIEngine } from './useAIEngine';

const AppShell = () => {
  useAIEngine();
  const location = useLocation();
  const showNav = !HIDE_NAV_PREFIXES.some(prefix => location.pathname.startsWith(prefix));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden' }}>
      <main style={{
        flex: 1,
        overflowY: 'auto',
        // Leave room for fixed BottomNav (64px) + safe area
        paddingBottom: showNav ? 'calc(64px + env(safe-area-inset-bottom, 20px))' : '0',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }} // premium fluid cubic-bezier transition
            style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default AppShell;

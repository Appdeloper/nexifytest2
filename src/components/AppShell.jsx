import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

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
        position: 'relative'
      }}>
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default AppShell;

import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CallProvider } from './components/CallProvider';
import { FitnessProvider } from './hooks/useFitness';
import AppShell from './components/AppShell';

import Splash from './screens/Splash';
import Login from './screens/Login';
import Signup from './screens/Signup';

// Lazy loaded routes
const Home = React.lazy(() => import('./screens/Home'));
const Chats = React.lazy(() => import('./screens/Chats'));
const ChatConversation = React.lazy(() => import('./screens/ChatConversation'));
const GroupChat = React.lazy(() => import('./screens/GroupChat'));
const Calls = React.lazy(() => import('./screens/Calls'));
const Rooms = React.lazy(() => import('./screens/Rooms'));
const CreateRoom = React.lazy(() => import('./screens/CreateRoom'));
const RoomChat = React.lazy(() => import('./screens/RoomChat'));
const FocusPods = React.lazy(() => import('./screens/FocusPods'));
const NexifyFit = React.lazy(() => import('./screens/NexifyFit'));
const NexifyEdge = React.lazy(() => import('./screens/NexifyEdge'));
const NexifyAI = React.lazy(() => import('./screens/NexifyAI'));
const GlobalSearch = React.lazy(() => import('./screens/GlobalSearch'));
const Profile = React.lazy(() => import('./screens/Profile'));
const Settings = React.lazy(() => import('./screens/Settings'));
const SettingsDetail = React.lazy(() => import('./screens/SettingsDetail'));
const Appearance = React.lazy(() => import('./screens/Appearance'));
const Friends = React.lazy(() => import('./screens/Friends'));
const Leaderboards = React.lazy(() => import('./screens/Leaderboards'));
const Tasks = React.lazy(() => import('./screens/Tasks'));
const AdminPanel = React.lazy(() => import('./screens/AdminPanel'));
const NexifyWaves = React.lazy(() => import('./screens/NexifyWaves'));
const ProfileCustomization = React.lazy(() => import('./screens/ProfileCustomization'));
const Notifications = React.lazy(() => import('./screens/Notifications'));

const LoadingFallback = () => (
  <div style={{ height: '100dvh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <img src="logo.png" alt="" style={{ width: 60, height: 60, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00dfd8', animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/home" replace />;
  return children;
};

// import { ensureAIUser } from './services/users'; // Removed from here
import { subscribeSystemConfig } from './services/xp';
import { NotificationProvider } from './components/NotificationProvider';

const AppContent = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }
  }, []);

  // Only subscribe to system config (ranks/roles) after auth resolves
  useEffect(() => {
    if (!currentUser) return;
    const unsubSystem = subscribeSystemConfig();
    return () => { if (unsubSystem) unsubSystem(); };
  }, [currentUser?.uid]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/home" element={<React.Suspense fallback={<LoadingFallback />}><Home /></React.Suspense>} />
          <Route path="/chats" element={<React.Suspense fallback={<LoadingFallback />}><Chats /></React.Suspense>} />
          <Route path="/chat-conversation/:chatId" element={<React.Suspense fallback={<LoadingFallback />}><ChatConversation /></React.Suspense>} />
          <Route path="/group-chat/:groupId" element={<React.Suspense fallback={<LoadingFallback />}><GroupChat /></React.Suspense>} />
          <Route path="/calls" element={<React.Suspense fallback={<LoadingFallback />}><Calls /></React.Suspense>} />
          <Route path="/rooms" element={<React.Suspense fallback={<LoadingFallback />}><Rooms /></React.Suspense>} />
          <Route path="/create-room" element={<React.Suspense fallback={<LoadingFallback />}><CreateRoom /></React.Suspense>} />
          <Route path="/room-chat/:roomId" element={<React.Suspense fallback={<LoadingFallback />}><RoomChat /></React.Suspense>} />
          <Route path="/focus-pods" element={<React.Suspense fallback={<LoadingFallback />}><FocusPods /></React.Suspense>} />
          <Route path="/nexify-fit" element={<React.Suspense fallback={<LoadingFallback />}><NexifyFit /></React.Suspense>} />
          <Route path="/nexify-edge" element={<React.Suspense fallback={<LoadingFallback />}><NexifyEdge /></React.Suspense>} />
          <Route path="/nexify-ai" element={<React.Suspense fallback={<LoadingFallback />}><NexifyAI /></React.Suspense>} />
          <Route path="/global-search" element={<React.Suspense fallback={<LoadingFallback />}><GlobalSearch /></React.Suspense>} />
          <Route path="/profile" element={<React.Suspense fallback={<LoadingFallback />}><Profile /></React.Suspense>} />
          <Route path="/profile-customization" element={<React.Suspense fallback={<LoadingFallback />}><ProfileCustomization /></React.Suspense>} />
          <Route path="/settings" element={<React.Suspense fallback={<LoadingFallback />}><Settings /></React.Suspense>} />
          <Route path="/settings/:type" element={<React.Suspense fallback={<LoadingFallback />}><SettingsDetail /></React.Suspense>} />
          <Route path="/appearance" element={<React.Suspense fallback={<LoadingFallback />}><Appearance /></React.Suspense>} />
          <Route path="/friends" element={<React.Suspense fallback={<LoadingFallback />}><Friends /></React.Suspense>} />
          <Route path="/leaderboards" element={<React.Suspense fallback={<LoadingFallback />}><Leaderboards /></React.Suspense>} />
          <Route path="/tasks" element={<React.Suspense fallback={<LoadingFallback />}><Tasks /></React.Suspense>} />
          <Route path="/admin" element={<React.Suspense fallback={<LoadingFallback />}><AdminPanel /></React.Suspense>} />
          <Route path="/nexify-waves" element={<React.Suspense fallback={<LoadingFallback />}><NexifyWaves /></React.Suspense>} />
          <Route path="/notifications" element={<React.Suspense fallback={<LoadingFallback />}><Notifications /></React.Suspense>} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

const App = () => {
  const [earlyAccessGranted, setEarlyAccessGranted] = useState(
    localStorage.getItem('early_access_granted') === 'true'
  );
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passcode.trim() === 'NEXIFY2026') {
      localStorage.setItem('early_access_granted', 'true');
      setEarlyAccessGranted(true);
    } else {
      setError(true);
    }
  };

  if (!earlyAccessGranted) {
    return (
      <div className="col p-4 flex-center fade-in" style={{ height: '100dvh', background: '#0A0F1F', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {/* Glow backdrop */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        
        <div className="col w-full glass p-6" style={{ maxWidth: '340px', borderRadius: '28px', border: '1px solid rgba(0, 229, 255, 0.2)', background: '#161128', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(0, 223, 216, 0.1)', border: '1px solid #00DFD8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '24px', height: '24px', fill: '#00DFD8' }} viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
          
          <h2 style={{ color: 'white', fontWeight: '800', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Early Access Lock</h2>
          <p style={{ color: '#D1D5DB', fontSize: '12px', lineHeight: '1.4', margin: 0 }}>This build is restricted. Enter the passcode to authenticate your device and unlock Nexify Connect.</p>
          
          <form onSubmit={handleUnlock} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', margin: 0 }}>
            <input
              type="password"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              style={{
                width: '100%',
                background: 'rgba(10, 10, 15, 0.4)',
                border: error ? '1px solid red' : '1px solid #374151',
                padding: '14px',
                borderRadius: '16px',
                color: 'white',
                outline: 'none',
                textAlign: 'center',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {error && <span style={{ color: 'red', fontSize: '11px', fontWeight: 'bold' }}>Invalid passcode. Access denied.</span>}
            <button
              type="submit"
              className="ripple"
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #7B61FF, #00E5FF)',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '9999px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                textTransform: 'uppercase',
                marginTop: '4px'
              }}
            >
              Unlock Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <FitnessProvider>
              <CallProvider>
                <AppContent />
              </CallProvider>
            </FitnessProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;

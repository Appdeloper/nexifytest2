import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

const LoadingFallback = () => (
  <div style={{ height: '100dvh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <img src="logo.png" alt="" style={{ width: 60, objectFit: 'contain', opacity: 0.8, animation: 'logoPulse 1.5s ease-in-out infinite alternate' }} />
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

const ProfileCustomization = React.lazy(() => import('./screens/ProfileCustomization'));
const Notifications = React.lazy(() => import('./screens/Notifications'));

import { ensureAIUser } from './services/users';
import { subscribeSystemConfig } from './services/xp';

const App = () => {
  useEffect(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }

    const unsubSystem = subscribeSystemConfig();
    ensureAIUser().catch(console.error);
    return () => { if (unsubSystem) unsubSystem(); };
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <FitnessProvider>
            <CallProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Splash />} />
                  <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                  <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

                  <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                    <Route path="/home" element={<React.Suspense fallback={<LoadingFallback />}><Home /></React.Suspense>} />
                    <Route path="/chats" element={<React.Suspense fallback={<LoadingFallback />}><Chats /></React.Suspense>} />
                    <Route path="/chat-conversation/:chatId" element={<React.Suspense fallback={<LoadingFallback />}><ChatConversation /></React.Suspense>} />
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
            </CallProvider>
          </FitnessProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;

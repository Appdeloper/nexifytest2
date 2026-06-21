import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { registerUser, loginWithGoogle } from '../services/auth';
import { useToast } from '../components/ToastProvider';

const Signup = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      showToast('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      await registerUser(email, password, username);
      navigate('/home');
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate('/home');
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col p-4 flex-center fade-in" style={{ height: '100vh', background: 'radial-gradient(circle at bottom left, var(--glow-color), transparent 50%)' }}>
      <div className="w-full flex-center col" style={{ maxWidth: '400px', zIndex: 1 }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Nexify Connect Logo" style={{ width: 120, height: 120, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} />

        <div className="col w-full glass-panel p-4" style={{ borderRadius: '24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>Join Nexify</h2>
          <p className="text-muted text-sm mb-6 mt-1" style={{ textAlign: 'center' }}>Create your account.</p>
        
        <form onSubmit={handleSignup} className="col gap-3 mb-4">
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full" 
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px', color: 'white', outline: 'none' }} 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full" 
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px', color: 'white', outline: 'none' }} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full" 
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px', color: 'white', outline: 'none' }} 
          />
          
          <GradientButton type="submit" className="mt-4" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </GradientButton>
        </form>

        <div className="flex-center mb-4 text-muted text-xs" style={{ position: 'relative' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
          <span style={{ padding: '0 10px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
        </div>

        <button 
          onClick={handleGoogleSignup} 
          disabled={loading}
          className="w-full row flex-center gap-2 mb-4 ripple" 
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
        >
          <svg style={{ width: '18px', height: '18px', marginRight: '6px' }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign Up with Google
        </button>

        <p className="text-sm text-center text-muted">
          Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/login')}>Log in</span>
        </p>
        </div>
        
        <p className="text-xs text-muted text-center mt-6" style={{ maxWidth: '80%' }}>
          By continuing, you agree to our <span className="text-primary" onClick={() => setShowTerms(true)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Terms & Privacy Policy</span>.
        </p>
      </div>

      {/* Terms and Privacy Policy Modal */}
      <AnimatePresence>
        {showTerms && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
                boxShadow: '0 0 30px rgba(0, 229, 255, 0.1)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>Terms & Privacy Policy</h2>
                <span
                  onClick={() => setShowTerms(false)}
                  style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                >
                  ✕
                </span>
              </div>

              {/* Modal Content */}
              <div style={{
                padding: '20px 24px',
                overflowY: 'auto',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                lineHeight: '1.6',
                textAlign: 'left'
              }}>
                <p style={{ marginTop: 0 }}>Welcome to <strong>Nexify Connect</strong>! By using our platform, you agree to these Terms and Conditions and understand our Privacy Policy.</p>
                
                <h3 style={{ color: 'var(--primary-cyan)', fontSize: '14px', marginTop: '16px', marginBottom: '8px' }}>1. Service Eligibility & Passcode Gate</h3>
                <p>Nexify Connect is currently in early-access beta. Access to this build requires entering the authorized passcode. You agree not to distribute this passcode to unauthorized third parties.</p>

                <h3 style={{ color: 'var(--primary-cyan)', fontSize: '14px', marginTop: '16px', marginBottom: '8px' }}>2. Acceptable Use</h3>
                <p>You agree to use our social and workspace features (chats, rooms, fitness trackers) for lawful purposes. Abuse or exploitation of our neural AI core or messaging servers will result in immediate ban.</p>

                <h3 style={{ color: 'var(--primary-cyan)', fontSize: '14px', marginTop: '16px', marginBottom: '8px' }}>3. Data Privacy & Local Storage</h3>
                <p>Your fitness activity, profiles, and chats are encrypted and securely synchronized with Firebase. We use local caching on your device to ensure smooth offline access and fast performance.</p>

                <h3 style={{ color: 'var(--primary-cyan)', fontSize: '14px', marginTop: '16px', marginBottom: '8px' }}>4. Disclaimer of Warranty</h3>
                <p>This is a Beta test build. We provide these services "as is" and do not guarantee uninterrupted uptime or data preservation during structural upgrades.</p>

                <p style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>Last updated: June 2026</p>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'right'
              }}>
                <button
                  onClick={() => setShowTerms(false)}
                  style={{
                    background: 'var(--primary-gradient)',
                    color: 'black',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  I Accept
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Signup;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { loginUser, loginWithGoogle } from '../services/auth';
import { useToast } from '../components/ToastProvider';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      navigate('/home');
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
    <div className="col p-4 flex-center fade-in slide-up" style={{ height: '100dvh', position: 'relative' }}>
      
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(0,223,216,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full flex-center col" style={{ maxWidth: '400px', zIndex: 1 }}>
        <img src="/logo.png" alt="Nexify Connect Logo" style={{ width: '120px', objectFit: 'contain', marginBottom: '24px', filter: 'drop-shadow(var(--neon-glow))' }} />

        <div className="col w-full glass-panel p-4" style={{ borderRadius: '24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>Login to continue</h2>
          <p className="text-muted text-sm mb-6 mt-1" style={{ textAlign: 'center' }}>Welcome back! Please login to your account.</p>
          
          <form onSubmit={handleLogin} className="col gap-3 mb-4">
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full" 
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px', color: 'white', outline: 'none' }} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full" 
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px', color: 'white', outline: 'none' }} 
            />
            <button type="submit" disabled={loading} className="ripple mt-2" style={{ width: '100%', background: 'var(--primary-gradient)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px' }}>
              {loading ? 'Signing in...' : 'Continue with Email'}
            </button>
          </form>

          <div className="flex-center mb-4 text-muted text-xs" style={{ position: 'relative' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
            <span style={{ padding: '0 10px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }} />
          </div>

          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full row flex-center gap-2 mb-6 ripple" 
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-center text-muted">
            Don't have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate('/signup')}>Sign up</span>
          </p>
        </div>
        
        <p className="text-xs text-muted text-center mt-6" style={{ maxWidth: '80%' }}>
          By continuing, you agree to our <span className="text-primary" style={{ cursor: 'pointer' }}>Terms & Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

export default Login;

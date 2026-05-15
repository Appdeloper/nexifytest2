import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
          className="w-full row flex-center gap-2 mb-4" 
          style={{ background: 'transparent', border: '1px solid var(--border-glass)', padding: '14px', borderRadius: 'var(--radius-full)', color: 'white', cursor: 'pointer' }}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          Sign Up with Google
        </button>

        <p className="text-sm text-center text-muted">
          Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/login')}>Log in</span>
        </p>
        </div>
        
        <p className="text-xs text-muted text-center mt-6" style={{ maxWidth: '80%' }}>
          By continuing, you agree to our <span className="text-primary" style={{ cursor: 'pointer' }}>Terms & Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

export default Signup;

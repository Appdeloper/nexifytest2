import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Nexify Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100dvh', width: '100%', background: '#000', color: 'white', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          padding: 24, textAlign: 'center' 
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,85,85,0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
              border: '1px solid rgba(255,85,85,0.3)', boxShadow: '0 0 30px rgba(255,85,85,0.1)'
            }}
          >
            <AlertTriangle size={40} color="#ff5555" />
          </motion.div>
          
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Oops! Something went wrong.</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 300, marginBottom: 32 }}>
            Nexify Connect encountered an unexpected error. Don't worry, your data is safe.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                background: 'linear-gradient(135deg, #00dfd8, #0070f3)', border: 'none', 
                borderRadius: 14, padding: '16px', color: 'white', fontWeight: 800, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'
              }}
            >
              <RefreshCw size={18} /> Reload Application
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              style={{ 
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 14, padding: '16px', color: 'white', fontWeight: 700, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer'
              }}
            >
              <Home size={18} /> Back to Home
            </button>
          </div>

          <div style={{ marginTop: 40, fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
            ERROR_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

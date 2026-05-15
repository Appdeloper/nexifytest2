import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ title, showBack = false, rightElement }) => {
  const navigate = useNavigate();

  return (
    <header className="app-header glass-panel">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showBack ? (
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ width: 34, height: 34 }}>
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div style={{ position: 'relative' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,223,216,0.6))' }} alt="Logo" />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, background: '#10b981', borderRadius: '50%', border: '1.5px solid black' }} />
          </div>
        )}
      </div>
      <h1 className="header-title" style={{ fontSize: 18, fontWeight: 800, flex: 1, textAlign: showBack ? 'left' : 'center' }}>{title}</h1>
      <div className="header-right">
        {rightElement}
      </div>
    </header>
  );
};

export default Header;

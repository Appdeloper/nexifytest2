import React from 'react';
import './GradientButton.css';

const GradientButton = ({ children, onClick, className = '', disabled, type = 'button' }) => {
  return (
    <button 
      type={type} 
      className={`gradient-button ${className}`} 
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default GradientButton;

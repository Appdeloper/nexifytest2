import React from 'react';
import './GradientButton.css';

const GradientButton = ({ children, onClick, className = '', disabled, type = 'button', ...props }) => {
  return (
    <button 
      type={type} 
      className={`gradient-button ${className}`} 
      onClick={onClick} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default GradientButton;

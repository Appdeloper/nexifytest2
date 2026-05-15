import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('nexify_theme') || 'amoled');

  useEffect(() => {
    if (currentUser?.prefs?.theme) {
      setTheme(currentUser.prefs.theme);
    }
  }, [currentUser?.prefs?.theme]);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('nexify_theme', theme);
  }, [theme]);


  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

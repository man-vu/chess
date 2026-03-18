import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { darkTheme, lightTheme } from '../themes';

const STORAGE_KEY = 'chess_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // localStorage may be unavailable
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  }, []);

  const isDark = theme === 'dark';

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      isDark,
      themeObject: isDark ? darkTheme : lightTheme,
    }),
    [theme, toggleTheme, setTheme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

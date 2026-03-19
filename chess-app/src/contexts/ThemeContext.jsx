import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { darkTheme, lightTheme } from '../themes';
import { _setActiveTheme } from '../theme';

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
    // Update the global theme reference so colors/shadows proxies reflect the new theme
    _setActiveTheme(theme === 'dark' ? darkTheme : lightTheme);
    // Update body + html background for areas outside the React root
    const bg = theme === 'dark' ? darkTheme.colors.bg : lightTheme.colors.bg;
    const fg = theme === 'dark' ? darkTheme.colors.text : lightTheme.colors.text;
    document.body.style.backgroundColor = bg;
    document.body.style.color = fg;
    document.documentElement.style.backgroundColor = bg;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      // Update the global proxy synchronously before re-render
      _setActiveTheme(next === 'dark' ? darkTheme : lightTheme);
      return next;
    });
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

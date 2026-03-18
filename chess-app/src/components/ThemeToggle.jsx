import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SunIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function ThemeToggle() {
  const { isDark, toggleTheme, themeObject } = useTheme();
  const { colors } = themeObject;

  const styles = {
    button: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      border: 'none',
      backgroundColor: 'transparent',
      color: colors.textSecondary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      transition: 'background-color 200ms ease, color 200ms ease, transform 200ms ease',
      outline: 'none',
    },
    icon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 300ms ease, opacity 300ms ease',
      transform: isDark ? 'rotate(0deg)' : 'rotate(90deg)',
    },
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = colors.bgHover;
    e.currentTarget.style.color = colors.text;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = colors.textSecondary;
  };

  return (
    <button
      onClick={toggleTheme}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={styles.button}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span style={styles.icon}>
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}

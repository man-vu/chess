import { useState, useCallback } from 'react';

const BOARD_THEMES = {
  classic: {
    name: 'Classic',
    light: '#f0d9b5',
    dark: '#b58863',
    selectedLight: '#f7f769',
    selectedDark: '#bbcc44',
    lastMoveLight: '#ced26b',
    lastMoveDark: '#aaa23a',
  },
  blue: {
    name: 'Blue',
    light: '#dee3e6',
    dark: '#8ca2ad',
    selectedLight: '#b4d88b',
    selectedDark: '#7fa650',
    lastMoveLight: '#a9cce3',
    lastMoveDark: '#6e9ab5',
  },
  green: {
    name: 'Green',
    light: '#ffffdd',
    dark: '#86a666',
    selectedLight: '#f7f769',
    selectedDark: '#bbcc44',
    lastMoveLight: '#d6e6a0',
    lastMoveDark: '#a0c060',
  },
  wood: {
    name: 'Wood',
    light: '#e8c889',
    dark: '#a07840',
    selectedLight: '#f5e680',
    selectedDark: '#c8a838',
    lastMoveLight: '#d4c07a',
    lastMoveDark: '#9a8540',
  },
  contrast: {
    name: 'High Contrast',
    light: '#ffffff',
    dark: '#5c5c5c',
    selectedLight: '#fef250',
    selectedDark: '#c8b020',
    lastMoveLight: '#c0e0c0',
    lastMoveDark: '#607060',
  },
  purple: {
    name: 'Purple',
    light: '#e8dff0',
    dark: '#9070b0',
    selectedLight: '#d4b0f0',
    selectedDark: '#a070d0',
    lastMoveLight: '#d8c8e8',
    lastMoveDark: '#8868a8',
  },
};

const STORAGE_KEY = 'chess_board_theme';

export { BOARD_THEMES };

export default function useBoardTheme() {
  const [themeId, setThemeId] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && BOARD_THEMES[stored]) return stored;
    } catch {}
    return 'classic';
  });

  const setBoardTheme = useCallback((id) => {
    if (BOARD_THEMES[id]) {
      setThemeId(id);
      try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    }
  }, []);

  return {
    boardTheme: BOARD_THEMES[themeId],
    boardThemeId: themeId,
    setBoardTheme,
    allThemes: BOARD_THEMES,
  };
}

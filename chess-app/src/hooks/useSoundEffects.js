import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'chess_sound_enabled';

function getInitialSoundEnabled() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
    // localStorage may be unavailable
  }
  return true;
}

function createTone(ctx, frequency, duration, volume, type, startTime) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export default function useSoundEffects() {
  const [soundEnabled, setSoundEnabled] = useState(getInitialSoundEnabled);
  const ctxRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playMove = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      createTone(ctx, 800, 0.03, 0.3, 'square', now);
    } catch {
      // Web Audio can fail silently
    }
  }, [soundEnabled, getContext]);

  const playCapture = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      createTone(ctx, 600, 0.02, 0.4, 'square', now);
      createTone(ctx, 400, 0.02, 0.4, 'square', now + 0.02);
    } catch {
      // Web Audio can fail silently
    }
  }, [soundEnabled, getContext]);

  const playCheck = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      createTone(ctx, 660, 0.05, 0.35, 'sine', now);
      createTone(ctx, 880, 0.05, 0.35, 'sine', now + 0.05);
    } catch {
      // Web Audio can fail silently
    }
  }, [soundEnabled, getContext]);

  const playGameOver = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      createTone(ctx, 880, 0.1, 0.35, 'sine', now);
      createTone(ctx, 660, 0.1, 0.35, 'sine', now + 0.1);
      createTone(ctx, 440, 0.1, 0.35, 'sine', now + 0.2);
    } catch {
      // Web Audio can fail silently
    }
  }, [soundEnabled, getContext]);

  const playCastle = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      createTone(ctx, 800, 0.03, 0.3, 'square', now);
      createTone(ctx, 800, 0.03, 0.3, 'square', now + 0.08);
    } catch {
      // Web Audio can fail silently
    }
  }, [soundEnabled, getContext]);

  const playPromotion = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      createTone(ctx, 440, 0.04, 0.3, 'sine', now);
      createTone(ctx, 554, 0.04, 0.3, 'sine', now + 0.04);
      createTone(ctx, 659, 0.04, 0.3, 'sine', now + 0.08);
      createTone(ctx, 880, 0.04, 0.3, 'sine', now + 0.12);
    } catch {
      // Web Audio can fail silently
    }
  }, [soundEnabled, getContext]);

  const playPremove = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      createTone(ctx, 500, 0.015, 0.15, 'sine', now);
    } catch {
      // Web Audio can fail silently
    }
  }, [soundEnabled, getContext]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  return {
    playMove,
    playCapture,
    playCheck,
    playGameOver,
    playCastle,
    playPromotion,
    playPremove,
    soundEnabled,
    toggleSound,
  };
}

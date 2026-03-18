import { useState, useRef, useCallback, useEffect } from 'react';

const TICK_INTERVAL = 100;

export default function useChessClock({ initialTime = 300000, increment = 0, enabled = true }) {
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);
  const [activeColor, setActiveColor] = useState(null);
  const [isWhiteTimeout, setIsWhiteTimeout] = useState(false);
  const [isBlackTimeout, setIsBlackTimeout] = useState(false);

  const intervalRef = useRef(null);
  const activeColorRef = useRef(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      const color = activeColorRef.current;
      if (!color) return;

      const setter = color === 'w' ? setWhiteTime : setBlackTime;
      const setTimeout_ = color === 'w' ? setIsWhiteTimeout : setIsBlackTimeout;

      setter((prev) => {
        const next = prev - TICK_INTERVAL;
        if (next <= 0) {
          setTimeout_(true);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          activeColorRef.current = null;
          setActiveColor(null);
          return 0;
        }
        return next;
      });
    }, TICK_INTERVAL);
  }, [clearTick]);

  const startClock = useCallback((color) => {
    if (!enabled) return;
    activeColorRef.current = color;
    setActiveColor(color);
    startTick();
  }, [enabled, startTick]);

  const switchClock = useCallback(() => {
    if (!enabled) return;
    const current = activeColorRef.current;
    if (!current) return;

    // Add increment to the color that just moved
    if (increment > 0) {
      const setter = current === 'w' ? setWhiteTime : setBlackTime;
      setter((prev) => prev + increment);
    }

    // Switch to the other color
    const next = current === 'w' ? 'b' : 'w';
    activeColorRef.current = next;
    setActiveColor(next);
    startTick();
  }, [enabled, increment, startTick]);

  const pauseClock = useCallback(() => {
    clearTick();
    activeColorRef.current = null;
    setActiveColor(null);
  }, [clearTick]);

  const resetClock = useCallback(() => {
    clearTick();
    activeColorRef.current = null;
    setActiveColor(null);
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    setIsWhiteTimeout(false);
    setIsBlackTimeout(false);
  }, [clearTick, initialTime]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      clearTick();
    };
  }, [clearTick]);

  // Reset when initialTime changes
  useEffect(() => {
    resetClock();
  }, [initialTime]);

  return {
    whiteTime,
    blackTime,
    activeColor,
    isWhiteTimeout,
    isBlackTimeout,
    startClock,
    switchClock,
    pauseClock,
    resetClock,
  };
}

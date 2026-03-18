import React, { useMemo } from 'react';
import { colors, borderRadius, spacing, transitions, typography } from '../theme';

function formatTime(ms) {
  if (ms <= 0) return '0:00';

  const totalSeconds = Math.ceil(ms / 1000);

  if (ms < 20000) {
    // Under 20 seconds: show "S.T" (seconds.tenths)
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}`;
  }

  // 1 minute or more (or between 20s and 60s): show "M:SS"
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const PULSE_KEYFRAMES = `
@keyframes chess-clock-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`;

function ClockFace({ time, isActive, isTimeout, label }) {
  const isLow = time < 20000 && !isTimeout;

  const containerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: borderRadius.md,
    backgroundColor: isActive ? colors.accent : colors.bgDeep,
    border: `1px solid ${isActive ? colors.accent : colors.border}`,
    transition: `background-color ${transitions.fast}, border-color ${transitions.fast}`,
    minWidth: 140,
  }), [isActive]);

  const labelStyle = useMemo(() => ({
    fontFamily: typography.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: 600,
    color: isActive ? colors.white : colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginRight: spacing.sm,
    transition: `color ${transitions.fast}`,
  }), [isActive]);

  const timeStyle = useMemo(() => {
    let color = isActive ? colors.white : colors.textSecondary;
    let animation = 'none';

    if (isTimeout) {
      color = colors.error;
    } else if (isLow) {
      color = isActive ? '#fecaca' : colors.error;
      animation = 'chess-clock-pulse 1s ease-in-out infinite';
    }

    return {
      fontFamily: typography.monoFamily,
      fontSize: 22,
      fontWeight: 700,
      color,
      letterSpacing: '0.02em',
      lineHeight: 1,
      animation,
      transition: `color ${transitions.fast}`,
      minWidth: 60,
      textAlign: 'right',
    };
  }, [isActive, isTimeout, isLow]);

  const displayText = isTimeout ? 'FLAG' : formatTime(time);

  return (
    <div style={containerStyle} role="timer" aria-label={`${label} clock: ${isTimeout ? 'time expired' : formatTime(time)}`}>
      <span style={labelStyle}>{label}</span>
      <span style={timeStyle}>{displayText}</span>
    </div>
  );
}

export default function ChessClock({ whiteTime, blackTime, activeColor, isWhiteTimeout, isBlackTimeout }) {
  const wrapperStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  }), []);

  return (
    <div style={wrapperStyle} aria-live="polite">
      <style>{PULSE_KEYFRAMES}</style>
      <ClockFace
        time={blackTime}
        isActive={activeColor === 'b'}
        isTimeout={isBlackTimeout}
        label="Black"
      />
      <ClockFace
        time={whiteTime}
        isActive={activeColor === 'w'}
        isTimeout={isWhiteTimeout}
        label="White"
      />
    </div>
  );
}

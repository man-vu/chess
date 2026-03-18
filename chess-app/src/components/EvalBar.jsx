import React, { useMemo } from 'react';
import { colors, transitions, typography, borderRadius } from '../theme';

const BAR_WIDTH = 30;
const BAR_HEIGHT = 576;
const MIN_PERCENT = 5;
const MAX_PERCENT = 95;
const MATE_THRESHOLD = 9000;

/**
 * Maps centipawn evaluation to a percentage for White's bar height.
 * Uses a sigmoid-like function: +300cp ~ 75%, +600cp ~ 90%.
 */
function evalToPercent(cp) {
  if (cp === null || cp === undefined) return 50;
  // Sigmoid: 50 + 50 * (2 / (1 + e^(-k*cp)) - 1)
  // Tuned so that k produces ~75% at 300cp and ~90% at 600cp.
  // k = 0.004 gives: sigmoid(300) ~ 73%, sigmoid(600) ~ 91% — close enough.
  const k = 0.004;
  const raw = 50 + 50 * (2 / (1 + Math.exp(-k * cp)) - 1);
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, raw));
}

/**
 * Formats the evaluation for display.
 * Centipawns -> pawns with 1 decimal. Mate scores -> "M3", "M-2", etc.
 */
function formatEval(cp) {
  if (cp === null || cp === undefined) return '';

  if (Math.abs(cp) >= MATE_THRESHOLD) {
    // Mate score: show "M" + number of moves (we encode as +/-10000)
    // Since we only know it's mate (not the exact move count from the bar),
    // the caller should pass the raw cp which may be exactly +/-10000.
    // We display "M" for mate.
    const sign = cp > 0 ? '' : '-';
    return `M${sign}`;
  }

  const pawns = cp / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}

/**
 * Formats mate scores more precisely when possible.
 * Accepts the raw centipawn value and attempts to derive mate-in-N.
 */
function formatMateScore(cp) {
  if (cp === null || cp === undefined) return null;
  if (Math.abs(cp) < MATE_THRESHOLD) return null;
  return cp > 0 ? 'M' : '-M';
}

export default function EvalBar({ evaluation, depth }) {
  const whitePercent = useMemo(() => evalToPercent(evaluation), [evaluation]);

  const displayText = useMemo(() => {
    if (evaluation === null || evaluation === undefined) return '';
    return formatEval(evaluation);
  }, [evaluation]);

  const isMate = evaluation !== null && Math.abs(evaluation) >= MATE_THRESHOLD;

  // Determine if score label sits in the white or black zone
  // Place the label near the boundary between white and black
  const labelInWhiteZone = whitePercent >= 50;

  const containerStyle = {
    position: 'relative',
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    flexShrink: 0,
    userSelect: 'none',
  };

  const blackSectionStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: `${100 - whitePercent}%`,
    backgroundColor: '#1a1a1d',
    transition: `height ${transitions.base}`,
  };

  const whiteSectionStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: `${whitePercent}%`,
    backgroundColor: '#ececef',
    transition: `height ${transitions.base}`,
  };

  const scoreLabelStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: typography.monoFamily,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1,
    padding: '2px 0',
    zIndex: 1,
    // Position the label at the boundary
    ...(labelInWhiteZone
      ? {
          top: `${100 - whitePercent}%`,
          marginTop: 4,
          color: '#1a1a1d',
        }
      : {
          bottom: `${whitePercent}%`,
          marginBottom: 4,
          color: '#ececef',
        }),
  };

  const depthLabelStyle = {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: typography.monoFamily,
    fontSize: 8,
    color: colors.textMuted,
    zIndex: 1,
  };

  return (
    <div style={containerStyle} aria-label={`Evaluation: ${displayText || 'No evaluation'}`}>
      <div style={blackSectionStyle} />
      <div style={whiteSectionStyle} />
      {displayText && <div style={scoreLabelStyle}>{displayText}</div>}
      {depth > 0 && <div style={depthLabelStyle}>d{depth}</div>}
    </div>
  );
}

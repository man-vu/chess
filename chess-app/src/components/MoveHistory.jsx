import { useRef, useEffect } from 'react';
import { colors, borderRadius, spacing, typography, transitions } from '../theme';

export default function MoveHistory({ history, currentMoveIndex }) {
  const scrollRef = useRef(null);
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] || '',
      whiteIdx: i,
      blackIdx: i + 1,
    });
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  return (
    <div
      style={{
        width: 240,
        maxHeight: 576,
        backgroundColor: colors.bgDeep,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        padding: `${spacing.sm}px ${spacing.md}px`,
        fontWeight: 600,
        fontSize: 13,
        color: colors.textSecondary,
        borderBottom: `1px solid ${colors.border}`,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}>
        Moves
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: `${spacing.xs}px 0` }}>
        {pairs.map((p) => (
          <div
            key={p.num}
            style={{
              display: 'flex',
              padding: `4px ${spacing.md}px`,
              fontSize: 14,
              fontFamily: typography.monoFamily,
              backgroundColor: p.num % 2 === 0 ? colors.bgCard : 'transparent',
              transition: `background-color ${transitions.fast}`,
            }}
          >
            <span style={{ width: 36, color: colors.textDark, fontWeight: 500, flexShrink: 0 }}>{p.num}.</span>
            <span style={{
              width: 80,
              color: currentMoveIndex === p.whiteIdx ? colors.accent : colors.text,
              fontWeight: currentMoveIndex === p.whiteIdx ? 600 : 400,
            }}>
              {p.white}
            </span>
            <span style={{
              width: 80,
              color: currentMoveIndex === p.blackIdx ? colors.accent : colors.text,
              fontWeight: currentMoveIndex === p.blackIdx ? 600 : 400,
            }}>
              {p.black}
            </span>
          </div>
        ))}
        {pairs.length === 0 && (
          <div style={{
            padding: spacing.lg,
            color: colors.textDark,
            textAlign: 'center',
            fontSize: 13,
            fontStyle: 'italic',
          }}>
            No moves yet
          </div>
        )}
      </div>
    </div>
  );
}

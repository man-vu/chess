import ChessPiece from './ChessPiece';
import { colors, borderRadius, shadows, spacing, transitions } from '../theme';

export default function PromotionModal({ color, onSelect }) {
  const pieces = ['q', 'r', 'b', 'n'];
  const labels = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'backdropIn 200ms ease',
      }}
    >
      <div
        style={{
          backgroundColor: colors.bgCard,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.xl,
          animation: 'modalIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <p style={{
          textAlign: 'center',
          margin: 0,
          fontWeight: 600,
          fontSize: 16,
          color: colors.text,
          letterSpacing: '-0.01em',
        }}>
          Promote to
        </p>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {pieces.map((p) => (
            <button
              key={p}
              onClick={() => onSelect(p)}
              style={{
                width: 72,
                height: 80,
                border: `2px solid ${colors.border}`,
                borderRadius: borderRadius.lg,
                backgroundColor: colors.bgElevated,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: `border-color ${transitions.fast}, background-color ${transitions.fast}, transform ${transitions.fast}`,
                outline: 'none',
                padding: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.style.backgroundColor = colors.accentLight;
                e.currentTarget.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.backgroundColor = colors.bgElevated;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChessPiece type={p} color={color} size={48} />
              <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 500 }}>{labels[p]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

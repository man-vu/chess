import { colors, borderRadius, spacing, shadows, transitions } from '../../theme';

export default function StatCard({ label, value, subtext, color = colors.text }) {
  return (
    <div
      style={{
        backgroundColor: colors.bgDeep,
        borderRadius: borderRadius.lg,
        padding: `${spacing.md}px ${spacing.lg}px`,
        textAlign: 'center',
        flex: 1,
        minWidth: 100,
        border: `1px solid ${colors.border}`,
        transition: `border-color ${transitions.base}, transform ${transitions.base}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.borderLight;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      {subtext && <div style={{ fontSize: 11, color: colors.textDark, marginTop: 2 }}>{subtext}</div>}
    </div>
  );
}

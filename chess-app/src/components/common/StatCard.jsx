import { colors, borderRadius, spacing } from '../../theme';

export default function StatCard({ label, value, subtext, color = colors.text }) {
  return (
    <div
      style={{
        backgroundColor: colors.bgDeep,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        textAlign: 'center',
        flex: 1,
        minWidth: 100,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{label}</div>
      {subtext && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{subtext}</div>}
    </div>
  );
}

import { colors, borderRadius } from '../../theme';

const COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#e91e63'];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function Avatar({ username, size = 40, style }) {
  const initials = (username || '?').slice(0, 2).toUpperCase();
  const bg = COLORS[hashCode(username || '') % COLORS.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius.full,
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.white,
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}

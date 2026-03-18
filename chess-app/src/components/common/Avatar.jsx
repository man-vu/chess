import { colors, borderRadius, shadows } from '../../theme';

const GRADIENTS = [
  ['#e74c3c', '#c0392b'],
  ['#e67e22', '#d35400'],
  ['#f1c40f', '#f39c12'],
  ['#2ecc71', '#27ae60'],
  ['#3498db', '#2980b9'],
  ['#9b59b6', '#8e44ad'],
  ['#1abc9c', '#16a085'],
  ['#e91e63', '#c2185b'],
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export default function Avatar({ username, size = 40, style }) {
  const initials = (username || '?').slice(0, 2).toUpperCase();
  const [c1, c2] = GRADIENTS[hashCode(username || '') % GRADIENTS.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius.full,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.white,
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
        boxShadow: size >= 40 ? shadows.sm : 'none',
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {initials}
    </div>
  );
}

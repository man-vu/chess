import { borderRadius } from '../../theme';

export default function Badge({ text, color = '#81b64c', style }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: borderRadius.sm,
        backgroundColor: `${color}22`,
        color: color,
        fontSize: 12,
        fontWeight: 600,
        ...style,
      }}
    >
      {text}
    </span>
  );
}

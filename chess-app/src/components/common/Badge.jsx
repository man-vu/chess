import { borderRadius } from '../../theme';

export default function Badge({ text, color = '#7cb342', style }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: borderRadius.sm,
        backgroundColor: `${color}18`,
        color: color,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {text}
    </span>
  );
}

import type { ReactNode, CSSProperties } from 'react';
import { useTheme } from '../ThemeContext.js';

interface HeadingProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

const sizeMap: Record<number, CSSProperties> = {
  1: { fontSize: '28px' },
  2: { fontSize: '22px' },
  3: { fontSize: '18px' },
  4: { fontSize: '16px' },
};

export function Heading({ children, level = 1, color, align = 'left' }: HeadingProps) {
  const theme = useTheme();
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
  const style: CSSProperties = {
    fontWeight: '700',
    lineHeight: '1.3',
    margin: '0 0 16px 0',
    padding: '24px 32px 0',
    color: color ?? theme.textPrimary,
    textAlign: align,
    ...(sizeMap[level] ?? sizeMap[1]),
  };
  return (
    <Tag className="tierde-text-primary" style={style}>
      {children}
    </Tag>
  );
}

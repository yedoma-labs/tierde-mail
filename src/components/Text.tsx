import type { ReactNode, CSSProperties } from 'react';
import { useTheme } from '../ThemeContext.js';

interface TextProps {
  children: ReactNode;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
  align?: 'left' | 'center' | 'right';
}

const sizeMap = {
  sm: '13px',
  md: '15px',
  lg: '17px',
};

export function Text({ children, color, size = 'md', muted = false, align = 'left' }: TextProps) {
  const theme = useTheme();
  const defaultColor = muted ? theme.textMuted : theme.textSecondary;
  const className = muted ? 'tierde-text-muted' : 'tierde-text-secondary';
  const style: CSSProperties = {
    margin: '0 0 16px 0',
    padding: '0 32px',
    fontSize: sizeMap[size],
    lineHeight: '1.6',
    color: color ?? defaultColor,
    textAlign: align,
  };
  return (
    <p className={className} style={style}>
      {children}
    </p>
  );
}

import type { ReactNode, CSSProperties } from 'react';

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
  const style: CSSProperties = {
    margin: '0 0 16px 0',
    padding: '0 32px',
    fontSize: sizeMap[size],
    lineHeight: '1.6',
    color: color ?? (muted ? '#6b7280' : '#374151'),
    textAlign: align,
  };
  return <p style={style}>{children}</p>;
}

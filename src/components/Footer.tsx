import type { ReactNode, CSSProperties } from 'react';

interface FooterProps {
  children: ReactNode;
}

const style: CSSProperties = {
  padding: '24px 32px',
  borderTop: '1px solid #e5e7eb',
  fontSize: '12px',
  color: '#9ca3af',
  textAlign: 'center',
  lineHeight: '1.5',
};

export function Footer({ children }: FooterProps) {
  return <div style={style}>{children}</div>;
}

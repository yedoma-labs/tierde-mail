import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { useTheme } from '../ThemeContext.js';

interface FooterProps {
  children: ReactNode;
}

export function Footer({ children }: FooterProps): ReactElement {
  const theme = useTheme();
  const style: CSSProperties = {
    padding: '24px 32px',
    borderTop: `1px solid ${theme.border}`,
    fontSize: '12px',
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: '1.5',
  };
  return (
    <div className="tierde-footer" style={style}>
      {children}
    </div>
  );
}

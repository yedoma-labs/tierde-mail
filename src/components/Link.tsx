import type { ReactNode, CSSProperties, ReactElement } from 'react';
import { useTheme } from '../ThemeContext.js';

interface LinkProps {
  href: string;
  children: ReactNode;
  color?: string;
}

export function Link({ href, children, color }: LinkProps): ReactElement {
  const theme = useTheme();
  const linkColor = color ?? theme.primary;
  const style: CSSProperties = {
    color: linkColor,
    textDecoration: 'underline',
  };
  return (
    <a href={href} style={style} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

import type { ReactNode, CSSProperties, ReactElement } from 'react';
import { useTheme } from '../ThemeContext.js';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^(https?|mailto):/.test(parsed.protocol || parsed.href);
  } catch {
    return url.startsWith('/') || !url.includes(':');
  }
}

interface LinkProps {
  href: string;
  children: ReactNode;
  color?: string;
}

export function Link({ href, children, color }: LinkProps): ReactElement {
  if (!isValidUrl(href)) {
    throw new Error(`Invalid link href: ${href}`);
  }
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

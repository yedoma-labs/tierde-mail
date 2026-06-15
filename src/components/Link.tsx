import type { ReactNode, CSSProperties, ReactElement } from 'react';

interface LinkProps {
  href: string;
  children: ReactNode;
  color?: string;
}

export function Link({ href, children, color = '#2563eb' }: LinkProps): ReactElement {
  const style: CSSProperties = {
    color,
    textDecoration: 'underline',
  };
  return (
    <a href={href} style={style} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

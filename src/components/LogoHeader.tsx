import type { CSSProperties, ReactElement } from 'react';
import { useTheme } from '../ThemeContext.js';

interface LogoHeaderProps {
  src?: string;
  alt?: string;
  width?: number;
  backgroundColor?: string;
}

export function LogoHeader({
  src,
  alt,
  width,
  backgroundColor,
}: LogoHeaderProps): ReactElement | null {
  const theme = useTheme();
  const logoSrc = src ?? theme.logo;
  if (!logoSrc) return null;

  const tdStyle: CSSProperties = {
    padding: '28px 32px 20px',
    textAlign: 'center',
    backgroundColor: backgroundColor ?? theme.cardBackground,
  };

  return (
    <div className="tierde-logo-bg" style={tdStyle}>
      <img
        src={logoSrc}
        alt={alt ?? theme.logoAlt ?? ''}
        width={width ?? theme.logoWidth ?? 140}
        style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto' }}
      />
    </div>
  );
}

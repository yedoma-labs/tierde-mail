import type { CSSProperties, ReactElement } from 'react';
import { useTheme } from '../ThemeContext.js';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  align?: 'left' | 'center' | 'right';
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http, https, and mailto
    return /^(https?|mailto):/.test(parsed.protocol || parsed.href);
  } catch {
    // Relative URLs like `/path` fail URL constructor, treat as valid
    return url.startsWith('/') || !url.includes(':');
  }
}

export function Button({ href, children, variant = 'primary', align = 'center' }: ButtonProps): ReactElement {
  if (!isValidUrl(href)) {
    throw new Error(`Invalid button href: ${href}`);
  }
  const theme = useTheme();

  let bgColor: string;
  let textColor: string;
  let border: string;

  if (variant === 'secondary') {
    bgColor = theme.secondary;
    textColor = theme.secondaryText;
    border = 'none';
  } else if (variant === 'outline') {
    bgColor = 'transparent';
    textColor = theme.primary;
    border = `2px solid ${theme.primary}`;
  } else {
    bgColor = theme.primary;
    textColor = theme.primaryText;
    border = 'none';
  }

  const wrapperStyle: CSSProperties = {
    padding: '8px 32px 24px',
    textAlign: align,
  };

  // Table-based button: renders correctly in Outlook without VML
  const tableStyle: CSSProperties = {
    display: 'inline-table',
    borderCollapse: 'collapse',
    borderRadius: theme.buttonBorderRadius,
    border,
  };

  const tdStyle: CSSProperties = {
    backgroundColor: bgColor,
    borderRadius: theme.buttonBorderRadius,
    padding: '13px 30px',
  };

  const linkStyle: CSSProperties = {
    color: textColor,
    fontSize: '15px',
    fontWeight: '600',
    lineHeight: '1',
    textDecoration: 'none',
    display: 'block',
  };

  return (
    <div style={wrapperStyle}>
      <table role="presentation" style={tableStyle} cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td style={tdStyle}>
              <a href={href} style={linkStyle}>
                {children}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

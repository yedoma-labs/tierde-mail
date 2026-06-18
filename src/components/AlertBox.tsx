import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { useTheme } from '../ThemeContext.js';

export type AlertBoxVariant = 'danger' | 'warning' | 'success' | 'info';

interface AlertBoxProps {
  variant?: AlertBoxVariant;
  icon?: string;
  children: ReactNode;
}

const iconStyle: CSSProperties = {
  fontSize: '24px',
  display: 'block',
  marginBottom: '8px',
};

export function AlertBox({ variant = 'info', icon, children }: AlertBoxProps): ReactElement {
  const theme = useTheme();
  const variants: Record<AlertBoxVariant, { bg: string; border: string; text: string }> = {
    danger: { bg: theme.dangerBg, border: theme.dangerBorder, text: theme.dangerText },
    warning: { bg: theme.warningBg, border: theme.warningBorder, text: theme.warningText },
    success: { bg: theme.successBg, border: theme.successBorder, text: theme.successText },
    info: { bg: theme.infoBg, border: theme.infoBorder, text: theme.infoText },
  };
  const v = variants[variant];
  const boxStyle: CSSProperties = {
    backgroundColor: v.bg,
    border: `1px solid ${v.border}`,
    borderRadius: '8px',
    padding: '16px',
  };
  const textStyle: CSSProperties = {
    color: v.text,
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.6',
  };

  return (
    <div style={boxStyle}>
      {icon && <span style={iconStyle}>{icon}</span>}
      <p style={textStyle}>{children}</p>
    </div>
  );
}

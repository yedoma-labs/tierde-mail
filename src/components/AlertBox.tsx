import type { ReactNode, CSSProperties, ReactElement } from 'react';

export type AlertBoxVariant = 'danger' | 'warning' | 'success' | 'info';

interface AlertBoxProps {
  variant?: AlertBoxVariant;
  icon?: string;
  children: ReactNode;
}

const variants: Record<AlertBoxVariant, { bg: string; border: string; text: string }> = {
  danger:  { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d' },
  warning: { bg: '#fff7ed', border: '#fed7aa', text: '#7c2d12' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
};

const iconStyle: CSSProperties = {
  fontSize: '24px',
  display: 'block',
  marginBottom: '8px',
};

export function AlertBox({ variant = 'info', icon, children }: AlertBoxProps): ReactElement {
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

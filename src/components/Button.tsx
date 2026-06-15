import type { CSSProperties } from 'react';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  align?: 'left' | 'center' | 'right';
}

const variants: Record<string, CSSProperties> = {
  primary: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#2563eb',
    border: '2px solid #2563eb',
  },
};

export function Button({ href, children, variant = 'primary', align = 'center' }: ButtonProps) {
  const variantStyle = variants[variant] ?? (variants['primary'] as CSSProperties);
  const wrapperStyle: CSSProperties = {
    padding: '8px 32px 24px',
    textAlign: align,
  };
  const linkStyle: CSSProperties = {
    ...variantStyle,
    display: 'inline-block',
    padding: '12px 28px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '600',
    lineHeight: '1',
    textDecoration: 'none',
    cursor: 'pointer',
  };
  return (
    <div style={wrapperStyle}>
      <a href={href} style={linkStyle}>
        {children}
      </a>
    </div>
  );
}

import type { ReactNode, CSSProperties } from 'react';

interface SectionProps {
  children: ReactNode;
  padding?: string;
  backgroundColor?: string;
}

export function Section({
  children,
  padding = '24px 32px',
  backgroundColor,
}: SectionProps) {
  const style: CSSProperties = {
    padding,
    ...(backgroundColor ? { backgroundColor } : {}),
  };
  return <div style={style}>{children}</div>;
}

import type { ReactNode, CSSProperties, ReactElement } from 'react';

interface SectionProps {
  children: ReactNode;
  padding?: string;
  backgroundColor?: string;
}

export function Section({
  children,
  padding = '24px 32px',
  backgroundColor,
}: SectionProps): ReactElement {
  const style: CSSProperties = {
    padding,
    ...(backgroundColor ? { backgroundColor } : {}),
  };
  return <div style={style}>{children}</div>;
}

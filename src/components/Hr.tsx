import type { CSSProperties } from 'react';

interface HrProps {
  color?: string;
  margin?: string;
}

export function Hr({ color = '#e5e7eb', margin = '24px 32px' }: HrProps) {
  const style: CSSProperties = {
    border: 'none',
    borderTop: `1px solid ${color}`,
    margin,
  };
  return <hr style={style} />;
}

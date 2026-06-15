import type { CSSProperties } from 'react';
import { useTheme } from '../ThemeContext.js';

interface HrProps {
  color?: string;
  margin?: string;
}

export function Hr({ color, margin = '24px 32px' }: HrProps) {
  const theme = useTheme();
  const style: CSSProperties = {
    border: 'none',
    borderTop: `1px solid ${color ?? theme.border}`,
    margin,
  };
  return <hr className="tierde-border" style={style} />;
}

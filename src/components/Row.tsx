import type { ReactNode, CSSProperties } from 'react';

interface RowProps {
  children: ReactNode;
  padding?: string;
}

export function Row({ children, padding = '0 32px' }: RowProps) {
  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    padding,
  };
  return (
    <table role="presentation" style={tableStyle} cellPadding="0" cellSpacing="0">
      <tbody>
        <tr>{children}</tr>
      </tbody>
    </table>
  );
}

interface ColumnProps {
  children: ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
}

export function Column({ children, width, align = 'left', valign = 'top' }: ColumnProps) {
  const style: CSSProperties = {
    verticalAlign: valign,
    textAlign: align,
    ...(width ? { width } : {}),
  };
  return <td style={style}>{children}</td>;
}

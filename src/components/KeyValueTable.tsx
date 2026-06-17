import type { ReactNode, CSSProperties, ReactElement } from 'react';
import { useTheme } from '../ThemeContext.js';

export interface KeyValueRow {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

interface KeyValueTableProps {
  rows: KeyValueRow[];
}

export function KeyValueTable({ rows }: KeyValueTableProps): ReactElement {
  const theme = useTheme();
  const filtered = rows.filter((r) => r.value != null && r.value !== '' && r.value !== false);
  if (filtered.length === 0) return <></>;

  const cellBase: CSSProperties = {
    padding: '8px 0',
    borderBottom: `1px solid ${theme.border}`,
    fontSize: '14px',
    verticalAlign: 'top',
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
      <tbody>
        {filtered.map(({ label, value, mono }) => (
          <tr key={label}>
            <td className="tierde-kv-label" style={{ ...cellBase, color: theme.textMuted, width: '40%' }}>{label}</td>
            <td className="tierde-kv-value" style={{
              ...cellBase,
              color: theme.textPrimary,
              fontWeight: '500',
              ...(mono ? { fontFamily: 'monospace', fontSize: '13px' } : {}),
            }}>
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

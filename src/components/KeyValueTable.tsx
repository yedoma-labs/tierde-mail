import type { ReactNode, CSSProperties, ReactElement } from 'react';

export interface KeyValueRow {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

interface KeyValueTableProps {
  rows: KeyValueRow[];
}

const cellBase: CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '14px',
  verticalAlign: 'top',
};

export function KeyValueTable({ rows }: KeyValueTableProps): ReactElement {
  const filtered = rows.filter((r) => r.value != null && r.value !== '' && r.value !== false);
  if (filtered.length === 0) return <></>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
      <tbody>
        {filtered.map(({ label, value, mono }) => (
          <tr key={label}>
            <td className="tierde-kv-label" style={{ ...cellBase, color: '#6b7280', width: '40%' }}>{label}</td>
            <td className="tierde-kv-value" style={{
              ...cellBase,
              color: '#0f172a',
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

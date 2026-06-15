import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';

export interface InvoiceLineItem {
  name: string;
  description?: string;
  quantity?: number;
  price: number;
}

export interface InvoiceProps {
  customerName: string;
  invoiceNumber: string;
  items: InvoiceLineItem[];
  currency?: string;
  appName?: string;
  supportEmail?: string;
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 0',
  borderBottom: '2px solid #e5e7eb',
  color: '#6b7280',
  fontWeight: '600',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: CSSProperties = {
  padding: '12px 0',
  borderBottom: '1px solid #f3f4f6',
  color: '#374151',
};

const totalRowStyle: CSSProperties = {
  ...tdStyle,
  fontWeight: '700',
  fontSize: '16px',
  borderBottom: 'none',
  borderTop: '2px solid #e5e7eb',
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export const Invoice = defineEmail<InvoiceProps>({
  subject: ({ appName, invoiceNumber }) =>
    `Invoice #${invoiceNumber} from ${appName ?? 'Us'}`,
  component: ({
    customerName,
    invoiceNumber,
    items,
    currency = 'USD',
    appName = 'Our App',
    supportEmail,
  }) => {
    const total = items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);

    return (
      <EmailTemplate preview={`Invoice #${invoiceNumber} — ${formatCurrency(total, currency)}`}>
        <Heading>Invoice #{invoiceNumber}</Heading>
        <Text>Hi {customerName},</Text>
        <Text>Thank you for your business. Here's your invoice summary.</Text>
        <Section>
          <table style={tableStyle} cellPadding="0" cellSpacing="0">
            <thead>
              <tr>
                <th style={thStyle}>Item</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td style={tdStyle}>
                    <strong>{item.name}</strong>
                    {item.description && (
                      <>
                        <br />
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>
                          {item.description}
                        </span>
                      </>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{item.quantity ?? 1}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {formatCurrency(item.price, currency)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {formatCurrency(item.price * (item.quantity ?? 1), currency)}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={totalRowStyle} colSpan={3}>
                  Total
                </td>
                <td style={{ ...totalRowStyle, textAlign: 'right' }}>
                  {formatCurrency(total, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Hr />
        <Text muted size="sm">
          {supportEmail
            ? `Questions about this invoice? Contact us at ${supportEmail}.`
            : 'Questions? Reply to this email.'}
        </Text>
        <Footer>© {currentYear()} {appName}. All rights reserved.</Footer>
      </EmailTemplate>
    );
  },
});

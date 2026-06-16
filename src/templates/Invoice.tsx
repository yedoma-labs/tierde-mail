import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface InvoiceStrings {
  subject: (invoiceNumber: string, appName: string) => string;
  heading: (invoiceNumber: string) => string;
  greeting: (customerName: string) => string;
  intro: string;
  colItem: string;
  colQty: string;
  colPrice: string;
  colTotal: string;
  totalLabel: string;
  supportNote: (supportEmail: string) => string;
  replyNote: string;
  footer: (year: string, appName: string) => string;
}

export const INVOICE_STRINGS: InvoiceStrings = {
  subject: (invoiceNumber, appName) => `Invoice #${invoiceNumber} from ${appName}`,
  heading: (invoiceNumber) => `Invoice #${invoiceNumber}`,
  greeting: (customerName) => `Hi ${customerName},`,
  intro: "Thank you for your business. Here's your invoice summary.",
  colItem: 'Item',
  colQty: 'Qty',
  colPrice: 'Price',
  colTotal: 'Total',
  totalLabel: 'Total',
  supportNote: (supportEmail) => `Questions about this invoice? Contact us at ${supportEmail}.`,
  replyNote: 'Questions? Reply to this email.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface InvoiceLineItem {
  name: string;
  description?: string;
  quantity?: number;
  price: number;
}

export interface InvoiceProps extends BaseTemplateProps<InvoiceStrings> {
  customerName: string;
  invoiceNumber: string;
  items: InvoiceLineItem[];
  currency?: string;
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

function formatCurrency(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale ?? 'en-US', { style: 'currency', currency }).format(amount);
}

export const Invoice: EmailTemplateType<InvoiceProps> = defineEmail<InvoiceProps>({
  subject: ({ appName = 'Us', invoiceNumber, strings }) => {
    const s = { ...INVOICE_STRINGS, ...strings };
    return s.subject(invoiceNumber, appName);
  },
  component: ({
    customerName,
    invoiceNumber,
    items,
    currency = 'USD',
    appName = 'Our App',
    supportEmail,
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...INVOICE_STRINGS, ...strings };
    const year = currentYear(locale);
    const total = items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);

    return (
      <EmailTemplate
        preview={`Invoice #${invoiceNumber} — ${formatCurrency(total, currency, locale)}`}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(invoiceNumber)}</Heading>
        <Text>{s.greeting(customerName)}</Text>
        <Text>{s.intro}</Text>
        <Section>
          <table style={tableStyle} cellPadding="0" cellSpacing="0">
            <thead>
              <tr>
                <th style={thStyle}>{s.colItem}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{s.colQty}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{s.colPrice}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>{s.colTotal}</th>
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
                    {formatCurrency(item.price, currency, locale)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {formatCurrency(item.price * (item.quantity ?? 1), currency, locale)}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={totalRowStyle} colSpan={3}>
                  {s.totalLabel}
                </td>
                <td style={{ ...totalRowStyle, textAlign: 'right' }}>
                  {formatCurrency(total, currency, locale)}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
        <Hr />
        <Text muted size="sm">
          {supportEmail ? s.supportNote(supportEmail) : s.replyNote}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

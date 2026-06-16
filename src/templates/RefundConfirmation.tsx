import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { Theme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface RefundConfirmationStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (amount: string) => string;
  processingNote: (days: number) => string;
  supportNote: (email: string) => string;
  footer: (year: string, appName: string) => string;
}

export const REFUND_CONFIRMATION_STRINGS: RefundConfirmationStrings = {
  subject: (appName) => `Your refund has been processed — ${appName}`,
  heading: 'Refund confirmed',
  greeting: (name) => `Hi ${name},`,
  body: (amount) => `We've processed your refund of ${amount}. You should see it back on your original payment method within the timeframe below.`,
  processingNote: (days) => `Refunds typically appear within ${days} business days, depending on your bank or card issuer.`,
  supportNote: (email) => `Questions? Contact us at ${email}.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface RefundItem {
  name: string;
  amount: number;
}

export interface RefundConfirmationProps {
  name: string;
  refundAmount: string;
  refundId?: string;
  originalOrderId?: string;
  items?: RefundItem[];
  processingDays?: number;
  paymentMethod?: string;
  supportEmail?: string;
  currency?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<RefundConfirmationStrings>;
  theme?: Theme;
}

const detailRowStyle: CSSProperties = {
  padding: '10px 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '14px',
};

const labelStyle: CSSProperties = { color: '#6b7280' };
const valueStyle: CSSProperties = { color: '#0f172a', fontWeight: '600', textAlign: 'right' };

const successBoxStyle: CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center',
};

export const RefundConfirmation: EmailTemplateType<RefundConfirmationProps> = defineEmail<RefundConfirmationProps>({
  subject: ({ appName = 'Our Store', strings }) => {
    const s = { ...REFUND_CONFIRMATION_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name,
    refundAmount,
    refundId,
    originalOrderId,
    items,
    processingDays = 5,
    paymentMethod,
    supportEmail,
    appName = 'Our Store',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...REFUND_CONFIRMATION_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(refundAmount)}</Text>
        <Section>
          <div style={successBoxStyle}>
            <span style={{ fontSize: '32px', fontWeight: '800', color: '#16a34a' }}>{refundAmount}</span>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#15803d' }}>Refund confirmed</p>
          </div>
        </Section>
        <Section>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
            <tbody>
              {refundId && (
                <tr>
                  <td style={detailRowStyle}><span style={labelStyle}>Refund ID</span></td>
                  <td style={{ ...detailRowStyle, ...valueStyle }}><code style={{ fontFamily: 'monospace', fontSize: '12px' }}>{refundId}</code></td>
                </tr>
              )}
              {originalOrderId && (
                <tr>
                  <td style={detailRowStyle}><span style={labelStyle}>Original Order</span></td>
                  <td style={{ ...detailRowStyle, ...valueStyle }}>#{originalOrderId}</td>
                </tr>
              )}
              {paymentMethod && (
                <tr>
                  <td style={detailRowStyle}><span style={labelStyle}>Refund To</span></td>
                  <td style={{ ...detailRowStyle, ...valueStyle }}>{paymentMethod}</td>
                </tr>
              )}
              {items && items.map((item, i) => (
                <tr key={i}>
                  <td style={detailRowStyle}><span style={labelStyle}>{item.name}</span></td>
                  <td style={{ ...detailRowStyle, ...valueStyle }}>{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Hr />
        <Text muted size="sm">
          {s.processingNote(processingDays)}
          {supportEmail && <>{' '}{s.supportNote(supportEmail)}</>}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

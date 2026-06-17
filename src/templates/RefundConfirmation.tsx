import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme } from '../theme.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import { KeyValueTable } from '../components/KeyValueTable.js';
import type { CSSProperties } from 'react';
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface RefundConfirmationStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (amount: string) => string;
  refundIdLabel: string;
  originalOrderLabel: string;
  refundToLabel: string;
  processingNote: (days: number) => string;
  supportNote: (email: string) => string;
  footer: (year: string, appName: string) => string;
}

export const REFUND_CONFIRMATION_STRINGS: RefundConfirmationStrings = {
  subject: (appName) => `Your refund has been processed — ${appName}`,
  heading: 'Refund confirmed',
  greeting: (name) => `Hi ${name},`,
  body: (amount) => `We've processed your refund of ${amount}. You should see it back on your original payment method within the timeframe below.`,
  refundIdLabel: 'Refund ID',
  originalOrderLabel: 'Original Order',
  refundToLabel: 'Refund To',
  processingNote: (days) => `Refunds typically appear within ${days} business days, depending on your bank or card issuer.`,
  supportNote: (email) => `Questions? Contact us at ${email}.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface RefundItem {
  name: string;
  amount: number;
}

export interface RefundConfirmationProps extends BaseTemplateProps<RefundConfirmationStrings> {
  name: string;
  refundAmount: string;
  refundId?: string;
  originalOrderId?: string;
  items?: RefundItem[];
  processingDays?: number;
  paymentMethod?: string;
  supportEmail?: string;
  currency?: string;
}

export const RefundConfirmation: EmailTemplateType<RefundConfirmationProps> = defineEmail<RefundConfirmationProps>({
  subject: ({ appName = 'Our Store', strings }) => {
    const s = { ...REFUND_CONFIRMATION_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name, refundAmount, refundId, originalOrderId,
    items, processingDays = 5, paymentMethod, supportEmail,
    appName = 'Our Store', locale, dir, strings, theme,
  }) => {
    const s = { ...REFUND_CONFIRMATION_STRINGS, ...strings };
    const t = { ...defaultTheme, ...theme };
    const year = currentYear(locale);

    const successBoxStyle: CSSProperties = {
      backgroundColor: t.successBg,
      border: `1px solid ${t.successBorder}`,
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
    };

    const detailRows = [
      refundId ? { label: s.refundIdLabel, value: refundId, mono: true } : null,
      originalOrderId ? { label: s.originalOrderLabel, value: `#${originalOrderId}` } : null,
      paymentMethod ? { label: s.refundToLabel, value: paymentMethod } : null,
      ...(items ?? []).map((item) => ({ label: item.name, value: String(item.amount) })),
    ].filter(Boolean) as { label: string; value: string; mono?: boolean }[];

    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(refundAmount)}</Text>
        <Section>
          <div style={successBoxStyle}>
            <span className="tierde-positive" style={{ fontSize: '32px', fontWeight: '800', color: t.successText }}>{refundAmount}</span>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: t.successText }}>{s.heading}</p>
          </div>
        </Section>
        {detailRows.length > 0 && (
          <Section>
            <KeyValueTable rows={detailRows} />
          </Section>
        )}
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

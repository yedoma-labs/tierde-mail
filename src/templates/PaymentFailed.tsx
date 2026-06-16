import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { Theme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface PaymentFailedStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: string;
  amount: (amount: string) => string;
  reason: (reason: string) => string;
  ctaLabel: string;
  retryNote: (days: number) => string;
  supportNote: (email: string) => string;
  footer: (year: string, appName: string) => string;
}

export const PAYMENT_FAILED_STRINGS: PaymentFailedStrings = {
  subject: (appName) => `Action required: Payment failed for ${appName}`,
  heading: 'Payment failed',
  greeting: (name) => `Hi ${name},`,
  body: "We were unable to process your payment. Please update your payment method to continue your subscription.",
  amount: (amount) => `Amount: ${amount}`,
  reason: (reason) => `Reason: ${reason}`,
  ctaLabel: 'Update Payment Method',
  retryNote: (days) => `We'll retry the payment in ${days} days. Update your billing details to avoid interruption.`,
  supportNote: (email) => `Need help? Contact us at ${email}`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface PaymentFailedProps {
  name: string;
  updateUrl: string;
  amount?: string;
  failureReason?: string;
  retryInDays?: number;
  supportEmail?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<PaymentFailedStrings>;
  theme?: Theme;
}

const alertBoxStyle: CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '16px',
  marginBottom: '16px',
};

const alertTextStyle: CSSProperties = {
  color: '#991b1b',
  fontSize: '14px',
  margin: 0,
};

export const PaymentFailed: EmailTemplateType<PaymentFailedProps> = defineEmail<PaymentFailedProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...PAYMENT_FAILED_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name,
    updateUrl,
    amount,
    failureReason,
    retryInDays = 3,
    supportEmail,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...PAYMENT_FAILED_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate
        preview={s.subject(appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body}</Text>
        {(amount || failureReason) && (
          <Section>
            <div style={alertBoxStyle}>
              {amount && <p style={alertTextStyle}>{s.amount(amount)}</p>}
              {failureReason && <p style={{ ...alertTextStyle, marginTop: amount ? '4px' : 0 }}>{s.reason(failureReason)}</p>}
            </div>
          </Section>
        )}
        <Button href={updateUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {s.retryNote(retryInDays)}
          {supportEmail && (
            <>
              {' '}
              {s.supportNote(supportEmail)}
            </>
          )}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

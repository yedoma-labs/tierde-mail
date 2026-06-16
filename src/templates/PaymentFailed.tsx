import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import { AlertBox } from '../components/AlertBox.js';
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface PaymentFailedStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: string;
  amountLabel: string;
  reasonLabel: string;
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
  amountLabel: 'Amount',
  reasonLabel: 'Reason',
  ctaLabel: 'Update Payment Method',
  retryNote: (days) => `We'll retry the payment in ${days} days. Update your billing details to avoid interruption.`,
  supportNote: (email) => `Need help? Contact us at ${email}`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface PaymentFailedProps extends BaseTemplateProps<PaymentFailedStrings> {
  name: string;
  updateUrl: string;
  amount?: string;
  failureReason?: string;
  retryInDays?: number;
  supportEmail?: string;
}

export const PaymentFailed: EmailTemplateType<PaymentFailedProps> = defineEmail<PaymentFailedProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...PAYMENT_FAILED_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name, updateUrl, amount, failureReason,
    retryInDays = 3, supportEmail,
    appName = 'Our App', locale, dir, strings, theme,
  }) => {
    const s = { ...PAYMENT_FAILED_STRINGS, ...strings };
    const year = currentYear(locale);

    const alertContent = [
      amount ? `${s.amountLabel}: ${amount}` : null,
      failureReason ? `${s.reasonLabel}: ${failureReason}` : null,
    ].filter(Boolean).join(' · ');

    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body}</Text>
        {alertContent && (
          <Section>
            <AlertBox variant="danger">{alertContent}</AlertBox>
          </Section>
        )}
        <Button href={updateUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {s.retryNote(retryInDays)}
          {supportEmail && <>{' '}{s.supportNote(supportEmail)}</>}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

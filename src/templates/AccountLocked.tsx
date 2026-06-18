import { AlertBox } from '../components/AlertBox.js';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { KeyValueTable } from '../components/KeyValueTable.js';
import { Section } from '../components/Section.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps, SecurityDetails } from './shared.js';
import { currentYear } from './utils.js';

export type LockReason =
  | 'too_many_attempts'
  | 'suspicious_activity'
  | 'admin_action'
  | 'policy_violation';

export interface AccountLockedStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (reason: LockReason) => string;
  unlockCtaLabel: string;
  supportNote: (email: string) => string;
  timeLabel: string;
  locationLabel: string;
  ipLabel: string;
  footer: (year: string, appName: string) => string;
}

export const ACCOUNT_LOCKED_STRINGS: AccountLockedStrings = {
  subject: (appName) => `Your ${appName} account has been locked`,
  heading: 'Account locked',
  greeting: (name) => `Hi ${name},`,
  body: (reason) => {
    const messages: Record<LockReason, string> = {
      too_many_attempts:
        'Your account has been temporarily locked due to too many failed sign-in attempts. This is a security measure to protect your account.',
      suspicious_activity:
        'Your account has been locked due to suspicious activity detected. Please verify your identity to regain access.',
      admin_action:
        'Your account has been locked by an administrator. Please contact support for assistance.',
      policy_violation:
        'Your account has been locked due to a policy violation. Please contact support to resolve this.',
    };
    return messages[reason];
  },
  unlockCtaLabel: 'Unlock My Account',
  supportNote: (email) => `Need help? Contact our support team at ${email}.`,
  timeLabel: 'Time',
  locationLabel: 'Location',
  ipLabel: 'IP Address',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface AccountLockedProps
  extends BaseTemplateProps<AccountLockedStrings>,
    SecurityDetails {
  name: string;
  reason: LockReason;
  unlockUrl: string;
  supportEmail?: string;
}

export const AccountLocked: EmailTemplateType<AccountLockedProps> = defineEmail<AccountLockedProps>(
  {
    subject: ({ appName = 'Our App', strings }) => {
      const s = { ...ACCOUNT_LOCKED_STRINGS, ...strings };
      return s.subject(appName);
    },
    component: ({
      name,
      reason,
      unlockUrl,
      ipAddress,
      location,
      timestamp,
      supportEmail,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...ACCOUNT_LOCKED_STRINGS, ...strings };
      const year = currentYear(locale);

      return (
        <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
          <Heading>{s.heading}</Heading>
          <Text>{s.greeting(name)}</Text>
          <Section>
            <AlertBox variant="danger" icon="🔒">
              {s.body(reason)}
            </AlertBox>
          </Section>
          {(timestamp || location || ipAddress) && (
            <Section>
              <KeyValueTable
                rows={[
                  { label: s.timeLabel, value: timestamp },
                  { label: s.locationLabel, value: location },
                  { label: s.ipLabel, value: ipAddress, mono: true },
                ]}
              />
            </Section>
          )}
          <Button href={unlockUrl}>{s.unlockCtaLabel}</Button>
          <Hr />
          {supportEmail && (
            <Text muted size="sm">
              {s.supportNote(supportEmail)}
            </Text>
          )}
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  },
);

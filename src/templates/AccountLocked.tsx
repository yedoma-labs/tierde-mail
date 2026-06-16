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

export type LockReason = 'too_many_attempts' | 'suspicious_activity' | 'admin_action' | 'policy_violation';

export interface AccountLockedStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (reason: LockReason) => string;
  unlockCtaLabel: string;
  supportNote: (email: string) => string;
  footer: (year: string, appName: string) => string;
}

export const ACCOUNT_LOCKED_STRINGS: AccountLockedStrings = {
  subject: (appName) => `Your ${appName} account has been locked`,
  heading: 'Account locked',
  greeting: (name) => `Hi ${name},`,
  body: (reason) => {
    const messages: Record<LockReason, string> = {
      too_many_attempts: 'Your account has been temporarily locked due to too many failed sign-in attempts. This is a security measure to protect your account.',
      suspicious_activity: 'Your account has been locked due to suspicious activity detected. Please verify your identity to regain access.',
      admin_action: 'Your account has been locked by an administrator. Please contact support for assistance.',
      policy_violation: 'Your account has been locked due to a policy violation. Please contact support to resolve this.',
    };
    return messages[reason];
  },
  unlockCtaLabel: 'Unlock My Account',
  supportNote: (email) => `Need help? Contact our support team at ${email}.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface AccountLockedProps {
  name: string;
  reason: LockReason;
  unlockUrl: string;
  ipAddress?: string;
  location?: string;
  timestamp?: string;
  supportEmail?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<AccountLockedStrings>;
  theme?: Theme;
}

const alertBoxStyle: CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
};

const alertIconStyle: CSSProperties = {
  fontSize: '28px',
  display: 'block',
  marginBottom: '8px',
};

const alertTextStyle: CSSProperties = {
  color: '#7f1d1d',
  fontSize: '14px',
  margin: 0,
  lineHeight: '1.6',
};

const detailRowStyle: CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '14px',
};

export const AccountLocked: EmailTemplateType<AccountLockedProps> = defineEmail<AccountLockedProps>({
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
    const hasDetails = ipAddress || location || timestamp;

    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Section>
          <div style={alertBoxStyle}>
            <span style={alertIconStyle}>🔒</span>
            <p style={alertTextStyle}>{s.body(reason)}</p>
          </div>
        </Section>
        {hasDetails && (
          <Section>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
              <tbody>
                {timestamp && (
                  <tr>
                    <td style={detailRowStyle}><span style={{ color: '#6b7280' }}>Time</span></td>
                    <td style={{ ...detailRowStyle, textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>{timestamp}</td>
                  </tr>
                )}
                {location && (
                  <tr>
                    <td style={detailRowStyle}><span style={{ color: '#6b7280' }}>Location</span></td>
                    <td style={{ ...detailRowStyle, textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>{location}</td>
                  </tr>
                )}
                {ipAddress && (
                  <tr>
                    <td style={{ padding: '8px 0', fontSize: '14px' }}><span style={{ color: '#6b7280' }}>IP Address</span></td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>{ipAddress}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>
        )}
        <Button href={unlockUrl}>{s.unlockCtaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {supportEmail && s.supportNote(supportEmail)}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

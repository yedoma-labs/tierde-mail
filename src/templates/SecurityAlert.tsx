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

export type SecurityEventType =
  | 'new_login'
  | 'password_changed'
  | 'email_changed'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'api_key_created'
  | 'suspicious_activity';

export interface SecurityAlertStrings {
  subject: (event: SecurityEventType, appName: string) => string;
  heading: (event: SecurityEventType) => string;
  greeting: (name: string) => string;
  body: (event: SecurityEventType) => string;
  notYouNote: string;
  ctaLabel: string;
  footer: (year: string, appName: string) => string;
}

export const SECURITY_ALERT_STRINGS: SecurityAlertStrings = {
  subject: (event, appName) => {
    const labels: Record<SecurityEventType, string> = {
      new_login: `New sign-in to your ${appName} account`,
      password_changed: `Your ${appName} password was changed`,
      email_changed: `Your ${appName} email address was updated`,
      two_factor_enabled: `Two-factor authentication enabled — ${appName}`,
      two_factor_disabled: `Two-factor authentication disabled — ${appName}`,
      api_key_created: `New API key created — ${appName}`,
      suspicious_activity: `Suspicious activity detected on your ${appName} account`,
    };
    return labels[event];
  },
  heading: (event) => {
    const labels: Record<SecurityEventType, string> = {
      new_login: 'New sign-in detected',
      password_changed: 'Password changed',
      email_changed: 'Email address changed',
      two_factor_enabled: 'Two-factor authentication enabled',
      two_factor_disabled: 'Two-factor authentication disabled',
      api_key_created: 'New API key created',
      suspicious_activity: 'Suspicious activity detected',
    };
    return labels[event];
  },
  greeting: (name) => `Hi ${name},`,
  body: (event) => {
    const messages: Record<SecurityEventType, string> = {
      new_login: 'A new sign-in was detected on your account. If this was you, no action is needed.',
      password_changed: 'Your account password was recently changed. If you made this change, no action is needed.',
      email_changed: 'The email address on your account was updated. If you made this change, no action is needed.',
      two_factor_enabled: 'Two-factor authentication has been enabled on your account, adding an extra layer of security.',
      two_factor_disabled: 'Two-factor authentication has been disabled on your account. If you did not make this change, secure your account immediately.',
      api_key_created: 'A new API key was created for your account. If you did not authorize this, revoke it immediately.',
      suspicious_activity: 'We detected unusual activity on your account. Please review your recent activity and secure your account if needed.',
    };
    return messages[event];
  },
  notYouNote: "If this wasn't you, secure your account immediately by changing your password.",
  ctaLabel: 'Review Activity',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface SecurityAlertProps {
  name: string;
  event: SecurityEventType;
  reviewUrl: string;
  ipAddress?: string;
  location?: string;
  device?: string;
  timestamp?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<SecurityAlertStrings>;
  theme?: Theme;
}

const alertStyle: CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '16px',
};

const alertHeadingStyle: CSSProperties = {
  color: '#991b1b',
  fontWeight: '700',
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 8px',
};

const detailRowStyle: CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '14px',
};

export const SecurityAlert: EmailTemplateType<SecurityAlertProps> = defineEmail<SecurityAlertProps>({
  subject: ({ event, appName = 'Our App', strings }) => {
    const s = { ...SECURITY_ALERT_STRINGS, ...strings };
    return s.subject(event, appName);
  },
  component: ({
    name,
    event,
    reviewUrl,
    ipAddress,
    location,
    device,
    timestamp,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...SECURITY_ALERT_STRINGS, ...strings };
    const year = currentYear(locale);
    const isHighRisk = event === 'suspicious_activity' || event === 'two_factor_disabled';
    const hasDetails = ipAddress || location || device || timestamp;

    return (
      <EmailTemplate
        preview={s.subject(event, appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(event)}</Heading>
        <Text>{s.greeting(name)}</Text>
        {isHighRisk ? (
          <Section>
            <div style={alertStyle}>
              <p style={alertHeadingStyle}>Action Required</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#7f1d1d' }}>{s.body(event)}</p>
            </div>
          </Section>
        ) : (
          <Text>{s.body(event)}</Text>
        )}
        {hasDetails && (
          <Section>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
              <tbody>
                {timestamp && (
                  <tr>
                    <td style={{ ...detailRowStyle, color: '#6b7280', width: '40%' }}>Time</td>
                    <td style={{ ...detailRowStyle, color: '#0f172a', fontWeight: '500' }}>{timestamp}</td>
                  </tr>
                )}
                {device && (
                  <tr>
                    <td style={{ ...detailRowStyle, color: '#6b7280' }}>Device</td>
                    <td style={{ ...detailRowStyle, color: '#0f172a', fontWeight: '500' }}>{device}</td>
                  </tr>
                )}
                {location && (
                  <tr>
                    <td style={{ ...detailRowStyle, color: '#6b7280' }}>Location</td>
                    <td style={{ ...detailRowStyle, color: '#0f172a', fontWeight: '500' }}>{location}</td>
                  </tr>
                )}
                {ipAddress && (
                  <tr>
                    <td style={{ padding: '8px 0', color: '#6b7280' }}>IP Address</td>
                    <td style={{ padding: '8px 0', color: '#0f172a', fontWeight: '500', fontFamily: 'monospace' }}>{ipAddress}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>
        )}
        <Button href={reviewUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.notYouNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

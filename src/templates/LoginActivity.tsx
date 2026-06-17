import { currentYear } from './utils.js';
import type { BaseTemplateProps, LoginEvent } from './shared.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme } from '../theme.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface LoginActivityStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: string;
  timestampLabel: string;
  locationLabel: string;
  deviceLabel: string;
  statusLabel: string;
  statusSuccess: string;
  statusFailed: string;
  reviewCtaLabel: string;
  suspiciousNote: string;
  footer: (year: string, appName: string) => string;
}

export const LOGIN_ACTIVITY_STRINGS: LoginActivityStrings = {
  subject: (appName) => `Recent login activity on your ${appName} account`,
  heading: 'Login activity summary',
  greeting: (name) => `Hi ${name},`,
  body: 'Here is a summary of recent sign-in activity on your account.',
  timestampLabel: 'Time',
  locationLabel: 'Location',
  deviceLabel: 'Device',
  statusLabel: 'Status',
  statusSuccess: 'Success',
  statusFailed: 'Failed',
  reviewCtaLabel: 'Review Security Settings',
  suspiciousNote: 'If you notice activity you do not recognise, secure your account immediately.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface LoginActivityProps extends BaseTemplateProps<LoginActivityStrings> {
  name: string;
  events: LoginEvent[];
  securityUrl: string;
}

const badgeBase: CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '9999px',
  fontSize: '11px',
  fontWeight: '600',
};

export const LoginActivity: EmailTemplateType<LoginActivityProps> = defineEmail<LoginActivityProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...LOGIN_ACTIVITY_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({ name, events, securityUrl, appName = 'Our App', locale, dir, strings, theme }) => {
    const s = { ...LOGIN_ACTIVITY_STRINGS, ...strings };
    const t = { ...defaultTheme, ...theme };
    const year = currentYear(locale);

    const thStyle: CSSProperties = {
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: t.textMuted,
      padding: '0 8px 8px 0',
      borderBottom: `2px solid ${t.border}`,
      whiteSpace: 'nowrap',
    };

    const tdStyle: CSSProperties = {
      fontSize: '13px',
      color: t.textSecondary,
      padding: '8px 8px 8px 0',
      borderBottom: `1px solid ${t.borderSubtle}`,
      verticalAlign: 'top',
    };

    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body}</Text>
        <Section>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
            <thead>
              <tr>
                <th style={thStyle}>{s.timestampLabel}</th>
                <th style={thStyle}>{s.locationLabel}</th>
                <th style={thStyle}>{s.deviceLabel}</th>
                <th style={thStyle}>{s.statusLabel}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={`${ev.timestamp}-${i}`}>
                  <td style={tdStyle}>{ev.timestamp}</td>
                  <td style={tdStyle}>{ev.location ?? '—'}</td>
                  <td style={tdStyle}>{ev.device ?? '—'}</td>
                  <td style={tdStyle}>
                    <span className="tierde-badge" style={{
                      ...badgeBase,
                      backgroundColor: ev.status === 'success' ? t.successBg : t.dangerBg,
                      color: ev.status === 'success' ? t.successText : t.dangerText,
                    }}>
                      {ev.status === 'success' ? s.statusSuccess : s.statusFailed}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Button href={securityUrl} variant="outline">{s.reviewCtaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.suspiciousNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

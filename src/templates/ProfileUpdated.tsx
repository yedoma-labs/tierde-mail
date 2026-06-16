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

export interface ProfileChange {
  field: string;
  oldValue?: string;
  newValue: string;
}

export interface ProfileUpdatedStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: string;
  changesHeading: string;
  fieldLabel: string;
  fromLabel: string;
  toLabel: string;
  reviewCtaLabel: string;
  notYouNote: string;
  footer: (year: string, appName: string) => string;
}

export const PROFILE_UPDATED_STRINGS: ProfileUpdatedStrings = {
  subject: (appName) => `Your ${appName} profile was updated`,
  heading: 'Profile updated',
  greeting: (name) => `Hi ${name},`,
  body: 'The following changes were made to your account profile.',
  changesHeading: 'Changes made',
  fieldLabel: 'Field',
  fromLabel: 'From',
  toLabel: 'To',
  reviewCtaLabel: 'Review Account',
  notYouNote: 'If you did not make these changes, please secure your account immediately.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface ProfileUpdatedProps {
  name: string;
  changes: ProfileChange[];
  accountUrl: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<ProfileUpdatedStrings>;
  theme?: Theme;
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  paddingBottom: '8px',
  borderBottom: '1px solid #e5e7eb',
};

const tdStyle: CSSProperties = {
  fontSize: '14px',
  color: '#0f172a',
  padding: '8px 8px 8px 0',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'top',
};

const oldValueStyle: CSSProperties = {
  color: '#6b7280',
  textDecoration: 'line-through',
};

export const ProfileUpdated: EmailTemplateType<ProfileUpdatedProps> = defineEmail<ProfileUpdatedProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...PROFILE_UPDATED_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name,
    changes,
    accountUrl,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...PROFILE_UPDATED_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body}</Text>
        <Section>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
            <thead>
              <tr>
                <th style={thStyle}>{s.fieldLabel}</th>
                <th style={{ ...thStyle, paddingLeft: '8px' }}>{s.toLabel}</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((change, i) => (
                <tr key={i}>
                  <td style={tdStyle}><strong>{change.field}</strong></td>
                  <td style={{ ...tdStyle, paddingLeft: '8px' }}>
                    {change.oldValue && (
                      <span style={oldValueStyle}>{change.oldValue}<br /></span>
                    )}
                    {change.newValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Button href={accountUrl}>{s.reviewCtaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.notYouNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

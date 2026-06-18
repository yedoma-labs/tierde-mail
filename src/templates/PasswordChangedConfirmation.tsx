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

export interface PasswordChangedConfirmationStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: string;
  timestampLabel: string;
  locationLabel: string;
  ipLabel: string;
  securityCtaLabel: string;
  notYouNote: string;
  footer: (year: string, appName: string) => string;
}

export const PASSWORD_CHANGED_CONFIRMATION_STRINGS: PasswordChangedConfirmationStrings = {
  subject: (appName) => `Your ${appName} password was changed`,
  heading: 'Password changed',
  greeting: (name) => `Hi ${name},`,
  body: 'Your password was successfully changed. If you made this change, no further action is needed.',
  timestampLabel: 'Changed on',
  locationLabel: 'Location',
  ipLabel: 'IP Address',
  securityCtaLabel: 'Secure My Account',
  notYouNote:
    'If you did not change your password, someone may have access to your account. Click the button above to reset your password immediately and contact support.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface PasswordChangedConfirmationProps
  extends BaseTemplateProps<PasswordChangedConfirmationStrings>,
    SecurityDetails {
  name: string;
  securityUrl: string;
}

export const PasswordChangedConfirmation: EmailTemplateType<PasswordChangedConfirmationProps> =
  defineEmail<PasswordChangedConfirmationProps>({
    subject: ({ appName = 'Our App', strings }) => {
      const s = { ...PASSWORD_CHANGED_CONFIRMATION_STRINGS, ...strings };
      return s.subject(appName);
    },
    component: ({
      name,
      securityUrl,
      timestamp,
      ipAddress,
      location,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...PASSWORD_CHANGED_CONFIRMATION_STRINGS, ...strings };
      const year = currentYear(locale);
      return (
        <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
          <Heading>{s.heading}</Heading>
          <Text>{s.greeting(name)}</Text>
          <Text>{s.body}</Text>
          {(timestamp || location || ipAddress) && (
            <Section>
              <KeyValueTable
                rows={[
                  { label: s.timestampLabel, value: timestamp },
                  { label: s.locationLabel, value: location },
                  { label: s.ipLabel, value: ipAddress, mono: true },
                ]}
              />
            </Section>
          )}
          <Button href={securityUrl} variant="outline">
            {s.securityCtaLabel}
          </Button>
          <Hr />
          <Text muted size="sm">
            {s.notYouNote}
          </Text>
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });

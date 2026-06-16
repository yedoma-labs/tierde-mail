import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import type { Theme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface RegistrationConfirmationStrings {
  subject: (appName: string) => string;
  heading: (name: string) => string;
  greeting: (name: string) => string;
  body: (appName: string) => string;
  ctaLabel: string;
  nextSteps?: string;
  footer: (year: string, appName: string) => string;
}

export const REGISTRATION_CONFIRMATION_STRINGS: RegistrationConfirmationStrings = {
  subject: (appName) => `Welcome to ${appName} — your account is ready`,
  heading: (name) => `Welcome, ${name}!`,
  greeting: (name) => `Hi ${name},`,
  body: (appName) => `Your account has been created successfully. You're all set to start using ${appName}.`,
  ctaLabel: 'Get Started',
  nextSteps: 'Complete your profile, explore features, or invite your team to get the most out of your account.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface RegistrationConfirmationProps {
  name: string;
  dashboardUrl: string;
  email?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<RegistrationConfirmationStrings>;
  theme?: Theme;
}

export const RegistrationConfirmation: EmailTemplateType<RegistrationConfirmationProps> = defineEmail<RegistrationConfirmationProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...REGISTRATION_CONFIRMATION_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name,
    dashboardUrl,
    email,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...REGISTRATION_CONFIRMATION_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading(name)}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(appName)}</Text>
        {email && (
          <Text muted size="sm">Account email: <strong>{email}</strong></Text>
        )}
        {s.nextSteps && <Text>{s.nextSteps}</Text>}
        <Button href={dashboardUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

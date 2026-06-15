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

export interface EmailVerificationStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (appName: string) => string;
  ctaLabel: string;
  expiryNote: (expiresIn: string) => string;
  securityNote: (appName: string) => string;
  footer: (year: string, appName: string) => string;
}

export const EMAIL_VERIFICATION_STRINGS: EmailVerificationStrings = {
  subject: (appName) => `Verify your email address for ${appName}`,
  heading: 'Verify your email',
  greeting: (name) => `Hi ${name},`,
  body: (appName) =>
    `Thanks for signing up for ${appName}! Please verify your email address to activate your account.`,
  ctaLabel: 'Verify Email Address',
  expiryNote: (expiresIn) => `This link expires in ${expiresIn}.`,
  securityNote: (appName) =>
    `If you didn't create an account with ${appName}, you can safely ignore this email.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface EmailVerificationProps {
  name: string;
  verifyUrl: string;
  expiresIn?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<EmailVerificationStrings>;
  theme?: Theme;
}

export const EmailVerification: EmailTemplateType<EmailVerificationProps> = defineEmail<EmailVerificationProps>({
  subject: ({ appName = 'your account', strings }) => {
    const s = { ...EMAIL_VERIFICATION_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({ name, verifyUrl, expiresIn = '24 hours', appName = 'Our App', locale, dir, strings, theme }) => {
    const s = { ...EMAIL_VERIFICATION_STRINGS, ...strings };
    const year = currentYear(locale);
    return (
      <EmailTemplate
        preview="Please verify your email address to get started."
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(appName)}</Text>
        <Button href={verifyUrl}>{s.ctaLabel}</Button>
        <Text muted size="sm" align="center">
          {s.expiryNote(expiresIn)}
        </Text>
        <Hr />
        <Text muted size="sm">
          {s.securityNote(appName)}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

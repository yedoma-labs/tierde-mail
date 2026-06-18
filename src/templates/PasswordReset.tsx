import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export interface PasswordResetStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (username: string) => string;
  body: (appName: string) => string;
  ctaLabel: string;
  expiryNote: (expiresIn: string) => string;
  securityNote: string;
  footer: (year: string, appName: string) => string;
}

export const PASSWORD_RESET_STRINGS: PasswordResetStrings = {
  subject: (appName) => `Reset your ${appName} password`,
  heading: 'Reset your password',
  greeting: (username) => `Hi ${username},`,
  body: (appName) =>
    `We received a request to reset the password for your ${appName} account. Click the button below to choose a new password.`,
  ctaLabel: 'Reset Password',
  expiryNote: (expiresIn) => `This link expires in ${expiresIn}.`,
  securityNote:
    "If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.",
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface PasswordResetProps extends BaseTemplateProps<PasswordResetStrings> {
  username: string;
  resetUrl: string;
  expiresIn?: string;
}

export const PasswordReset: EmailTemplateType<PasswordResetProps> = defineEmail<PasswordResetProps>(
  {
    subject: ({ appName = 'your', strings }) => {
      const s = { ...PASSWORD_RESET_STRINGS, ...strings };
      return s.subject(appName);
    },
    component: ({
      username,
      resetUrl,
      expiresIn = '1 hour',
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...PASSWORD_RESET_STRINGS, ...strings };
      const year = currentYear(locale);
      return (
        <EmailTemplate
          preview="Password reset requested. Click to reset your password."
          lang={locale}
          dir={dir}
          theme={theme}
        >
          <Heading>{s.heading}</Heading>
          <Text>{s.greeting(username)}</Text>
          <Text>{s.body(appName)}</Text>
          <Button href={resetUrl}>{s.ctaLabel}</Button>
          <Text muted size="sm" align="center">
            {s.expiryNote(expiresIn)}
          </Text>
          <Hr />
          <Text muted size="sm">
            {s.securityNote}
          </Text>
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  },
);

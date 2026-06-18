import type { CSSProperties } from 'react';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export interface EmailChangeVerificationStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (newEmail: string) => string;
  ctaLabel: string;
  expiry: (minutes: number) => string;
  notYouNote: string;
  footer: (year: string, appName: string) => string;
}

export const EMAIL_CHANGE_VERIFICATION_STRINGS: EmailChangeVerificationStrings = {
  subject: (appName) => `Verify your new email address — ${appName}`,
  heading: 'Verify your new email',
  greeting: (name) => `Hi ${name},`,
  body: (newEmail) =>
    `You requested to change your email address to ${newEmail}. Click the button below to confirm this change.`,
  ctaLabel: 'Confirm Email Change',
  expiry: (minutes) => `This link expires in ${minutes} minutes.`,
  notYouNote:
    'If you did not request this change, your account may be compromised. Please contact support immediately.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface EmailChangeVerificationProps
  extends BaseTemplateProps<EmailChangeVerificationStrings> {
  name: string;
  newEmail: string;
  verifyUrl: string;
  expiresInMinutes?: number;
}

export const EmailChangeVerification: EmailTemplateType<EmailChangeVerificationProps> =
  defineEmail<EmailChangeVerificationProps>({
    subject: ({ appName = 'Our App', strings }) => {
      const s = { ...EMAIL_CHANGE_VERIFICATION_STRINGS, ...strings };
      return s.subject(appName);
    },
    component: ({
      name,
      newEmail,
      verifyUrl,
      expiresInMinutes = 60,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...EMAIL_CHANGE_VERIFICATION_STRINGS, ...strings };
      const t = { ...defaultTheme, ...theme };
      const year = currentYear(locale);

      const addressBoxStyle: CSSProperties = {
        backgroundColor: t.successBg,
        border: `1px solid ${t.successBorder}`,
        borderRadius: '8px',
        padding: '12px 16px',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: t.successText,
        wordBreak: 'break-all',
      };

      return (
        <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
          <Heading>{s.heading}</Heading>
          <Text>{s.greeting(name)}</Text>
          <Text>{s.body(newEmail)}</Text>
          <div style={addressBoxStyle}>{newEmail}</div>
          <Button href={verifyUrl}>{s.ctaLabel}</Button>
          <Text muted size="sm">
            {s.expiry(expiresInMinutes)}
          </Text>
          <Hr />
          <Text muted size="sm">
            {s.notYouNote}
          </Text>
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });

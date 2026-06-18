import type { CSSProperties } from 'react';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export interface PasswordlessOtpStrings {
  subject: (appName: string) => string;
  heading: string;
  intro: string;
  expiryNote: (minutes: number) => string;
  securityNote: string;
  footer: (year: string, appName: string) => string;
}

export const PASSWORDLESS_OTP_STRINGS: PasswordlessOtpStrings = {
  subject: (appName) => `Your ${appName} login code`,
  heading: 'Your login code',
  intro: 'Use the code below to sign in. Do not share this code with anyone.',
  expiryNote: (minutes) => `This code expires in ${minutes} minutes.`,
  securityNote: "If you didn't request this code, you can safely ignore this email.",
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface PasswordlessOtpProps extends BaseTemplateProps<PasswordlessOtpStrings> {
  code: string;
  expiresInMinutes?: number;
}

const codeBlockStyle: CSSProperties = {
  textAlign: 'center',
  padding: '32px 0',
};

export const PasswordlessOtp: EmailTemplateType<PasswordlessOtpProps> =
  defineEmail<PasswordlessOtpProps>({
    subject: ({ appName = 'Our App', strings }) => {
      const s = { ...PASSWORDLESS_OTP_STRINGS, ...strings };
      return s.subject(appName);
    },
    component: ({
      code,
      expiresInMinutes = 10,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...PASSWORDLESS_OTP_STRINGS, ...strings };
      const t = { ...defaultTheme, ...theme };
      const year = currentYear(locale);

      const codeStyle: CSSProperties = {
        display: 'inline-block',
        fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
        fontSize: '40px',
        fontWeight: '700',
        letterSpacing: '0.25em',
        color: t.textPrimary,
        padding: '16px 32px',
        backgroundColor: t.surfaceSubtle,
        borderRadius: '8px',
        border: `1px solid ${t.border}`,
      };

      return (
        <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
          <Heading>{s.heading}</Heading>
          <Text>{s.intro}</Text>
          <Section>
            <div style={codeBlockStyle}>
              <span className="tierde-code" style={codeStyle}>
                {code}
              </span>
            </div>
          </Section>
          <Text muted size="sm">
            {s.expiryNote(expiresInMinutes)}
          </Text>
          <Hr />
          <Text muted size="sm">
            {s.securityNote}
          </Text>
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });

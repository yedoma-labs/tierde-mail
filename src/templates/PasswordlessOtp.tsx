import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { Theme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

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

export interface PasswordlessOtpProps {
  code: string;
  expiresInMinutes?: number;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<PasswordlessOtpStrings>;
  theme?: Theme;
}

const codeBlockStyle: CSSProperties = {
  textAlign: 'center',
  padding: '32px 0',
};

const codeStyle: CSSProperties = {
  display: 'inline-block',
  fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
  fontSize: '40px',
  fontWeight: '700',
  letterSpacing: '0.25em',
  color: '#0f172a',
  padding: '16px 32px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
};

export const PasswordlessOtp: EmailTemplateType<PasswordlessOtpProps> = defineEmail<PasswordlessOtpProps>({
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
    const year = currentYear(locale);

    return (
      <EmailTemplate
        preview={s.subject(appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading}</Heading>
        <Text>{s.intro}</Text>
        <Section>
          <div style={codeBlockStyle}>
            <span style={codeStyle}>{code}</span>
          </div>
        </Section>
        <Text muted size="sm">{s.expiryNote(expiresInMinutes)}</Text>
        <Hr />
        <Text muted size="sm">{s.securityNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

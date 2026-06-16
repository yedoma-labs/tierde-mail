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

export interface PhoneVerificationStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (phone: string) => string;
  codeLabel: string;
  expiry: (minutes: number) => string;
  noActionNote: string;
  footer: (year: string, appName: string) => string;
}

export const PHONE_VERIFICATION_STRINGS: PhoneVerificationStrings = {
  subject: (appName) => `Verify your phone number — ${appName}`,
  heading: 'Verify your phone number',
  greeting: (name) => `Hi ${name},`,
  body: (phone) => `Use the code below to verify your phone number ${phone}.`,
  codeLabel: 'Verification code',
  expiry: (minutes) => `This code expires in ${minutes} minutes.`,
  noActionNote: 'If you did not request this, you can safely ignore this email.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface PhoneVerificationProps {
  name: string;
  phone: string;
  code: string;
  expiresInMinutes?: number;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<PhoneVerificationStrings>;
  theme?: Theme;
}

const codeLabelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#6b7280',
  marginBottom: '8px',
  display: 'block',
};

const codeStyle: CSSProperties = {
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '0.15em',
  color: '#0f172a',
  fontFamily: 'monospace',
};

export const PhoneVerification: EmailTemplateType<PhoneVerificationProps> = defineEmail<PhoneVerificationProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...PHONE_VERIFICATION_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name,
    phone,
    code,
    expiresInMinutes = 10,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...PHONE_VERIFICATION_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(phone)}</Text>
        <Section>
          <span style={codeLabelStyle}>{s.codeLabel}</span>
          <div style={codeStyle}>{code}</div>
        </Section>
        <Text muted size="sm">{s.expiry(expiresInMinutes)}</Text>
        <Hr />
        <Text muted size="sm">{s.noActionNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

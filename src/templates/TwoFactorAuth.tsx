import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Section } from '../components/Section.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import type { CSSProperties } from 'react';

export interface TwoFactorAuthStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (username: string) => string;
  body: string;
  expiryNote: (expiresIn: string) => string;
  securityNote: string;
  footer: (year: string, appName: string) => string;
}

export const TWO_FACTOR_AUTH_STRINGS: TwoFactorAuthStrings = {
  subject: (appName) => `Your ${appName} verification code`,
  heading: 'Your verification code',
  greeting: (username) => `Hi ${username},`,
  body: 'Use the code below to complete your sign in. Do not share this code with anyone.',
  expiryNote: (expiresIn) => `This code expires in ${expiresIn}.`,
  securityNote:
    "If you didn't request this code, your account may be at risk. Please change your password immediately.",
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface TwoFactorAuthProps {
  username: string;
  code: string;
  expiresIn?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<TwoFactorAuthStrings>;
}

const codeStyle: CSSProperties = {
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '8px',
  color: '#1a1a1a',
  textAlign: 'center',
  fontFamily: 'monospace',
};

export const TwoFactorAuth = defineEmail<TwoFactorAuthProps>({
  subject: ({ appName = 'verification', strings }) => {
    const s = { ...TWO_FACTOR_AUTH_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({ username, code, expiresIn = '10 minutes', appName = 'Our App', locale, dir, strings }) => {
    const s = { ...TWO_FACTOR_AUTH_STRINGS, ...strings };
    const year = currentYear(locale);
    return (
      <EmailTemplate
        preview={`Your ${appName} verification code: ${code}`}
        lang={locale}
        dir={dir}
      >
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(username)}</Text>
        <Text>{s.body}</Text>
        <Section backgroundColor="#f3f4f6">
          <p style={codeStyle}>{code}</p>
        </Section>
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
});

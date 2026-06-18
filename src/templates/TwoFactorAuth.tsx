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

export interface TwoFactorAuthProps extends BaseTemplateProps<TwoFactorAuthStrings> {
  username: string;
  code: string;
  expiresIn?: string;
}

export const TwoFactorAuth: EmailTemplateType<TwoFactorAuthProps> = defineEmail<TwoFactorAuthProps>(
  {
    subject: ({ appName = 'verification', strings }) => {
      const s = { ...TWO_FACTOR_AUTH_STRINGS, ...strings };
      return s.subject(appName);
    },
    component: ({
      username,
      code,
      expiresIn = '10 minutes',
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...TWO_FACTOR_AUTH_STRINGS, ...strings };
      const t = { ...defaultTheme, ...theme };
      const year = currentYear(locale);

      const codeStyle: CSSProperties = {
        fontSize: '36px',
        fontWeight: '700',
        letterSpacing: '8px',
        color: t.textPrimary,
        textAlign: 'center',
        fontFamily: 'monospace',
      };

      return (
        <EmailTemplate
          preview={`Your ${appName} verification code: ${code}`}
          lang={locale}
          dir={dir}
          theme={theme}
        >
          <Heading>{s.heading}</Heading>
          <Text>{s.greeting(username)}</Text>
          <Text>{s.body}</Text>
          <Section backgroundColor={t.surfaceSubtle}>
            <p className="tierde-code" style={codeStyle}>
              {code}
            </p>
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
  },
);

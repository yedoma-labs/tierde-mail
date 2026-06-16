import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface WelcomeStrings {
  subject: (name: string, appName: string) => string;
  heading: (name: string) => string;
  body: (appName: string) => string;
  ctaLabel: string;
  securityNote: string;
  supportNote: (supportEmail: string) => string;
  footer: (year: string, appName: string) => string;
}

export const WELCOME_STRINGS: WelcomeStrings = {
  subject: (name, appName) => `Welcome to ${appName}, ${name}!`,
  heading: (name) => `Welcome, ${name}!`,
  body: (appName) => `We're thrilled to have you on board at ${appName}. Your account is ready to go.`,
  ctaLabel: 'Get Started',
  securityNote: "If you didn't create this account, you can safely ignore this email.",
  supportNote: (supportEmail) => `Questions? Reply to this email or contact us at ${supportEmail}.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface WelcomeProps extends BaseTemplateProps<WelcomeStrings> {
  name: string;
  loginUrl: string;
  supportEmail?: string;
}

export const Welcome: EmailTemplateType<WelcomeProps> = defineEmail<WelcomeProps>({
  subject: ({ name, appName = 'Our App', strings }) => {
    const s = { ...WELCOME_STRINGS, ...strings };
    return s.subject(name, appName);
  },
  component: ({ name, loginUrl, appName = 'Our App', supportEmail, locale, dir, strings, theme }) => {
    const s = { ...WELCOME_STRINGS, ...strings };
    const year = currentYear(locale);
    return (
      <EmailTemplate
        preview={s.subject(name, appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(name)}</Heading>
        <Text>{s.body(appName)}</Text>
        <Button href={loginUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {s.securityNote}
          {supportEmail && (
            <>
              {' '}
              {s.supportNote(supportEmail)}
            </>
          )}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

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

export interface MagicLinkStrings {
  subject: (appName: string) => string;
  heading: (appName: string) => string;
  body: (email: string) => string;
  ctaLabel: string;
  expiryNote: (expiresIn: string) => string;
  securityNote: string;
  footer: (year: string, appName: string) => string;
}

export const MAGIC_LINK_STRINGS: MagicLinkStrings = {
  subject: (appName) => `Your sign-in link for ${appName}`,
  heading: (appName) => `Sign in to ${appName}`,
  body: (email) =>
    `We received a sign-in request for ${email}. Click the button below to sign in — no password needed.`,
  ctaLabel: 'Sign In',
  expiryNote: (expiresIn) => `This link expires in ${expiresIn} and can only be used once.`,
  securityNote: "If you didn't request this link, you can safely ignore this email.",
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface MagicLinkProps extends BaseTemplateProps<MagicLinkStrings> {
  email: string;
  loginUrl: string;
  expiresIn?: string;
}

export const MagicLink: EmailTemplateType<MagicLinkProps> = defineEmail<MagicLinkProps>({
  subject: ({ appName = 'the app', strings }) => {
    const s = { ...MAGIC_LINK_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({ email, loginUrl, expiresIn = '15 minutes', appName = 'Our App', locale, dir, strings, theme }) => {
    const s = { ...MAGIC_LINK_STRINGS, ...strings };
    const year = currentYear(locale);
    return (
      <EmailTemplate
        preview={`Click to sign in to ${appName}. No password needed.`}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(appName)}</Heading>
        <Text>{s.body(email)}</Text>
        <Button href={loginUrl}>{s.ctaLabel}</Button>
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

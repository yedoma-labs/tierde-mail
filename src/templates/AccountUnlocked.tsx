import { currentYear } from './utils.js';
import type { BaseTemplateProps } from './shared.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface AccountUnlockedStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: string;
  ctaLabel: string;
  securityTip: string;
  footer: (year: string, appName: string) => string;
}

export const ACCOUNT_UNLOCKED_STRINGS: AccountUnlockedStrings = {
  subject: (appName) => `Your ${appName} account has been unlocked`,
  heading: 'Account unlocked',
  greeting: (name) => `Hi ${name},`,
  body: 'Your account has been successfully unlocked. You can now sign in as usual.',
  ctaLabel: 'Sign In',
  securityTip: 'If you did not request this, please contact support immediately — someone else may have access to your account.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface AccountUnlockedProps extends BaseTemplateProps<AccountUnlockedStrings> {
  name: string;
  loginUrl: string;
}

export const AccountUnlocked: EmailTemplateType<AccountUnlockedProps> = defineEmail<AccountUnlockedProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...ACCOUNT_UNLOCKED_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({ name, loginUrl, appName = 'Our App', locale, dir, strings, theme }) => {
    const s = { ...ACCOUNT_UNLOCKED_STRINGS, ...strings };
    const year = currentYear(locale);
    return (
      <EmailTemplate preview={s.subject(appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body}</Text>
        <Button href={loginUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.securityTip}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

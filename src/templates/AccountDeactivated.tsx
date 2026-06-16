import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import type { Theme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface AccountDeactivatedStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (appName: string, reason?: string) => string;
  dataNote: (days: number) => string;
  ctaLabel: string;
  supportNote: (email: string) => string;
  footer: (year: string, appName: string) => string;
}

export const ACCOUNT_DEACTIVATED_STRINGS: AccountDeactivatedStrings = {
  subject: (appName) => `Your ${appName} account has been deactivated`,
  heading: 'Account deactivated',
  greeting: (name) => `Hi ${name},`,
  body: (appName, reason) =>
    reason
      ? `Your ${appName} account has been deactivated. Reason: ${reason}`
      : `Your ${appName} account has been deactivated.`,
  dataNote: (days) =>
    `Your data will be retained for ${days} days. You can reactivate your account during this period.`,
  ctaLabel: 'Reactivate Account',
  supportNote: (email) => `Questions? Contact us at ${email}.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface AccountDeactivatedProps {
  name: string;
  reactivateUrl: string;
  reason?: string;
  dataRetentionDays?: number;
  supportEmail?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<AccountDeactivatedStrings>;
  theme?: Theme;
}

export const AccountDeactivated: EmailTemplateType<AccountDeactivatedProps> = defineEmail<AccountDeactivatedProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...ACCOUNT_DEACTIVATED_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name,
    reactivateUrl,
    reason,
    dataRetentionDays = 30,
    supportEmail,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...ACCOUNT_DEACTIVATED_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate
        preview={s.subject(appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(appName, reason)}</Text>
        <Text muted size="sm">{s.dataNote(dataRetentionDays)}</Text>
        <Button href={reactivateUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {supportEmail && s.supportNote(supportEmail)}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

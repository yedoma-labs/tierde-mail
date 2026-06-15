import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import type { Theme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface NotificationStrings {
  footer: (year: string, appName: string) => string;
}

export const NOTIFICATION_STRINGS: NotificationStrings = {
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface NotificationProps {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<NotificationStrings>;
  theme?: Theme;
}

export const Notification: EmailTemplateType<NotificationProps> = defineEmail<NotificationProps>({
  subject: ({ title }) => title,
  component: ({ title, body, ctaLabel, ctaUrl, appName = 'Our App', locale, dir, strings, theme }) => {
    const s = { ...NOTIFICATION_STRINGS, ...strings };
    const year = currentYear(locale);
    return (
      <EmailTemplate preview={body} lang={locale} dir={dir} theme={theme}>
        <Heading>{title}</Heading>
        <Text>{body}</Text>
        {ctaLabel && ctaUrl && <Button href={ctaUrl}>{ctaLabel}</Button>}
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

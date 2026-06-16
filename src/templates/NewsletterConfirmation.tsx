import { currentYear } from './utils.js';
import type { BaseTemplateProps } from './shared.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Link } from '../components/Link.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export interface NewsletterConfirmationStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (email: string) => string;
  body: (listName: string) => string;
  ctaLabel: string;
  noSignupNote: string;
  unsubscribeLabel: string;
  footer: (year: string, appName: string) => string;
}

export const NEWSLETTER_CONFIRMATION_STRINGS: NewsletterConfirmationStrings = {
  subject: (appName) => `Confirm your subscription to ${appName}`,
  heading: 'Confirm your subscription',
  greeting: (email) => `Thanks for signing up with ${email}!`,
  body: (listName) => `Click the button below to confirm your subscription to ${listName} updates and newsletters.`,
  ctaLabel: 'Confirm Subscription',
  noSignupNote: "If you didn't sign up for this, you can safely ignore this email.",
  unsubscribeLabel: 'Unsubscribe',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface NewsletterConfirmationProps extends BaseTemplateProps<NewsletterConfirmationStrings> {
  email: string;
  confirmUrl: string;
  unsubscribeUrl?: string;
  listName?: string;
}

export const NewsletterConfirmation: EmailTemplateType<NewsletterConfirmationProps> = defineEmail<NewsletterConfirmationProps>({
  subject: ({ appName = 'Our Newsletter', listName, strings }) => {
    const s = { ...NEWSLETTER_CONFIRMATION_STRINGS, ...strings };
    return s.subject(listName ?? appName);
  },
  component: ({ email, confirmUrl, unsubscribeUrl, listName, appName = 'Our Newsletter', locale, dir, strings, theme }) => {
    const s = { ...NEWSLETTER_CONFIRMATION_STRINGS, ...strings };
    const year = currentYear(locale);
    const displayName = listName ?? appName;
    return (
      <EmailTemplate preview={s.subject(displayName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(email)}</Text>
        <Text>{s.body(displayName)}</Text>
        <Button href={confirmUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.noSignupNote}</Text>
        {unsubscribeUrl && (
          <Text muted size="sm">
            <Link href={unsubscribeUrl}>{s.unsubscribeLabel}</Link>
          </Text>
        )}
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

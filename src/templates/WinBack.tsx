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

export interface WinBackStrings {
  subject: (name: string, appName: string) => string;
  heading: (name: string) => string;
  body: (appName: string, daysSince: number) => string;
  offerLine: (offer: string) => string;
  ctaLabel: string;
  optOutNote: string;
  footer: (year: string, appName: string) => string;
}

export const WIN_BACK_STRINGS: WinBackStrings = {
  subject: (name, appName) => `We miss you, ${name} — come back to ${appName}`,
  heading: (name) => `We miss you, ${name}`,
  body: (appName, daysSince) =>
    `It's been ${daysSince} days since you last visited ${appName}. A lot has changed — we'd love to have you back.`,
  offerLine: (offer) => offer,
  ctaLabel: 'Come Back',
  optOutNote: "If you'd prefer not to receive these emails, you can unsubscribe below.",
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface WinBackProps extends BaseTemplateProps<WinBackStrings> {
  name: string;
  returnUrl: string;
  daysSince: number;
  offer?: string;
  unsubscribeUrl?: string;
}

export const WinBack: EmailTemplateType<WinBackProps> = defineEmail<WinBackProps>({
  subject: ({ name, appName = 'Our App', strings }) => {
    const s = { ...WIN_BACK_STRINGS, ...strings };
    return s.subject(name, appName);
  },
  component: ({
    name,
    returnUrl,
    daysSince,
    offer,
    unsubscribeUrl,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...WIN_BACK_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate preview={s.subject(name, appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading(name)}</Heading>
        <Text>{s.body(appName, daysSince)}</Text>
        {offer && (
          <Text>
            <strong>{s.offerLine(offer)}</strong>
          </Text>
        )}
        <Button href={returnUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {s.optOutNote}
          {unsubscribeUrl && (
            <>
              {' '}
              <a href={unsubscribeUrl} style={{ color: '#64748b' }}>Unsubscribe</a>
            </>
          )}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

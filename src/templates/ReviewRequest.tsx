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

export interface ReviewRequestStrings {
  subject: (appName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: (productOrService: string) => string;
  ctaLabel: string;
  skipNote: string;
  footer: (year: string, appName: string) => string;
}

export const REVIEW_REQUEST_STRINGS: ReviewRequestStrings = {
  subject: (appName) => `How was your experience with ${appName}?`,
  heading: 'How did we do?',
  greeting: (name) => `Hi ${name},`,
  body: (productOrService) =>
    `We hope you're enjoying ${productOrService}. Your feedback helps us improve and helps others make informed decisions.`,
  ctaLabel: 'Leave a Review',
  skipNote: "This is a one-time request. We won't ask again.",
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface ReviewRequestProps extends BaseTemplateProps<ReviewRequestStrings> {
  name: string;
  reviewUrl: string;
  productOrService?: string;
}

export const ReviewRequest: EmailTemplateType<ReviewRequestProps> = defineEmail<ReviewRequestProps>({
  subject: ({ appName = 'Our App', strings }) => {
    const s = { ...REVIEW_REQUEST_STRINGS, ...strings };
    return s.subject(appName);
  },
  component: ({
    name,
    reviewUrl,
    productOrService,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...REVIEW_REQUEST_STRINGS, ...strings };
    const year = currentYear(locale);
    const subject = productOrService ?? appName;

    return (
      <EmailTemplate
        preview={s.subject(appName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(subject)}</Text>
        <Button href={reviewUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">{s.skipNote}</Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

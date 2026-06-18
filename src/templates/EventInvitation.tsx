import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { KeyValueTable } from '../components/KeyValueTable.js';
import { Link } from '../components/Link.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export interface EventInvitationStrings {
  subject: (eventName: string) => string;
  heading: (eventName: string) => string;
  greeting: (name: string) => string;
  hostedBy: (hostName: string) => string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  ctaLabel: string;
  calendarLabel: string;
  footer: (year: string, appName: string) => string;
}

export const EVENT_INVITATION_STRINGS: EventInvitationStrings = {
  subject: (eventName) => `You're invited: ${eventName}`,
  heading: (eventName) => `You're invited to ${eventName}`,
  greeting: (name) => `Hi ${name},`,
  hostedBy: (hostName) => `Hosted by ${hostName}`,
  dateLabel: 'Date',
  timeLabel: 'Time',
  locationLabel: 'Location',
  ctaLabel: 'Register Now',
  calendarLabel: 'Add to Calendar',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface EventInvitationProps extends BaseTemplateProps<EventInvitationStrings> {
  name: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  registerUrl: string;
  description?: string;
  location?: string;
  hostName?: string;
  calendarUrl?: string;
}

export const EventInvitation: EmailTemplateType<EventInvitationProps> =
  defineEmail<EventInvitationProps>({
    subject: ({ eventName, strings }) => {
      const s = { ...EVENT_INVITATION_STRINGS, ...strings };
      return s.subject(eventName);
    },
    component: ({
      name,
      eventName,
      eventDate,
      eventTime,
      registerUrl,
      description,
      location,
      hostName,
      calendarUrl,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...EVENT_INVITATION_STRINGS, ...strings };
      const year = currentYear(locale);
      return (
        <EmailTemplate preview={s.subject(eventName)} lang={locale} dir={dir} theme={theme}>
          <Heading>{s.heading(eventName)}</Heading>
          <Text>{s.greeting(name)}</Text>
          {hostName && <Text muted>{s.hostedBy(hostName)}</Text>}
          {description && <Text>{description}</Text>}
          <KeyValueTable
            rows={[
              { label: s.dateLabel, value: eventDate },
              { label: s.timeLabel, value: eventTime },
              { label: s.locationLabel, value: location },
            ]}
          />
          <Button href={registerUrl}>{s.ctaLabel}</Button>
          {calendarUrl && (
            <Text muted size="sm" align="center">
              <Link href={calendarUrl}>{s.calendarLabel}</Link>
            </Text>
          )}
          <Hr />
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });

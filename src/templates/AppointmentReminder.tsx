import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { KeyValueTable } from '../components/KeyValueTable.js';
import { Link } from '../components/Link.js';
import { Section } from '../components/Section.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export interface AppointmentReminderStrings {
  subject: (providerName: string) => string;
  heading: string;
  greeting: (name: string) => string;
  body: string;
  dateLabel: string;
  timeLabel: string;
  providerLabel: string;
  locationLabel: string;
  calendarLabel: string;
  rescheduleLabel: string;
  cancelLabel: string;
  footer: (year: string, appName: string) => string;
}

export const APPOINTMENT_REMINDER_STRINGS: AppointmentReminderStrings = {
  subject: (providerName) => `Reminder: Your appointment with ${providerName}`,
  heading: 'Your appointment is coming up',
  greeting: (name) => `Hi ${name},`,
  body: 'This is a friendly reminder about your upcoming appointment.',
  dateLabel: 'Date',
  timeLabel: 'Time',
  providerLabel: 'Provider',
  locationLabel: 'Location',
  calendarLabel: 'Add to Calendar',
  rescheduleLabel: 'Reschedule',
  cancelLabel: 'Cancel Appointment',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface AppointmentReminderProps extends BaseTemplateProps<AppointmentReminderStrings> {
  name: string;
  providerName: string;
  appointmentDate: string;
  appointmentTime: string;
  location?: string;
  calendarUrl?: string;
  rescheduleUrl?: string;
  cancelUrl?: string;
}

export const AppointmentReminder: EmailTemplateType<AppointmentReminderProps> =
  defineEmail<AppointmentReminderProps>({
    subject: ({ providerName, strings }) => {
      const s = { ...APPOINTMENT_REMINDER_STRINGS, ...strings };
      return s.subject(providerName);
    },
    component: ({
      name,
      providerName,
      appointmentDate,
      appointmentTime,
      location,
      calendarUrl,
      rescheduleUrl,
      cancelUrl,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...APPOINTMENT_REMINDER_STRINGS, ...strings };
      const year = currentYear(locale);
      return (
        <EmailTemplate preview={s.subject(providerName)} lang={locale} dir={dir} theme={theme}>
          <Heading>{s.heading}</Heading>
          <Text>{s.greeting(name)}</Text>
          <Text>{s.body}</Text>
          <KeyValueTable
            rows={[
              { label: s.dateLabel, value: appointmentDate },
              { label: s.timeLabel, value: appointmentTime },
              { label: s.providerLabel, value: providerName },
              { label: s.locationLabel, value: location },
            ]}
          />
          {calendarUrl && (
            <Button href={calendarUrl} variant="outline">
              {s.calendarLabel}
            </Button>
          )}
          <Hr />
          {(rescheduleUrl || cancelUrl) && (
            <Section>
              <Text muted size="sm">
                {rescheduleUrl && cancelUrl ? (
                  <>
                    <Link href={rescheduleUrl}>{s.rescheduleLabel}</Link>
                    {' · '}
                    <Link href={cancelUrl}>{s.cancelLabel}</Link>
                  </>
                ) : rescheduleUrl ? (
                  <Link href={rescheduleUrl}>{s.rescheduleLabel}</Link>
                ) : (
                  <Link href={cancelUrl as string}>{s.cancelLabel}</Link>
                )}
              </Text>
            </Section>
          )}
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });

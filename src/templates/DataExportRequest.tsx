import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export type DataExportRequestEvent = 'requested' | 'processing' | 'ready' | 'expired';

export interface DataExportRequestStrings {
  subject: (event: DataExportRequestEvent, appName: string) => string;
  heading: (event: DataExportRequestEvent) => string;
  greeting: (name: string) => string;
  body: (event: DataExportRequestEvent) => string;
  ctaLabel: (event: DataExportRequestEvent) => string;
  processingNote: string;
  expiryNote: (hours: number) => string;
  footer: (year: string, appName: string) => string;
}

export const DATA_EXPORT_REQUEST_STRINGS: DataExportRequestStrings = {
  subject: (event, appName) => {
    const map: Record<DataExportRequestEvent, string> = {
      requested: `Data export requested — ${appName}`,
      processing: `Your data export is being prepared — ${appName}`,
      ready: `Your data export is ready — ${appName}`,
      expired: `Your data export link has expired — ${appName}`,
    };
    return map[event];
  },
  heading: (event) => {
    const map: Record<DataExportRequestEvent, string> = {
      requested: 'Data export requested',
      processing: 'Preparing your export',
      ready: 'Your export is ready',
      expired: 'Export link expired',
    };
    return map[event];
  },
  greeting: (name) => `Hi ${name},`,
  body: (event) => {
    const map: Record<DataExportRequestEvent, string> = {
      requested:
        'We received your request to export your personal data. We will begin processing it shortly and notify you when your download is ready.',
      processing:
        'We are currently preparing your data export. This usually takes a few minutes. We will send you another email when it is ready.',
      ready:
        'Your personal data export is ready to download. The file includes all data associated with your account.',
      expired:
        'Your data export download link has expired. You can submit a new export request from your account settings.',
    };
    return map[event];
  },
  ctaLabel: (event) => {
    const map: Record<DataExportRequestEvent, string> = {
      requested: 'View Account',
      processing: 'View Account',
      ready: 'Download Export',
      expired: 'Request New Export',
    };
    return map[event];
  },
  processingNote: 'Exports typically take 1–5 minutes depending on account size.',
  expiryNote: (hours) => `This download link expires in ${hours} hours.`,
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface DataExportRequestProps extends BaseTemplateProps<DataExportRequestStrings> {
  name: string;
  event: DataExportRequestEvent;
  actionUrl: string;
  expiresInHours?: number;
}

export const DataExportRequest: EmailTemplateType<DataExportRequestProps> =
  defineEmail<DataExportRequestProps>({
    subject: ({ event, appName = 'Our App', strings }) => {
      const s = { ...DATA_EXPORT_REQUEST_STRINGS, ...strings };
      return s.subject(event, appName);
    },
    component: ({
      name,
      event,
      actionUrl,
      expiresInHours = 24,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...DATA_EXPORT_REQUEST_STRINGS, ...strings };
      const year = currentYear(locale);
      return (
        <EmailTemplate preview={s.subject(event, appName)} lang={locale} dir={dir} theme={theme}>
          <Heading>{s.heading(event)}</Heading>
          <Text>{s.greeting(name)}</Text>
          <Text>{s.body(event)}</Text>
          {event === 'processing' && (
            <Text muted size="sm">
              {s.processingNote}
            </Text>
          )}
          {event === 'ready' && (
            <Text muted size="sm">
              {s.expiryNote(expiresInHours)}
            </Text>
          )}
          <Button href={actionUrl}>{s.ctaLabel(event)}</Button>
          <Hr />
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });

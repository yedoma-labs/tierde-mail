import { currentYear } from './utils.js';
import type { BaseTemplateProps } from './shared.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export type AccountDeletionEvent = 'requested' | 'scheduled' | 'completed' | 'cancelled';

export interface AccountDeletionConfirmationStrings {
  subject: (event: AccountDeletionEvent, appName: string) => string;
  heading: (event: AccountDeletionEvent) => string;
  greeting: (name: string) => string;
  body: (event: AccountDeletionEvent, deletionDate?: string) => string;
  cancelCtaLabel: string;
  dataNote: (days: number) => string;
  permanentNote: string;
  footer: (year: string, appName: string) => string;
}

export const ACCOUNT_DELETION_CONFIRMATION_STRINGS: AccountDeletionConfirmationStrings = {
  subject: (event, appName) => {
    const map: Record<AccountDeletionEvent, string> = {
      requested: `Account deletion requested — ${appName}`,
      scheduled: `Your ${appName} account will be deleted`,
      completed: `Your ${appName} account has been deleted`,
      cancelled: `Account deletion cancelled — ${appName}`,
    };
    return map[event];
  },
  heading: (event) => {
    const map: Record<AccountDeletionEvent, string> = {
      requested: 'Account deletion requested',
      scheduled: 'Account scheduled for deletion',
      completed: 'Account deleted',
      cancelled: 'Deletion cancelled',
    };
    return map[event];
  },
  greeting: (name) => `Hi ${name},`,
  body: (event, deletionDate) => {
    const map: Record<AccountDeletionEvent, string> = {
      requested: 'We received your request to delete your account. Your account will be scheduled for deletion shortly.',
      scheduled: `Your account is scheduled to be permanently deleted on ${deletionDate ?? 'the specified date'}. You can cancel this request before then.`,
      completed: 'Your account and all associated data have been permanently deleted. Thank you for using our service.',
      cancelled: 'Your account deletion request has been cancelled. Your account remains active.',
    };
    return map[event];
  },
  cancelCtaLabel: 'Cancel Deletion',
  dataNote: (days) => `All your data will be permanently removed after ${days} days.`,
  permanentNote: 'This action is permanent and cannot be undone.',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface AccountDeletionConfirmationProps extends BaseTemplateProps<AccountDeletionConfirmationStrings> {
  name: string;
  event: AccountDeletionEvent;
  cancelUrl?: string;
  deletionDate?: string;
  dataRetentionDays?: number;
}

const warningBoxStyle: CSSProperties = {
  backgroundColor: '#fff7ed',
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '16px',
};

const warningTextStyle: CSSProperties = {
  color: '#7c2d12',
  fontSize: '14px',
  margin: 0,
  lineHeight: '1.6',
};

export const AccountDeletionConfirmation: EmailTemplateType<AccountDeletionConfirmationProps> = defineEmail<AccountDeletionConfirmationProps>({
  subject: ({ event, appName = 'Our App', strings }) => {
    const s = { ...ACCOUNT_DELETION_CONFIRMATION_STRINGS, ...strings };
    return s.subject(event, appName);
  },
  component: ({ name, event, cancelUrl, deletionDate, dataRetentionDays = 30, appName = 'Our App', locale, dir, strings, theme }) => {
    const s = { ...ACCOUNT_DELETION_CONFIRMATION_STRINGS, ...strings };
    const year = currentYear(locale);
    const showWarning = event === 'requested' || event === 'scheduled' || event === 'completed';

    return (
      <EmailTemplate preview={s.subject(event, appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading(event)}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(event, deletionDate)}</Text>
        {showWarning && (
          <Section>
            <div style={warningBoxStyle}>
              <p style={warningTextStyle}>
                {event === 'scheduled' ? s.dataNote(dataRetentionDays) : s.permanentNote}
              </p>
            </div>
          </Section>
        )}
        {cancelUrl && event === 'scheduled' && (
          <Button href={cancelUrl} variant="outline">{s.cancelCtaLabel}</Button>
        )}
        <Hr />
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

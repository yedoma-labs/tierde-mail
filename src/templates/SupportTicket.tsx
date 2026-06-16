import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import type { CSSProperties } from 'react';
import type { BaseTemplateProps } from './shared.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';

export type SupportTicketEvent = 'created' | 'updated' | 'resolved' | 'closed' | 'reopened';

export interface SupportTicketStrings {
  subject: (event: SupportTicketEvent, ticketId: string, appName: string) => string;
  heading: (event: SupportTicketEvent) => string;
  greeting: (name: string) => string;
  body: (event: SupportTicketEvent, ticketTitle: string) => string;
  ctaLabel: (event: SupportTicketEvent) => string;
  footer: (year: string, appName: string) => string;
}

export const SUPPORT_TICKET_STRINGS: SupportTicketStrings = {
  subject: (event, ticketId, appName) => {
    const labels: Record<SupportTicketEvent, string> = {
      created: `[#${ticketId}] Support ticket created — ${appName}`,
      updated: `[#${ticketId}] Update on your support request — ${appName}`,
      resolved: `[#${ticketId}] Your issue has been resolved — ${appName}`,
      closed: `[#${ticketId}] Ticket closed — ${appName}`,
      reopened: `[#${ticketId}] Ticket reopened — ${appName}`,
    };
    return labels[event];
  },
  heading: (event) => {
    const labels: Record<SupportTicketEvent, string> = {
      created: 'Ticket created',
      updated: 'Ticket updated',
      resolved: 'Issue resolved',
      closed: 'Ticket closed',
      reopened: 'Ticket reopened',
    };
    return labels[event];
  },
  greeting: (name) => `Hi ${name},`,
  body: (event, ticketTitle) => {
    const messages: Record<SupportTicketEvent, string> = {
      created: `We've received your support request about "${ticketTitle}" and will get back to you as soon as possible.`,
      updated: `There's a new update on your support request about "${ticketTitle}".`,
      resolved: `Your support request about "${ticketTitle}" has been resolved. Please let us know if you need further assistance.`,
      closed: `Your support ticket about "${ticketTitle}" has been closed.`,
      reopened: `Your support ticket about "${ticketTitle}" has been reopened and is being reviewed.`,
    };
    return messages[event];
  },
  ctaLabel: (event) => event === 'resolved' ? 'Rate Your Experience' : 'View Ticket',
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface SupportTicketProps extends BaseTemplateProps<SupportTicketStrings> {
  name: string;
  event: SupportTicketEvent;
  ticketId: string;
  ticketTitle: string;
  ticketUrl: string;
  agentMessage?: string;
  agentName?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

const detailRowStyle: CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '14px',
};

const priorityBadge = (priority: SupportTicketProps['priority']): CSSProperties => {
  const map: Record<NonNullable<SupportTicketProps['priority']>, [string, string]> = {
    low: ['#f1f5f9', '#475569'],
    normal: ['#eff6ff', '#1d4ed8'],
    high: ['#ffedd5', '#9a3412'],
    urgent: ['#fee2e2', '#991b1b'],
  };
  const [bg, color] = map[priority ?? 'normal'];
  return { display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: bg, color };
};

const agentMessageStyle: CSSProperties = {
  backgroundColor: '#f8fafc',
  borderLeft: '3px solid #6366f1',
  borderRadius: '0 6px 6px 0',
  padding: '12px 16px',
  fontSize: '14px',
  color: '#334155',
  lineHeight: '1.6',
};

export const SupportTicket: EmailTemplateType<SupportTicketProps> = defineEmail<SupportTicketProps>({
  subject: ({ event, ticketId, appName = 'Our App', strings }) => {
    const s = { ...SUPPORT_TICKET_STRINGS, ...strings };
    return s.subject(event, ticketId, appName);
  },
  component: ({
    name,
    event,
    ticketId,
    ticketTitle,
    ticketUrl,
    agentMessage,
    agentName,
    priority,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...SUPPORT_TICKET_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate preview={s.subject(event, ticketId, appName)} lang={locale} dir={dir} theme={theme}>
        <Heading>{s.heading(event)}</Heading>
        <Text>{s.greeting(name)}</Text>
        <Text>{s.body(event, ticketTitle)}</Text>
        <Section>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <td style={detailRowStyle}><span style={{ color: '#6b7280' }}>Ticket</span></td>
                <td style={{ ...detailRowStyle, textAlign: 'right', fontWeight: '600', color: '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>#{ticketId}</td>
              </tr>
              <tr>
                <td style={detailRowStyle}><span style={{ color: '#6b7280' }}>Subject</span></td>
                <td style={{ ...detailRowStyle, textAlign: 'right', fontWeight: '600', color: '#0f172a' }}>{ticketTitle}</td>
              </tr>
              {priority && (
                <tr>
                  <td style={{ padding: '8px 0', fontSize: '14px' }}><span style={{ color: '#6b7280' }}>Priority</span></td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                    <span style={priorityBadge(priority)}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>
        {agentMessage && (
          <Section>
            {agentName && <Text muted size="sm">{agentName} replied:</Text>}
            <div style={agentMessageStyle}>{agentMessage}</div>
          </Section>
        )}
        <Button href={ticketUrl}>{s.ctaLabel(event)}</Button>
        <Hr />
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

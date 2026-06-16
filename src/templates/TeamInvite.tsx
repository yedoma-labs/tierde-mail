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

export interface TeamInviteStrings {
  subject: (inviterName: string, teamName: string) => string;
  heading: (teamName: string) => string;
  intro: (inviterName: string, teamName: string, role?: string) => string;
  ctaLabel: string;
  expiryNote: (hours: number) => string;
  declineNote: string;
  footer: (year: string, appName: string) => string;
}

export const TEAM_INVITE_STRINGS: TeamInviteStrings = {
  subject: (inviterName, teamName) => `${inviterName} invited you to join ${teamName}`,
  heading: (teamName) => `You're invited to join ${teamName}`,
  intro: (inviterName, teamName, role) =>
    role
      ? `${inviterName} has invited you to join ${teamName} as a ${role}.`
      : `${inviterName} has invited you to join ${teamName}.`,
  ctaLabel: 'Accept Invitation',
  expiryNote: (hours) => `This invitation expires in ${hours} hours.`,
  declineNote: "If you weren't expecting this invitation, you can safely ignore this email.",
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface TeamInviteProps {
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  role?: string;
  expiresInHours?: number;
  appName?: string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
  strings?: Partial<TeamInviteStrings>;
  theme?: Theme;
}

export const TeamInvite: EmailTemplateType<TeamInviteProps> = defineEmail<TeamInviteProps>({
  subject: ({ inviterName, teamName, strings }) => {
    const s = { ...TEAM_INVITE_STRINGS, ...strings };
    return s.subject(inviterName, teamName);
  },
  component: ({
    inviterName,
    teamName,
    inviteUrl,
    role,
    expiresInHours = 48,
    appName = 'Our App',
    locale,
    dir,
    strings,
    theme,
  }) => {
    const s = { ...TEAM_INVITE_STRINGS, ...strings };
    const year = currentYear(locale);

    return (
      <EmailTemplate
        preview={s.subject(inviterName, teamName)}
        lang={locale}
        dir={dir}
        theme={theme}
      >
        <Heading>{s.heading(teamName)}</Heading>
        <Text>{s.intro(inviterName, teamName, role)}</Text>
        <Button href={inviteUrl}>{s.ctaLabel}</Button>
        <Hr />
        <Text muted size="sm">
          {s.expiryNote(expiresInHours)}
          {' '}
          {s.declineNote}
        </Text>
        <Footer>{s.footer(year, appName)}</Footer>
      </EmailTemplate>
    );
  },
});

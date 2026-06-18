import type { CSSProperties } from 'react';
import { Button } from '../components/Button.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Footer } from '../components/Footer.js';
import { Heading } from '../components/Heading.js';
import { Hr } from '../components/Hr.js';
import { Section } from '../components/Section.js';
import { Text } from '../components/Text.js';
import { defineEmail } from '../define-email.js';
import { defaultTheme } from '../theme.js';
import type { EmailTemplate as EmailTemplateType } from '../types.js';
import type { BaseTemplateProps } from './shared.js';
import { currentYear } from './utils.js';

export type MentionEventType = 'mention' | 'comment' | 'reply' | 'reaction';

export interface CommentMentionStrings {
  subject: (event: MentionEventType, actorName: string, contextName: string) => string;
  heading: (event: MentionEventType, actorName: string) => string;
  greeting: (name: string) => string;
  context: (contextName: string) => string;
  ctaLabel: (event: MentionEventType) => string;
  footer: (year: string, appName: string) => string;
}

export const COMMENT_MENTION_STRINGS: CommentMentionStrings = {
  subject: (event, actorName, contextName) => {
    const labels: Record<MentionEventType, string> = {
      mention: `${actorName} mentioned you in "${contextName}"`,
      comment: `${actorName} commented on "${contextName}"`,
      reply: `${actorName} replied to your comment in "${contextName}"`,
      reaction: `${actorName} reacted to your comment in "${contextName}"`,
    };
    return labels[event];
  },
  heading: (event, actorName) => {
    const labels: Record<MentionEventType, string> = {
      mention: `${actorName} mentioned you`,
      comment: `${actorName} left a comment`,
      reply: `${actorName} replied to you`,
      reaction: `${actorName} reacted to your comment`,
    };
    return labels[event];
  },
  greeting: (name) => `Hi ${name},`,
  context: (contextName) => `In: ${contextName}`,
  ctaLabel: (event) => {
    const labels: Record<MentionEventType, string> = {
      mention: 'View Mention',
      comment: 'View Comment',
      reply: 'View Reply',
      reaction: 'View Comment',
    };
    return labels[event];
  },
  footer: (year, appName) => `© ${year} ${appName}. All rights reserved.`,
};

export interface CommentMentionProps extends BaseTemplateProps<CommentMentionStrings> {
  name: string;
  event: MentionEventType;
  actorName: string;
  actorAvatarUrl?: string;
  contextName: string;
  commentText?: string;
  commentUrl: string;
}

export const CommentMention: EmailTemplateType<CommentMentionProps> =
  defineEmail<CommentMentionProps>({
    subject: ({ event, actorName, contextName, strings }) => {
      const s = { ...COMMENT_MENTION_STRINGS, ...strings };
      return s.subject(event, actorName, contextName);
    },
    component: ({
      name,
      event,
      actorName,
      contextName,
      commentText,
      commentUrl,
      appName = 'Our App',
      locale,
      dir,
      strings,
      theme,
    }) => {
      const s = { ...COMMENT_MENTION_STRINGS, ...strings };
      const t = { ...defaultTheme, ...theme };
      const year = currentYear(locale);

      const quoteBlockStyle: CSSProperties = {
        backgroundColor: t.surfaceSubtle,
        borderLeft: `3px solid ${t.primary}`,
        borderRadius: '0 6px 6px 0',
        padding: '12px 16px',
        margin: '0',
      };

      const quoteTextStyle: CSSProperties = {
        fontSize: '14px',
        color: t.textSecondary,
        fontStyle: 'italic',
        margin: 0,
        lineHeight: '1.6',
      };

      const contextStyle: CSSProperties = {
        fontSize: '12px',
        color: t.textMuted,
        margin: '8px 0 0',
      };

      return (
        <EmailTemplate
          preview={s.subject(event, actorName, contextName)}
          lang={locale}
          dir={dir}
          theme={theme}
        >
          <Heading>{s.heading(event, actorName)}</Heading>
          <Text>{s.greeting(name)}</Text>
          {commentText && (
            <Section>
              <div style={quoteBlockStyle}>
                <p style={quoteTextStyle}>"{commentText}"</p>
                <p style={contextStyle}>{s.context(contextName)}</p>
              </div>
            </Section>
          )}
          <Button href={commentUrl}>{s.ctaLabel(event)}</Button>
          <Hr />
          <Footer>{s.footer(year, appName)}</Footer>
        </EmailTemplate>
      );
    },
  });

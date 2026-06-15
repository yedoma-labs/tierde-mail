import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';

export interface NotificationProps {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  appName?: string;
}

export const Notification = defineEmail<NotificationProps>({
  subject: ({ title }) => title,
  component: ({ title, body, ctaLabel, ctaUrl, appName = 'Our App' }) => (
    <EmailTemplate preview={body}>
      <Heading>{title}</Heading>
      <Text>{body}</Text>
      {ctaLabel && ctaUrl && <Button href={ctaUrl}>{ctaLabel}</Button>}
      <Footer>© {currentYear()} {appName}. All rights reserved.</Footer>
    </EmailTemplate>
  ),
});

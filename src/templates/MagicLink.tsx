import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';

export interface MagicLinkProps {
  email: string;
  loginUrl: string;
  expiresIn?: string;
  appName?: string;
}

export const MagicLink = defineEmail<MagicLinkProps>({
  subject: ({ appName }) => `Your sign-in link for ${appName ?? 'the app'}`,
  component: ({ email, loginUrl, expiresIn = '15 minutes', appName = 'Our App' }) => (
    <EmailTemplate preview={`Click to sign in to ${appName}. No password needed.`}>
      <Heading>Sign in to {appName}</Heading>
      <Text>
        We received a sign-in request for <strong>{email}</strong>. Click the button
        below to sign in — no password needed.
      </Text>
      <Button href={loginUrl}>Sign In</Button>
      <Text muted size="sm" align="center">
        This link expires in {expiresIn} and can only be used once.
      </Text>
      <Hr />
      <Text muted size="sm">
        If you didn't request this link, you can safely ignore this email.
      </Text>
      <Footer>© {currentYear()} {appName}. All rights reserved.</Footer>
    </EmailTemplate>
  ),
});

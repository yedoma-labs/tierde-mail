import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';

export interface EmailVerificationProps {
  name: string;
  verifyUrl: string;
  expiresIn?: string;
  appName?: string;
}

export const EmailVerification = defineEmail<EmailVerificationProps>({
  subject: ({ appName }) => `Verify your email address for ${appName ?? 'your account'}`,
  component: ({ name, verifyUrl, expiresIn = '24 hours', appName = 'Our App' }) => (
    <EmailTemplate preview="Please verify your email address to get started.">
      <Heading>Verify your email</Heading>
      <Text>Hi {name},</Text>
      <Text>
        Thanks for signing up for {appName}! Please verify your email address
        to activate your account.
      </Text>
      <Button href={verifyUrl}>Verify Email Address</Button>
      <Text muted size="sm" align="center">
        This link expires in {expiresIn}.
      </Text>
      <Hr />
      <Text muted size="sm">
        If you didn't create an account with {appName}, you can safely ignore this email.
      </Text>
      <Footer>© {currentYear()} {appName}. All rights reserved.</Footer>
    </EmailTemplate>
  ),
});

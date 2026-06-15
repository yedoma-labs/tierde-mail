import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';

export interface PasswordResetProps {
  username: string;
  resetUrl: string;
  expiresIn?: string;
  appName?: string;
}

export const PasswordReset = defineEmail<PasswordResetProps>({
  subject: ({ appName }) => `Reset your ${appName ?? 'your'} password`,
  component: ({ username, resetUrl, expiresIn = '1 hour', appName = 'Our App' }) => (
    <EmailTemplate preview="Password reset requested. Click to reset your password.">
      <Heading>Reset your password</Heading>
      <Text>Hi {username},</Text>
      <Text>
        We received a request to reset the password for your {appName} account.
        Click the button below to choose a new password.
      </Text>
      <Button href={resetUrl}>Reset Password</Button>
      <Text muted size="sm" align="center">
        This link expires in {expiresIn}.
      </Text>
      <Hr />
      <Text muted size="sm">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </Text>
      <Footer>© {currentYear()} {appName}. All rights reserved.</Footer>
    </EmailTemplate>
  ),
});

import { currentYear } from './utils.js';
import { defineEmail } from '../define-email.js';
import { EmailTemplate } from '../components/EmailTemplate.js';
import { Heading } from '../components/Heading.js';
import { Text } from '../components/Text.js';
import { Button } from '../components/Button.js';
import { Footer } from '../components/Footer.js';
import { Hr } from '../components/Hr.js';

export interface WelcomeProps {
  name: string;
  loginUrl: string;
  appName?: string;
  supportEmail?: string;
}

export const Welcome = defineEmail<WelcomeProps>({
  subject: ({ appName, name }) => `Welcome to ${appName ?? 'the app'}, ${name}!`,
  component: ({ name, loginUrl, appName = 'Our App', supportEmail }) => (
    <EmailTemplate preview={`Welcome to ${appName}, ${name}! Click to get started.`}>
      <Heading>Welcome, {name}!</Heading>
      <Text>
        We're thrilled to have you on board at {appName}. Your account is ready to go.
      </Text>
      <Button href={loginUrl}>Get Started</Button>
      <Hr />
      <Text muted size="sm">
        If you didn't create this account, you can safely ignore this email.
        {supportEmail && (
          <>
            {' '}
            Questions? Reply to this email or contact us at {supportEmail}.
          </>
        )}
      </Text>
      <Footer>© {currentYear()} {appName}. All rights reserved.</Footer>
    </EmailTemplate>
  ),
});

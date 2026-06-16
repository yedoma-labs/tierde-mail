export type WebhookEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.bounced'
  | 'email.complained'
  | 'email.opened'
  | 'email.clicked'
  | 'email.subscription_changed'
  | (string & {});

export interface WebhookEmail {
  /** Provider-specific message ID */
  id: string;
  to: string[];
  from: string;
  subject?: string | undefined;
  timestamp: string;
}

export interface WebhookEvent {
  type: WebhookEventType;
  provider: 'resend' | 'postmark';
  email: WebhookEmail;
  /** Original parsed payload — use for provider-specific fields */
  raw: unknown;
}

export interface WebhookHandler {
  /**
   * Verify the webhook signature and parse the event.
   * Throws `WebhookVerificationError` on invalid signature or expired timestamp.
   */
  verify(
    rawBody: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent;
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookVerificationError';
  }
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Attachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
  encoding?: 'base64' | 'utf-8';
}

export interface EmailMessage {
  from: EmailAddress;
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  attachments?: Attachment[];
  headers?: Record<string, string>;
}

export interface SendResult {
  id: string;
  provider: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<SendResult>;
  readonly name: string;
}

export type EmailAddressInput = string | EmailAddress;

export interface SendOptions<Props> {
  to: EmailAddressInput | EmailAddressInput[];
  cc?: EmailAddressInput | EmailAddressInput[];
  bcc?: EmailAddressInput | EmailAddressInput[];
  replyTo?: EmailAddressInput;
  props: Props;
  attachments?: Attachment[];
  headers?: Record<string, string>;
}

export interface EmailDefinition<Props> {
  subject: (props: Props) => string;
  component: (props: Props) => React.ReactElement;
}

export type EmailTemplate<Props> = EmailDefinition<Props> & {
  readonly __propsType: Props;
};

export interface MailerConfig {
  from: EmailAddressInput;
  defaultReplyTo?: EmailAddressInput;
}

export interface SingleProviderMailerConfig extends MailerConfig {
  provider: EmailProvider;
}

export interface MultiProviderMailerConfig extends MailerConfig {
  providers: EmailProvider[];
  strategy: 'failover' | 'round-robin';
}

export type CreateMailerConfig = SingleProviderMailerConfig | MultiProviderMailerConfig;

export interface BatchRecipient<Props> {
  to: EmailAddressInput | EmailAddressInput[];
  props: Props;
  cc?: EmailAddressInput | EmailAddressInput[];
  bcc?: EmailAddressInput | EmailAddressInput[];
}

export interface BatchSendOptions<Props> {
  recipients: BatchRecipient<Props>[];
  /** Max concurrent sends per chunk. Default: 5 */
  concurrency?: number;
  /** Milliseconds to wait between chunks (rate limiting). Default: 0 */
  delayMs?: number;
  /** Called after each send attempt, success or failure */
  onResult?: (result: BatchItemResult<Props>) => void;
}

export interface BatchItemResult<Props> {
  to: EmailAddressInput | EmailAddressInput[];
  props: Props;
  result?: SendResult;
  error?: Error;
}

export interface BatchSendResult<Props> {
  results: BatchItemResult<Props>[];
  sent: number;
  failed: number;
}

export interface Mailer {
  send<Props>(template: EmailTemplate<Props>, options: SendOptions<Props>): Promise<SendResult>;
  sendBatch<Props>(template: EmailTemplate<Props>, options: BatchSendOptions<Props>): Promise<BatchSendResult<Props>>;
}

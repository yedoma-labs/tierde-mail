import { htmlToPlainText } from './plain-text.js';
import { renderEmail } from './render.js';
import type {
  BatchItemResult,
  BatchRecipient,
  BatchSendOptions,
  BatchSendResult,
  CreateMailerConfig,
  EmailMessage,
  EmailProvider,
  EmailTemplate,
  Mailer,
  MailMiddleware,
  MultiProviderMailerConfig,
  SendOptions,
  SendResult,
} from './types.js';
import { normalizeAddress, normalizeAddresses, validateAttachment } from './validate.js';
import { VERSION } from './version.js';

function isMultiProvider(config: CreateMailerConfig): config is MultiProviderMailerConfig {
  return 'providers' in config;
}

function extractHttpStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const match = error.message.match(/\serror\s(\d{3}):/i);
  return match ? Number(match[1]) : undefined;
}

function defaultRetryOn(error: unknown): boolean {
  const status = extractHttpStatus(error);
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MailerImpl implements Mailer {
  readonly #from;
  readonly #defaultReplyTo;
  readonly #providers: EmailProvider[];
  readonly #strategy: 'failover' | 'round-robin';
  readonly #middleware: MailMiddleware[];
  readonly #maxRetries: number;
  readonly #initialRetryDelayMs: number;
  readonly #retryOn: (error: unknown) => boolean;
  #roundRobinIndex = 0;

  constructor(config: CreateMailerConfig) {
    this.#from = normalizeAddress(config.from);
    this.#defaultReplyTo = config.defaultReplyTo
      ? normalizeAddress(config.defaultReplyTo)
      : undefined;
    this.#middleware = config.middleware ?? [];
    this.#maxRetries = config.maxRetries ?? 0;
    this.#initialRetryDelayMs = config.initialRetryDelayMs ?? 1000;
    this.#retryOn = config.retryOn ?? defaultRetryOn;

    if (isMultiProvider(config)) {
      if (!config.providers || config.providers.length === 0) {
        throw new TypeError('At least one provider is required');
      }
      this.#providers = config.providers;
      this.#strategy = config.strategy;
    } else {
      this.#providers = [config.provider];
      this.#strategy = 'failover';
    }
  }

  async send<Props>(
    template: EmailTemplate<Props>,
    options: SendOptions<Props>,
  ): Promise<SendResult> {
    for (const attachment of options.attachments ?? []) {
      validateAttachment(attachment);
    }

    const props = options.props;
    const subject = template.subject(props);
    // Prevent SMTP header injection via CRLF in subject
    if (/[\r\n]/.test(subject)) {
      throw new TypeError('Subject line contains invalid characters');
    }
    const element = template.component(props);
    const html = renderEmail(element);
    const text = htmlToPlainText(html);

    const replyTo = options.replyTo ? normalizeAddress(options.replyTo) : this.#defaultReplyTo;

    let message: EmailMessage = {
      from: this.#from,
      to: normalizeAddresses(options.to),
      ...(options.cc ? { cc: normalizeAddresses(options.cc) } : {}),
      ...(options.bcc ? { bcc: normalizeAddresses(options.bcc) } : {}),
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
      text,
      attachments: options.attachments ?? [],
      headers: { 'X-Mailer': `tierde-mail/${VERSION}`, ...options.headers },
    };

    for (const mw of this.#middleware) {
      message = await mw(message);
    }

    // Re-validate after middleware: middleware can rewrite the subject or inject attachments,
    // so the pre-middleware checks above are not sufficient on their own.
    if (/[\r\n]/.test(message.subject)) {
      throw new TypeError('Subject line contains invalid characters');
    }
    for (const attachment of message.attachments ?? []) {
      validateAttachment(attachment);
    }

    if (this.#strategy === 'round-robin') {
      const idx = this.#roundRobinIndex % this.#providers.length;
      this.#roundRobinIndex++;
      const provider = this.#providers[idx];
      if (!provider) throw new Error('No provider available for round-robin slot');
      return this.#sendWithRetry(provider, message);
    }

    // failover: try each provider in order (with per-provider retry)
    let lastError: unknown;
    for (const provider of this.#providers) {
      try {
        return await this.#sendWithRetry(provider, message);
      } catch (err) {
        lastError = err;
      }
    }
    // Single provider: rethrow its error unchanged. Multiple providers: wrap so the caller
    // knows every provider was tried, preserving the last error as `cause`.
    if (this.#providers.length === 1) {
      throw lastError ?? new Error('Provider failed with no error message');
    }
    throw new Error(
      `All ${this.#providers.length} providers failed. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
      lastError !== undefined ? { cause: lastError } : undefined,
    );
  }

  async #sendWithRetry(provider: EmailProvider, message: EmailMessage): Promise<SendResult> {
    let attempt = 0;
    while (true) {
      try {
        return await provider.send(message);
      } catch (err) {
        if (attempt >= this.#maxRetries || !this.#retryOn(err)) throw err;
        await delay(this.#initialRetryDelayMs * 2 ** attempt);
        attempt++;
      }
    }
  }

  async sendBatch<Props>(
    template: EmailTemplate<Props>,
    options: BatchSendOptions<Props>,
  ): Promise<BatchSendResult<Props>> {
    return executeBatch(this, template, options);
  }

  toString(): string {
    return `Mailer(providers=[${this.#providers.map((p) => p.name).join(', ')}])`;
  }
}

function buildSendOptions<Props>(
  options: BatchSendOptions<Props>,
  recipient: BatchRecipient<Props>,
): SendOptions<Props> {
  const mergedAttachments = [...(options.attachments ?? []), ...(recipient.attachments ?? [])];
  return {
    to: recipient.to,
    props: recipient.props,
    ...(recipient.cc ? { cc: recipient.cc } : {}),
    ...(recipient.bcc ? { bcc: recipient.bcc } : {}),
    ...(mergedAttachments.length > 0 ? { attachments: mergedAttachments } : {}),
  };
}

export async function executeBatch<Props>(
  mailer: Mailer,
  template: EmailTemplate<Props>,
  options: BatchSendOptions<Props>,
): Promise<BatchSendResult<Props>> {
  const {
    recipients,
    concurrency = 5,
    delayMs = 0,
    maxPerSecond,
    onResult,
    collectResults = true,
  } = options;
  const results: BatchItemResult<Props>[] = [];
  let sent = 0;
  let failed = 0;

  if (maxPerSecond !== undefined && maxPerSecond > 0) {
    // Token-bucket: track the earliest time each slot is free.
    // `concurrency` slots rotate; each slot must wait minGapMs before reuse.
    const minGapMs = 1000 / maxPerSecond;
    const slotFreeAt: number[] = Array.from({ length: concurrency }, () => 0);
    // Preserve recipient order only when collecting; otherwise tally as results arrive.
    const ordered: BatchItemResult<Props>[] = collectResults ? new Array(recipients.length) : [];

    await Promise.all(
      recipients.map(async (recipient, idx): Promise<void> => {
        const slot = idx % concurrency;
        const now = Date.now();
        const waitMs = Math.max(0, (slotFreeAt[slot] ?? 0) - now);
        if (waitMs > 0) await delay(waitMs);
        slotFreeAt[slot] = Date.now() + minGapMs;

        let item: BatchItemResult<Props>;
        try {
          const result = await mailer.send(template, buildSendOptions(options, recipient));
          item = { to: recipient.to, props: recipient.props, result };
        } catch (err) {
          item = {
            to: recipient.to,
            props: recipient.props,
            error: err instanceof Error ? err : new Error(String(err)),
          };
        }
        if (item.error) failed++;
        else sent++;
        onResult?.(item);
        if (collectResults) ordered[idx] = item;
      }),
    );

    return { results: ordered, sent, failed };
  }

  // Chunk-based path (original behaviour)
  for (let i = 0; i < recipients.length; i += concurrency) {
    if (i > 0 && delayMs > 0) await delay(delayMs);
    const chunk = recipients.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (recipient): Promise<BatchItemResult<Props>> => {
        try {
          const result = await mailer.send(template, buildSendOptions(options, recipient));
          const item: BatchItemResult<Props> = { to: recipient.to, props: recipient.props, result };
          onResult?.(item);
          return item;
        } catch (err) {
          const item: BatchItemResult<Props> = {
            to: recipient.to,
            props: recipient.props,
            error: err instanceof Error ? err : new Error(String(err)),
          };
          onResult?.(item);
          return item;
        }
      }),
    );
    for (const item of chunkResults) {
      if (item.error) failed++;
      else sent++;
      if (collectResults) results.push(item);
    }
  }

  return { results, sent, failed };
}

export function createMailer(config: CreateMailerConfig): Mailer {
  return new MailerImpl(config);
}

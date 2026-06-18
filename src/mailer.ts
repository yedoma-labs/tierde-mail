import { htmlToPlainText } from './plain-text.js';
import { renderEmail } from './render.js';
import type {
  BatchItemResult,
  BatchSendOptions,
  BatchSendResult,
  CreateMailerConfig,
  EmailMessage,
  EmailProvider,
  EmailTemplate,
  Mailer,
  MultiProviderMailerConfig,
  SendOptions,
  SendResult,
} from './types.js';
import { normalizeAddress, normalizeAddresses, validateAttachment } from './validate.js';

function isMultiProvider(config: CreateMailerConfig): config is MultiProviderMailerConfig {
  return 'providers' in config;
}

class MailerImpl implements Mailer {
  readonly #from;
  readonly #defaultReplyTo;
  readonly #providers: EmailProvider[];
  readonly #strategy: 'failover' | 'round-robin';
  #roundRobinIndex = 0;

  constructor(config: CreateMailerConfig) {
    this.#from = normalizeAddress(config.from);
    this.#defaultReplyTo = config.defaultReplyTo
      ? normalizeAddress(config.defaultReplyTo)
      : undefined;

    if (isMultiProvider(config)) {
      if (!config.providers || config.providers.length === 0) {
        throw new Error('At least one provider is required');
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
      throw new Error('Subject line contains invalid characters');
    }
    const element = template.component(props);
    const html = renderEmail(element);
    const text = htmlToPlainText(html);

    const replyTo = options.replyTo ? normalizeAddress(options.replyTo) : this.#defaultReplyTo;

    const message: EmailMessage = {
      from: this.#from,
      to: normalizeAddresses(options.to),
      ...(options.cc ? { cc: normalizeAddresses(options.cc) } : {}),
      ...(options.bcc ? { bcc: normalizeAddresses(options.bcc) } : {}),
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
      text,
      attachments: options.attachments ?? [],
      headers: options.headers ?? {},
    };

    if (this.#strategy === 'round-robin') {
      const idx = this.#roundRobinIndex % this.#providers.length;
      this.#roundRobinIndex++;
      const provider = this.#providers[idx];
      if (!provider) throw new Error('No provider available for round-robin slot');
      return provider.send(message);
    }

    // failover: try each provider in order
    let lastError: unknown;
    for (const provider of this.#providers) {
      try {
        return await provider.send(message);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError ?? new Error('All providers failed with no error message');
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

function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function executeBatch<Props>(
  mailer: Mailer,
  template: EmailTemplate<Props>,
  options: BatchSendOptions<Props>,
): Promise<BatchSendResult<Props>> {
  const { recipients, concurrency = 5, delayMs = 0, maxPerSecond, onResult } = options;
  const results: BatchItemResult<Props>[] = [];

  if (maxPerSecond !== undefined && maxPerSecond > 0) {
    // Token-bucket: track the earliest time each slot is free.
    // `concurrency` slots rotate; each slot must wait minGapMs before reuse.
    const minGapMs = 1000 / maxPerSecond;
    const slotFreeAt: number[] = Array.from({ length: concurrency }, () => 0);
    const ordered: BatchItemResult<Props>[] = new Array(recipients.length);

    await Promise.all(
      recipients.map(async (recipient, idx): Promise<void> => {
        const slot = idx % concurrency;
        const now = Date.now();
        const waitMs = Math.max(0, (slotFreeAt[slot] ?? 0) - now);
        if (waitMs > 0) await delay(waitMs);
        slotFreeAt[slot] = Date.now() + minGapMs;

        let item: BatchItemResult<Props>;
        try {
          const result = await mailer.send(template, {
            to: recipient.to,
            props: recipient.props,
            ...(recipient.cc ? { cc: recipient.cc } : {}),
            ...(recipient.bcc ? { bcc: recipient.bcc } : {}),
          });
          item = { to: recipient.to, props: recipient.props, result };
        } catch (err) {
          item = {
            to: recipient.to,
            props: recipient.props,
            error: err instanceof Error ? err : new Error(String(err)),
          };
        }
        onResult?.(item);
        ordered[idx] = item;
      }),
    );

    return {
      results: ordered,
      sent: ordered.filter((r) => !r.error).length,
      failed: ordered.filter((r) => !!r.error).length,
    };
  }

  // Chunk-based path (original behaviour)
  for (let i = 0; i < recipients.length; i += concurrency) {
    if (i > 0 && delayMs > 0) await delay(delayMs);
    const chunk = recipients.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (recipient): Promise<BatchItemResult<Props>> => {
        try {
          const result = await mailer.send(template, {
            to: recipient.to,
            props: recipient.props,
            ...(recipient.cc ? { cc: recipient.cc } : {}),
            ...(recipient.bcc ? { bcc: recipient.bcc } : {}),
          });
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
    results.push(...chunkResults);
  }

  return {
    results,
    sent: results.filter((r) => !r.error).length,
    failed: results.filter((r) => !!r.error).length,
  };
}

export function createMailer(config: CreateMailerConfig): Mailer {
  return new MailerImpl(config);
}

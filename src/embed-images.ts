import type { Attachment, MailMiddleware } from './types.js';
import { validateAttachment } from './validate.js';

const SRC_PATTERN = /\bsrc="(https?:\/\/[^"]+)"/g;

interface FetchedImage {
  buffer: Buffer;
  contentType: string;
}

/**
 * Middleware that fetches remote images and embeds them as inline CID attachments.
 *
 * @param urls - Specific image URLs to embed. If omitted, all `http(s)://` src attributes are embedded.
 *
 * @example
 * ```ts
 * import { createMailer, embedImages } from '@yedoma-labs/tierde-mail';
 *
 * const mailer = createMailer({
 *   provider: smtp({ ... }),
 *   from: 'hello@example.com',
 *   middleware: [
 *     embedImages([
 *       'https://raw.githubusercontent.com/yedoma-labs/assets/main/resized/banner-resized.png',
 *     ]),
 *   ],
 * });
 * ```
 *
 * The HTML template can reference the image by its remote URL — the middleware replaces
 * it with `src="cid:<filename>"` and attaches the image inline.
 *
 * **Caching**: fetched images are cached for the lifetime of the middleware instance, keyed
 * by URL. In a batch send the same banner is fetched once and reused for every recipient
 * instead of re-fetched per send. The trade-off is that an image updated at its URL after the
 * first fetch is not picked up until a new mailer is created — create a fresh mailer (or call
 * `embedImages()` again) if you need to invalidate.
 *
 * **SES limitation**: `SendEmailCommand` does not support attachments. Use `SendRawEmailCommand`
 * (outside tierde-mail) if you need inline images with SES.
 *
 * **SSRF warning**: when called without a URL list, every remote `src` in the rendered HTML
 * is fetched server-side. Do not use with templates whose `src` values come from untrusted
 * user input.
 */
export function embedImages(urls?: string[]): MailMiddleware {
  const urlSet = urls ? new Set(urls) : null;
  // Cache in-flight/resolved fetches across sends so a batch fetches each image once.
  const fetchCache = new Map<string, Promise<FetchedImage>>();

  const fetchImage = (url: string): Promise<FetchedImage> => {
    const cached = fetchCache.get(url);
    if (cached) return cached;

    const promise = (async (): Promise<FetchedImage> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`embedImages: failed to fetch ${url} — HTTP ${res.status}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      const raw =
        res.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? 'image/png';
      // Only accept rasterised image types; reject active-content types (SVG, HTML) that
      // a misbehaving CDN might supply.
      const contentType =
        raw.startsWith('image/') && raw !== 'image/svg+xml' && raw !== 'image/svg'
          ? raw
          : 'image/png';
      return { buffer, contentType };
    })();

    // Drop failed fetches from the cache so a transient error can be retried on the next send.
    promise.catch(() => fetchCache.delete(url));
    fetchCache.set(url, promise);
    return promise;
  };

  return async (message) => {
    const candidates = new Set<string>();

    for (const [, src] of message.html.matchAll(SRC_PATTERN)) {
      if (src && (!urlSet || urlSet.has(src))) candidates.add(src);
    }

    if (candidates.size === 0) return message;

    const cidMap = new Map<string, string>();
    const inlineAttachments: Attachment[] = [];
    const filenameCounts = new Map<string, number>();

    const urlList = [...candidates];
    const fetched = await Promise.all(urlList.map((url) => fetchImage(url)));

    for (let i = 0; i < urlList.length; i++) {
      const url = urlList[i] as string;
      const { buffer, contentType } = fetched[i] as FetchedImage;

      const urlPath = new URL(url).pathname;
      const basename = urlPath.split('/').pop() || 'image';
      const filename = basename.includes('.')
        ? basename
        : `${basename}.${contentType.split('/')[1] ?? 'bin'}`;

      const count = filenameCounts.get(filename) ?? 0;
      filenameCounts.set(filename, count + 1);
      const cid = count === 0 ? filename : `${count}-${filename}`;

      const attachment: Attachment = { filename, content: buffer, contentType, cid };
      validateAttachment(attachment);

      cidMap.set(url, cid);
      inlineAttachments.push(attachment);
    }

    const html = message.html.replace(SRC_PATTERN, (match, src: string) => {
      const cid = cidMap.get(src);
      return cid ? `src="cid:${cid}"` : match;
    });

    return {
      ...message,
      html,
      attachments: [...(message.attachments ?? []), ...inlineAttachments],
    };
  };
}

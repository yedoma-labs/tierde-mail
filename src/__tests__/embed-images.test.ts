import { beforeEach, describe, expect, it, vi } from 'vitest';
import { embedImages } from '../embed-images.js';
import type { EmailMessage } from '../types.js';

const IMAGE_URL =
  'https://raw.githubusercontent.com/yedoma-labs/assets/main/resized/banner-resized.png';
const OTHER_URL = 'https://example.com/logo.png';

function makeMessage(html: string): EmailMessage {
  return {
    from: { email: 'sender@example.com' },
    to: { email: 'recipient@example.com' },
    subject: 'Test',
    html,
    text: 'Test',
    attachments: [],
  };
}

function mockImageFetch(url: string, bytes: Uint8Array, contentType = 'image/png') {
  vi.mocked(fetch).mockImplementationOnce(async (input) => {
    if (String(input) === url) {
      return {
        ok: true,
        arrayBuffer: async () => bytes.buffer,
        headers: { get: (h: string) => (h === 'content-type' ? contentType : null) },
      } as unknown as Response;
    }
    return {
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    } as unknown as Response;
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('embedImages', () => {
  it('fetches image and adds it as inline attachment', async () => {
    const imgBytes = new Uint8Array([1, 2, 3]);
    mockImageFetch(IMAGE_URL, imgBytes);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments).toHaveLength(1);
    expect(result.attachments![0]!.cid).toBe('banner-resized.png');
    expect(result.attachments![0]!.filename).toBe('banner-resized.png');
    expect(result.attachments![0]!.contentType).toBe('image/png');
    expect(Buffer.from(result.attachments![0]!.content as Buffer)).toEqual(Buffer.from(imgBytes));
  });

  it('rewrites src to cid reference in HTML', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const msg = makeMessage(`<img src="${IMAGE_URL}" alt="banner" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.html).toContain('src="cid:banner-resized.png"');
    expect(result.html).not.toContain(`src="${IMAGE_URL}"`);
  });

  it('embeds all remote img src when no url list given', async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(
        async () =>
          ({
            ok: true,
            arrayBuffer: async () => new Uint8Array([1]).buffer,
            headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
          }) as unknown as Response,
      )
      .mockImplementationOnce(
        async () =>
          ({
            ok: true,
            arrayBuffer: async () => new Uint8Array([2]).buffer,
            headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
          }) as unknown as Response,
      );

    const msg = makeMessage(`<img src="${IMAGE_URL}" /><img src="${OTHER_URL}" />`);
    const result = await embedImages()(msg);

    expect(result.attachments).toHaveLength(2);
    expect(result.html).toContain('src="cid:banner-resized.png"');
    expect(result.html).toContain('src="cid:logo.png"');
  });

  it('skips URLs not in the filter list', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const msg = makeMessage(`<img src="${IMAGE_URL}" /><img src="${OTHER_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments).toHaveLength(1);
    expect(result.html).toContain('src="cid:banner-resized.png"');
    expect(result.html).toContain(`src="${OTHER_URL}"`);
  });

  it('deduplicates same URL appearing multiple times in HTML', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const msg = makeMessage(`<img src="${IMAGE_URL}" /><img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments).toHaveLength(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(result.html).toBe(
      '<img src="cid:banner-resized.png" /><img src="cid:banner-resized.png" />',
    );
  });

  it('disambiguates same filename from different URLs with counter prefix', async () => {
    const url1 = 'https://cdn1.example.com/image.png';
    const url2 = 'https://cdn2.example.com/image.png';

    vi.mocked(fetch)
      .mockImplementationOnce(
        async () =>
          ({
            ok: true,
            arrayBuffer: async () => new Uint8Array([1]).buffer,
            headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
          }) as unknown as Response,
      )
      .mockImplementationOnce(
        async () =>
          ({
            ok: true,
            arrayBuffer: async () => new Uint8Array([2]).buffer,
            headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
          }) as unknown as Response,
      );

    const msg = makeMessage(`<img src="${url1}" /><img src="${url2}" />`);
    const result = await embedImages()(msg);

    const cids = result.attachments?.map((a) => a.cid) ?? [];
    // First occurrence keeps the bare filename; the second gets the counter prefix.
    expect(cids).toEqual(['image.png', '1-image.png']);
    // Each URL must rewrite to its OWN cid — a swapped mapping would show the wrong image.
    expect(result.html).toBe('<img src="cid:image.png" /><img src="cid:1-image.png" />');
  });

  it('preserves existing attachments', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const existing = { filename: 'doc.pdf', content: 'base64', contentType: 'application/pdf' };
    const msg = { ...makeMessage(`<img src="${IMAGE_URL}" />`), attachments: [existing] };
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments).toHaveLength(2);
    expect(result.attachments![0]).toBe(existing);
    expect(result.attachments![1]!.cid).toBe('banner-resized.png');
  });

  it('returns message unchanged when no matching src found', async () => {
    const msg = makeMessage('<p>No images here</p>');
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result).toBe(msg);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('throws when image fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    await expect(embedImages([IMAGE_URL])(msg)).rejects.toThrow(
      `embedImages: failed to fetch ${IMAGE_URL} — HTTP 404`,
    );
  });

  it('does not match non-http src attributes', async () => {
    const msg = makeMessage(
      '<img src="cid:existing.png" /><img src="data:image/png;base64,abc" />',
    );
    const result = await embedImages()(msg);

    expect(result).toBe(msg);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('uses content-type from response headers', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
      headers: { get: (h: string) => (h === 'content-type' ? 'image/webp' : null) },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments![0]!.contentType).toBe('image/webp');
  });

  it('falls back to image/png when server returns non-image content-type', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
      headers: { get: (h: string) => (h === 'content-type' ? 'text/html' : null) },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments![0]!.contentType).toBe('image/png');
  });

  it('falls back to image/png when server returns image/svg+xml', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
      headers: { get: (h: string) => (h === 'content-type' ? 'image/svg+xml' : null) },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments?.[0]?.contentType).toBe('image/png');
  });

  it('rejects uppercase Image/SVG+XML content-type (case-insensitive)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
      headers: { get: (h: string) => (h === 'content-type' ? 'Image/SVG+XML' : null) },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments?.[0]?.contentType).toBe('image/png');
  });

  it('derives filename extension from content-type when URL has no extension', async () => {
    const noExtUrl = 'https://cdn.example.com/avatar';
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
      headers: { get: (h: string) => (h === 'content-type' ? 'image/jpeg' : null) },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${noExtUrl}" />`);
    const result = await embedImages([noExtUrl])(msg);

    expect(result.attachments?.[0]?.filename).toBe('avatar.jpeg');
    expect(result.attachments?.[0]?.cid).toBe('avatar.jpeg');
    expect(result.html).toContain('src="cid:avatar.jpeg"');
  });

  it('falls back to image/png when content-type header is absent', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1]).buffer,
      headers: { get: () => null },
    } as unknown as Response);

    const msg = makeMessage(`<img src="${IMAGE_URL}" />`);
    const result = await embedImages([IMAGE_URL])(msg);

    expect(result.attachments?.[0]?.contentType).toBe('image/png');
  });

  it('caches fetched images across sends — fetches each URL once per instance', async () => {
    mockImageFetch(IMAGE_URL, new Uint8Array([1]));

    const middleware = embedImages([IMAGE_URL]);
    const first = await middleware(makeMessage(`<img src="${IMAGE_URL}" />`));
    const second = await middleware(makeMessage(`<img src="${IMAGE_URL}" />`));

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(first.attachments?.[0]?.cid).toBe('banner-resized.png');
    expect(second.attachments?.[0]?.cid).toBe('banner-resized.png');
  });

  it('does not cache failed fetches — retries on next send', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        arrayBuffer: async () => new ArrayBuffer(0),
        headers: { get: () => null },
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1]).buffer,
        headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
      } as unknown as Response);

    const middleware = embedImages([IMAGE_URL]);
    await expect(middleware(makeMessage(`<img src="${IMAGE_URL}" />`))).rejects.toThrow('HTTP 503');

    const retry = await middleware(makeMessage(`<img src="${IMAGE_URL}" />`));
    expect(retry.attachments?.[0]?.cid).toBe('banner-resized.png');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });
});

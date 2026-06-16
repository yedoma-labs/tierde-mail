import { describe, it, expect } from 'vitest';
import { unsubscribeHeaders } from '../unsubscribe.js';

describe('unsubscribeHeaders', () => {
  it('emits List-Unsubscribe with URL', () => {
    const headers = unsubscribeHeaders({ url: 'https://app.com/unsubscribe?token=abc' });
    expect(headers['List-Unsubscribe']).toBe('<https://app.com/unsubscribe?token=abc>');
  });

  it('emits List-Unsubscribe-Post by default (one-click)', () => {
    const headers = unsubscribeHeaders({ url: 'https://app.com/unsub' });
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
  });

  it('includes mailto when email provided', () => {
    const headers = unsubscribeHeaders({
      url: 'https://app.com/unsub',
      email: 'unsub@app.com',
    });
    expect(headers['List-Unsubscribe']).toBe('<https://app.com/unsub>, <mailto:unsub@app.com>');
  });

  it('omits List-Unsubscribe-Post when oneClick is false', () => {
    const headers = unsubscribeHeaders({ url: 'https://app.com/unsub', oneClick: false });
    expect(headers['List-Unsubscribe-Post']).toBeUndefined();
  });

  it('returns plain object suitable for spread into SendOptions.headers', () => {
    const headers = unsubscribeHeaders({ url: 'https://app.com/unsub' });
    expect(typeof headers).toBe('object');
    expect(Object.values(headers).every((v) => typeof v === 'string')).toBe(true);
  });
});

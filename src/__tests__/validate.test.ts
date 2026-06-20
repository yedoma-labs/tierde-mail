import { describe, expect, it } from 'vitest';
import {
  normalizeAddress,
  normalizeAddresses,
  validateAttachment,
  validateEmail,
} from '../validate.js';

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(() => validateEmail('user@example.com')).not.toThrow();
    expect(() => validateEmail('user+tag@sub.domain.io')).not.toThrow();
  });

  it('rejects missing @', () => {
    expect(() => validateEmail('notanemail')).toThrow(TypeError);
  });

  it('rejects missing domain', () => {
    expect(() => validateEmail('user@')).toThrow(TypeError);
  });

  it('accepts bare-hostname domain (RFC 5321 — used by Mailpit/MailHog)', () => {
    expect(() => validateEmail('user@localhost')).not.toThrow();
    expect(() => validateEmail('test@mailpit')).not.toThrow();
    expect(() => validateEmail('dev@mail')).not.toThrow();
  });

  it('rejects domain with leading/trailing dot', () => {
    expect(() => validateEmail('user@.example.com')).toThrow(TypeError);
    expect(() => validateEmail('user@example.com.')).toThrow(TypeError);
  });

  it('rejects CRLF injection in email', () => {
    expect(() => validateEmail('user\r\n@example.com')).toThrow(TypeError);
    expect(() => validateEmail('user@example.com\r\nBcc:evil@evil.com')).toThrow(TypeError);
  });

  it('rejects null byte in email', () => {
    expect(() => validateEmail('user\x00@example.com')).toThrow(TypeError);
  });

  it('rejects spaces in local/domain', () => {
    expect(() => validateEmail('user name@example.com')).toThrow(TypeError);
    expect(() => validateEmail('user@exam ple.com')).toThrow(TypeError);
  });
});

describe('normalizeAddress', () => {
  it('converts string to EmailAddress', () => {
    expect(normalizeAddress('user@example.com')).toEqual({ email: 'user@example.com' });
  });

  it('passes through object', () => {
    const addr = { email: 'user@example.com', name: 'User' };
    expect(normalizeAddress(addr)).toEqual(addr);
  });
});

describe('normalizeAddresses', () => {
  it('wraps single address in array', () => {
    expect(normalizeAddresses('a@b.com')).toHaveLength(1);
  });

  it('maps array of strings', () => {
    const result = normalizeAddresses(['a@b.com', 'c@d.com']);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ email: 'a@b.com' });
  });

  it('rejects empty array', () => {
    expect(() => normalizeAddresses([])).toThrow(TypeError);
  });
});

describe('validateAttachment', () => {
  it('accepts safe filename and allowed content type', () => {
    expect(() =>
      validateAttachment({ filename: 'file.pdf', content: '', contentType: 'application/pdf' }),
    ).not.toThrow();
  });

  it('rejects path traversal in filename', () => {
    expect(() =>
      validateAttachment({ filename: '../evil.pdf', content: '', contentType: 'application/pdf' }),
    ).toThrow(TypeError);
  });

  it('rejects absolute path in filename', () => {
    expect(() =>
      validateAttachment({ filename: '/etc/passwd', content: '', contentType: 'text/plain' }),
    ).toThrow(TypeError);
  });

  it('rejects backslash path in filename', () => {
    expect(() =>
      validateAttachment({ filename: 'foo\\bar.pdf', content: '', contentType: 'application/pdf' }),
    ).toThrow(TypeError);
  });

  it('rejects null byte in filename', () => {
    expect(() =>
      validateAttachment({ filename: 'file\x00.pdf', content: '', contentType: 'application/pdf' }),
    ).toThrow(TypeError);
  });

  it('rejects control characters in filename', () => {
    expect(() =>
      validateAttachment({ filename: 'file\x1f.pdf', content: '', contentType: 'application/pdf' }),
    ).toThrow(TypeError);
  });

  it('rejects disallowed content type', () => {
    expect(() =>
      validateAttachment({
        filename: 'script.exe',
        content: '',
        contentType: 'application/x-executable',
      }),
    ).toThrow(TypeError);
  });

  it('accepts image/* content types (avif, bmp, etc.)', () => {
    expect(() =>
      validateAttachment({ filename: 'photo.avif', content: '', contentType: 'image/avif' }),
    ).not.toThrow();
  });

  it('rejects image/svg+xml — active content', () => {
    expect(() =>
      validateAttachment({ filename: 'icon.svg', content: '', contentType: 'image/svg+xml' }),
    ).toThrow(TypeError);
  });

  it('accepts CSV attachment', () => {
    expect(() =>
      validateAttachment({ filename: 'data.csv', content: '', contentType: 'text/csv' }),
    ).not.toThrow();
  });
});

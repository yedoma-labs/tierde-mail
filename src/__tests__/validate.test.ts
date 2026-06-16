import { describe, it, expect } from 'vitest';
import { validateEmail, normalizeAddress, normalizeAddresses, validateAttachment } from '../validate.js';

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

  it('rejects domain without dot', () => {
    expect(() => validateEmail('user@localhost')).toThrow(TypeError);
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
      validateAttachment({ filename: 'script.exe', content: '', contentType: 'application/x-executable' }),
    ).toThrow(TypeError);
  });

  it('accepts image/* content types', () => {
    expect(() =>
      validateAttachment({ filename: 'photo.svg', content: '', contentType: 'image/svg+xml' }),
    ).not.toThrow();
  });

  it('accepts CSV attachment', () => {
    expect(() =>
      validateAttachment({ filename: 'data.csv', content: '', contentType: 'text/csv' }),
    ).not.toThrow();
  });
});

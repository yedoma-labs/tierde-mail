import { describe, expect, it } from 'vitest';
import {
  normalizeAddress,
  normalizeAddresses,
  validateAttachment,
  validateEmail,
} from '../validate.js';

describe('validateEmail — RFC 5321 compliance', () => {
  describe('valid addresses', () => {
    it('accepts standard dot-atom addresses', () => {
      expect(() => validateEmail('user@example.com')).not.toThrow();
      expect(() => validateEmail('user+tag@sub.domain.io')).not.toThrow();
      expect(() => validateEmail('first.last@example.co.uk')).not.toThrow();
    });

    it('accepts all RFC 5322 atext characters in local part', () => {
      // atext = ALPHA / DIGIT / !#$%&'*+/=?^_`{|}~-
      expect(() => validateEmail("!#$%&'*+/=?^_`{|}~-@example.com")).not.toThrow();
    });

    it('accepts bare-hostname domain (RFC 5321 §4.1.2 — used by Mailpit/MailHog)', () => {
      expect(() => validateEmail('user@localhost')).not.toThrow();
      expect(() => validateEmail('test@mailpit')).not.toThrow();
      expect(() => validateEmail('dev@mail')).not.toThrow();
    });

    it('accepts address literals (RFC 5321 §4.1.3)', () => {
      expect(() => validateEmail('user@[127.0.0.1]')).not.toThrow();
      expect(() => validateEmail('user@[IPv6:2001:db8::1]')).not.toThrow();
    });

    it('accepts quoted-string local parts (RFC 5321 §4.1.2)', () => {
      expect(() => validateEmail('"user name"@example.com')).not.toThrow();
      expect(() => validateEmail('"user@other"@example.com')).not.toThrow();
    });

    it('accepts numeric-only local part', () => {
      expect(() => validateEmail('123@example.com')).not.toThrow();
    });

    it('accepts single-label TLD domain (valid in SMTP)', () => {
      expect(() => validateEmail('user@com')).not.toThrow();
    });
  });

  describe('structure violations', () => {
    it('rejects non-string', () => {
      // @ts-expect-error intentional
      expect(() => validateEmail(null)).toThrow(TypeError);
      // @ts-expect-error intentional
      expect(() => validateEmail(42)).toThrow(TypeError);
    });

    it('rejects missing @', () => {
      expect(() => validateEmail('notanemail')).toThrow(TypeError);
    });

    it('rejects @ as first character (empty local part)', () => {
      expect(() => validateEmail('@example.com')).toThrow(TypeError);
    });

    it('rejects missing domain', () => {
      expect(() => validateEmail('user@')).toThrow(TypeError);
    });
  });

  describe('local part violations', () => {
    it('rejects local part exceeding 64 characters (RFC 5321 §4.5.3.1.1)', () => {
      const long = `${'a'.repeat(65)}@example.com`;
      expect(() => validateEmail(long)).toThrow(TypeError);
    });

    it('rejects leading dot in local part', () => {
      expect(() => validateEmail('.user@example.com')).toThrow(TypeError);
    });

    it('rejects trailing dot in local part', () => {
      expect(() => validateEmail('user.@example.com')).toThrow(TypeError);
    });

    it('rejects consecutive dots in local part', () => {
      expect(() => validateEmail('user..name@example.com')).toThrow(TypeError);
    });

    it('rejects spaces in local part', () => {
      expect(() => validateEmail('user name@example.com')).toThrow(TypeError);
    });

    it('rejects special characters outside atext in unquoted local part', () => {
      expect(() => validateEmail('user(comment)@example.com')).toThrow(TypeError);
      expect(() => validateEmail('user<tag>@example.com')).toThrow(TypeError);
      expect(() => validateEmail('user[bracket]@example.com')).toThrow(TypeError);
    });

    it('rejects malformed quoted local part (unclosed quote)', () => {
      expect(() => validateEmail('"unclosed@example.com')).toThrow(TypeError);
    });
  });

  describe('domain violations', () => {
    it('rejects domain exceeding 255 characters (RFC 5321 §4.5.3.1.2)', () => {
      // 63-char labels * 4 + 3 dots = 255, one more char = 256
      const long = `user@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.x`;
      expect(() => validateEmail(long)).toThrow(TypeError);
    });

    it('rejects domain with leading dot', () => {
      expect(() => validateEmail('user@.example.com')).toThrow(TypeError);
    });

    it('rejects domain with trailing dot', () => {
      expect(() => validateEmail('user@example.com.')).toThrow(TypeError);
    });

    it('rejects domain with consecutive dots', () => {
      expect(() => validateEmail('user@example..com')).toThrow(TypeError);
    });

    it('rejects domain label starting with hyphen', () => {
      expect(() => validateEmail('user@-invalid.com')).toThrow(TypeError);
    });

    it('rejects domain label ending with hyphen', () => {
      expect(() => validateEmail('user@invalid-.com')).toThrow(TypeError);
    });

    it('rejects domain label exceeding 63 characters', () => {
      const long = `user@${'a'.repeat(64)}.com`;
      expect(() => validateEmail(long)).toThrow(TypeError);
    });

    it('rejects spaces in domain', () => {
      expect(() => validateEmail('user@exam ple.com')).toThrow(TypeError);
    });
  });

  describe('header injection prevention', () => {
    it('rejects CRLF in email', () => {
      expect(() => validateEmail('user\r\n@example.com')).toThrow(TypeError);
      expect(() => validateEmail('user@example.com\r\nBcc:evil@evil.com')).toThrow(TypeError);
    });

    it('rejects null byte', () => {
      expect(() => validateEmail('user\x00@example.com')).toThrow(TypeError);
    });

    it('rejects other control characters', () => {
      expect(() => validateEmail('user\x07@example.com')).toThrow(TypeError);
      expect(() => validateEmail('user@exam\x01ple.com')).toThrow(TypeError);
    });
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

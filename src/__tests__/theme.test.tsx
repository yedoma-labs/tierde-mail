import { describe, expect, it } from 'vitest';
import { renderEmail } from '../render.js';
import { PasswordChangedConfirmation } from '../templates/PasswordChangedConfirmation.js';
import { Welcome } from '../templates/Welcome.js';
import { createTheme, darkTheme, defaultTheme } from '../theme.js';

describe('theme system', () => {
  it('createTheme merges overrides with defaultTheme', () => {
    const theme = createTheme({ primary: '#e11d48', accentBar: '#e11d48' });
    expect(theme.primary).toBe('#e11d48');
    expect(theme.accentBar).toBe('#e11d48');
    expect(theme.background).toBe(defaultTheme.background);
    expect(theme.fontFamily).toBe(defaultTheme.fontFamily);
  });

  it('defaultTheme has required shape', () => {
    expect(defaultTheme.primary).toBeTruthy();
    expect(defaultTheme.primaryText).toBeTruthy();
    expect(defaultTheme.cardBackground).toBeTruthy();
    expect(defaultTheme.borderRadius).toBeTruthy();
  });

  it('theme primary color appears in rendered button', () => {
    const theme = createTheme({ primary: '#ff0099' });
    const element = Welcome.component({
      name: 'Alice',
      loginUrl: 'https://example.com/login',
      theme,
    });
    const html = renderEmail(element);
    expect(html).toContain('#ff0099');
  });

  it('accent bar uses theme accentBar color', () => {
    const theme = createTheme({ accentBar: '#00bcd4' });
    const element = Welcome.component({
      name: 'Alice',
      loginUrl: 'https://example.com/login',
      theme,
    });
    const html = renderEmail(element);
    expect(html).toContain('#00bcd4');
  });

  it('logo renders when theme.logo is set', () => {
    const theme = createTheme({ logo: 'https://example.com/logo.png', logoAlt: 'Acme' });
    const element = Welcome.component({
      name: 'Alice',
      loginUrl: 'https://example.com/login',
      theme,
    });
    const html = renderEmail(element);
    expect(html).toContain('https://example.com/logo.png');
    expect(html).toContain('Acme');
  });

  it('no logo row when theme.logo is unset', () => {
    const element = Welcome.component({
      name: 'Alice',
      loginUrl: 'https://example.com/login',
    });
    const html = renderEmail(element);
    expect(html).not.toContain('<img');
  });

  it('dark mode media query is present in style block', () => {
    const element = Welcome.component({ name: 'Alice', loginUrl: 'https://example.com' });
    const html = renderEmail(element);
    expect(html).toContain('prefers-color-scheme');
    expect(html).toContain('tierde-card');
  });
});

// ─── Color contract tests ───────────────────────────────────────────────────
// These tests pin exact palette values. A color change that breaks design
// intent will fail here immediately — update intentionally, not accidentally.

function extractDarkMediaCSS(html: string): string {
  const re = /@media[^{]*prefers-color-scheme[^{]*:\s*dark[^{]*\{/g;
  let m: RegExpExecArray | null;
  const blocks: string[] = [];
  while ((m = re.exec(html)) !== null) {
    const start = m.index + m[0].length;
    let depth = 1,
      i = start;
    while (i < html.length && depth > 0) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') depth--;
      i++;
    }
    blocks.push(html.slice(start, i - 1));
  }
  return blocks.join('\n');
}

describe('light mode color tokens', () => {
  it('defaultTheme palette is correct', () => {
    // Primary brand — indigo-600
    expect(defaultTheme.primary).toBe('#4f46e5');
    expect(defaultTheme.accentBar).toBe('#4f46e5');
    expect(defaultTheme.primaryText).toBe('#ffffff');
    // Surfaces
    expect(defaultTheme.background).toBe('#f8fafc'); // slate-50
    expect(defaultTheme.cardBackground).toBe('#ffffff');
    // Text hierarchy (slate scale)
    expect(defaultTheme.textPrimary).toBe('#0f172a'); // slate-900
    expect(defaultTheme.textSecondary).toBe('#334155'); // slate-700
    expect(defaultTheme.textMuted).toBe('#64748b'); // slate-500
    // Border
    expect(defaultTheme.border).toBe('#e2e8f0'); // slate-200
  });

  it('KeyValueTable renders with theme.textMuted label and theme.textPrimary value', () => {
    const html = renderEmail(
      PasswordChangedConfirmation.component({
        name: 'Alice',
        securityUrl: 'https://example.com/secure',
        timestamp: 'June 16, 2026',
        location: 'Berlin',
        ipAddress: '1.2.3.4',
      }),
    );
    // Label cell uses textMuted
    expect(html).toContain(defaultTheme.textMuted);
    // Value cell uses textPrimary
    expect(html).toContain(defaultTheme.textPrimary);
    // Row border uses theme.border
    expect(html).toContain(defaultTheme.border);
  });
});

describe('dark mode color tokens', () => {
  it('darkTheme palette is correct', () => {
    // Surfaces
    expect(darkTheme.background).toBe('#0f172a'); // slate-900
    expect(darkTheme.cardBackground).toBe('#1e293b'); // slate-800
    // Primary brand — indigo-500 (brighter than light-mode indigo-600)
    expect(darkTheme.primary).toBe('#6366f1');
    expect(darkTheme.accentBar).toBe('#6366f1');
    expect(darkTheme.primaryText).toBe('#ffffff');
    // Text hierarchy (slate scale, all pass WCAG AA on cardBackground)
    expect(darkTheme.textPrimary).toBe('#f1f5f9'); // slate-100  ≥12:1 on card
    expect(darkTheme.textSecondary).toBe('#cbd5e1'); // slate-300  ≥7:1  on card
    expect(darkTheme.textMuted).toBe('#94a3b8'); // slate-400  ~4.5:1 on card
    // Border
    expect(darkTheme.border).toBe('#334155'); // slate-700
  });

  it('rendered @media dark block contains all darkTheme surface tokens', () => {
    const html = renderEmail(Welcome.component({ name: 'Alice', loginUrl: 'https://example.com' }));
    const dark = extractDarkMediaCSS(html);
    expect(dark).toContain(darkTheme.background);
    expect(dark).toContain(darkTheme.cardBackground);
    expect(dark).toContain(darkTheme.textPrimary);
    expect(dark).toContain(darkTheme.textSecondary);
    expect(dark).toContain(darkTheme.textMuted);
    expect(dark).toContain(darkTheme.border);
  });

  it('rendered @media dark block covers all tierde class hooks', () => {
    const html = renderEmail(Welcome.component({ name: 'Alice', loginUrl: 'https://example.com' }));
    const dark = extractDarkMediaCSS(html);
    const required = [
      'tierde-bg',
      'tierde-card',
      'tierde-text-primary',
      'tierde-text-secondary',
      'tierde-text-muted',
      'tierde-footer',
      'tierde-border',
      'tierde-logo-bg',
      'tierde-kv-label',
      'tierde-kv-value',
      'tierde-btn-outline',
      'tierde-btn-outline-text',
    ];
    for (const cls of required) {
      expect(dark, `dark @media missing selector: .${cls}`).toContain(cls);
    }
  });

  it('dark kv-value is more prominent than kv-label (higher perceived brightness)', () => {
    // textPrimary (#f1f5f9) should have a higher R+G+B sum than textMuted (#94a3b8)
    const parseRgbSum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return ((n >> 16) & 0xff) + ((n >> 8) & 0xff) + (n & 0xff);
    };
    expect(parseRgbSum(darkTheme.textPrimary)).toBeGreaterThan(parseRgbSum(darkTheme.textMuted));
  });

  it('dark textMuted meets WCAG AA contrast on cardBackground (~4.5:1)', () => {
    // Relative luminance via simplified sRGB
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
        .map((c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i]!, 0);
    };
    const contrast = (fg: string, bg: string) => {
      const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a) as [number, number];
      return (l1 + 0.05) / (l2 + 0.05);
    };
    expect(contrast(darkTheme.textMuted, darkTheme.cardBackground)).toBeGreaterThanOrEqual(4.4);
    expect(contrast(darkTheme.textSecondary, darkTheme.cardBackground)).toBeGreaterThanOrEqual(7);
    expect(contrast(darkTheme.textPrimary, darkTheme.cardBackground)).toBeGreaterThanOrEqual(11);
  });
});

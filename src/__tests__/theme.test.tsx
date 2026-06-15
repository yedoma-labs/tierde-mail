import { describe, it, expect } from 'vitest';
import { renderEmail } from '../render.js';
import { createTheme, defaultTheme } from '../theme.js';
import { Welcome } from '../templates/Welcome.js';

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

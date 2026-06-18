import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { ThemeContext, useTheme } from '../ThemeContext.js';
import type { Theme } from '../theme.js';
import { darkTheme, defaultTheme } from '../theme.js';

// Generated once from darkTheme tokens — change darkTheme, all @media rules update automatically.
const DARK_MEDIA_CSS = `
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
    }
    @media (prefers-color-scheme: dark) {
      .tierde-bg { background-color: ${darkTheme.background} !important; }
      .tierde-card { background-color: ${darkTheme.cardBackground} !important; }
      .tierde-text-primary { color: ${darkTheme.textPrimary} !important; }
      .tierde-text-secondary { color: ${darkTheme.textSecondary} !important; }
      .tierde-text-muted { color: ${darkTheme.textMuted} !important; }
      .tierde-footer { background-color: ${darkTheme.cardBackground} !important; border-top-color: ${darkTheme.border} !important; color: ${darkTheme.textMuted} !important; }
      .tierde-border { border-color: ${darkTheme.border} !important; }
      .tierde-logo-bg { background-color: ${darkTheme.cardBackground} !important; }
      .tierde-kv-label { color: ${darkTheme.textMuted} !important; border-bottom-color: ${darkTheme.border} !important; }
      .tierde-kv-value { color: ${darkTheme.textPrimary} !important; border-bottom-color: ${darkTheme.border} !important; }
      .tierde-btn-outline { border-color: ${darkTheme.primary} !important; }
      .tierde-btn-outline-text { color: ${darkTheme.textPrimary} !important; }
      /* Semantic colors for dark mode — use tierde-positive/tierde-negative class on colored indicators */
      .tierde-positive { color: #4ade80 !important; }
      .tierde-negative { color: #f87171 !important; }
      /* Catch-all: unclassed inline body text on the card flips to readable dark colors.
         Elements on explicit light backgrounds (code blocks, badges) use tierde-badge or tierde-code
         to opt out of this rule via :not([class]). */
      .tierde-card strong:not([class]) { color: ${darkTheme.textPrimary} !important; }
      .tierde-card p:not([class]) { color: ${darkTheme.textSecondary} !important; }
      .tierde-card td:not([class]) { color: ${darkTheme.textPrimary} !important; }
      .tierde-card a:not([class]) { color: #a5b4fc !important; }
      .tierde-card div:not([class]) { color: ${darkTheme.textSecondary} !important; }
      .tierde-card span:not([class]) { color: ${darkTheme.textSecondary} !important; }
    }
  `;

interface EmailTemplateProps {
  children: ReactNode;
  backgroundColor?: string;
  fontFamily?: string;
  preview?: string;
  lang?: string | undefined;
  dir?: 'ltr' | 'rtl' | undefined;
  theme?: Theme | undefined;
}

function EmailShell({
  children,
  backgroundColor,
  fontFamily,
  preview,
  lang,
  dir,
}: Omit<EmailTemplateProps, 'theme'>) {
  const theme = useTheme();
  const bg = backgroundColor ?? theme.background;
  const ff = fontFamily ?? theme.fontFamily;

  const bodyStyle: CSSProperties = {
    margin: '0',
    padding: '0',
    backgroundColor: bg,
    fontFamily: ff,
  };

  const outerTableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const outerTdStyle: CSSProperties = {
    padding: '20px 0',
  };

  const cardTableStyle: CSSProperties = {
    width: theme.maxWidth,
    maxWidth: '100%',
    borderCollapse: 'collapse',
    backgroundColor: theme.cardBackground,
    borderRadius: theme.borderRadius,
    overflow: 'hidden',
  };

  const accentBarStyle: CSSProperties = {
    height: '4px',
    backgroundColor: theme.accentBar,
    fontSize: '0',
    lineHeight: '0',
  };

  return (
    <html lang={lang ?? 'en'} dir={dir ?? 'ltr'}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <style>{DARK_MEDIA_CSS}</style>
      </head>
      <body style={bodyStyle} className="tierde-bg">
        {preview && (
          <div
            style={{
              display: 'none',
              fontSize: '1px',
              color: '#fefefe',
              lineHeight: '1px',
              maxHeight: '0px',
              maxWidth: '0px',
              opacity: '0',
              overflow: 'hidden',
            }}
          >
            {preview}
          </div>
        )}
        <table role="presentation" style={outerTableStyle} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td align="center" style={outerTdStyle}>
                <table
                  role="presentation"
                  className="email-container tierde-card"
                  style={cardTableStyle}
                  cellPadding="0"
                  cellSpacing="0"
                >
                  <tbody>
                    <tr>
                      <td style={accentBarStyle}>&nbsp;</td>
                    </tr>
                    {theme.logo && (
                      <tr>
                        <td
                          align="center"
                          className="tierde-logo-bg"
                          style={{
                            padding: '28px 32px 20px',
                            backgroundColor: theme.cardBackground,
                          }}
                        >
                          <img
                            src={theme.logo}
                            alt={theme.logoAlt ?? ''}
                            width={theme.logoWidth ?? 140}
                            style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                          />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td>{children}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function EmailTemplate({ theme, ...rest }: EmailTemplateProps): ReactElement {
  const resolvedTheme = theme ?? defaultTheme;
  return (
    <ThemeContext.Provider value={resolvedTheme}>
      <EmailShell {...rest} />
    </ThemeContext.Provider>
  );
}

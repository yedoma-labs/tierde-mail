import type { ReactNode, CSSProperties, ReactElement } from 'react';
import { ThemeContext, useTheme } from '../ThemeContext.js';
import type { Theme } from '../theme.js';
import { defaultTheme } from '../theme.js';

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

  const darkMode = `
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
    }
    @media (prefers-color-scheme: dark) {
      .tierde-bg { background-color: #0f172a !important; }
      .tierde-card { background-color: #1e293b !important; }
      .tierde-text-primary { color: #f1f5f9 !important; }
      .tierde-text-secondary { color: #cbd5e1 !important; }
      .tierde-text-muted { color: #94a3b8 !important; }
      .tierde-footer { background-color: #1e293b !important; border-top-color: #334155 !important; color: #94a3b8 !important; }
      .tierde-border { border-color: #334155 !important; }
      .tierde-logo-bg { background-color: #1e293b !important; }
    }
  `;

  return (
    <html lang={lang ?? 'en'} dir={dir ?? 'ltr'}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <style>{darkMode}</style>
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

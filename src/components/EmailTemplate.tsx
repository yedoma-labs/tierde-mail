import type { ReactNode, CSSProperties } from 'react';

interface EmailTemplateProps {
  children: ReactNode;
  backgroundColor?: string;
  fontFamily?: string;
  preview?: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
}

const bodyStyle: CSSProperties = {
  margin: '0',
  padding: '0',
  backgroundColor: '#f4f4f4',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const outerTdStyle: CSSProperties = {
  padding: '20px 0',
};

const innerTableStyle: CSSProperties = {
  width: '600px',
  maxWidth: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
};

export function EmailTemplate({
  children,
  backgroundColor = '#f4f4f4',
  fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  preview,
  lang = 'en',
  dir = 'ltr',
}: EmailTemplateProps) {
  return (
    <html lang={lang} dir={dir}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <style>{`
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
          }
        `}</style>
      </head>
      <body style={{ ...bodyStyle, backgroundColor, fontFamily }}>
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
        <table role="presentation" style={tableStyle} cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td align="center" style={outerTdStyle}>
                <table
                  role="presentation"
                  className="email-container"
                  style={innerTableStyle}
                  cellPadding="0"
                  cellSpacing="0"
                >
                  <tbody>
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

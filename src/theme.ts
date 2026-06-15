export interface Theme {
  primary: string;
  primaryHover: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  background: string;
  cardBackground: string;
  accentBar: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  fontFamily: string;
  borderRadius: string;
  buttonBorderRadius: string;
  maxWidth: string;
  logo?: string | undefined;
  logoAlt?: string | undefined;
  logoWidth?: number | undefined;
}

export const defaultTheme: Theme = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  primaryText: '#ffffff',
  secondary: '#f1f5f9',
  secondaryText: '#334155',
  background: '#f8fafc',
  cardBackground: '#ffffff',
  accentBar: '#4f46e5',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  border: '#e2e8f0',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  borderRadius: '12px',
  buttonBorderRadius: '8px',
  maxWidth: '600px',
};

export function createTheme(overrides: Partial<Theme>): Theme {
  return { ...defaultTheme, ...overrides };
}

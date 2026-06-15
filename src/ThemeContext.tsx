import { createContext, useContext } from 'react';
import { defaultTheme } from './theme.js';
import type { Theme } from './theme.js';

export const ThemeContext = createContext<Theme>(defaultTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

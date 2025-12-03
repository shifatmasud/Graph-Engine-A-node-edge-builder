import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

type ThemeMode = 'dark' | 'light';

export const tokens = {
  dark: {
    id: 'dark',
    surface: {
      1: '#09090b', // Zinc 950
      2: '#18181b', // Zinc 900
      3: '#27272a', // Zinc 800
    },
    content: {
      1: '#fafafa', // Zinc 50
      2: '#a1a1aa', // Zinc 400
      3: '#52525b', // Zinc 600
    },
    accent: {
      primary: '#3b82f6', // Blue 500
      glow: 'rgba(59, 130, 246, 0.5)',
      valid: '#22c55e',
      danger: '#ef4444',
    },
    border: '#27272a',
    grid: 'rgba(255, 255, 255, 0.05)',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
  },
  light: {
    id: 'light',
    surface: {
      1: '#ffffff', // White
      2: '#f4f4f5', // Zinc 100
      3: '#e4e4e7', // Zinc 200
    },
    content: {
      1: '#18181b', // Zinc 950
      2: '#52525b', // Zinc 600
      3: '#a1a1aa', // Zinc 400
    },
    accent: {
      primary: '#2563eb', // Blue 600
      glow: 'rgba(37, 99, 235, 0.3)',
      valid: '#16a34a',
      danger: '#dc2626',
    },
    border: '#e4e4e7',
    grid: 'rgba(0, 0, 0, 0.08)',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
  }
};

type ThemeTokens = typeof tokens.dark;

interface ThemeContextType {
  theme: ThemeTokens;
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const theme = tokens[mode];

  const toggle = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
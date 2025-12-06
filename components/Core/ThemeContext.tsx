import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

type ThemeMode = 'dark' | 'light';

export const tokens = {
  dark: {
    id: 'dark',
    surface: {
      '1': '#111111', // Canvas background - deeper charcoal
      '2': '#1D1D1D', // Node background - dark grey
      '3': '#2A2A2A', // Hover states - lighter grey
    },
    content: {
      '1': '#EDEDED', // Primary Text - slightly off-white
      '2': '#A0A0A0', // Secondary Text
      '3': '#444444', // Tertiary Text / Lines
    },
    accent: {
      primary: '#3399FF', // Vibrant Blue
      secondary: '#AD88FF', // Soft Purple
      glow: 'rgba(51, 153, 255, 0.4)',
      valid: '#22C55E', // Green-500
      danger: '#EF4444', // Red-500
    },
    border: 'rgba(255, 255, 255, 0.1)',
    grid: 'rgba(51, 153, 255, 0.08)',
    shadow: '0 0 24px rgba(51, 153, 255, 0.1), 0 8px 16px rgba(0,0,0,0.4)',
    space: {
      '1': '4px', '2': '8px', '3': '12px', '4': '16px', '5': '20px', '6': '24px', '8': '32px', '10': '40px', '12': '48px'
    },
    radius: {
      '1': '2px', '2': '4px', '3': '8px', '4': '12px', '5': '16px', '6': '24px', 'round': '9999px'
    },
  },
  light: {
    id: 'light',
    surface: {
      '1': '#F9F9F9', // Canvas background
      '2': '#FFFFFF', // Node background
      '3': '#F0F0F0', // Hover
    },
    content: {
      '1': '#222222', // Primary text
      '2': '#666666', // Secondary text
      '3': '#D0D0D0', // Lines/borders
    },
    accent: {
      primary: '#007AFF', // Professional Blue
      secondary: '#8A3FFC', // Purple
      glow: 'rgba(0, 122, 255, 0.2)',
      valid: '#16A34A', // Green
      danger: '#DC2626', // Red
    },
    border: '#E5E5E5',
    grid: 'rgba(0, 0, 0, 0.06)',
    shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    space: {
      '1': '4px', '2': '8px', '3': '12px', '4': '16px', '5': '20px', '6': '24px', '8': '32px', '10': '40px', '12': '48px'
    },
    radius: {
      '1': '2px', '2': '4px', '3': '8px', '4': '12px', '5': '16px', '6': '24px', 'round': '9999px'
    },
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
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedMode = window.localStorage.getItem('themeMode');
      if (storedMode === 'dark' || storedMode === 'light') {
        return storedMode;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'dark';
  });
  const theme = tokens[mode];

  const toggle = () => {
    setMode((prev) => {
      const newMode = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('themeMode', newMode);
      }
      return newMode;
    });
  };

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

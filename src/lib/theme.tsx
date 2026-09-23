import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeId = 'black' | 'dark' | 'light' | 'bw' | 'purple' | 'neon' | 'cyber';

interface ThemeColors {
  bg: string;
  bgCard: string;
  bgHover: string;
  border: string;
  borderActive: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  accentGlow: string;
  danger: string;
  warning: string;
  success: string;
  gradient: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  scanline: string;
  gridLine: string;
  orb1: string;
  orb2: string;
  orb3: string;
}

const themes: Record<ThemeId, ThemeColors> = {
  black: {
    bg: '#06060c',
    bgCard: 'rgba(255,255,255,0.02)',
    bgHover: 'rgba(52,211,153,0.03)',
    border: 'rgba(255,255,255,0.06)',
    borderActive: 'rgba(52,211,153,0.3)',
    text: '#ffffff',
    textMuted: '#9ca3af',
    textDim: '#4b5563',
    primary: '#34d399',
    primaryGlow: 'rgba(52,211,153,0.15)',
    secondary: '#22d3ee',
    accent: '#3b82f6',
    accentGlow: 'rgba(59,130,246,0.15)',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#34d399',
    gradient: 'linear-gradient(135deg, #34d399, #22d3ee, #3b82f6)',
    cardBg: 'rgba(255,255,255,0.02)',
    cardBorder: 'rgba(255,255,255,0.06)',
    cardHover: 'rgba(52,211,153,0.05)',
    inputBg: 'rgba(255,255,255,0.03)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputFocus: 'rgba(52,211,153,0.4)',
    scanline: 'rgba(52,211,153,0.015)',
    gridLine: 'rgba(52,211,153,0.03)',
    orb1: 'rgba(52,211,153,0.08)',
    orb2: 'rgba(34,211,238,0.06)',
    orb3: 'rgba(168,85,247,0.04)',
  },
  dark: {
    bg: '#0f172a',
    bgCard: 'rgba(255,255,255,0.03)',
    bgHover: 'rgba(99,102,241,0.05)',
    border: 'rgba(255,255,255,0.08)',
    borderActive: 'rgba(99,102,241,0.4)',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textDim: '#475569',
    primary: '#818cf8',
    primaryGlow: 'rgba(129,140,248,0.15)',
    secondary: '#38bdf8',
    accent: '#a78bfa',
    accentGlow: 'rgba(167,139,250,0.15)',
    danger: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',
    gradient: 'linear-gradient(135deg, #818cf8, #38bdf8, #a78bfa)',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.08)',
    cardHover: 'rgba(129,140,248,0.05)',
    inputBg: 'rgba(255,255,255,0.03)',
    inputBorder: 'rgba(255,255,255,0.1)',
    inputFocus: 'rgba(129,140,248,0.4)',
    scanline: 'rgba(129,140,248,0.012)',
    gridLine: 'rgba(129,140,248,0.03)',
    orb1: 'rgba(129,140,248,0.08)',
    orb2: 'rgba(56,189,248,0.06)',
    orb3: 'rgba(167,139,250,0.05)',
  },
  light: {
    bg: '#f8fafc',
    bgCard: 'rgba(0,0,0,0.02)',
    bgHover: 'rgba(0,0,0,0.03)',
    border: 'rgba(0,0,0,0.08)',
    borderActive: 'rgba(16,185,129,0.4)',
    text: '#0f172a',
    textMuted: '#64748b',
    textDim: '#94a3b8',
    primary: '#10b981',
    primaryGlow: 'rgba(16,185,129,0.1)',
    secondary: '#06b6d4',
    accent: '#6366f1',
    accentGlow: 'rgba(99,102,241,0.1)',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4, #6366f1)',
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.08)',
    cardHover: 'rgba(16,185,129,0.03)',
    inputBg: '#ffffff',
    inputBorder: 'rgba(0,0,0,0.12)',
    inputFocus: 'rgba(16,185,129,0.3)',
    scanline: 'rgba(0,0,0,0.02)',
    gridLine: 'rgba(0,0,0,0.03)',
    orb1: 'rgba(16,185,129,0.06)',
    orb2: 'rgba(6,182,212,0.06)',
    orb3: 'rgba(99,102,241,0.04)',
  },
  bw: {
    bg: '#111111',
    bgCard: 'rgba(255,255,255,0.03)',
    bgHover: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.1)',
    borderActive: 'rgba(255,255,255,0.4)',
    text: '#ffffff',
    textMuted: '#a3a3a3',
    textDim: '#525252',
    primary: '#ffffff',
    primaryGlow: 'rgba(255,255,255,0.1)',
    secondary: '#d4d4d4',
    accent: '#a3a3a3',
    accentGlow: 'rgba(163,163,163,0.1)',
    danger: '#ef4444',
    warning: '#fbbf24',
    success: '#ffffff',
    gradient: 'linear-gradient(135deg, #ffffff, #a3a3a3, #ffffff)',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBorder: 'rgba(255,255,255,0.1)',
    cardHover: 'rgba(255,255,255,0.06)',
    inputBg: 'rgba(255,255,255,0.03)',
    inputBorder: 'rgba(255,255,255,0.12)',
    inputFocus: 'rgba(255,255,255,0.3)',
    scanline: 'rgba(255,255,255,0.015)',
    gridLine: 'rgba(255,255,255,0.03)',
    orb1: 'rgba(255,255,255,0.04)',
    orb2: 'rgba(163,163,163,0.04)',
    orb3: 'rgba(212,212,212,0.03)',
  },
  purple: {
    bg: '#0c0614',
    bgCard: 'rgba(168,85,247,0.04)',
    bgHover: 'rgba(168,85,247,0.06)',
    border: 'rgba(168,85,247,0.12)',
    borderActive: 'rgba(168,85,247,0.4)',
    text: '#f3e8ff',
    textMuted: '#a78bfa',
    textDim: '#6b21a8',
    primary: '#a855f7',
    primaryGlow: 'rgba(168,85,247,0.2)',
    secondary: '#c084fc',
    accent: '#e879f9',
    accentGlow: 'rgba(232,121,249,0.15)',
    danger: '#f87171',
    warning: '#fbbf24',
    success: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #c084fc, #e879f9)',
    cardBg: 'rgba(168,85,247,0.04)',
    cardBorder: 'rgba(168,85,247,0.12)',
    cardHover: 'rgba(168,85,247,0.08)',
    inputBg: 'rgba(168,85,247,0.05)',
    inputBorder: 'rgba(168,85,247,0.15)',
    inputFocus: 'rgba(168,85,247,0.4)',
    scanline: 'rgba(168,85,247,0.015)',
    gridLine: 'rgba(168,85,247,0.03)',
    orb1: 'rgba(168,85,247,0.1)',
    orb2: 'rgba(232,121,249,0.06)',
    orb3: 'rgba(192,132,252,0.05)',
  },
  neon: {
    bg: '#020208',
    bgCard: 'rgba(0,255,136,0.03)',
    bgHover: 'rgba(0,255,136,0.06)',
    border: 'rgba(0,255,136,0.15)',
    borderActive: 'rgba(0,255,136,0.5)',
    text: '#e0ffe8',
    textMuted: '#00ff88',
    textDim: '#007744',
    primary: '#00ff88',
    primaryGlow: 'rgba(0,255,136,0.25)',
    secondary: '#00ffcc',
    accent: '#ff00ff',
    accentGlow: 'rgba(255,0,255,0.2)',
    danger: '#ff3366',
    warning: '#ffff00',
    success: '#00ff88',
    gradient: 'linear-gradient(135deg, #00ff88, #00ffcc, #ff00ff)',
    cardBg: 'rgba(0,255,136,0.03)',
    cardBorder: 'rgba(0,255,136,0.15)',
    cardHover: 'rgba(0,255,136,0.08)',
    inputBg: 'rgba(0,255,136,0.03)',
    inputBorder: 'rgba(0,255,136,0.2)',
    inputFocus: 'rgba(0,255,136,0.5)',
    scanline: 'rgba(0,255,136,0.02)',
    gridLine: 'rgba(0,255,136,0.04)',
    orb1: 'rgba(0,255,136,0.12)',
    orb2: 'rgba(0,255,204,0.08)',
    orb3: 'rgba(255,0,255,0.06)',
  },
  cyber: {
    bg: '#0a0e1a',
    bgCard: 'rgba(0,200,255,0.03)',
    bgHover: 'rgba(0,200,255,0.06)',
    border: 'rgba(0,200,255,0.12)',
    borderActive: 'rgba(0,200,255,0.5)',
    text: '#e0f4ff',
    textMuted: '#7ec8e3',
    textDim: '#3a6073',
    primary: '#00d4ff',
    primaryGlow: 'rgba(0,212,255,0.2)',
    secondary: '#00ffc8',
    accent: '#ff6b35',
    accentGlow: 'rgba(255,107,53,0.15)',
    danger: '#ff4757',
    warning: '#ffc312',
    success: '#00d4ff',
    gradient: 'linear-gradient(135deg, #00d4ff, #00ffc8, #ff6b35)',
    cardBg: 'rgba(0,200,255,0.03)',
    cardBorder: 'rgba(0,200,255,0.12)',
    cardHover: 'rgba(0,200,255,0.08)',
    inputBg: 'rgba(0,200,255,0.04)',
    inputBorder: 'rgba(0,200,255,0.15)',
    inputFocus: 'rgba(0,212,255,0.4)',
    scanline: 'rgba(0,200,255,0.015)',
    gridLine: 'rgba(0,200,255,0.03)',
    orb1: 'rgba(0,200,255,0.1)',
    orb2: 'rgba(0,255,200,0.06)',
    orb3: 'rgba(255,107,53,0.04)',
  },
};

interface ThemeContextType {
  theme: ThemeId;
  colors: ThemeColors;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'black',
  colors: themes.black,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem('lazydrop-theme') as ThemeId) || 'black';
  });

  function setTheme(t: ThemeId) {
    setThemeState(t);
    localStorage.setItem('lazydrop-theme', t);
  }

  useEffect(() => {
    const c = themes[theme];
    const root = document.documentElement;
    Object.entries(c).forEach(([k, v]) => {
      root.style.setProperty(`--${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`, v);
    });
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, colors: themes[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { themes };

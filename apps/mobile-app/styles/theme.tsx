import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// Lazy AsyncStorage — gracefully degrades if the package isn't yet installed.
let _AsyncStorage: { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void> } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  // Package not yet installed — theme preference will reset on each app launch.
}

// ─── Palette ─────────────────────────────────────────────────────────────────

export const LIGHT_COLORS = {
  background: '#f4f4f5', // zinc-100
  backgroundDark: '#e4e4e7', // zinc-200
  card: '#ffffff',  //white
  border: '#e4e4e7', // zinc-200
  borderLight: '#d4d4d8', // zinc-300
  primary: '#6366f1', // indigo-500
  primaryDark: '#4f46e5', // indigo-600
  text: '#09090b', // zinc-950
  textMuted: '#3f3f46', // zinc-700
  textDim: '#71717a', // zinc-500
  textDark: '#a1a1aa', // zinc-400
  success: '#10b981', // emerald-500
  successBg: '#d1fae5', // emerald-100
  successBorder: '#a7f3d0', // emerald-200
  successText: '#065f46', // emerald-800
  pending: '#8b5cf6', // purple-500
  pendingBg: '#f3e8ff', // purple-100
  pendingBorder: '#e9d5ff', // purple-200
  pendingText: '#581c87', // purple-800
  error: '#ef4444', // red-500
  errorBg: '#fee2e2', // red-100
  errorBorder: '#fca5a5', // red-300
  errorText: '#991b1b', // red-800
};

export const DARK_COLORS = {
  background: '#09090b', // zinc-950
  backgroundDark: '#030303',
  card: '#18181b', // zinc-900
  border: '#27272a', // zinc-800
  borderLight: '#3f3f46', // zinc-700
  primary: '#6366f1', // indigo-500
  primaryDark: '#4f46e5', // indigo-600
  text: '#fafafa', // zinc-50
  textMuted: '#a1a1aa', // zinc-400
  textDim: '#71717a', // zinc-500
  textDark: '#52525b', // zinc-600
  success: '#10b981', // emerald-500
  successBg: '#022c22', // emerald-950
  successBorder: '#065f46', // emerald-900
  successText: '#34d399', // emerald-300
  pending: '#8b5cf6', // purple-500
  pendingBg: '#3b0764', // purple-950
  pendingBorder: '#581c87', // purple-900
  pendingText: '#c084fc', // purple-300
  error: '#ef4444', // red-500
  errorBg: '#450a0a', // red-950
  errorBorder: '#7f1d1d', // red-900
  errorText: '#fca5a5', // red-300
};

export type ThemeColors = typeof DARK_COLORS;

// ─── Theme Mode ───────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'device';

const STORAGE_KEY = '@theme_mode';

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
  typography: ReturnType<typeof buildTypography>;
  commonStyles: ReturnType<typeof buildCommonStyles>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const deviceScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('device');

  // Load persisted preference on mount
  useEffect(() => {
    _AsyncStorage?.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'device') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    _AsyncStorage?.setItem(STORAGE_KEY, next);
  }, []);

  const isDark =
    mode === 'dark' || (mode === 'device' && deviceScheme !== 'light');
  const colors: ThemeColors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const typography = buildTypography(colors);
  const commonStyles = buildCommonStyles(colors);

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, isDark, typography, commonStyles }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}

// ─── Style Builders ───────────────────────────────────────────────────────────

function buildTypography(colors: ThemeColors) {
  return {
    title: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textDim,
      marginTop: 6,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.textMuted,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    body: {
      fontSize: 15,
      color: colors.text,
    },
    caption: {
      fontSize: 12,
      color: colors.textDim,
    },
  };
}

function buildCommonStyles(colors: ThemeColors) {
  return {
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 36,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      color: colors.text,
      fontSize: 15,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700' as const,
    },
  };
}

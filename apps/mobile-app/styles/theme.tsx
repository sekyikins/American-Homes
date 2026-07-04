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

// ─── Design Tokens ───────────────────────────────────────────────────────────
// Use these constants instead of magic numbers throughout the app.
// When adding new screens/components, always reference these tokens.

/** Standardized spacing scale (in dp). */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Standardized border-radius scale (in dp). */
export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 14,
  pill: 999,
} as const;

/** Standardized font-size scale (in sp). */
export const FONT_SIZE = {
  /** 10 — tiny labels, banner sub-labels */
  xs: 10,
  /** 11 — captions, meta info, badge text, tab labels */
  sm: 11,
  /** 12 — secondary text, descriptions, field labels */
  md: 12,
  /** 13 — body text, list item titles */
  body: 13,
  /** 14 — medium text, agent names */
  lg: 14,
  /** 15 — primary body, input text, menu titles */
  xl: 15,
  /** 17 — large numbers, greeting names */
  xxl: 17,
  /** 20 — header titles */
  title: 20,
  /** 24 — hero / page titles */
  hero: 24,
} as const;

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

// ─── Typography ───────────────────────────────────────────────────────────────
// All text styles live here. Screens should reference typography.* for text
// and only override layout props (margins, alignment) locally.

function buildTypography(colors: ThemeColors) {
  return {
    // ── Headings ──────────────────────────────────────────────────────────
    /** Large page/hero titles — 24sp bold */
    title: {
      fontSize: FONT_SIZE.hero,
      fontWeight: '700' as const,
      color: colors.text,
      letterSpacing: -0.5,
    },
    /** Header bar titles — 20sp bold */
    headerTitle: {
      fontSize: FONT_SIZE.title,
      fontWeight: '700' as const,
      color: colors.text,
    },
    /** Section headings — 15sp bold, muted color, spaced */
    sectionTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700' as const,
      color: colors.textMuted,
      marginBottom: SPACING.md,
      letterSpacing: 0.5,
    },
    /** Compact section headings — 13sp semibold (HomeScreen style) */
    sectionTitleCompact: {
      fontSize: FONT_SIZE.body,
      fontWeight: '600' as const,
      color: colors.text,
      lineHeight: 20,
      marginBottom: SPACING.sm,
    },
    /** Uppercase section headings — 11sp bold, uppercase (WalletScreen style) */
    sectionTitleUppercase: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '700' as const,
      color: colors.textMuted,
      marginBottom: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },

    // ── Body ─────────────────────────────────────────────────────────────
    /** Page subtitles — 13sp, dim, spaced below */
    subtitle: {
      fontSize: FONT_SIZE.body,
      color: colors.textDim,
      marginTop: 6,
      marginBottom: SPACING.xxl,
    },
    /** Primary body text — 15sp */
    body: {
      fontSize: FONT_SIZE.xl,
      color: colors.text,
    },
    /** Secondary body — 14sp, slightly smaller */
    bodySmall: {
      fontSize: FONT_SIZE.lg,
      color: colors.text,
    },

    // ── Captions & Labels ────────────────────────────────────────────────
    /** Standard caption — 12sp, dim */
    caption: {
      fontSize: FONT_SIZE.md,
      color: colors.textDim,
    },
    /** Tiny meta text — 11sp, dim */
    meta: {
      fontSize: FONT_SIZE.sm,
      color: colors.textDim,
    },
    /** Uppercase field labels — 12sp semibold (form fields) */
    fieldLabel: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600' as const,
      color: colors.textDim,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
      marginBottom: SPACING.sm,
    },
    /** Form input labels — 15sp semibold */
    inputLabel: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: SPACING.sm,
    },

    // ── Menu / List Text ─────────────────────────────────────────────────
    /** Menu row primary text — 15sp bold */
    menuTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700' as const,
      color: colors.text,
    },
    /** Menu row description — 12sp, dim, with line-height */
    menuDescription: {
      fontSize: FONT_SIZE.md,
      color: colors.textDim,
      marginTop: SPACING.xs,
      lineHeight: 16,
    },
    /** Menu row value — 13sp semibold, muted */
    menuValue: {
      fontSize: FONT_SIZE.body,
      color: colors.textMuted,
      fontWeight: '600' as const,
    },

    // ── Special ──────────────────────────────────────────────────────────
    /** "View All" link — 12sp, primary color */
    viewAllLink: {
      fontSize: FONT_SIZE.md,
      fontWeight: '500' as const,
      color: colors.primary,
      marginBottom: SPACING.sm,
    },
    /** Monospaced code/ID text — 12sp, dim */
    mono: {
      fontSize: FONT_SIZE.md,
      color: colors.textDim,
      fontFamily: 'monospace' as const,
    },
    /** Greeting subtitle — 11sp, dim */
    greetingSub: {
      fontSize: FONT_SIZE.sm,
      color: colors.textDim,
      lineHeight: 16,
    },
    /** Greeting name — 17sp bold */
    greetingName: {
      fontSize: FONT_SIZE.xxl,
      fontWeight: '700' as const,
      color: colors.text,
      lineHeight: 24,
    },
    /** Empty state title — 16sp bold, muted */
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.textMuted,
      textAlign: 'center' as const,
    },
    /** Empty state body — 13sp, dim */
    emptyBody: {
      fontSize: FONT_SIZE.body,
      color: colors.textDim,
      textAlign: 'center' as const,
    },
  };
}

// ─── Common Styles ────────────────────────────────────────────────────────────
// Reusable component-level styles. Screens should spread these and only
// override layout-specific props (margins, flex, positioning) locally.

function buildCommonStyles(colors: ThemeColors) {
  return {
    // ── Layout ────────────────────────────────────────────────────────────
    /** Full-screen container with theme background */
    container: {
      flex: 1 as const,
      backgroundColor: colors.background,
    },
    /** Standard ScrollView wrapper */
    scroll: {
      flex: 1 as const,
      backgroundColor: colors.background,
    },
    /** Standard scroll content padding */
    content: {
      padding: SPACING.xl,
      paddingBottom: 36,
    },
    /** Scroll content with horizontal + top padding (list screens) */
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: 36,
    },
    /** Static header area pinned above scroll (search bars, banners) */
    staticHeader: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    /** Centered loading / empty layout */
    center: {
      flex: 1 as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.background,
    },

    // ── Cards ─────────────────────────────────────────────────────────────
    /** Standard bordered card (no internal padding — add padding per use) */
    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    /** Card with standard internal padding */
    cardPadded: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      overflow: 'hidden' as const,
    },

    // ── Inputs ────────────────────────────────────────────────────────────
    /** Standard text input field */
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      color: colors.text,
      fontSize: FONT_SIZE.xl,
    },

    // ── Buttons ───────────────────────────────────────────────────────────
    /** Primary filled button */
    button: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.md,
      paddingVertical: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    /** Primary button label */
    buttonText: {
      color: '#ffffff',
      fontSize: FONT_SIZE.xl,
      fontWeight: '700' as const,
    },
    /** Disabled button state */
    buttonDisabled: {
      backgroundColor: colors.border,
    },
    /** Outlined button (sign-out, secondary actions) */
    buttonOutline: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: RADIUS.md,
      paddingVertical: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    /** Outlined button label */
    buttonOutlineText: {
      color: colors.error,
      fontSize: FONT_SIZE.xl,
      fontWeight: '700' as const,
    },

    // ── Badges ────────────────────────────────────────────────────────────
    /** Status badge container (pass backgroundColor + borderColor inline) */
    badge: {
      borderWidth: 1,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
    },
    /** Status badge text (pass color inline) */
    badgeText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '600' as const,
    },

    // ── List Items ────────────────────────────────────────────────────────
    /** Standard list row (horizontal, spaced) */
    listItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: 15,
    },
    /** Bottom border for list rows (apply conditionally) */
    listItemDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    // ── Menu Rows (Settings) ──────────────────────────────────────────────
    /** Settings-style menu row */
    menuRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: SPACING.lg,
      gap: SPACING.md,
    },
    /** Divider between menu rows */
    menuDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    /** Left side of menu row (title + description) */
    menuLeft: {
      flex: 1 as const,
    },
    /** Right side of menu row (value + chevron) */
    menuRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: SPACING.sm,
    },

    // ── Section Headers ───────────────────────────────────────────────────
    /** Row with section title and action link (e.g. "View All") */
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: SPACING.sm,
    },

    // ── Filter Tabs ───────────────────────────────────────────────────────
    /** Filter tab bar container */
    filterBar: {
      flexDirection: 'row' as const,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: SPACING.sm,
      gap: SPACING.sm,
    },
    /** Individual filter tab (inactive) */
    filterTab: {
      flex: 1 as const,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
    },
    /** Active filter tab */
    filterTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    /** Filter tab label (inactive) */
    filterText: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '600' as const,
      color: colors.textMuted,
    },
    /** Filter tab label (active) */
    filterTextActive: {
      color: '#ffffff',
    },

    // ── Avatars ───────────────────────────────────────────────────────────
    /** Standard circular avatar (60dp, ProfileScreen size) */
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    /** Small circular avatar (44dp, WalletScreen agent cards) */
    avatarSmall: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    /** Avatar initials text */
    avatarText: {
      color: colors.text,
      fontSize: FONT_SIZE.title,
      fontWeight: '700' as const,
    },
    /** Small avatar initials text */
    avatarTextSmall: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700' as const,
    },

    // ── Empty States ──────────────────────────────────────────────────────
    /** Centered empty-state wrapper */
    emptyContainer: {
      paddingVertical: 60,
      alignItems: 'center' as const,
    },
    /** Empty-state text */
    emptyText: {
      color: colors.textDim,
      fontSize: FONT_SIZE.lg,
    },

    // ── Alerts ────────────────────────────────────────────────────────────
    /** Alert/warning banner row */
    alertBanner: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: SPACING.sm,
      backgroundColor: colors.errorBg,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    },
    /** Alert banner text */
    alertText: {
      flex: 1 as const,
      fontSize: FONT_SIZE.md,
      fontWeight: '500' as const,
      color: colors.errorText,
      lineHeight: 16,
    },

    // ── Miscellaneous ─────────────────────────────────────────────────────
    /** Horizontal divider line */
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    /** Icon button container (36dp circle, bordered) */
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    /** Quick-nav chip (tag-style button) */
    chip: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: 7,
    },
    /** Quick-nav chip label */
    chipText: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    /** Quick-access icon box (32dp rounded square with tinted bg) */
    quickIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primary + '20',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    /** Status dot (8dp circle, pass backgroundColor inline) */
    statusDot: {
      width: SPACING.sm,
      height: SPACING.sm,
      borderRadius: SPACING.xs,
    },
  };
}

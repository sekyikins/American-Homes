import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

// Global styling theme
import { useTheme, ThemeMode } from '../styles/theme';

const menuItems = [
  { title: 'Offline Synchronization', description: 'Configure ledger sync frequency and local database caches.', value: 'Auto (5m)' },
  { title: 'Bluetooth Scanner Settings', description: 'Pair external hardware serial scan guns.', value: 'Disconnected' },
  { title: 'Warehouse Location', description: 'Set active dispatch and inventory hub.', value: 'Austin Hub A' },
  { title: 'App Diagnostics & Logs', description: 'Export local database state logs for support.', value: 'v1.0.4' },
];

const THEME_OPTIONS: { label: string; mode: ThemeMode }[] = [
  { label: '☀️  Light', mode: 'light' },
  { label: '🌙  Dark', mode: 'dark' },
  { label: '📱  Device', mode: 'device' },
];

interface Props {
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function ProfileScreen({ refreshing = false, onRefresh }: Props) {
  const { colors, mode, setMode } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Operator Card (Static at top) */}
      <View style={styles.staticHeader}>
        <View style={styles.operatorCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JC</Text>
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorName}>James Cole</Text>
            <Text style={styles.operatorRole}>Warehouse Operator • Lead</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Cloud Synced</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Scrollable Settings Options */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Theme Selector */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>App Theme</Text>
              <Text style={styles.menuDescription}>
                Choose light, dark, or follow the device system setting.
              </Text>
            </View>
          </View>
          <View style={styles.themeDivider} />
          <View style={styles.themeOptions}>
            {THEME_OPTIONS.map((opt, idx) => {
              const isSelected = mode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.themeOptionBtn,
                    isSelected && styles.themeOptionBtnActive,
                  ]}
                  onPress={() => setMode(opt.mode)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      isSelected && styles.themeOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings Options */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>App Preferences</Text>
        <View style={styles.card}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.menuRow,
                idx < menuItems.length - 1 && styles.menuDivider,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <View style={styles.menuRight}>
                <Text style={styles.menuValue}>{item.value}</Text>
                <ChevronRight size={18} color={colors.textDark} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Placeholder */}
        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.8}>
          <Text style={styles.signOutBtnText}>Sign Out Operator</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  staticHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  operatorRole: {
    fontSize: 13,
    color: colors.textDim,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.successText,
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  // ── Theme row ──────────────────────────────────────
  themeRow: {
    padding: 16,
  },
  themeDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  themeOptionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  themeOptionTextActive: {
    color: '#ffffff',
  },
  // ── Menu rows ─────────────────────────────────────
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  menuDescription: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 4,
    lineHeight: 16,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  signOutBtn: {
    marginTop: 28,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
});

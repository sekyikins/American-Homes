import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { ChevronRight, Sun, Moon, Smartphone } from 'lucide-react-native';

// Global styling theme
import { useTheme, ThemeMode, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import { supabase } from '../lib/supabase';
import SectionHeader from '../components/SectionHeader';
import StickyScrollView from '../components/StickyScrollView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const THEME_OPTIONS: { label: string; mode: ThemeMode; icon: any }[] = [
  { label: 'Light', mode: 'light', icon: Sun },
  { label: 'Dark', mode: 'dark', icon: Moon },
  { label: 'Device', mode: 'device', icon: Smartphone },
];

interface Props {
  refreshing?: boolean;
  onRefresh?: () => void;
  onSignOut?: () => void;
}

export default function ProfileScreen({ refreshing = false, onRefresh, onSignOut }: Props) {
  const { colors, typography, commonStyles, mode, setMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const mockData = useMockData();
  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  const currentUser = mockData?.currentUser;
  
  const handleSignOutPress = () => {
    Alert.alert(
      'Sign Out Operator',
      'Are you sure you want to sign out and lock the active operator terminal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (e) {
              // ignore
            }
            if (mockData?.signOutMockUser) {
              mockData.signOutMockUser();
            }
            if (onSignOut) {
              onSignOut();
            }
            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
          }
        }
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    return role
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const menuItems = [
    { 
      title: 'Wallet & Earnings', 
      description: 'View your commissions, base salary, and request money withdrawals.', 
      value: currentUser ? `$${currentUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '',
      onPress: () => navigation.navigate('Wallet')
    },
    { 
      title: 'Offline Synchronization', 
      description: 'Configure ledger sync frequency and local database caches.', 
      value: 'Auto (5m)',
      onPress: () => navigation.navigate('SyncCenter')
    },
    { 
      title: 'Notification Settings', 
      description: 'Choose which alerts trigger system push notifications.', 
      value: 'Enabled',
      onPress: () => navigation.navigate('NotificationSettings')
    },
    { 
      title: 'Language Selection', 
      description: 'Configure current localization language options.', 
      value: 'English',
      onPress: () => navigation.navigate('LanguageSelection')
    },
    { 
      title: 'Change Password', 
      description: 'Update current system authentication credentials.', 
      value: '',
      onPress: () => navigation.navigate('ChangePassword')
    },
    { 
      title: 'Bluetooth Scanner Settings', 
      description: 'Pair external hardware serial scan guns.', 
      value: 'Disconnected',
      onPress: () => Alert.alert('Bluetooth Scan Gun', 'Pairing feature will scan for local hardware. Ensure scan gun is in pairing mode.')
    },
    { 
      title: 'Warehouse Location', 
      description: 'Set active dispatch and inventory hub.', 
      value: 'Austin Hub A',
      onPress: () => Alert.alert('Warehouse Selection', 'Active dispatch location is locked to Austin Hub A. Contact supervisor to adjust warehouse routing.')
    },
  ];

  return (
    <View style={styles.container}>
      {/* Operator Card (Static at top) */}
      <View style={styles.staticHeader}>
        <View style={styles.operatorCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser ? getInitials(currentUser.name) : 'JC'}
            </Text>
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorName}>
              {currentUser ? currentUser.name : ' '}
            </Text>
            <Text style={styles.operatorRole}>
              {currentUser ? getRoleLabel(currentUser.role) : 'Warehouse Operator'} • Lead
            </Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Cloud Synced</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Scrollable Settings Options */}
      <StickyScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        <SectionHeader title="Appearance" variant='compact' />
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
            {THEME_OPTIONS.map((opt) => {
              const isSelected = mode === opt.mode;
              const Icon = opt.icon;
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
                  <Icon
                    size={15}
                    color={isSelected ? "#fff" : colors.textMuted}
                  />
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
        <SectionHeader title="App Preferences" variant='compact' />
        <View style={styles.card}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.menuRow,
                idx < menuItems.length - 1 && styles.menuDivider,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <View style={styles.menuRight}>
                {item.value ? <Text style={styles.menuValue}>{item.value}</Text> : null}
                <ChevronRight size={18} color={colors.textDark} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Placeholder */}
        <TouchableOpacity 
          style={styles.signOutBtn} 
          activeOpacity={0.8}
          onPress={handleSignOutPress}
        >
          <Text style={styles.signOutBtnText}>Sign Out Operator</Text>
        </TouchableOpacity>
      </StickyScrollView>
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) => StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────────
  container: { ...cs.container },
  staticHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },

  // ── Operator Card ───────────────────────────────────────────────────────────
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    ...cs.cardPadded,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  avatar: { ...cs.avatar, borderColor: colors.primary },
  avatarText: { ...cs.avatarText },
  operatorInfo: { flex: 1 },
  operatorName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  operatorRole: {
    fontSize: FONT_SIZE.body,
    color: colors.textDim,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.successBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  statusDot: {
    ...cs.statusDot,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.successText,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },

  // ── Card ────────────────────────────────────────────────────────────────────
  card: { ...cs.card, marginBottom: SPACING.xl },

  // ── Theme Selector ──────────────────────────────────────────────────────────
  themeRow: { padding: SPACING.lg },
  themeDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: SPACING.lg,
  },
  themeOptions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: colors.background,
  },
  themeOptionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  themeOptionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  themeOptionTextActive: { color: '#ffffff' },

  // ── Menu Rows ───────────────────────────────────────────────────────────────
  menuRow: { ...cs.menuRow },
  menuDivider: { ...cs.menuDivider },
  menuLeft: { ...cs.menuLeft },
  menuRight: { ...cs.menuRight },
  menuTitle: { ...typo.menuTitle },
  menuDescription: { ...typo.menuDescription },
  menuValue: { ...typo.menuValue },

  // ── Sign Out ────────────────────────────────────────────────────────────────
  signOutBtn: { ...cs.buttonOutline },
  signOutBtnText: { ...cs.buttonOutlineText },
});

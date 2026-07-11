import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import {
  CheckCircle,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import SectionHeader from '../components/SectionHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'SyncCenter'>;

export default function SyncCenterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { offlineActivities, syncActivities, resetActivities } = useMockData();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds(offlineActivities.map(a => a.id));
  }, [offlineActivities]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === offlineActivities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(offlineActivities.map(a => a.id));
    }
  };

  const handleSyncNow = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    syncActivities(selectedIds);
    setSelectedIds([]);
    setSynced(true);
    setLastSyncTime(now);
  };

  const handleResync = () => {
    resetActivities();
    setSynced(false);
    setLastSyncTime(null);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: SPACING.lg, flex: 1 },

    // All-synced state
    syncedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.successBg,
      borderWidth: 1,
      borderColor: colors.successBorder,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      gap: SPACING.md,
    },
    syncedBannerText: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '700',
      color: colors.successText,
    },
    syncedBannerSub: {
      fontSize: FONT_SIZE.md,
      color: colors.primary,
      opacity: 0.8,
    },
    syncedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.successBg,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      gap: SPACING.sm,
    },
    syncedBtnText: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700',
      color: colors.successText,
    },

    // Pending state
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      marginBottom: SPACING.xl,
    },
    summaryTitle: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    summaryText: {
      fontSize: FONT_SIZE.body,
      color: colors.textDim,
    },
    selectAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    selectAllText: {
      fontSize: FONT_SIZE.body,
      fontWeight: '600',
      color: colors.text,
    },
    activityCard: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.md,
    },
    activityContent: { flex: 1 },
    activityTitle: {
      fontSize: FONT_SIZE.lg,
      fontWeight: '700',
      color: colors.text,
    },
    activityDescription: {
      fontSize: FONT_SIZE.md,
      color: colors.textMuted,
      marginTop: SPACING.xs,
    },
    activityTimestamp: {
      fontSize: FONT_SIZE.sm,
      color: colors.textMuted,
      marginTop: SPACING.sm,
    },
    syncBtn: {
      marginTop: SPACING.lg,
      backgroundColor: colors.primary,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    syncBtnDisabled: {
      opacity: 0.4,
    },
    syncBtnText: {
      fontSize: FONT_SIZE.xl,
      fontWeight: '700',
      color: '#fff',
    },
  });

  // ── All Synced state ───────────────────────────────────────────────────────
  if (offlineActivities.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.syncedBanner}>
            <CheckCircle size={22} color={colors.successText} />
            <View>
              <Text style={styles.syncedBannerText}>All data synced</Text>
              <Text style={styles.syncedBannerSub}>
                Last sync: {lastSyncTime ? lastSyncTime : 'just now'}
              </Text>
            </View>
          </View>

          {/* Separate Demo Button to reload mock data */}
          <TouchableOpacity 
            style={{ padding: SPACING.md, alignItems: 'center' }} 
            onPress={handleResync} 
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FONT_SIZE.body }}>
              [Demo Mode] Load Sample Offline Activities
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={{padding: SPACING.lg}}>
          {/* Unclickable / Disabled All Synced button */}
          <View style={[styles.syncedBtn, { opacity: 0.5, backgroundColor: colors.border }]} pointerEvents="none">
            <CheckCircle size={18} color={colors.textDim} />
            <Text style={[styles.syncedBtnText, { color: colors.textDim }]}>All Synced</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Pending Activities state ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Offline Activities</Text>
          <Text style={styles.summaryText}>
            {offlineActivities.length} total · {selectedIds.length} selected
          </Text>
        </View>

        {/* Select All */}
        {offlineActivities.length > 0 && (
          <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.8} style={styles.selectAllRow}>
            {selectedIds.length === offlineActivities.length ? (
              <CheckSquare size={20} color={colors.primary} />
            ) : (
              <Square size={20} color={colors.textDim} />
            )}
            <Text style={styles.selectAllText}>
              {selectedIds.length === offlineActivities.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Activities */}
        <SectionHeader title="Pending Changes" variant="uppercase" />
        {offlineActivities.map(activity => (
          <TouchableOpacity
            key={activity.id}
            onPress={() => toggleSelect(activity.id)}
            activeOpacity={0.8}
            style={styles.activityCard}
          >
            <View>
              {selectedIds.includes(activity.id) ? (
                <CheckSquare size={22} color={colors.primary} />
              ) : (
                <Square size={22} color={colors.textDim} />
              )}
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {offlineActivities.length === 0 && (
          <View style={styles.syncedBanner}>
            <CheckCircle size={22} color={colors.successText} />
            <View>
              <Text style={styles.syncedBannerText}>All data synced</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{padding: SPACING.lg}}>
        {/* Sync Button */}
        {offlineActivities.length > 0 && (
          <TouchableOpacity
            style={[styles.syncBtn, selectedIds.length === 0 && styles.syncBtnDisabled]}
            onPress={handleSyncNow}
            activeOpacity={0.8}
            disabled={selectedIds.length === 0}
          >
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.syncBtnText}>Sync Now ({selectedIds.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

import React, { useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'SyncCenter'>;

interface OfflineActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'stock' | 'order' | 'scan';
}

const INITIAL_ACTIVITIES: OfflineActivity[] = [
  {
    id: '1',
    title: 'Stock Adjustment',
    description: 'Added 5 units of AirPods Pro to inventory',
    timestamp: '10:24 AM',
    type: 'stock',
  },
  {
    id: '2',
    title: 'Scan Serial Number',
    description: 'Registered serial number SN-12345 to batch B-987',
    timestamp: '10:18 AM',
    type: 'scan',
  },
  {
    id: '3',
    title: 'Order Status Update',
    description: 'Marked ORD-2024-1205 as "shipped"',
    timestamp: '10:05 AM',
    type: 'order',
  },
];

export default function SyncCenterScreen({ navigation }: Props) {
  const { colors } = useTheme();

  const [activities, setActivities] = useState<OfflineActivity[]>(INITIAL_ACTIVITIES);
  const [selectedIds, setSelectedIds] = useState<string[]>(INITIAL_ACTIVITIES.map(a => a.id));
  const [synced, setSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === activities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activities.map(a => a.id));
    }
  };

  const handleSyncNow = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setActivities([]);
    setSelectedIds([]);
    setSynced(true);
    setLastSyncTime(now);
  };

  const handleResync = () => {
    setActivities(INITIAL_ACTIVITIES);
    setSelectedIds(INITIAL_ACTIVITIES.map(a => a.id));
    setSynced(false);
    setLastSyncTime(null);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: SPACING.lg, paddingBottom: 40 },

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
      paddingVertical: SPACING.md + 2,
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
      marginBottom: 4,
    },
    summaryText: {
      fontSize: FONT_SIZE.body,
      color: colors.textDim,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.sm,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: SPACING.md,
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
      marginTop: 4,
    },
    activityTimestamp: {
      fontSize: FONT_SIZE.sm,
      color: colors.textMuted,
      marginTop: 6,
    },
    syncBtn: {
      marginTop: SPACING.lg,
      backgroundColor: colors.primary,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.md + 2,
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
  if (synced) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.syncedBanner}>
            <CheckCircle size={22} color={colors.successText} />
            <View>
              <Text style={styles.syncedBannerText}>All data synced</Text>
              <Text style={styles.syncedBannerSub}>
                Last sync: {lastSyncTime ? lastSyncTime : 'just now'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.syncedBtn} onPress={handleResync} activeOpacity={0.8}>
            <RefreshCw size={18} color={colors.successText} />
            <Text style={styles.syncedBtnText}>All Synced</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Pending Activities state ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Offline Activities</Text>
          <Text style={styles.summaryText}>
            {activities.length} total · {selectedIds.length} selected
          </Text>
        </View>

        {/* Select All */}
        <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.8} style={styles.selectAllRow}>
          {selectedIds.length === activities.length ? (
            <CheckSquare size={20} color={colors.primary} />
          ) : (
            <Square size={20} color={colors.textDim} />
          )}
          <Text style={styles.selectAllText}>
            {selectedIds.length === activities.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>

        {/* Activities */}
        <Text style={styles.sectionTitle}>Pending Changes</Text>
        {activities.map(activity => (
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

        {/* Sync Button */}
        <TouchableOpacity
          style={[styles.syncBtn, selectedIds.length === 0 && styles.syncBtnDisabled]}
          onPress={handleSyncNow}
          activeOpacity={0.8}
          disabled={selectedIds.length === 0}
        >
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.syncBtnText}>Sync Now ({selectedIds.length})</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

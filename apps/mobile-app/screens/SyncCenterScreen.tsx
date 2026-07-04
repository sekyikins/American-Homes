import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../styles/theme';
import {
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

export default function SyncCenterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  
  // Mock offline activities data
  const [activities, setActivities] = useState<OfflineActivity[]>([
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
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>(activities.map(a => a.id));

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
    alert(`Syncing ${selectedIds.length} item(s)...`);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20 },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    summaryText: {
      fontSize: 13,
      color: colors.textDim,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    activityCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    checkboxContainer: {
      marginTop: 2,
    },
    activityContent: { flex: 1 },
    activityTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    activityDescription: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    activityTimestamp: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 6,
    },
    syncBtn: {
      marginTop: 20,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    syncBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Offline Activities</Text>
          <Text style={styles.summaryText}>
            {activities.length} total • {selectedIds.length} selected
          </Text>
        </View>

        {/* Select All Toggle */}
        <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {selectedIds.length === activities.length ? (
              <CheckSquare size={20} color={colors.primary} />
            ) : (
              <Square size={20} color={colors.textDim} />
            )}
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
              {selectedIds.length === activities.length ? 'Deselect All' : 'Select All'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Activities List */}
        <Text style={styles.sectionTitle}>Pending Changes</Text>
        {activities.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => toggleSelect(activity.id)}
              activeOpacity={0.8}
            >
              {selectedIds.includes(activity.id) ? (
                <CheckSquare size={22} color={colors.primary} />
              ) : (
                <Square size={22} color={colors.textDim} />
              )}
            </TouchableOpacity>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
            </View>
          </View>
        ))}

        {/* Sync Button */}
        <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow} activeOpacity={0.8}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.syncBtnText}>Sync Now ({selectedIds.length})</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

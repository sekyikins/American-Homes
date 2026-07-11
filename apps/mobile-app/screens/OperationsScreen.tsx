import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useMockData } from '../context/MockDataContext';
import {
  ClipboardList,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  Scan,
  TrendingUp,
  ListTodo,
  RefreshCw,
  Sliders,
  DollarSign,
} from 'lucide-react-native';
import SectionHeader from '../components/SectionHeader';
import StickyScrollView from '../components/StickyScrollView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function OperationsScreen() {
  const { colors, commonStyles, typography } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { tasks, offlineActivities, shipments } = useMockData();
  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
  const activeShipmentsCount = shipments.filter(s => s.status !== 'received').length;

  const operationActions = [
    {
      title: 'Cycle Count Audit',
      description: 'Audit and count warehouse physical stock levels.',
      icon: ClipboardList,
      color: colors.primary,
      onPress: () => navigation.navigate('InventoryCount'),
    },
    {
      title: 'Receive New Stock',
      description: 'Log and scan inbound supplier shipments.',
      icon: Download,
      color: colors.success,
      onPress: () => navigation.navigate('ReceiveStock'),
    },
    {
      title: 'Manual Stock Adjust',
      description: 'Manually adjust variant inventory balances.',
      icon: Sliders,
      color: colors.pending,
      onPress: () => navigation.navigate('StockAdjust'),
    },
    {
      title: 'Barcode Scan Register',
      description: 'Register and scan product serial numbers.',
      icon: Scan,
      color: colors.primary,
      onPress: () => navigation.navigate('Scan'),
    },
    {
      title: 'Submit Damage Report',
      description: 'Report broken, defective, or unsellable stock.',
      icon: AlertTriangle,
      color: colors.error,
      onPress: () => navigation.navigate('ReportDamage'),
    },
    {
      title: 'Submit Discrepancy',
      description: 'Log mismatch between physical count and system.',
      icon: FileSpreadsheet,
      color: '#8b5cf6',
      onPress: () => navigation.navigate('DiscrepancyReport'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Operations Performance Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('TasksAndAlerts', { initialTab: 'tasks' })}
            activeOpacity={0.8}
          >
            <ListTodo size={20} color={colors.primary} />
            <Text style={styles.statVal}>{pendingTasksCount}</Text>
            <Text style={styles.statLbl}>Pending Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Shipments')}
            activeOpacity={0.8}
          >
            <TrendingUp size={20} color={colors.success} />
            <Text style={styles.statVal}>{activeShipmentsCount}</Text>
            <Text style={styles.statLbl}>Active Shipments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('SyncCenter')}
            activeOpacity={0.8}
          >
            <RefreshCw size={20} color={offlineActivities.length > 0 ? colors.error : colors.textDim} />
            <Text style={styles.statVal}>{offlineActivities.length}</Text>
            <Text style={styles.statLbl}>Offline Queue</Text>
          </TouchableOpacity>
        </View>

      <StickyScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        

        <SectionHeader title="Operational Workflows" variant="uppercase" />
        
        <View style={styles.grid}>
          {operationActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
                  <Icon size={22} color={action.color} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDesc}>{action.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Audit Log Quick Access */}
        <SectionHeader title="Operations & Control" variant="uppercase" style={{ marginTop: SPACING.xl }} />
        <View style={styles.controlCard}>
          <TouchableOpacity
            style={styles.controlRow}
            onPress={() => navigation.navigate('Reports')}
            activeOpacity={0.7}
          >
            <View style={styles.controlLeft}>
              <ClipboardList size={18} color={colors.text} />
              <View>
                <Text style={styles.controlTitle}>All Operations Reports</Text>
                <Text style={styles.controlDesc}>View historical logs of damages and discrepancies</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.controlRow}
            onPress={() => navigation.navigate('Activity')}
            activeOpacity={0.7}
          >
            <View style={styles.controlLeft}>
              <RefreshCw size={18} color={colors.text} />
              <View>
                <Text style={styles.controlTitle}>Audit Activity Trail</Text>
                <Text style={styles.controlDesc}>Real-time system action logging ledger</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </StickyScrollView>
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) =>
  StyleSheet.create({
    container: { ...cs.container },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },

    // Stats Grid
    statsRow: {
      flexDirection: 'row',
      gap: SPACING.md,
      padding: SPACING.lg,
    },
    statCard: {
      flex: 1,
      ...cs.cardPadded,
      padding: SPACING.sm,
      alignItems: 'center',
      borderColor: colors.primary,
    },
    statVal: {
      fontSize: FONT_SIZE.title,
      fontWeight: '800',
      color: colors.text,
      marginTop: SPACING.xs,
    },
    statLbl: {
      fontSize: FONT_SIZE.xs,
      color: colors.textDim,
      fontWeight: '600',
    },

    // Grid Actions
    grid: {
      gap: SPACING.sm,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      ...cs.cardPadded,
      padding: SPACING.md,
      gap: SPACING.md,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionInfo: {
      flex: 1,
    },
    actionTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '700',
      color: colors.text,
    },
    actionDesc: {
      fontSize: FONT_SIZE.sm,
      color: colors.textMuted,
    },

    // Control card
    controlCard: {
      ...cs.card,
    },
    controlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
    },
    controlLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    controlTitle: {
      fontSize: FONT_SIZE.md,
      fontWeight: '600',
      color: colors.text,
    },
    controlDesc: {
      fontSize: FONT_SIZE.sm,
      color: colors.textDim,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: SPACING.md,
    },
  });

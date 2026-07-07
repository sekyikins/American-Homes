import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Check, Calendar, Inbox, Package, ShieldAlert, CreditCard, Truck } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';

type Props = NativeStackScreenProps<RootStackParamList, 'TasksAndAlerts'>;

export default function TasksAndAlertsScreen({ route }: Props) {
  const { colors } = useTheme();
  const { tasks, toggleTaskStatus, alerts, toggleAlertReadStatus } = useMockData();
  const initialTab = route.params?.initialTab ?? 'tasks';
  const [activeTab, setActiveTab] = useState<'tasks' | 'alerts'>(initialTab);

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const openTasksCount = tasks.filter(t => t.status === 'pending').length;
  const alertsCount = alerts.length;

  const tabOptions = [
    { key: 'tasks', label: `Tasks (${openTasksCount} Open)` },
    { key: 'alerts', label: `Alerts (${alertsCount})` }
  ];

  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: colors.errorBg, border: colors.errorBorder, text: colors.error };
      case 'medium':
        return { bg: colors.pendingBg, border: colors.pendingBorder, text: colors.pending };
      default:
        return { bg: colors.primary + '20', border: colors.primary + '40', text: colors.primary };
    }
  };

  const getAlertIcon = (category: string) => {
    switch (category) {
      case 'inventory_low':
        return { icon: Package, color: colors.pending, bg: colors.pendingBg, border: colors.pendingBorder };
      case 'inventory_out':
        return { icon: ShieldAlert, color: colors.error, bg: colors.errorBg, border: colors.errorBorder };
      case 'credit':
        return { icon: CreditCard, color: colors.error, bg: colors.errorBg, border: colors.errorBorder };
      default:
        return { icon: Truck, color: colors.primary, bg: colors.primary + '20', border: colors.primary + '40' };
    }
  };

  const formatDueDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  const renderTaskItem = ({ item }: { item: typeof tasks[0] }) => {
    const isCompleted = item.status === 'completed';
    const pColors = getPriorityColors(item.priority);

    return (
      <View style={styles.taskCard}>
        <TouchableOpacity
          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
          onPress={() => toggleTaskStatus(item.id)}
          activeOpacity={0.8}
        >
          {isCompleted && <Check size={14} color="#ffffff" />}
        </TouchableOpacity>
        <View style={styles.contentBox}>
          <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.dueDateContainer}>
              <Calendar size={12} color={colors.textDim} />
              <Text style={styles.dueDateText}>Due {formatDueDate(item.due_date)}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: pColors.bg, borderColor: pColors.border }]}>
              <Text style={[styles.priorityText, { color: pColors.text }]}>{item.priority}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderAlertItem = ({ item }: { item: typeof alerts[0] }) => {
    const iconConfig = getAlertIcon(item.category);
    const IconComponent = iconConfig.icon;

    return (
      <TouchableOpacity
        style={[styles.taskCard, item.read && { opacity: 0.7 }]}
        onPress={() => toggleAlertReadStatus(item.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.alertIconBox, { backgroundColor: iconConfig.bg, borderColor: iconConfig.border }]}>
          <IconComponent size={18} color={iconConfig.color} />
        </View>
        <View style={styles.contentBox}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <Text style={styles.alertBody}>{item.body}</Text>
          <Text style={styles.alertTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Segmented Controller */}
      <FilterBar
        options={tabOptions}
        activeKey={activeTab}
        onChange={setActiveTab}
        isSegmented={true}
        style={styles.segmentedContainer}
      />

      {/* List content */}
      {activeTab === 'tasks' ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderTaskItem}
          ListEmptyComponent={
            <EmptyState icon={Inbox} title="No tasks found" />
          }
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderAlertItem}
          ListEmptyComponent={
            <EmptyState icon={Inbox} title="No alerts found" />
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentedContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  contentBox: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textDim,
    opacity: 0.7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: colors.textDim,
  },
  priorityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 14,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  alertBody: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  alertTime: {
    fontSize: 11,
    color: colors.textDark,
    marginTop: 6,
  },
});

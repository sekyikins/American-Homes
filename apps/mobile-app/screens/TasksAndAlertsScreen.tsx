import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Check, Calendar, Inbox, Package, ShieldAlert, CreditCard, Truck } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TasksAndAlerts'>;

export default function TasksAndAlertsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { tasks, toggleTaskStatus, alerts, toggleAlertReadStatus } = useMockData();
  const [activeTab, setActiveTab] = useState<'tasks' | 'alerts'>('tasks');

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const openTasksCount = tasks.filter(t => t.status === 'pending').length;
  const alertsCount = alerts.length;

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
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'tasks' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('tasks')}
          activeOpacity={0.9}
        >
          <Text style={[styles.segmentText, activeTab === 'tasks' && styles.segmentTextActive]}>
            Tasks ({openTasksCount} Open)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'alerts' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('alerts')}
          activeOpacity={0.9}
        >
          <Text style={[styles.segmentText, activeTab === 'alerts' && styles.segmentTextActive]}>
            Alerts ({alertsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List content */}
      {activeTab === 'tasks' ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderTaskItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Inbox size={48} color={colors.textDark} />
              <Text style={styles.emptyText}>No tasks found</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderAlertItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Inbox size={48} color={colors.textDark} />
              <Text style={styles.emptyText}>No alerts found</Text>
            </View>
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
    flexDirection: 'row',
    backgroundColor: colors.backgroundDark,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDim,
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '700',
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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textDim,
  },
});

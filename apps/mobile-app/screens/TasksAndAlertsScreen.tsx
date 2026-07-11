import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Check, Calendar, Inbox, Package, ShieldAlert, CreditCard, Truck, Plus, X } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';
import FilterBar from '../components/FilterBar';

type Props = NativeStackScreenProps<RootStackParamList, 'TasksAndAlerts'>;

export default function TasksAndAlertsScreen({ route }: Props) {
  const { colors } = useTheme();
  const { tasks, toggleTaskStatus, alerts, toggleAlertReadStatus, currentUser, users, addTask } = useMockData();
  const initialTab = route.params?.initialTab ?? 'tasks';
  const [activeTab, setActiveTab] = useState<'tasks' | 'alerts'>(initialTab);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState(currentUser?.id || '');

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const visibleTasks = tasks.filter(t => {
    if (t.status === 'completed') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (t.due_date < todayStr) {
        return false;
      }
    }
    return true;
  });

  const openTasksCount = visibleTasks.filter(t => t.status === 'pending').length;
  const alertsCount = alerts.length;

  const tabOptions = [
    { key: 'tasks', label: `Tasks (${openTasksCount} Open)` },
    { key: 'alerts', label: `Alerts (${alertsCount})` }
  ];

  const staffUsers = users.filter(u => ['admin', 'manager', 'agent', 'warehouse_operator'].includes(u.role));
  const isAdmin = currentUser?.role === 'admin';

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

  const handleSaveTask = () => {
    if (!taskTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a task title.');
      return;
    }
    const defaultDate = taskDueDate.trim() || new Date().toISOString().split('T')[0];
    addTask(taskTitle, taskDesc, taskPriority, defaultDate, assignedStaffId);
    
    // reset form
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskDueDate('');
    setShowCreateForm(false);
  };

  const renderTaskItem = ({ item }: { item: typeof tasks[0] }) => {
    const isCompleted = item.status === 'completed';
    const pColors = getPriorityColors(item.priority);

    // Find assignee name
    const assignee = users.find(u => u.id === item.assigned_to);

    return (
      <TouchableOpacity
        style={styles.taskCard}
        activeOpacity={0.8}
        onPress={() => toggleTaskStatus(item.id)}
      >
        <View
          style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
        >
          {isCompleted && <Check size={14} color="#ffffff" />}
        </View>
        <View style={styles.contentBox}>
          <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={[styles.taskDescText, isCompleted && { color: colors.textDim }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <View style={styles.dueDateContainer}>
              <Calendar size={12} color={colors.textDim} />
              <Text style={styles.dueDateText}>Due {formatDueDate(item.due_date)}</Text>
            </View>
            {assignee && (
              <Text style={styles.assigneeName}>Assigned to: {assignee.name}</Text>
            )}
            <View style={[styles.priorityBadge, { backgroundColor: pColors.bg, borderColor: pColors.border }]}>
              <Text style={[styles.priorityText, { color: pColors.text }]}>{item.priority}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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

  const renderListHeader = () => {
    if (!isAdmin) return null;

    if (!showCreateForm) {
      return (
        <TouchableOpacity
          style={styles.createTaskTrigger}
          onPress={() => setShowCreateForm(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={styles.createTaskTriggerText}>Assign New Task</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.createCard}>
        <View style={styles.createCardHeader}>
          <Text style={styles.createCardTitle}>Create & Assign Task</Text>
          <TouchableOpacity onPress={() => setShowCreateForm(false)}>
            <X size={18} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <TextInput
          style={styles.createInput}
          placeholder="Task title..."
          placeholderTextColor={colors.textDim}
          value={taskTitle}
          onChangeText={setTaskTitle}
        />

        {/* Description */}
        <TextInput
          style={[styles.createInput, { height: 50, textAlignVertical: 'top', marginTop: SPACING.sm }]}
          placeholder="Description (optional)..."
          placeholderTextColor={colors.textDim}
          multiline
          value={taskDesc}
          onChangeText={setTaskDesc}
        />

        {/* Due Date */}
        <TextInput
          style={[styles.createInput, { marginTop: SPACING.sm }]}
          placeholder="Due Date (e.g. YYYY-MM-DD)..."
          placeholderTextColor={colors.textDim}
          value={taskDueDate}
          onChangeText={setTaskDueDate}
        />

        {/* Priority Selector */}
        <Text style={styles.fieldLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          {(['low', 'medium', 'high'] as const).map((p) => {
            const isActive = taskPriority === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityBtn,
                  isActive && {
                    borderColor: p === 'high' ? colors.error : p === 'medium' ? colors.pending : colors.primary,
                    backgroundColor: (p === 'high' ? colors.error : p === 'medium' ? colors.pending : colors.primary) + '15',
                  },
                ]}
                onPress={() => setTaskPriority(p)}
              >
                <Text
                  style={[
                    styles.priorityBtnText,
                    isActive && {
                      color: p === 'high' ? colors.error : p === 'medium' ? colors.pending : colors.primary,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Assignee Selector */}
        <Text style={styles.fieldLabel}>Assign To</Text>
        <View style={styles.assigneeGrid}>
          {staffUsers.map((u) => {
            const isActive = assignedStaffId === u.id;
            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.assigneeBtn, isActive && styles.assigneeBtnActive]}
                onPress={() => setAssignedStaffId(u.id)}
              >
                <Text style={[styles.assigneeBtnText, isActive && styles.assigneeBtnTextActive]} numberOfLines={1}>
                  {u.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTask} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Task</Text>
        </TouchableOpacity>
      </View>
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
          data={visibleTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderTaskItem}
          ListHeaderComponent={renderListHeader}
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
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
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
    marginRight: SPACING.md,
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  contentBox: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: colors.text,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textDim,
    opacity: 0.7,
  },
  taskDescText: {
    fontSize: FONT_SIZE.md,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dueDateText: {
    fontSize: FONT_SIZE.md,
    color: colors.textDim,
  },
  assigneeName: {
    fontSize: FONT_SIZE.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  priorityBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: FONT_SIZE.xs,
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
    marginRight: SPACING.md,
  },
  alertTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.text,
  },
  alertBody: {
    fontSize: FONT_SIZE.md,
    color: colors.textMuted,
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
  alertTime: {
    fontSize: FONT_SIZE.sm,
    color: colors.textDark,
    marginTop: SPACING.xs,
  },

  // ── Admin Create Task Inline Form ───────────────────────────────────────────
  createTaskTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  createTaskTriggerText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  createCard: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  createCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  createCardTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.text,
  },
  createInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.lg,
    color: colors.text,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  priorityBtnText: {
    fontSize: FONT_SIZE.md,
    color: colors.textDim,
    textTransform: 'capitalize',
  },
  assigneeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  assigneeBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  assigneeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  assigneeBtnText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textDim,
  },
  assigneeBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#ffffff',
  },
});

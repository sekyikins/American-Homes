import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Bell, Inbox, AlertTriangle, CheckCircle, Package } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { colors, commonStyles } = useTheme();
  const { notifications, markNotificationsAsRead, markNotificationAsRead } = useMockData();
  const [refreshing, setRefreshing] = useState(false);

  const handleNotificationPress = (notification: any) => {
    // Mark this specific notification as read
    markNotificationAsRead(notification.id);

    // Deep link based on category
    if (notification.category === 'inventory') {
      navigation.navigate('TasksAndAlerts', { initialTab: 'alerts' });
    } else if (notification.category === 'orders') {
      navigation.navigate('Orders');
    } else if (notification.category === 'shipments') {
      navigation.navigate('Shipments');
    }
  };

  const styles = React.useMemo(() => createStyles(colors, commonStyles), [colors, commonStyles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setRefreshing(false);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'inventory': return <AlertTriangle size={18} color={colors.error} />;
      case 'orders': return <CheckCircle size={18} color={colors.success} />;
      case 'shipments': return <Package size={18} color={colors.primary} />;
      default: return <Bell size={18} color={colors.textDim} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.actionHeader}>
        <Text style={styles.unreadCount}>
          {unreadCount} Unread Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markNotificationsAsRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === notifications.length - 1;
          return (
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
              style={[
                styles.row,
                isFirst && styles.rowFirst,
                isLast && styles.rowLast,
                !isLast && styles.rowDivider,
                !item.read && styles.rowUnread,
              ]}
            >
              <View>{getIcon(item.category)}</View>
              <View style={styles.bodyBox}>
                <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState icon={Inbox} title="No notifications" message="Your notification inbox is clean!" />
        }
      />
    </View>
  );
}

const createStyles = (colors: any, cs: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  unreadCount: { fontSize: FONT_SIZE.body, fontWeight: '700', color: colors.textMuted },
  markReadText: { fontSize: FONT_SIZE.body, fontWeight: '600', color: colors.primary },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  row: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: colors.card,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg },
  rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowUnread: { backgroundColor: colors.primary + '0a' },
  bodyBox: { flex: 1 },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: colors.textDim },
  titleUnread: { color: colors.text, fontWeight: '700' },
  body: { fontSize: FONT_SIZE.body, color: colors.textMuted, marginTop: SPACING.xs, lineHeight: 18 },
  time: { fontSize: FONT_SIZE.sm, color: colors.textDark, marginTop: SPACING.sm },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, alignSelf: 'center' },
});

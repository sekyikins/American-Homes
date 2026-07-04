import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Bell, Inbox, AlertTriangle, CheckCircle, Package } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { colors, typography } = useTheme();
  const { notifications, markNotificationsAsRead } = useMockData();
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    actionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 10,
    },
    unreadCount: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
    markReadText: { fontSize: 13, fontWeight: '600', color: colors.primary },
    listContent: { paddingHorizontal: 16, paddingBottom: 30 },
    row: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.card,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
      alignItems: 'flex-start',
      gap: 12,
    },
    rowFirst: { borderTopWidth: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowUnread: { backgroundColor: colors.primary + '0a' },
    iconBox: { marginTop: 2 },
    bodyBox: { flex: 1 },
    title: { fontSize: 14, fontWeight: '600', color: colors.textDim },
    titleUnread: { color: colors.text, fontWeight: '700' },
    body: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
    time: { fontSize: 11, color: colors.textDark, marginTop: 6 },
    unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, alignSelf: 'center' },
    empty: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
    emptyText: { fontSize: 14, color: colors.textDim },
  });

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
            <View
              style={[
                styles.row,
                isFirst && styles.rowFirst,
                isLast && styles.rowLast,
                !isLast && styles.rowDivider,
                !item.read && styles.rowUnread,
              ]}
            >
              <View style={styles.iconBox}>{getIcon(item.category)}</View>
              <View style={styles.bodyBox}>
                <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Inbox size={48} color={colors.textDark} />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
    </View>
  );
}

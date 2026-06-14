import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const menuItems = [
  { title: 'Offline Synchronization', description: 'Configure ledger sync frequency and local database caches.', value: 'Auto (5m)' },
  { title: 'Bluetooth Scanner Settings', description: 'Pair external hardware serial scan guns.', value: 'Disconnected' },
  { title: 'Warehouse Location', description: 'Set active dispatch and inventory hub.', value: 'Austin Hub A' },
  { title: 'App Diagnostics & Logs', description: 'Export local database state logs for support.', value: 'v1.0.4' },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.pageSubtitle}>Configure device preferences and active operators.</Text>

      {/* Operator Card */}
      <View style={styles.operatorCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JC</Text>
        </View>
        <View style={styles.operatorInfo}>
          <Text style={styles.operatorName}>James Cole</Text>
          <Text style={styles.operatorRole}>Warehouse Operator • Lead</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Cloud Synced</Text>
          </View>
        </View>
      </View>

      {/* Settings Options */}
      <Text style={styles.sectionTitle}>App Preferences</Text>
      <View style={styles.card}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.menuRow,
              idx < menuItems.length - 1 && styles.menuDivider,
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>{item.value}</Text>
              <Text style={styles.arrowIcon}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out Placeholder */}
      <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.8}>
        <Text style={styles.signOutBtnText}>Sign Out Operator</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fafafa',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 6,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a1a1aa',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 28,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  avatarText: {
    color: '#fafafa',
    fontSize: 20,
    fontWeight: '700',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fafafa',
  },
  operatorRole: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#022c22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#065f46',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  menuLeft: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fafafa',
  },
  menuDescription: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
    lineHeight: 16,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 13,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  arrowIcon: {
    color: '#52525b',
    fontSize: 20,
    fontWeight: '600',
  },
  signOutBtn: {
    marginTop: 28,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
});

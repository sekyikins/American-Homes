import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { FileWarning, Hammer, AlertTriangle } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

type TabType = 'discrepancy' | 'damage' | 'shipment';

export default function ReportsScreen({ navigation }: Props) {
  const { colors, commonStyles, typography } = useTheme();
  const { discrepancyReports, damageReports, shipmentReports, products, shipments } = useMockData();
  const [activeTab, setActiveTab] = useState<TabType>('discrepancy');

  const styles = React.useMemo(() => createStyles(colors, commonStyles, typography), [colors, commonStyles, typography]);

  return (
    <View style={styles.container}>
      {/* Quick Actions Grid */}
      <SectionHeader title="Make A Report" variant="uppercase" />
      <View style={styles.grid}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('DiscrepancyReport')}
        >
          <FileWarning size={24} color={colors.pending} />
          <Text style={styles.actionCardText}>Discrepancy</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
            onPress={() => navigation.navigate('ReportDamage')}
          >
            <Hammer size={24} color={colors.error} />
            <Text style={styles.actionCardText}>Damage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ReportShipment')}
          >
            <AlertTriangle size={24} color={colors.primary} />
            <Text style={styles.actionCardText}>Shipment</Text>
          </TouchableOpacity>
        </View>

        {/* Tab selector for logs */}
        <SectionHeader title="Recent Submissions Log" variant="uppercase" />
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'discrepancy' && styles.tabBtnActive]}
            onPress={() => setActiveTab('discrepancy')}
          >
            <Text style={[styles.tabText, activeTab === 'discrepancy' && styles.tabTextActive]}>Discrepancy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'damage' && styles.tabBtnActive]}
            onPress={() => setActiveTab('damage')}
          >
            <Text style={[styles.tabText, activeTab === 'damage' && styles.tabTextActive]}>Damage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'shipment' && styles.tabBtnActive]}
            onPress={() => setActiveTab('shipment')}
          >
            <Text style={[styles.tabText, activeTab === 'shipment' && styles.tabTextActive]}>Shipment</Text>
          </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Report List */}
        <View style={styles.list}>
          {activeTab === 'discrepancy' && (
            discrepancyReports.length === 0 ? (
              <EmptyState title="No discrepancy reports logged" />
            ) : (
              discrepancyReports.map(item => {
                const prod = products.find(p => p.id === item.product_id);
                return (
                  <View key={item.id} style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportTitle}>{prod ? prod.name : 'Unknown Product'}</Text>
                      <Text style={styles.reportDate}>
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={[styles.reportDesc, { marginBottom: SPACING.xs, fontWeight: '700', color: colors.error }]}>
                      Expected: {item.expected_qty}  •  Physical: {item.actual_qty} ({item.actual_qty - item.expected_qty > 0 ? '+' : ''}{item.actual_qty - item.expected_qty})
                    </Text>
                    <Text style={styles.reportDesc}>{item.notes}</Text>
                  </View>
                );
              })
            )
          )}

          {activeTab === 'damage' && (
            damageReports.length === 0 ? (
              <EmptyState title="No damage reports logged" />
            ) : (
              damageReports.map(item => {
                const prod = products.find(p => p.id === item.product_id);
                return (
                  <View key={item.id} style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportTitle}>{prod ? prod.name : 'Unknown Product'}</Text>
                      <Text style={styles.reportDate}>
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={[styles.reportDesc, { marginBottom: SPACING.xs, fontWeight: '700', color: colors.error }]}>
                      Severity: {item.severity} {item.serial_number ? ` •  Serial: ${item.serial_number}` : ''}
                    </Text>
                    <Text style={styles.reportDesc}>{item.description}</Text>
                  </View>
                );
              })
            )
          )}

          {activeTab === 'shipment' && (
            shipmentReports.length === 0 ? (
              <EmptyState title="No shipment reports logged" />
            ) : (
              shipmentReports.map(item => {
                const shp = shipments.find(s => s.id === item.shipment_id);
                return (
                  <View key={item.id} style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportTitle}>{shp ? shp.shipment_code : 'Unknown Shipment'}</Text>
                      <Text style={styles.reportDate}>
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={[styles.reportDesc, { marginBottom: SPACING.xs, fontWeight: '700', color: colors.primary }]}>
                      Category: {item.issue_type}
                    </Text>
                    <Text style={styles.reportDesc}>{item.description}</Text>
                  </View>
                );
              })
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, cs: any, typo: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: SPACING.lg },
  scroll: { flex: 1 },
  content: {},
  grid: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.text, marginTop: SPACING.sm, textAlign: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderRadius: RADIUS.md, borderBottomColor: colors.border, overflow: 'hidden', marginBottom: SPACING.md },
  tabBtn: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: FONT_SIZE.body, fontWeight: '600', color: colors.textDim },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  list: { flex: 1 },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  reportTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text },
  reportDate: { fontSize: FONT_SIZE.sm, color: colors.textDim },
  reportDesc: { fontSize: FONT_SIZE.body, color: colors.textMuted },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useTheme } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { FileText, FileWarning, Hammer, AlertTriangle, ChevronRight, Calendar } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

type TabType = 'discrepancy' | 'damage' | 'shipment';

export default function ReportsScreen({ navigation }: Props) {
  const { colors, typography } = useTheme();
  const { discrepancyReports, damageReports, shipmentReports, products, shipments } = useMockData();
  const [activeTab, setActiveTab] = useState<TabType>('discrepancy');

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    grid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    actionCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionCardText: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 8, textAlign: 'center' },
    tabBar: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 12 },
    tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: colors.textDim },
    tabTextActive: { color: colors.primary, fontWeight: '700' },
    list: { flex: 1 },
    reportCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 10,
    },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reportTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    reportDate: { fontSize: 11, color: colors.textDim },
    reportDesc: { fontSize: 13, color: colors.textMuted },
    emptyText: { textAlign: 'center', color: colors.textDim, marginTop: 30, fontSize: 14 },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Quick Actions Grid */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Log Operations Report
        </Text>
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
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Recent Submissions Log
        </Text>
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

        {/* Report List */}
        <View style={styles.list}>
          {activeTab === 'discrepancy' && (
            discrepancyReports.length === 0 ? (
              <Text style={styles.emptyText}>No discrepancy reports logged</Text>
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
                    <Text style={[styles.reportDesc, { marginBottom: 6, fontWeight: '700', color: colors.error }]}>
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
              <Text style={styles.emptyText}>No damage reports logged</Text>
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
                    <Text style={[styles.reportDesc, { marginBottom: 6, fontWeight: '700', color: colors.error }]}>
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
              <Text style={styles.emptyText}>No shipment reports logged</Text>
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
                    <Text style={[styles.reportDesc, { marginBottom: 6, fontWeight: '700', color: colors.primary }]}>
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

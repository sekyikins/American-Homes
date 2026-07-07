import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme, SPACING, RADIUS, FONT_SIZE } from '../styles/theme';
import { useMockData } from '../context/MockDataContext';
import { Package, MapPin, DollarSign, Calendar, Truck, ArrowRight, PackageOpen, AlertTriangle } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import SectionHeader from '../components/SectionHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

type Props = NativeStackScreenProps<RootStackParamList, 'ShipmentDetail'>;

export default function ShipmentDetailScreen({ route, navigation }: Props) {
  const { colors, typography, commonStyles } = useTheme();
  const { shipments, batches, products } = useMockData();
  const { shipmentId } = route.params;

  const shipment = shipments.find((s) => s.id === shipmentId);

  // Shipment items based on inventory batches associated with this shipment
  const shipmentBatches = batches.filter((b) => b.shipment_id === shipmentId);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      marginBottom: 16,
    },
    row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
    rowText: { fontSize: 14, color: colors.textMuted, marginLeft: 8 },
    rowValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginLeft: 'auto' },
    
    // Timeline Styles
    timeline: { marginBottom: 12 },
    timelineItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    timelineText: { fontSize: 13, color: colors.textDim, flex: 1 },
    timelineTextActive: { color: colors.primary, fontWeight: '700' },
    timelineLine: { width: 2, height: 16, backgroundColor: colors.border, marginLeft: 9, marginVertical: 2 },
    timelineCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    timelineCircleActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },

    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
    itemQty: { fontSize: 13, color: colors.textDim, marginTop: 2 },
    itemCost: { fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 12 },
    
    actionsContainer: { flexDirection: 'row', gap: 12, marginTop: 10 },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1,
      gap: 6,
    },
    actionBtnText: { fontSize: 14, fontWeight: '700' },
    emptyText: { textAlign: 'center', color: colors.textDim, marginTop: 24, fontSize: 14 },
  });

  if (!shipment) {
    return (
      <View style={styles.container}>
        <EmptyState title="Shipment not found" />
      </View>
    );
  }
  
  const stepIndex = shipment.status === 'received' ? 3 : shipment.status === 'in_transit' ? 2 : 1;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <SectionHeader title="Overview" variant="uppercase" />
        <View style={styles.card}>
          <View style={styles.row}>
            <MapPin size={16} color={colors.textDim} />
            <Text style={styles.rowText}>Supplier Origin</Text>
            <Text style={styles.rowValue}>{shipment.supplier_country}</Text>
          </View>
          <View style={styles.row}>
            <Calendar size={16} color={colors.textDim} />
            <Text style={styles.rowText}>Arrival Date</Text>
            <Text style={styles.rowValue}>{shipment.arrival_date || 'TBD'}</Text>
          </View>
          <View style={styles.row}>
            <DollarSign size={16} color={colors.textDim} />
            <Text style={styles.rowText}>Total Cost</Text>
            <Text style={styles.rowValue}>${shipment.total_cost.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Package size={16} color={colors.textDim} />
            <Text style={styles.rowText}>Status</Text>
            <StatusBadge status={shipment.status} style={{ marginLeft: 'auto' }} />
          </View>
        </View>

        {/* Timeline Status */}
        <SectionHeader title="Tracking Progress" variant="uppercase" />
        
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={[styles.timelineCircle, stepIndex >= 1 && styles.timelineCircleActive]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stepIndex >= 1 ? colors.primary : 'transparent' }} />
            </View>
            <Text style={[styles.timelineText, stepIndex >= 1 && styles.timelineTextActive]}>Shipment Registered</Text>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineItem}>
            <View style={[styles.timelineCircle, stepIndex >= 2 && styles.timelineCircleActive]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stepIndex >= 2 ? colors.primary : 'transparent' }} />
            </View>
            <Text style={[styles.timelineText, stepIndex >= 2 && styles.timelineTextActive]}>In Transit</Text>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineItem}>
            <View style={[styles.timelineCircle, stepIndex >= 3 && styles.timelineCircleActive]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stepIndex >= 3 ? colors.primary : 'transparent' }} />
            </View>
            <Text style={[styles.timelineText, stepIndex >= 3 && styles.timelineTextActive]}>Received & Stocked</Text>
          </View>
        </View>

        {/* Shipment Items */}
        <SectionHeader title={`Products Received (${shipmentBatches.length})`} variant="uppercase" />
        <View style={styles.card}>
          {shipmentBatches.length === 0 ? (
            <EmptyState message="No inventory batches loaded yet." style={{ paddingVertical: SPACING.md }} />
          ) : (
            shipmentBatches.map((item) => {
              const prod = products.find((p) => p.id === item.product_id);
              return (
                <View key={item.id} style={styles.itemRow}>
                  <PackageOpen size={18} color={colors.textDim} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{prod ? prod.name : 'Unknown Product'}</Text>
                    <Text style={styles.itemQty}>
                      Qty: {item.quantity_received} units  •  Remaining: {item.remaining_quantity}
                    </Text>
                  </View>
                  <Text style={styles.itemCost}>${(item.quantity_received * item.cost_price).toLocaleString()}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {shipment.status !== 'received' && (
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => navigation.navigate('ReceiveStock', { shipmentId: shipment.id })}
              activeOpacity={0.8}
            >
              <Truck size={18} color="#ffffff" />
              <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Stock Items</Text>
              <ArrowRight size={16} color="#ffffff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: colors.error }]}
            onPress={() => navigation.navigate('ReportShipment', { shipmentId: shipment.id })}
            activeOpacity={0.8}
          >
            <AlertTriangle size={18} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ServiceItem } from '../context/ServiceContext';

interface ServiceCardProps {
  service: ServiceItem;
  onEdit?: (service: ServiceItem) => void;
  onDelete?: (serviceId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
}) => {
  const totalPartsAmount = service.parts.reduce((sum, part) => sum + part.totalPrice, 0);
  const totalLaborAmount = service.labor.reduce((sum, labor) => sum + labor.totalPrice, 0);
  const totalAmount = totalPartsAmount + totalLaborAmount;

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactCategory}>{service.category}</Text>
          <Text style={styles.compactTotal}>{formatCurrency(totalAmount)}</Text>
        </View>
        <Text style={styles.compactDescription} numberOfLines={2}>
          {service.description}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{service.category}</Text>
        </View>
        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit?.(service)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete?.(service.id)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.description}>{service.description}</Text>

      {/* Parts Section */}
      {service.parts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parts</Text>
          {service.parts.map((part) => (
            <View key={part.id} style={styles.lineItem}>
              <View style={styles.lineItemInfo}>
                <Text style={styles.lineItemName}>{part.name}</Text>
                {part.partNumber && (
                  <Text style={styles.lineItemMeta}>#{part.partNumber}</Text>
                )}
              </View>
              <View style={styles.lineItemPricing}>
                <Text style={styles.lineItemQuantity}>x{part.quantity}</Text>
                <Text style={styles.lineItemPrice}>
                  {formatCurrency(part.totalPrice)}
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Parts Subtotal</Text>
            <Text style={styles.subtotalAmount}>
              {formatCurrency(totalPartsAmount)}
            </Text>
          </View>
        </View>
      )}

      {/* Labor Section */}
      {service.labor.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Labor</Text>
          {service.labor.map((labor) => (
            <View key={labor.id} style={styles.lineItem}>
              <View style={styles.lineItemInfo}>
                <Text style={styles.lineItemName}>{labor.description}</Text>
                <Text style={styles.lineItemMeta}>
                  {labor.hours}h @ {formatCurrency(labor.rate)}/hr
                </Text>
              </View>
              <Text style={styles.lineItemPrice}>
                {formatCurrency(labor.totalPrice)}
              </Text>
            </View>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Labor Subtotal</Text>
            <Text style={styles.subtotalAmount}>
              {formatCurrency(totalLaborAmount)}
            </Text>
          </View>
        </View>
      )}

      {/* Notes */}
      {service.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{service.notes}</Text>
        </View>
      )}

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Service Total</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
    textTransform: 'uppercase',
  },
  compactTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  compactDescription: {
    fontSize: 14,
    color: '#4B5563',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 14,
    color: '#1F2937',
  },
  lineItemMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  lineItemPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineItemQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  lineItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 70,
    textAlign: 'right',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  subtotalLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  subtotalAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  notesSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#1E3A8A',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
});

export default ServiceCard;

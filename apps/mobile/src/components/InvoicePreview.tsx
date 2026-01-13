import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ServiceSession } from '../context/ServiceContext';

interface InvoicePreviewProps {
  session: ServiceSession;
  shopName?: string;
  mechanicName?: string;
  onConfirm?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  session,
  shopName = 'MotorAI',
  mechanicName,
  onConfirm,
  onEdit,
  showActions = true,
}) => {
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Calculate totals
  const partsTotal = session.services.reduce(
    (total, service) =>
      total + service.parts.reduce((sum, part) => sum + part.totalPrice, 0),
    0
  );

  const laborTotal = session.services.reduce(
    (total, service) =>
      total + service.labor.reduce((sum, labor) => sum + labor.totalPrice, 0),
    0
  );

  const subtotal = partsTotal + laborTotal;
  const taxRate = 0.0825; // 8.25% tax
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.shopName}>{shopName}</Text>
          <Text style={styles.invoiceTitle}>SERVICE INVOICE</Text>
          <Text style={styles.invoiceDate}>{formatDate(session.createdAt)}</Text>
          {session.id && (
            <Text style={styles.invoiceNumber}>Invoice #{session.id.slice(-8).toUpperCase()}</Text>
          )}
        </View>

        {/* Customer & Vehicle Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>BILL TO</Text>
            {session.customer && (
              <>
                <Text style={styles.infoText}>{session.customer.name}</Text>
                {session.customer.email && (
                  <Text style={styles.infoSubtext}>{session.customer.email}</Text>
                )}
                {session.customer.phone && (
                  <Text style={styles.infoSubtext}>{session.customer.phone}</Text>
                )}
              </>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>VEHICLE</Text>
            {session.vehicle && (
              <>
                <Text style={styles.infoText}>
                  {session.vehicle.year} {session.vehicle.make} {session.vehicle.model}
                </Text>
                <Text style={styles.infoSubtext}>VIN: {session.vehicle.vin}</Text>
                {session.vehicle.licensePlate && (
                  <Text style={styles.infoSubtext}>
                    Plate: {session.vehicle.licensePlate}
                  </Text>
                )}
                {session.vehicle.mileage && (
                  <Text style={styles.infoSubtext}>
                    Mileage: {session.vehicle.mileage.toLocaleString()} mi
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>SERVICES PERFORMED</Text>

          {session.services.map((service, index) => (
            <View key={service.id} style={styles.serviceBlock}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceNumber}>{index + 1}.</Text>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.description}</Text>
                  <Text style={styles.serviceCategory}>{service.category}</Text>
                </View>
              </View>

              {/* Parts */}
              {service.parts.length > 0 && (
                <View style={styles.lineItems}>
                  <Text style={styles.lineItemsTitle}>Parts:</Text>
                  {service.parts.map((part) => (
                    <View key={part.id} style={styles.lineItem}>
                      <View style={styles.lineItemLeft}>
                        <Text style={styles.lineItemName}>{part.name}</Text>
                        {part.partNumber && (
                          <Text style={styles.lineItemMeta}>#{part.partNumber}</Text>
                        )}
                      </View>
                      <View style={styles.lineItemRight}>
                        <Text style={styles.lineItemQty}>{part.quantity} x {formatCurrency(part.unitPrice)}</Text>
                        <Text style={styles.lineItemTotal}>{formatCurrency(part.totalPrice)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Labor */}
              {service.labor.length > 0 && (
                <View style={styles.lineItems}>
                  <Text style={styles.lineItemsTitle}>Labor:</Text>
                  {service.labor.map((labor) => (
                    <View key={labor.id} style={styles.lineItem}>
                      <View style={styles.lineItemLeft}>
                        <Text style={styles.lineItemName}>{labor.description}</Text>
                      </View>
                      <View style={styles.lineItemRight}>
                        <Text style={styles.lineItemQty}>{labor.hours}h @ {formatCurrency(labor.rate)}/hr</Text>
                        <Text style={styles.lineItemTotal}>{formatCurrency(labor.totalPrice)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Service Notes */}
              {service.notes && (
                <View style={styles.serviceNotes}>
                  <Text style={styles.serviceNotesText}>{service.notes}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Parts Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(partsTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Labor Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(laborTotal)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (8.25%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL DUE</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>

        {/* Mechanic Signature */}
        {mechanicName && (
          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>Service performed by:</Text>
            <Text style={styles.signatureName}>{mechanicName}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing {shopName}!
          </Text>
          <Text style={styles.footerSubtext}>
            Please retain this invoice for your records.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onConfirm && (
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Confirm & Generate Invoice</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1E3A8A',
    padding: 24,
    alignItems: 'center',
  },
  shopName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93C5FD',
    letterSpacing: 2,
    marginBottom: 8,
  },
  invoiceDate: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 4,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  servicesSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 16,
  },
  serviceBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1E3A8A',
  },
  serviceHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  serviceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginRight: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  lineItems: {
    marginTop: 8,
  },
  lineItemsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  lineItemLeft: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 13,
    color: '#374151',
  },
  lineItemMeta: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  lineItemRight: {
    alignItems: 'flex-end',
  },
  lineItemQty: {
    fontSize: 11,
    color: '#6B7280',
  },
  lineItemTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceNotes: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  serviceNotesText: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
  },
  totalsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  signatureSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  signatureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default InvoicePreview;

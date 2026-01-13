import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { apiClient, Invoice } from '../services/api';

type FilterStatus = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

const InvoicesScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      const statusParam = filterStatus === 'all' ? undefined : filterStatus;
      const result = await apiClient.invoices.list({ status: statusParam });
      setInvoices(result.invoices);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      // Mock data for demo
      setInvoices([
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          serviceRecordId: 'sr1',
          customerId: 'c1',
          customerName: 'John Smith',
          vehicleInfo: '2020 Honda Accord',
          items: [],
          subtotal: 150.45,
          tax: 12.41,
          total: 162.86,
          status: 'sent',
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          serviceRecordId: 'sr2',
          customerId: 'c2',
          customerName: 'Sarah Johnson',
          vehicleInfo: '2019 Toyota Camry',
          items: [],
          subtotal: 320.00,
          tax: 26.40,
          total: 346.40,
          status: 'paid',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          invoiceNumber: 'INV-2024-003',
          serviceRecordId: 'sr3',
          customerId: 'c3',
          customerName: 'Mike Williams',
          vehicleInfo: '2018 Ford F-150',
          items: [],
          subtotal: 850.00,
          tax: 70.13,
          total: 920.13,
          status: 'overdue',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          invoiceNumber: 'INV-2024-004',
          serviceRecordId: 'sr4',
          customerId: 'c4',
          customerName: 'Emily Brown',
          vehicleInfo: '2021 BMW 3 Series',
          items: [],
          subtotal: 275.50,
          tax: 22.73,
          total: 298.23,
          status: 'draft',
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInvoices();
    setIsRefreshing(false);
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    Alert.alert(
      'Send Invoice',
      `Send invoice ${invoice.invoiceNumber} to ${invoice.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await apiClient.invoices.send(invoice.id);
              await loadInvoices();
              Alert.alert('Success', 'Invoice sent successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to send invoice');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    Alert.alert(
      'Mark as Paid',
      `Mark invoice ${invoice.invoiceNumber} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await apiClient.invoices.markPaid(invoice.id);
              await loadInvoices();
              Alert.alert('Success', 'Invoice marked as paid');
            } catch (error) {
              Alert.alert('Error', 'Failed to update invoice');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string): { bg: string; text: string } => {
    switch (status) {
      case 'draft':
        return { bg: '#F3F4F6', text: '#6B7280' };
      case 'sent':
        return { bg: '#DBEAFE', text: '#1E3A8A' };
      case 'paid':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'overdue':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const filteredInvoices = filterStatus === 'all'
    ? invoices
    : invoices.filter((inv) => inv.status === filterStatus);

  const renderInvoiceItem = ({ item }: { item: Invoice }) => {
    const statusColors = getStatusColor(item.status);
    const isOverdue = item.status === 'overdue' ||
      (item.status === 'sent' && new Date(item.dueDate) < new Date());

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        onPress={() => setSelectedInvoice(item)}
        activeOpacity={0.7}
      >
        <View style={styles.invoiceHeader}>
          <View>
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
          >
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceBody}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.vehicleInfo}>{item.vehicleInfo}</Text>
          </View>
          <View style={styles.amountInfo}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.total)}</Text>
          </View>
        </View>

        {isOverdue && item.status !== 'paid' && (
          <View style={styles.overdueWarning}>
            <Text style={styles.overdueText}>
              Due: {formatDate(item.dueDate)}
            </Text>
          </View>
        )}

        <View style={styles.invoiceActions}>
          {item.status === 'draft' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSendInvoice(item)}
            >
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
          )}
          {(item.status === 'sent' || item.status === 'overdue') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => handleMarkPaid(item)}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                Mark Paid
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton: React.FC<{ status: FilterStatus; label: string }> = ({
    status,
    label,
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterStatus === status && styles.filterButtonActive,
      ]}
      onPress={() => setFilterStatus(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filterStatus === status && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading invoices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterButton status="all" label="All" />
        <FilterButton status="draft" label="Draft" />
        <FilterButton status="sent" label="Sent" />
        <FilterButton status="paid" label="Paid" />
        <FilterButton status="overdue" label="Overdue" />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatCurrency(
              filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
            )}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredInvoices.length}</Text>
          <Text style={styles.statLabel}>Invoices</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statValueOverdue]}>
            {formatCurrency(
              invoices
                .filter((inv) => inv.status === 'overdue')
                .reduce((sum, inv) => sum + inv.total, 0)
            )}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1E3A8A"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Invoices</Text>
            <Text style={styles.emptyText}>
              {filterStatus === 'all'
                ? 'No invoices have been created yet.'
                : `No ${filterStatus} invoices found.`}
            </Text>
          </View>
        }
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      )}

      {/* Invoice Detail Modal */}
      <Modal
        visible={selectedInvoice !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedInvoice && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedInvoice.invoiceNumber}</Text>
                  <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                    <Text style={styles.modalClose}>Close</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Customer</Text>
                    <Text style={styles.modalValue}>{selectedInvoice.customerName}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Vehicle</Text>
                    <Text style={styles.modalValue}>{selectedInvoice.vehicleInfo}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Created</Text>
                    <Text style={styles.modalValue}>
                      {formatDate(selectedInvoice.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Due Date</Text>
                    <Text style={styles.modalValue}>
                      {formatDate(selectedInvoice.dueDate)}
                    </Text>
                  </View>

                  <View style={styles.modalDivider} />

                  <View style={styles.modalTotals}>
                    <View style={styles.modalTotalRow}>
                      <Text style={styles.modalTotalLabel}>Subtotal</Text>
                      <Text style={styles.modalTotalValue}>
                        {formatCurrency(selectedInvoice.subtotal)}
                      </Text>
                    </View>
                    <View style={styles.modalTotalRow}>
                      <Text style={styles.modalTotalLabel}>Tax</Text>
                      <Text style={styles.modalTotalValue}>
                        {formatCurrency(selectedInvoice.tax)}
                      </Text>
                    </View>
                    <View style={[styles.modalTotalRow, styles.modalGrandTotal]}>
                      <Text style={styles.modalGrandTotalLabel}>Total</Text>
                      <Text style={styles.modalGrandTotalValue}>
                        {formatCurrency(selectedInvoice.total)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  {selectedInvoice.status === 'draft' && (
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={() => {
                        setSelectedInvoice(null);
                        handleSendInvoice(selectedInvoice);
                      }}
                    >
                      <Text style={styles.modalActionButtonText}>Send Invoice</Text>
                    </TouchableOpacity>
                  )}
                  {(selectedInvoice.status === 'sent' ||
                    selectedInvoice.status === 'overdue') && (
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={() => {
                        setSelectedInvoice(null);
                        handleMarkPaid(selectedInvoice);
                      }}
                    >
                      <Text style={styles.modalActionButtonText}>Mark as Paid</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    gap: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statValueOverdue: {
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  listContent: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  invoiceDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  invoiceBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  overdueWarning: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  invoiceActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  actionButtonPrimary: {
    backgroundColor: '#1E3A8A',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    fontSize: 16,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  modalTotals: {},
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalTotalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalTotalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalGrandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalGrandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalGrandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalActionButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default InvoicesScreen;

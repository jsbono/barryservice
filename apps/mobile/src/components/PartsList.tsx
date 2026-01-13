import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Part } from '../context/ServiceContext';
import { generatePartId } from '../services/voice';

interface PartsListProps {
  parts: Part[];
  onAddPart: (part: Part) => void;
  onUpdatePart: (partId: string, updates: Partial<Part>) => void;
  onRemovePart: (partId: string) => void;
  editable?: boolean;
}

interface PartFormData {
  name: string;
  partNumber: string;
  quantity: string;
  unitPrice: string;
}

const PartsList: React.FC<PartsListProps> = ({
  parts,
  onAddPart,
  onUpdatePart,
  onRemovePart,
  editable = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState<PartFormData>({
    name: '',
    partNumber: '',
    quantity: '1',
    unitPrice: '',
  });

  const totalAmount = parts.reduce((sum, part) => sum + part.totalPrice, 0);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      partNumber: '',
      quantity: '1',
      unitPrice: '',
    });
    setEditingPart(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (part: Part) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      partNumber: part.partNumber || '',
      quantity: part.quantity.toString(),
      unitPrice: part.unitPrice.toFixed(2),
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    const quantity = parseInt(formData.quantity, 10) || 1;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const totalPrice = quantity * unitPrice;

    if (editingPart) {
      onUpdatePart(editingPart.id, {
        name: formData.name,
        partNumber: formData.partNumber || undefined,
        quantity,
        unitPrice,
        totalPrice,
      });
    } else {
      const newPart: Part = {
        id: generatePartId(),
        name: formData.name,
        partNumber: formData.partNumber || undefined,
        quantity,
        unitPrice,
        totalPrice,
      };
      onAddPart(newPart);
    }

    setModalVisible(false);
    resetForm();
  };

  const isFormValid = (): boolean => {
    return (
      formData.name.trim().length > 0 &&
      parseInt(formData.quantity, 10) > 0 &&
      parseFloat(formData.unitPrice) > 0
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parts</Text>
        {editable && (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Part</Text>
          </TouchableOpacity>
        )}
      </View>

      {parts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No parts added</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {parts.map((part) => (
            <View key={part.id} style={styles.partRow}>
              <View style={styles.partInfo}>
                <Text style={styles.partName}>{part.name}</Text>
                {part.partNumber && (
                  <Text style={styles.partNumber}>#{part.partNumber}</Text>
                )}
                <Text style={styles.partDetails}>
                  {part.quantity} x {formatCurrency(part.unitPrice)}
                </Text>
              </View>
              <View style={styles.partActions}>
                <Text style={styles.partTotal}>
                  {formatCurrency(part.totalPrice)}
                </Text>
                {editable && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(part)}
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => onRemovePart(part.id)}
                    >
                      <Text style={styles.removeBtnText}>X</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {parts.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Parts Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPart ? 'Edit Part' : 'Add Part'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.closeButton}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Part Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="e.g., Oil Filter"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Part Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.partNumber}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, partNumber: text }))
                  }
                  placeholder="e.g., PF-123"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantity}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, quantity: text }))
                    }
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>Unit Price *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.unitPrice}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, unitPrice: text }))
                    }
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {formData.quantity && formData.unitPrice && (
                <View style={styles.previewTotal}>
                  <Text style={styles.previewTotalLabel}>Total:</Text>
                  <Text style={styles.previewTotalAmount}>
                    {formatCurrency(
                      (parseInt(formData.quantity, 10) || 0) *
                        (parseFloat(formData.unitPrice) || 0)
                    )}
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !isFormValid() && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!isFormValid()}
            >
              <Text style={styles.saveButtonText}>
                {editingPart ? 'Update Part' : 'Add Part'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  list: {
    gap: 8,
  },
  partRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  partNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  partDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  partActions: {
    alignItems: 'flex-end',
  },
  partTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  editBtnText: {
    fontSize: 12,
    color: '#4B5563',
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
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
  closeButton: {
    fontSize: 16,
    color: '#1E3A8A',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  previewTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  previewTotalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PartsList;

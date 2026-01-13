import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Vehicle } from '../context/ServiceContext';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
  onViewHistory?: (vehicleId: string) => void;
  showCustomer?: boolean;
  showActions?: boolean;
  selected?: boolean;
  compact?: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  onViewHistory,
  showCustomer = true,
  showActions = false,
  selected = false,
  compact = false,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(vehicle);
    }
  };

  const handleViewHistory = () => {
    if (onViewHistory) {
      onViewHistory(vehicle.id);
    }
  };

  // Generate vehicle icon based on make (simplified)
  const getVehicleIcon = (): string => {
    const make = vehicle.make.toLowerCase();
    if (make.includes('truck') || make.includes('ford') || make.includes('chevrolet') || make.includes('ram')) {
      return '🚚';
    }
    if (make.includes('motorcycle') || make.includes('harley') || make.includes('yamaha')) {
      return '🏍️';
    }
    return '🚗';
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, selected && styles.compactContainerSelected]}
        onPress={handlePress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <Text style={styles.compactIcon}>{getVehicleIcon()}</Text>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.compactSubtitle}>{vehicle.licensePlate || vehicle.vin}</Text>
        </View>
        {selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Vehicle Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getVehicleIcon()}</Text>
      </View>

      {/* Vehicle Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            {vehicle.color && (
              <View style={styles.colorBadge}>
                <Text style={styles.colorText}>{vehicle.color}</Text>
              </View>
            )}
          </View>
          {selected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>Selected</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>VIN:</Text>
            <Text style={styles.detailValue}>{vehicle.vin}</Text>
          </View>

          {vehicle.licensePlate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plate:</Text>
              <Text style={styles.detailValue}>{vehicle.licensePlate}</Text>
            </View>
          )}

          {vehicle.mileage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mileage:</Text>
              <Text style={styles.detailValue}>
                {vehicle.mileage.toLocaleString()} mi
              </Text>
            </View>
          )}
        </View>

        {/* Customer Info */}
        {showCustomer && vehicle.customerName && (
          <View style={styles.customerSection}>
            <Text style={styles.customerLabel}>Owner</Text>
            <Text style={styles.customerName}>{vehicle.customerName}</Text>
          </View>
        )}

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            {onViewHistory && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewHistory}
              >
                <Text style={styles.actionButtonText}>View History</Text>
              </TouchableOpacity>
            )}
            {onPress && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handlePress}
              >
                <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                  Select Vehicle
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  containerSelected: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactContainerSelected: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  compactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  compactSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  colorBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  colorText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  selectedBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    width: 60,
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  customerSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  customerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  primaryButton: {
    backgroundColor: '#1E3A8A',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
});

export default VehicleCard;

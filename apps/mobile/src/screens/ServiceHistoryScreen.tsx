import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { apiClient, ServiceRecord } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<RootStackParamList, 'ServiceHistory'>;

const ServiceHistoryScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { vehicleId } = route.params;

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<string>('');

  const loadServiceHistory = useCallback(async () => {
    try {
      const [historyData, vehicleData] = await Promise.all([
        apiClient.vehicles.getServiceHistory(vehicleId),
        apiClient.vehicles.getById(vehicleId),
      ]);

      setServices(historyData);
      setVehicleInfo(`${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`);
    } catch (error) {
      console.error('Failed to load service history:', error);
      // Mock data for demo
      setVehicleInfo('2020 Honda Accord');
      setServices([
        {
          id: '1',
          vehicleId,
          mechanicId: 'm1',
          services: [
            {
              id: 's1',
              description: 'Oil Change - Full Synthetic',
              category: 'Maintenance',
              parts: [
                {
                  id: 'p1',
                  name: 'Mobil 1 5W-30',
                  quantity: 5,
                  unitPrice: 8.99,
                  totalPrice: 44.95,
                },
              ],
              labor: [
                {
                  id: 'l1',
                  description: 'Oil change labor',
                  hours: 0.5,
                  rate: 85,
                  totalPrice: 42.5,
                },
              ],
            },
          ],
          transcript: 'Full synthetic oil change with filter replacement.',
          totalAmount: 87.45,
          status: 'completed',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          vehicleId,
          mechanicId: 'm1',
          services: [
            {
              id: 's2',
              description: 'Brake Pad Replacement - Front',
              category: 'Brakes',
              parts: [
                {
                  id: 'p2',
                  name: 'Ceramic Brake Pads (Front)',
                  quantity: 1,
                  unitPrice: 89.99,
                  totalPrice: 89.99,
                },
              ],
              labor: [
                {
                  id: 'l2',
                  description: 'Front brake pad installation',
                  hours: 1.5,
                  rate: 85,
                  totalPrice: 127.5,
                },
              ],
            },
          ],
          transcript: 'Replaced front brake pads with ceramic pads.',
          totalAmount: 217.49,
          status: 'completed',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          vehicleId,
          mechanicId: 'm1',
          services: [
            {
              id: 's3',
              description: 'Tire Rotation',
              category: 'Tires',
              parts: [],
              labor: [
                {
                  id: 'l3',
                  description: 'Tire rotation service',
                  hours: 0.5,
                  rate: 85,
                  totalPrice: 42.5,
                },
              ],
            },
          ],
          transcript: 'Rotated tires front to back.',
          totalAmount: 42.5,
          status: 'completed',
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadServiceHistory();
  }, [loadServiceHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadServiceHistory();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getCategoryIcon = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'maintenance':
        return '🔧';
      case 'brakes':
        return '🛑';
      case 'tires':
        return '🛞';
      case 'engine':
        return '⚙️';
      case 'electrical':
        return '⚡';
      case 'transmission':
        return '🔄';
      default:
        return '🔩';
    }
  };

  const renderServiceItem = ({ item }: { item: ServiceRecord }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.relativeTime}>{getRelativeTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
      </View>

      {item.services.map((service, index) => (
        <View key={service.id} style={styles.serviceItem}>
          <View style={styles.serviceItemHeader}>
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(service.category)}
            </Text>
            <View style={styles.serviceItemInfo}>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <Text style={styles.serviceCategory}>{service.category}</Text>
            </View>
          </View>

          {service.parts.length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Parts:</Text>
              {service.parts.map((part) => (
                <View key={part.id} style={styles.detailRow}>
                  <Text style={styles.detailName}>
                    {part.name} x{part.quantity}
                  </Text>
                  <Text style={styles.detailAmount}>
                    {formatCurrency(part.totalPrice)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {service.labor.length > 0 && (
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Labor:</Text>
              {service.labor.map((labor) => (
                <View key={labor.id} style={styles.detailRow}>
                  <Text style={styles.detailName}>
                    {labor.description} ({labor.hours}h)
                  </Text>
                  <Text style={styles.detailAmount}>
                    {formatCurrency(labor.totalPrice)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {index < item.services.length - 1 && <View style={styles.serviceDivider} />}
        </View>
      ))}

      {item.transcript && (
        <View style={styles.transcriptSection}>
          <Text style={styles.transcriptLabel}>Notes</Text>
          <Text style={styles.transcriptText}>{item.transcript}</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading service history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Vehicle Header */}
      <View style={styles.vehicleHeader}>
        <Text style={styles.vehicleTitle}>{vehicleInfo}</Text>
        <Text style={styles.serviceCount}>
          {services.length} service{services.length !== 1 ? 's' : ''} on record
        </Text>
      </View>

      {/* Service List */}
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceItem}
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
            <Text style={styles.emptyTitle}>No Service History</Text>
            <Text style={styles.emptyText}>
              This vehicle has no recorded services yet.
            </Text>
          </View>
        }
      />
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
  vehicleHeader: {
    backgroundColor: '#1E3A8A',
    padding: 20,
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  serviceCount: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateContainer: {},
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  relativeTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  serviceItem: {
    padding: 16,
  },
  serviceItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  serviceItemInfo: {
    flex: 1,
  },
  serviceDescription: {
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
  detailsSection: {
    marginTop: 12,
    marginLeft: 36,
  },
  detailsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailName: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  detailAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  serviceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 16,
  },
  transcriptSection: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
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
});

export default ServiceHistoryScreen;

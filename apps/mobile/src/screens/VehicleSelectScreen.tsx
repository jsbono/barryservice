import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useService, Vehicle } from '../context/ServiceContext';
import { apiClient } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'VehicleSelect'>;
type RouteProps = RouteProp<RootStackParamList, 'VehicleSelect'>;

const VehicleSelectScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { setVehicle, currentSession } = useService();

  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    // Check for barcode scanner permission
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const searchVehicles = useCallback(async (query: string) => {
    if (query.length < 2) {
      setVehicles([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await apiClient.vehicles.search(query);
      // Map API results to our Vehicle type
      setVehicles(results.map(v => ({
        ...v,
        customerId: v.customerId,
        customerName: v.customerName,
      })));
    } catch (error) {
      console.error('Search failed:', error);
      // For demo, show mock data
      setVehicles([
        {
          id: '1',
          vin: '1HGCM82633A004352',
          make: 'Honda',
          model: 'Accord',
          year: 2020,
          licensePlate: 'ABC 123',
          color: 'Silver',
          mileage: 45000,
          customerId: 'c1',
          customerName: 'John Smith',
        },
        {
          id: '2',
          vin: '5YFBURHE8FP123456',
          make: 'Toyota',
          model: 'Camry',
          year: 2019,
          licensePlate: 'XYZ 789',
          color: 'Blue',
          mileage: 62000,
          customerId: 'c2',
          customerName: 'Sarah Johnson',
        },
      ].filter(v =>
        v.vin.toLowerCase().includes(query.toLowerCase()) ||
        v.make.toLowerCase().includes(query.toLowerCase()) ||
        v.model.toLowerCase().includes(query.toLowerCase()) ||
        v.licensePlate?.toLowerCase().includes(query.toLowerCase()) ||
        v.customerName.toLowerCase().includes(query.toLowerCase())
      ));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchVehicles(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchVehicles]);

  const handleVinScanned = async ({ data }: { data: string }) => {
    setShowScanner(false);
    setSearchQuery(data);

    try {
      setIsLoading(true);
      const vehicle = await apiClient.vehicles.getByVin(data);
      setVehicles([{
        ...vehicle,
        customerId: vehicle.customerId,
        customerName: vehicle.customerName,
      }]);
    } catch (error) {
      Alert.alert(
        'Vehicle Not Found',
        'No vehicle found with this VIN. Please search manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleConfirm = () => {
    if (!selectedVehicle) return;

    setVehicle(selectedVehicle);
    navigation.navigate('RecordService', {
      vehicleId: selectedVehicle.id,
      jobId: route.params?.jobId,
    });
  };

  const handleViewHistory = (vehicleId: string) => {
    navigation.navigate('ServiceHistory', { vehicleId });
  };

  if (showScanner) {
    if (hasPermission === null) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      );
    }
    if (hasPermission === false) {
      return (
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Camera permission is required to scan VINs</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowScanner(false)}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={handleVinScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerTarget} />
          <Text style={styles.scannerText}>Point camera at VIN barcode</Text>
        </View>
        <TouchableOpacity
          style={styles.cancelScanButton}
          onPress={() => setShowScanner(false)}
        >
          <Text style={styles.cancelScanText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by VIN, plate, make, model, or customer..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>X</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}
        >
          <Text style={styles.scanButtonText}>Scan VIN</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onPress={handleVehicleSelect}
              onViewHistory={handleViewHistory}
              selected={selectedVehicle?.id === item.id}
              showActions
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {searchQuery.length > 0 ? (
                <>
                  <Text style={styles.emptyStateTitle}>No vehicles found</Text>
                  <Text style={styles.emptyStateText}>
                    Try a different search term or scan the VIN
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyStateTitle}>Search for a vehicle</Text>
                  <Text style={styles.emptyStateText}>
                    Enter a VIN, license plate, make, model, or customer name
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}

      {/* Confirm Button */}
      {selectedVehicle && (
        <View style={styles.footer}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>Selected:</Text>
            <Text style={styles.selectedVehicle}>
              {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
            </Text>
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Continue to Service</Text>
          </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  searchSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  scanButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedInfo: {
    marginBottom: 12,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedVehicle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  confirmButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 280,
    height: 100,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  scannerText: {
    marginTop: 24,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelScanButton: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cancelScanText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VehicleSelectScreen;

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useService, ServiceItem, Part } from '../context/ServiceContext';
import { useAuth } from '../context/AuthContext';
import { voiceService, generateServiceId, generatePartId, generateLaborId } from '../services/voice';
import { apiClient } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import ServiceCard from '../components/ServiceCard';
import PartsList from '../components/PartsList';
import InvoicePreview from '../components/InvoicePreview';
import VehicleCard from '../components/VehicleCard';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecordService'>;
type RouteProps = RouteProp<RootStackParamList, 'RecordService'>;

type ViewMode = 'record' | 'review' | 'preview';

const RecordServiceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { user } = useAuth();
  const {
    currentSession,
    liveTranscript,
    updateTranscript,
    updateLiveTranscript,
    setServices,
    updateService,
    removeService,
    addPart,
    updatePart,
    removePart,
    setSessionStatus,
    setRecording,
    clearSession,
  } = useService();

  const [viewMode, setViewMode] = useState<ViewMode>('record');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Load vehicle data if coming from route params
  useEffect(() => {
    if (route.params?.vehicleId && !currentSession?.vehicle) {
      loadVehicle(route.params.vehicleId);
    }
  }, [route.params?.vehicleId]);

  const loadVehicle = async (vehicleId: string) => {
    try {
      const vehicle = await apiClient.vehicles.getById(vehicleId);
      // Vehicle should already be set from VehicleSelectScreen
    } catch (error) {
      console.error('Failed to load vehicle:', error);
    }
  };

  const handleRecordingStart = useCallback(() => {
    setRecording(true);
    updateLiveTranscript('');
  }, [setRecording, updateLiveTranscript]);

  const handleRecordingComplete = useCallback(async (uri: string) => {
    setRecording(false);
    setAudioUri(uri);
    setIsProcessing(true);
    setSessionStatus('processing');

    try {
      // Process the recording
      const result = await voiceService.processRecording(
        uri,
        currentSession?.vehicle?.id
      );

      // Update session with parsed data
      updateTranscript(result.transcript);

      // Convert parsed services to our format
      const services: ServiceItem[] = result.services.map((svc) => ({
        id: generateServiceId(),
        description: svc.description,
        category: svc.category,
        parts: svc.parts.map((p) => ({
          ...p,
          id: generatePartId(),
        })),
        labor: svc.labor.map((l) => ({
          ...l,
          id: generateLaborId(),
        })),
        notes: svc.notes,
      }));

      setServices(services);
      setSessionStatus('ready');
      setViewMode('review');
    } catch (error) {
      console.error('Processing failed:', error);
      // For demo, create mock parsed data
      const mockServices: ServiceItem[] = [
        {
          id: generateServiceId(),
          description: 'Oil Change - Full Synthetic',
          category: 'Maintenance',
          parts: [
            {
              id: generatePartId(),
              name: 'Mobil 1 Full Synthetic 5W-30',
              partNumber: 'MOB1-5W30',
              quantity: 5,
              unitPrice: 8.99,
              totalPrice: 44.95,
            },
            {
              id: generatePartId(),
              name: 'Oil Filter',
              partNumber: 'PF-48',
              quantity: 1,
              unitPrice: 12.99,
              totalPrice: 12.99,
            },
          ],
          labor: [
            {
              id: generateLaborId(),
              description: 'Oil change labor',
              hours: 0.5,
              rate: 85,
              totalPrice: 42.5,
            },
          ],
        },
      ];

      setServices(mockServices);
      updateTranscript('Oil change with full synthetic. Used 5 quarts of Mobil 1 5W-30 and new oil filter.');
      setSessionStatus('ready');
      setViewMode('review');
    } finally {
      setIsProcessing(false);
    }
  }, [currentSession?.vehicle?.id, updateTranscript, setServices, setSessionStatus, setRecording]);

  const handleRecordingCancel = useCallback(() => {
    setRecording(false);
    updateLiveTranscript('');
  }, [setRecording, updateLiveTranscript]);

  const handleRecordingError = useCallback((error: Error) => {
    Alert.alert('Recording Error', error.message);
  }, []);

  const handleEditService = (service: ServiceItem) => {
    setEditingServiceId(service.id);
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Remove Service',
      'Are you sure you want to remove this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeService(serviceId),
        },
      ]
    );
  };

  const handleAddPartToService = (serviceId: string, part: Part) => {
    addPart(serviceId, part);
  };

  const handleUpdatePartInService = (serviceId: string, partId: string, updates: Partial<Part>) => {
    updatePart(serviceId, partId, updates);
  };

  const handleRemovePartFromService = (serviceId: string, partId: string) => {
    removePart(serviceId, partId);
  };

  const handlePreview = () => {
    setViewMode('preview');
  };

  const handleConfirmAndGenerate = async () => {
    if (!currentSession) return;

    try {
      setIsProcessing(true);
      setSessionStatus('confirmed');

      // Create service record in backend
      await apiClient.services.create({
        vehicleId: currentSession.vehicle!.id,
        services: currentSession.services,
        transcript: currentSession.transcript,
      });

      Alert.alert(
        'Invoice Generated',
        'The service has been recorded and an invoice has been generated.',
        [
          {
            text: 'OK',
            onPress: () => {
              clearSession();
              navigation.navigate('Main');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invoice. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordAgain = () => {
    setViewMode('record');
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Service',
      'Are you sure you want to discard this service recording?',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            clearSession();
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!currentSession) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No active service session</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Preview Mode
  if (viewMode === 'preview') {
    return (
      <InvoicePreview
        session={currentSession}
        shopName={user?.shopName}
        mechanicName={`${user?.firstName} ${user?.lastName}`}
        onConfirm={handleConfirmAndGenerate}
        onEdit={() => setViewMode('review')}
      />
    );
  }

  // Review Mode
  if (viewMode === 'review') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Vehicle Info */}
          {currentSession.vehicle && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle</Text>
              <VehicleCard
                vehicle={currentSession.vehicle}
                compact
                showCustomer
              />
            </View>
          )}

          {/* Transcript */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transcript</Text>
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptText}>
                {currentSession.transcript || 'No transcript available'}
              </Text>
            </View>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Services</Text>
              <TouchableOpacity
                style={styles.recordMoreButton}
                onPress={handleRecordAgain}
              >
                <Text style={styles.recordMoreText}>+ Record More</Text>
              </TouchableOpacity>
            </View>

            {currentSession.services.length === 0 ? (
              <View style={styles.emptyServices}>
                <Text style={styles.emptyServicesText}>
                  No services parsed. Record again or add manually.
                </Text>
              </View>
            ) : (
              currentSession.services.map((service) => (
                <View key={service.id}>
                  <ServiceCard
                    service={service}
                    onEdit={handleEditService}
                    onDelete={handleDeleteService}
                  />
                  {editingServiceId === service.id && (
                    <PartsList
                      parts={service.parts}
                      onAddPart={(part) => handleAddPartToService(service.id, part)}
                      onUpdatePart={(partId, updates) =>
                        handleUpdatePartInService(service.id, partId, updates)
                      }
                      onRemovePart={(partId) =>
                        handleRemovePartFromService(service.id, partId)
                      }
                    />
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.previewButton,
              currentSession.services.length === 0 && styles.previewButtonDisabled,
            ]}
            onPress={handlePreview}
            disabled={currentSession.services.length === 0}
          >
            <Text style={styles.previewButtonText}>Preview Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* Processing Modal */}
        <Modal visible={isProcessing} transparent animationType="fade">
          <View style={styles.processingOverlay}>
            <View style={styles.processingModal}>
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text style={styles.processingText}>Generating invoice...</Text>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Record Mode (default)
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Vehicle Info */}
        {currentSession.vehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <VehicleCard
              vehicle={currentSession.vehicle}
              compact
              showCustomer
            />
          </View>
        )}

        {/* Voice Recorder */}
        <View style={styles.recorderSection}>
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onRecordingStart={handleRecordingStart}
            onRecordingCancel={handleRecordingCancel}
            onError={handleRecordingError}
            disabled={isProcessing}
          />
        </View>

        {/* Live Transcript */}
        {liveTranscript && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Transcript</Text>
            <View style={styles.liveTranscriptBox}>
              <Text style={styles.liveTranscriptText}>{liveTranscript}</Text>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Recording Tips</Text>
          <Text style={styles.instructionItem}>
            • Speak clearly and mention specific parts used
          </Text>
          <Text style={styles.instructionItem}>
            • Include quantities and part numbers if known
          </Text>
          <Text style={styles.instructionItem}>
            • Describe the labor performed and estimated time
          </Text>
          <Text style={styles.instructionItem}>
            • Mention any issues found or recommendations
          </Text>
        </View>
      </ScrollView>

      {/* Cancel Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Processing Modal */}
      <Modal visible={isProcessing} transparent animationType="fade">
        <View style={styles.processingOverlay}>
          <View style={styles.processingModal}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.processingText}>Processing recording...</Text>
            <Text style={styles.processingSubtext}>
              Transcribing and parsing service details
            </Text>
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
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  recorderSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transcriptBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transcriptText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  liveTranscriptBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  liveTranscriptText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  recordMoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
  },
  recordMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  emptyServices: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyServicesText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  previewButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  previewButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RecordServiceScreen;

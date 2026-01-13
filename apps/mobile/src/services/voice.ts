import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import api from './api';
import { ServiceItem, Part, LaborItem } from '../context/ServiceContext';

// Recording configuration for optimal speech recognition
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  language: string;
}

export interface ParsedServiceResult {
  services: ServiceItem[];
  transcript: string;
  confidence: number;
  suggestions?: string[];
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  metering: number;
}

export interface VoiceServiceCallbacks {
  onRecordingStateChange?: (state: RecordingState) => void;
  onTranscriptUpdate?: (transcript: string) => void;
  onMeteringUpdate?: (metering: number) => void;
  onError?: (error: Error) => void;
}

class VoiceService {
  private recording: Audio.Recording | null = null;
  private callbacks: VoiceServiceCallbacks = {};
  private meteringInterval: NodeJS.Timeout | null = null;
  private recordingStartTime: number = 0;

  /**
   * Set callbacks for voice service events
   */
  setCallbacks(callbacks: VoiceServiceCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  /**
   * Check if microphone permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking audio permissions:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      // Check permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Create and prepare recording
      const { recording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS,
        this.onRecordingStatusUpdate.bind(this),
        100 // Update status every 100ms
      );

      this.recording = recording;
      this.recordingStartTime = Date.now();

      // Start metering updates
      this.startMeteringUpdates();

      this.callbacks.onRecordingStateChange?.({
        isRecording: true,
        isPaused: false,
        duration: 0,
        metering: 0,
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop recording and return the audio URI
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null;
      }

      this.stopMeteringUpdates();

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      this.recording = null;

      this.callbacks.onRecordingStateChange?.({
        isRecording: false,
        isPaused: false,
        duration: 0,
        metering: 0,
      });

      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Cancel recording without saving
   */
  async cancelRecording(): Promise<void> {
    try {
      if (!this.recording) {
        return;
      }

      this.stopMeteringUpdates();

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      // Delete the recorded file
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      this.recording = null;

      this.callbacks.onRecordingStateChange?.({
        isRecording: false,
        isPaused: false,
        duration: 0,
        metering: 0,
      });
    } catch (error) {
      console.error('Error cancelling recording:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.recording) {
        return;
      }

      await this.recording.pauseAsync();
      this.stopMeteringUpdates();

      const duration = (Date.now() - this.recordingStartTime) / 1000;

      this.callbacks.onRecordingStateChange?.({
        isRecording: true,
        isPaused: true,
        duration,
        metering: 0,
      });
    } catch (error) {
      console.error('Error pausing recording:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.recording) {
        return;
      }

      await this.recording.startAsync();
      this.startMeteringUpdates();

      const duration = (Date.now() - this.recordingStartTime) / 1000;

      this.callbacks.onRecordingStateChange?.({
        isRecording: true,
        isPaused: false,
        duration,
        metering: 0,
      });
    } catch (error) {
      console.error('Error resuming recording:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Get current recording status
   */
  getRecordingStatus(): RecordingState {
    return {
      isRecording: this.recording !== null,
      isPaused: false,
      duration: this.recording ? (Date.now() - this.recordingStartTime) / 1000 : 0,
      metering: 0,
    };
  }

  /**
   * Transcribe audio file
   */
  async transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
    try {
      // Read the audio file
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Create form data for upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      // Send to transcription API
      const response = await api.post<TranscriptionResult>('/voice/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for transcription
      });

      return response.data;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  /**
   * Parse transcript into service items
   */
  async parseTranscript(transcript: string, vehicleId?: string): Promise<ParsedServiceResult> {
    try {
      const response = await api.post<ParsedServiceResult>('/voice/parse', {
        transcript,
        vehicleId,
      });

      return response.data;
    } catch (error) {
      console.error('Error parsing transcript:', error);
      throw error;
    }
  }

  /**
   * Process recording: transcribe and parse in one call
   */
  async processRecording(audioUri: string, vehicleId?: string): Promise<ParsedServiceResult> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      if (vehicleId) {
        formData.append('vehicleId', vehicleId);
      }

      const response = await api.post<ParsedServiceResult>('/voice/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for full processing
      });

      return response.data;
    } catch (error) {
      console.error('Error processing recording:', error);
      throw error;
    }
  }

  /**
   * Stream transcription (for live transcript updates)
   */
  async startStreamingTranscription(audioUri: string): Promise<void> {
    // This would connect to a WebSocket for real-time transcription
    // Implementation depends on backend capabilities
    console.log('Streaming transcription not yet implemented');
  }

  // Private methods

  private onRecordingStatusUpdate(status: Audio.RecordingStatus) {
    if (status.isRecording) {
      const duration = status.durationMillis / 1000;
      const metering = status.metering ?? -160;

      this.callbacks.onRecordingStateChange?.({
        isRecording: true,
        isPaused: false,
        duration,
        metering: this.normalizeMetering(metering),
      });
    }
  }

  private startMeteringUpdates() {
    this.meteringInterval = setInterval(async () => {
      if (this.recording) {
        try {
          const status = await this.recording.getStatusAsync();
          if (status.isRecording && status.metering !== undefined) {
            this.callbacks.onMeteringUpdate?.(this.normalizeMetering(status.metering));
          }
        } catch (error) {
          // Recording may have stopped
        }
      }
    }, 100);
  }

  private stopMeteringUpdates() {
    if (this.meteringInterval) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
  }

  private normalizeMetering(metering: number): number {
    // Convert dB to 0-1 scale
    // Typical range is -160 (silence) to 0 (max)
    const minDb = -60;
    const maxDb = 0;
    const normalized = (metering - minDb) / (maxDb - minDb);
    return Math.max(0, Math.min(1, normalized));
  }
}

// Export singleton instance
export const voiceService = new VoiceService();

// Export helper functions
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const generateServiceId = (): string => {
  return `svc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generatePartId = (): string => {
  return `prt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateLaborId = (): string => {
  return `lbr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default voiceService;

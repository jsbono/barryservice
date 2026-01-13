import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { voiceService, formatDuration, RecordingState } from '../services/voice';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
  onRecordingStart?: () => void;
  onRecordingCancel?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onRecordingStart,
  onRecordingCancel,
  onError,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [metering, setMetering] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Animation values for waveform
  const waveAnimations = Array.from({ length: 5 }, () => new Animated.Value(0.3));
  const pulseAnimation = new Animated.Value(1);

  useEffect(() => {
    checkPermissions();
    setupCallbacks();

    return () => {
      // Cleanup on unmount
      if (isRecording) {
        voiceService.cancelRecording();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      startWaveAnimation();
      startPulseAnimation();
    } else {
      stopAnimations();
    }
  }, [isRecording, isPaused]);

  const checkPermissions = async () => {
    const granted = await voiceService.checkPermissions();
    setHasPermission(granted);
  };

  const setupCallbacks = () => {
    voiceService.setCallbacks({
      onRecordingStateChange: (state: RecordingState) => {
        setIsRecording(state.isRecording);
        setIsPaused(state.isPaused);
        setDuration(state.duration);
        setMetering(state.metering);
      },
      onMeteringUpdate: (level: number) => {
        setMetering(level);
        updateWaveAnimation(level);
      },
      onError: (error: Error) => {
        onError?.(error);
      },
    });
  };

  const startWaveAnimation = () => {
    waveAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.8 + Math.random() * 0.2,
            duration: 200 + index * 50,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3 + Math.random() * 0.2,
            duration: 200 + index * 50,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopAnimations = () => {
    waveAnimations.forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0.3);
    });
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  const updateWaveAnimation = (level: number) => {
    waveAnimations.forEach((anim, index) => {
      const targetValue = 0.3 + level * 0.7 * (1 - index * 0.1);
      Animated.timing(anim, {
        toValue: targetValue,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleStartRecording = useCallback(async () => {
    try {
      await voiceService.startRecording();
      onRecordingStart?.();
    } catch (error) {
      onError?.(error as Error);
    }
  }, [onRecordingStart, onError]);

  const handleStopRecording = useCallback(async () => {
    try {
      const uri = await voiceService.stopRecording();
      if (uri) {
        onRecordingComplete(uri);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [onRecordingComplete, onError]);

  const handleCancelRecording = useCallback(async () => {
    try {
      await voiceService.cancelRecording();
      onRecordingCancel?.();
    } catch (error) {
      onError?.(error as Error);
    }
  }, [onRecordingCancel, onError]);

  const handlePauseResume = useCallback(async () => {
    try {
      if (isPaused) {
        await voiceService.resumeRecording();
      } else {
        await voiceService.pauseRecording();
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [isPaused, onError]);

  const requestPermissions = async () => {
    const granted = await voiceService.requestPermissions();
    setHasPermission(granted);
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Microphone access is required to record services
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Waveform Visualization */}
      <View style={styles.waveformContainer}>
        {isRecording ? (
          <View style={styles.waveform}>
            {waveAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    transform: [{ scaleY: anim }],
                    backgroundColor: isPaused ? '#9CA3AF' : '#1E3A8A',
                  },
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.idleWaveform}>
            <Text style={styles.idleText}>Press and hold to record</Text>
          </View>
        )}
      </View>

      {/* Duration Display */}
      {isRecording && (
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      )}

      {/* Main Record Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            disabled && styles.recordButtonDisabled,
          ]}
          onPressIn={!isRecording ? handleStartRecording : undefined}
          onPressOut={isRecording ? handleStopRecording : undefined}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.recordButtonInner,
              isRecording && styles.recordButtonInnerActive,
            ]}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Recording Controls */}
      {isRecording && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePauseResume}
          >
            <Text style={styles.controlButtonText}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.cancelButton]}
            onPress={handleCancelRecording}
          >
            <Text style={[styles.controlButtonText, styles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <Text style={styles.instructions}>
        {isRecording
          ? isPaused
            ? 'Recording paused'
            : 'Release to stop recording'
          : 'Describe the service performed'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  waveformContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    gap: 8,
  },
  waveBar: {
    width: 8,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#1E3A8A',
  },
  idleWaveform: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  duration: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    fontVariant: ['tabular-nums'],
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
  },
  recordButtonInnerActive: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
  },
  controlButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  instructions: {
    marginTop: 24,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoiceRecorder;

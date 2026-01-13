import { useState, useRef, useEffect } from 'react';
import { processVoiceAudio, parseVoiceTranscript } from '../../lib/api';
import { VoiceParsedData } from '../../lib/types';

interface VoiceRecorderProps {
  vehicleId?: string;
  onResult: (data: VoiceParsedData & { transcript: string }) => void;
  onError?: (error: string) => void;
}

export function VoiceRecorder({ vehicleId, onResult, onError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        stream.getTracks().forEach(track => track.stop());
        await processRecording(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      onError?.('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processRecording = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const result = await processVoiceAudio(blob, vehicleId);
      if (result.success) {
        setTranscript(result.data.transcript);
        onResult(result.data);
      } else {
        onError?.('Failed to process voice recording');
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to process voice recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    try {
      const result = await parseVoiceTranscript(transcript, vehicleId);
      if (result.success) {
        onResult({ ...result.data, transcript });
      } else {
        onError?.('Failed to parse transcript');
      }
    } catch (err) {
      console.error('Parse error:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to parse transcript');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Voice Service Entry</h3>
        <button
          onClick={() => setManualMode(!manualMode)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {manualMode ? 'Use Voice' : 'Type Instead'}
        </button>
      </div>

      {!manualMode ? (
        <div className="flex flex-col items-center">
          {/* Recording Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isRecording ? (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>

          {/* Recording Time */}
          {isRecording && (
            <div className="mt-4 text-xl font-mono text-red-600">
              {formatTime(recordingTime)}
            </div>
          )}

          {/* Status Text */}
          <p className="mt-4 text-sm text-gray-600">
            {isProcessing
              ? 'Processing...'
              : isRecording
              ? 'Recording... Tap to stop'
              : 'Tap to start recording'}
          </p>

          {/* Instructions */}
          <div className="mt-6 text-xs text-gray-500 text-center max-w-sm">
            <p className="font-medium mb-2">Example:</p>
            <p className="italic">
              "Oil change, replaced front brake pads, two hours labor, parts were Mobil 1 filter and Bosch pads"
            </p>
          </div>
        </div>
      ) : (
        <div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type your service description here..."
            className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleManualSubmit}
            disabled={isProcessing || !transcript.trim()}
            className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Parse Service Entry'}
          </button>
        </div>
      )}

      {/* Show transcript after processing */}
      {transcript && !manualMode && !isRecording && !isProcessing && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Transcript:</p>
          <p className="text-sm text-gray-600 italic">{transcript}</p>
        </div>
      )}
    </div>
  );
}

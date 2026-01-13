import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, Customer } from '../lib/types';
import { getVehicles, getCustomers, createServiceLog, transcribeAudio } from '../lib/api';

type VoiceStep = 'idle' | 'asking-customer' | 'listening-customer' | 'asking-vehicle' | 'listening-vehicle' | 'asking-service' | 'listening-service' | 'confirming' | 'complete';

export function VoiceServiceEntry() {
  const navigate = useNavigate();

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Voice flow state
  const [step, setStep] = useState<VoiceStep>('idle');
  const [_isListening, setIsListening] = useState(false);
  const [_isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Selected data
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [serviceDescription, setServiceDescription] = useState('');
  const [laborHours, setLaborHours] = useState<number>(1);

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    loadData();
    synthRef.current = window.speechSynthesis;

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Auto-start voice flow when data is loaded
  useEffect(() => {
    if (!loading && customers.length > 0 && step === 'idle') {
      const timer = setTimeout(() => {
        startVoiceFlow();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, customers.length]);

  const loadData = async () => {
    try {
      const [customersRes, vehiclesRes] = await Promise.all([
        getCustomers(500),
        getVehicles(undefined, 500),
      ]);
      setCustomers(customersRes.customers);
      setVehicles(vehiclesRes.vehicles);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  // Text-to-speech function
  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }

      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  };

  // Start recording
  const startListening = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

          try {
            const result = await transcribeAudio(blob);
            if (result.success && result.transcript) {
              setTranscript(result.transcript);
              resolve(result.transcript);
            } else {
              reject(new Error('Could not transcribe audio'));
            }
          } catch (err) {
            reject(err);
          }
        };

        mediaRecorder.start();
        setIsListening(true);

        // Auto-stop after 8 seconds
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsListening(false);
          }
        }, 8000);

      } catch (err) {
        reject(err);
      }
    });
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // Find customer by name (fuzzy match)
  const findCustomerByName = (spokenName: string): Customer | null => {
    const nameLower = spokenName.toLowerCase().trim();

    // Try exact match first
    let match = customers.find(c =>
      c.name.toLowerCase() === nameLower
    );

    if (!match) {
      // Try partial match
      match = customers.find(c =>
        c.name.toLowerCase().includes(nameLower) ||
        nameLower.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().split(' ').some(part => nameLower.includes(part) && part.length > 2)
      );
    }

    return match || null;
  };

  // Find vehicle by description
  const findVehicleByDescription = (spokenDesc: string): Vehicle | null => {
    const descLower = spokenDesc.toLowerCase().trim();

    return customerVehicles.find(v => {
      const vehicleDesc = `${v.year} ${v.make} ${v.model}`.toLowerCase();
      return vehicleDesc.includes(descLower) ||
        descLower.includes(v.make.toLowerCase()) ||
        descLower.includes(v.model.toLowerCase()) ||
        (v.year && descLower.includes(v.year.toString()));
    }) || null;
  };

  // Parse service description for hours
  const parseServiceAndHours = (text: string): { service: string; hours: number } => {
    // Map of written numbers to numeric values
    const wordToNumber: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'half': 0.5, 'a half': 0.5, 'an': 1, 'a': 1,
      'one and a half': 1.5, 'two and a half': 2.5, 'three and a half': 3.5,
      'four and a half': 4.5, 'five and a half': 5.5,
    };

    let hours = 1;
    let service = text;

    // Try numeric pattern first (e.g., "2 hours", "1.5 hrs")
    const numericMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
    if (numericMatch) {
      hours = parseFloat(numericMatch[1]);
      service = text.replace(numericMatch[0], '').trim();
    } else {
      // Try word-based patterns (e.g., "two hours", "three and a half hours")
      const wordPattern = /(one and a half|two and a half|three and a half|four and a half|five and a half|zero|one|two|three|four|five|six|seven|eight|nine|ten|half|an|a)\s*(?:hours?|hrs?)/i;
      const wordMatch = text.match(wordPattern);
      if (wordMatch) {
        const wordNum = wordMatch[1].toLowerCase();
        hours = wordToNumber[wordNum] ?? 1;
        service = text.replace(wordMatch[0], '').trim();
      }
    }

    // Clean up service description
    service = service.replace(/^(i did|we did|performed|completed)\s+/i, '');
    service = service.replace(/\s+/g, ' ').trim();

    return { service, hours };
  };

  // Main voice flow
  const startVoiceFlow = async () => {
    setError(null);
    setTranscript('');
    setMatchedCustomer(null);
    setSelectedVehicle(null);
    setServiceDescription('');

    try {
      // Step 1: Ask for customer name
      setStep('asking-customer');
      await speak("Please say the name of the customer.");

      setStep('listening-customer');
      const customerName = await startListening();

      const customer = findCustomerByName(customerName);
      if (!customer) {
        await speak(`Sorry, I couldn't find a customer named ${customerName}. Please try again.`);
        setStep('idle');
        return;
      }

      setMatchedCustomer(customer);

      // Get customer's vehicles
      const custVehicles = vehicles.filter(v => v.customer_id === customer.id);
      setCustomerVehicles(custVehicles);

      if (custVehicles.length === 0) {
        await speak(`${customer.name} has no vehicles registered. Please add a vehicle first.`);
        setStep('idle');
        return;
      }

      let vehicle: Vehicle;

      if (custVehicles.length === 1) {
        // Only one vehicle, auto-select
        vehicle = custVehicles[0];
        setSelectedVehicle(vehicle);
        await speak(`Found ${customer.name} with a ${vehicle.year} ${vehicle.make} ${vehicle.model}.`);
      } else {
        // Multiple vehicles, ask which one
        setStep('asking-vehicle');
        const vehicleList = custVehicles.map(v => `${v.year} ${v.make} ${v.model}`).join(', or ');
        await speak(`${customer.name} has ${custVehicles.length} vehicles: ${vehicleList}. Which vehicle?`);

        setStep('listening-vehicle');
        const vehicleDesc = await startListening();

        const matchedVehicle = findVehicleByDescription(vehicleDesc);
        if (!matchedVehicle) {
          await speak("Sorry, I couldn't match that vehicle. Please try again.");
          setStep('idle');
          return;
        }

        vehicle = matchedVehicle;
        setSelectedVehicle(vehicle);
        await speak(`Selected the ${vehicle.year} ${vehicle.make} ${vehicle.model}.`);
      }

      // Step 3: Ask for service details
      setStep('asking-service');
      await speak("Please state the service done and how many hours.");

      setStep('listening-service');
      const serviceText = await startListening();

      const { service, hours } = parseServiceAndHours(serviceText);
      setServiceDescription(service);
      setLaborHours(hours);

      // Confirm
      setStep('confirming');
      await speak(`Got it. ${service}, ${hours} hours, for ${customer.name}'s ${vehicle.year} ${vehicle.make} ${vehicle.model}. Saving now.`);

      // Create service log
      await createServiceLog({
        vehicle_id: vehicle.id,
        service_type: service.replace(/\s+/g, '_').toUpperCase().substring(0, 50),
        notes: service,
        service_date: new Date().toISOString().split('T')[0],
        mileage_at_service: vehicle.mileage,
        labor_hours: hours,
      });

      setStep('complete');
      await speak("Service logged successfully!");

    } catch (err) {
      console.error('Voice flow error:', err);
      setError(err instanceof Error ? err.message : 'Voice input failed');
      setStep('idle');
    }
  };

  const resetFlow = () => {
    setStep('idle');
    setMatchedCustomer(null);
    setSelectedVehicle(null);
    setServiceDescription('');
    setLaborHours(1);
    setTranscript('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Voice Service Entry</h1>
        <p className="text-gray-600 mt-2">
          Hands-free service logging with voice prompts
        </p>
      </div>

      {/* Main Voice Interface */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Status Display */}
        <div className="text-center mb-8">
          {step === 'idle' && (
            <div className="space-y-4">
              <button
                onClick={startVoiceFlow}
                className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-105 cursor-pointer"
              >
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <p className="text-gray-500">Starting voice entry...</p>
            </div>
          )}

          {(step === 'asking-customer' || step === 'asking-vehicle' || step === 'asking-service') && (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                </svg>
              </div>
              <p className="text-xl text-green-700 font-medium">Speaking...</p>
              <p className="text-gray-600">
                {step === 'asking-customer' && '"Please say the name of the customer"'}
                {step === 'asking-vehicle' && '"Which vehicle?"'}
                {step === 'asking-service' && '"Please state the service done and how many hours"'}
              </p>
            </div>
          )}

          {(step === 'listening-customer' || step === 'listening-vehicle' || step === 'listening-service') && (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <div className="relative">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  {/* Recording animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-white rounded-full animate-ping opacity-30" />
                  </div>
                </div>
              </div>
              <p className="text-xl text-red-600 font-medium">Listening...</p>
              <button
                onClick={stopListening}
                className="mt-2 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                Stop Recording
              </button>
            </div>
          )}

          {step === 'confirming' && (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-16 h-16 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-xl text-yellow-700 font-medium">Saving...</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl text-green-700 font-medium">Service Logged!</p>
            </div>
          )}
        </div>

        {/* Current Data Display */}
        {(matchedCustomer || selectedVehicle || serviceDescription) && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            {matchedCustomer && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium text-gray-900">{matchedCustomer.name}</span>
              </div>
            )}
            {selectedVehicle && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Vehicle:</span>
                <span className="font-medium text-gray-900">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </span>
              </div>
            )}
            {serviceDescription && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Service:</span>
                <span className="font-medium text-gray-900">{serviceDescription}</span>
              </div>
            )}
            {laborHours > 0 && serviceDescription && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Hours:</span>
                <span className="font-medium text-gray-900">{laborHours}</span>
              </div>
            )}
          </div>
        )}

        {/* Last Transcript */}
        {transcript && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-600 font-medium mb-1">I heard:</p>
            <p className="text-blue-900 italic">"{transcript}"</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {step === 'complete' && (
            <>
              <button
                onClick={() => { resetFlow(); startVoiceFlow(); }}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Log Another Service
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </>
          )}

          {step !== 'idle' && step !== 'complete' && (
            <button
              onClick={resetFlow}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p className="font-medium mb-2">How it works:</p>
        <ol className="space-y-1">
          <li>1. Say the customer's name when prompted</li>
          <li>2. If they have multiple vehicles, say which one</li>
          <li>3. Describe the service and hours (e.g., "Oil change, 1 hour")</li>
        </ol>
      </div>
    </div>
  );
}

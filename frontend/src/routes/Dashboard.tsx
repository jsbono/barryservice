import { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { StatsSummary } from '../components/dashboard/StatsSummary';
import { UpcomingServicesTable } from '../components/dashboard/UpcomingServicesTable';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { ExpectedServicesTable } from '../components/dashboard/ExpectedServicesTable';
import { InsightsPanel } from '../components/insights/InsightsPanel';
import { getCustomers, getVehicles, getUpcomingServices, getRecentActivity, createServiceLog, transcribeAudio } from '../lib/api';
import { ServiceLog, Customer, Vehicle } from '../lib/types';

type VoiceStep = 'idle' | 'asking-customer' | 'listening-customer' | 'asking-vehicle' | 'listening-vehicle' | 'asking-service' | 'listening-service' | 'confirming' | 'complete';

function VoiceServiceModal({ isOpen, onClose, customers, vehicles }: {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  vehicles: Vehicle[];
}) {
  const [step, setStep] = useState<VoiceStep>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [serviceDescription, setServiceDescription] = useState('');
  const [laborHours, setLaborHours] = useState<number>(1);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetFlow();
      // Auto-start voice flow after a brief delay
      const timer = setTimeout(() => {
        startVoiceFlow();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return; }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synthRef.current.speak(utterance);
    });
  };

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
          if (e.data.size > 0) chunksRef.current.push(e.data);
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
          } catch (err) { reject(err); }
        };

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') mediaRecorder.stop();
        }, 8000);
      } catch (err) { reject(err); }
    });
  };

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const findCustomerByName = (spokenName: string): Customer | null => {
    const nameLower = spokenName.toLowerCase().trim();
    let match = customers.find(c => c.name.toLowerCase() === nameLower);
    if (!match) {
      match = customers.find(c =>
        c.name.toLowerCase().includes(nameLower) ||
        nameLower.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().split(' ').some(part => nameLower.includes(part) && part.length > 2)
      );
    }
    return match || null;
  };

  const findVehicleByDescription = (spokenDesc: string): Vehicle | null => {
    const descLower = spokenDesc.toLowerCase().trim();
    return customerVehicles.find(v =>
      `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(descLower) ||
      descLower.includes(v.make.toLowerCase()) ||
      descLower.includes(v.model.toLowerCase()) ||
      (v.year && descLower.includes(v.year.toString()))
    ) || null;
  };

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

    service = service.replace(/^(i did|we did|performed|completed)\s+/i, '').replace(/\s+/g, ' ').trim();
    return { service, hours };
  };

  const startVoiceFlow = async () => {
    setError(null);
    setTranscript('');

    try {
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
      const custVehicles = vehicles.filter(v => v.customer_id === customer.id);
      setCustomerVehicles(custVehicles);

      if (custVehicles.length === 0) {
        await speak(`${customer.name} has no vehicles registered.`);
        setStep('idle');
        return;
      }

      let vehicle: Vehicle;

      if (custVehicles.length === 1) {
        vehicle = custVehicles[0];
        setSelectedVehicle(vehicle);
        await speak(`Found ${customer.name} with a ${vehicle.year} ${vehicle.make} ${vehicle.model}.`);
      } else {
        setStep('asking-vehicle');
        const vehicleList = custVehicles.map(v => `${v.year} ${v.make} ${v.model}`).join(', or ');
        await speak(`${customer.name} has ${custVehicles.length} vehicles: ${vehicleList}. Which vehicle?`);

        setStep('listening-vehicle');
        const vehicleDesc = await startListening();

        const matchedVehicle = findVehicleByDescription(vehicleDesc);
        if (!matchedVehicle) {
          await speak("Sorry, I couldn't match that vehicle.");
          setStep('idle');
          return;
        }

        vehicle = matchedVehicle;
        setSelectedVehicle(vehicle);
        await speak(`Selected the ${vehicle.year} ${vehicle.make} ${vehicle.model}.`);
      }

      setStep('asking-service');
      await speak("Please state the service done and how many hours.");

      setStep('listening-service');
      const serviceText = await startListening();

      const { service, hours } = parseServiceAndHours(serviceText);
      setServiceDescription(service);
      setLaborHours(hours);

      setStep('confirming');
      await speak(`Got it. ${service}, ${hours} hours. Saving now.`);

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
    setCustomerVehicles([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg md:mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Log Service</h2>
            <p className="text-blue-100 text-sm">Voice-guided service entry</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Display */}
          <div className="text-center mb-6">
            {step === 'idle' && (
              <div className="space-y-4">
                <button
                  onClick={startVoiceFlow}
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-105 cursor-pointer"
                >
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <p className="text-gray-500 text-sm">Starting voice entry...</p>
              </div>
            )}

            {(step === 'asking-customer' || step === 'asking-vehicle' || step === 'asking-service') && (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728" />
                  </svg>
                </div>
                <p className="text-green-700 font-medium">Speaking...</p>
                <p className="text-gray-500 text-sm">
                  {step === 'asking-customer' && '"Please say the name of the customer"'}
                  {step === 'asking-vehicle' && '"Which vehicle?"'}
                  {step === 'asking-service' && '"Please state the service and hours"'}
                </p>
              </div>
            )}

            {(step === 'listening-customer' || step === 'listening-vehicle' || step === 'listening-service') && (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg relative">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-30" />
                </div>
                <p className="text-red-600 font-medium">Listening...</p>
                <button onClick={stopListening} className="px-4 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700">
                  Stop Recording
                </button>
              </div>
            )}

            {step === 'confirming' && (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-yellow-700 font-medium">Saving...</p>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 font-medium">Service Logged!</p>
              </div>
            )}
          </div>

          {/* Data Display */}
          {(matchedCustomer || selectedVehicle || serviceDescription) && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
              {matchedCustomer && <p><span className="text-gray-500">Customer:</span> <span className="font-medium">{matchedCustomer.name}</span></p>}
              {selectedVehicle && <p><span className="text-gray-500">Vehicle:</span> <span className="font-medium">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span></p>}
              {serviceDescription && <p><span className="text-gray-500">Service:</span> <span className="font-medium">{serviceDescription}</span></p>}
              {serviceDescription && <p><span className="text-gray-500">Hours:</span> <span className="font-medium">{laborHours}</span></p>}
            </div>
          )}

          {transcript && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
              <p className="text-blue-600">I heard: <span className="italic">"{transcript}"</span></p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3">
            {step === 'complete' && (
              <>
                <button onClick={() => { resetFlow(); startVoiceFlow(); }} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Log Another
                </button>
                <button onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Done
                </button>
              </>
            )}
            {step !== 'idle' && step !== 'complete' && (
              <button onClick={resetFlow} className="px-5 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const [stats, setStats] = useState({ customersCount: 0, vehiclesCount: 0, upcomingServicesCount: 0 });
  const [upcomingServices, setUpcomingServices] = useState<ServiceLog[]>([]);
  const [recentActivity, setRecentActivity] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [customersRes, vehiclesRes, upcomingRes, recentRes] = await Promise.all([
          getCustomers(500),
          getVehicles(undefined, 500),
          getUpcomingServices(),
          getRecentActivity(),
        ]);

        setStats({
          customersCount: customersRes.total,
          vehiclesCount: vehiclesRes.total,
          upcomingServicesCount: upcomingRes.services.length,
        });
        setCustomers(customersRes.customers);
        setVehicles(vehiclesRes.vehicles);
        setUpcomingServices(upcomingRes.services);
        setRecentActivity(recentRes.services);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{ background: 'var(--glow-accent)', filter: 'blur(12px)', transform: 'scale(1.5)' }}
          />
          <div className="spinner-lg relative" />
        </div>
        <span className="mt-5 text-sm font-medium" style={{ color: 'var(--slate-500)' }}>
          Loading dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto">
      {/* Page Header with Log Service Button */}
      <div className="mb-8 animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="precision-line" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold" style={{ color: 'var(--slate-800)' }}>
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--slate-500)' }}>
            Monitor your shop's performance and upcoming services
          </p>
        </div>

        {/* Log Service Button */}
        <button
          onClick={() => setShowVoiceModal(true)}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Log Service
        </button>
      </div>

      {/* Stats Summary */}
      <div className="animate-slide-up delay-100">
        <StatsSummary stats={stats} />
      </div>

      {/* AI Insights Panel */}
      <div className="mt-6 animate-slide-up delay-150">
        <InsightsPanel />
      </div>

      {/* Expected Services - Main Feature */}
      <div className="mt-6 animate-slide-up delay-200">
        <ExpectedServicesTable />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="animate-slide-up delay-300">
          <UpcomingServicesTable services={upcomingServices} />
        </div>
        <div className="animate-slide-up delay-400">
          <RecentActivityList activities={recentActivity} />
        </div>
      </div>

      {/* Voice Service Modal */}
      <VoiceServiceModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        customers={customers}
        vehicles={vehicles}
      />
    </div>
  );
}

export function Dashboard() {
  const location = useLocation();
  const isOverview = location.pathname === '/dashboard';

  return (
    <div className="flex min-h-screen md:min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0" style={{ background: 'var(--slate-50)' }}>
        {isOverview ? <DashboardOverview /> : <Outlet />}
      </main>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Invoice, InvoiceStatus, InvoiceStats, ServicePrice, Customer, Vehicle, ServiceLog } from '../lib/types';
import {
  getInvoices,
  getInvoiceStats,
  downloadInvoicePdf,
  sendInvoice,
  markInvoicePaid,
  deleteInvoice,
  getServicePrices,
  createQuickInvoice,
  getCustomers,
  getVehicles,
  getServices,
  transcribeAudio,
} from '../lib/api';

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-600',
};

// Voice Invoice Modal Component
type VoiceInvoiceStep =
  | 'idle'
  | 'asking-customer' | 'listening-customer'
  | 'asking-vehicle' | 'listening-vehicle'
  | 'asking-service-hours' | 'listening-service-hours'
  | 'asking-service-price' | 'listening-service-price'
  | 'asking-more' | 'listening-more'
  | 'asking-custom-service' | 'listening-custom-service'
  | 'asking-custom-hours' | 'listening-custom-hours'
  | 'asking-custom-price' | 'listening-custom-price'
  | 'creating' | 'complete' | 'cancelled';

interface InvoiceLineItem {
  name: string;
  hours: number;
  price: number;
}

interface VoiceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  servicePrices: ServicePrice[];
  onInvoiceCreated: () => void;
}

function VoiceInvoiceModal({ isOpen, onClose, customers, servicePrices, onInvoiceCreated }: VoiceInvoiceModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<VoiceInvoiceStep>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [recentServices, setRecentServices] = useState<ServiceLog[]>([]);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

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
      utterance.rate = 0.95;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      synthRef.current.speak(utterance);
    });
  };

  const startListening = async (maxRetries: number = 2): Promise<string> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const transcript = await new Promise<string>(async (resolve, reject) => {
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

              // Check if we have enough audio data
              if (blob.size < 1000) {
                reject(new Error('Audio too short. Please speak louder or longer.'));
                return;
              }

              try {
                const result = await transcribeAudio(blob);
                if (result.success && result.transcript && result.transcript.trim().length > 0) {
                  setTranscript(result.transcript);
                  resolve(result.transcript);
                } else {
                  reject(new Error('Could not understand audio. Please try again.'));
                }
              } catch (err) { reject(err); }
            };

            mediaRecorder.start();
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') mediaRecorder.stop();
            }, 6000);
          } catch (err) { reject(err); }
        });

        return transcript;
      } catch (err) {
        if (attempt < maxRetries) {
          // Wait briefly and play retry prompt
          await speak("I didn't catch that. Please try again.");
          continue;
        }
        throw err;
      }
    }
    throw new Error('Could not transcribe audio after retries');
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

  const isYesResponse = (text: string): boolean => {
    const yesPatterns = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'correct', 'affirmative', 'please', 'go ahead'];
    return yesPatterns.some(p => text.toLowerCase().includes(p));
  };

  // Parse hours from spoken text
  const parseHours = (text: string): number => {
    const wordToNumber: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'half': 0.5, 'a half': 0.5, 'an': 1, 'a': 1,
      'one and a half': 1.5, 'two and a half': 2.5, 'three and a half': 3.5,
      'four and a half': 4.5, 'five and a half': 5.5,
    };

    // Try numeric first
    const numMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) return parseFloat(numMatch[1]);

    // Try word-based
    const textLower = text.toLowerCase();
    for (const [word, num] of Object.entries(wordToNumber)) {
      if (textLower.includes(word)) return num;
    }

    return 1; // Default
  };

  // Parse price from spoken text
  const parsePrice = (text: string): number => {
    // Match patterns like "$50", "50 dollars", "fifty dollars", "50"
    const numMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
    if (numMatch) return parseFloat(numMatch[1]);

    // Word numbers for common prices
    const wordPrices: Record<string, number> = {
      'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
      'hundred': 100, 'one fifty': 150, 'two hundred': 200, 'two fifty': 250,
      'three hundred': 300, 'forty': 40, 'thirty': 30, 'twenty': 20,
    };

    const textLower = text.toLowerCase();
    for (const [word, price] of Object.entries(wordPrices)) {
      if (textLower.includes(word)) return price;
    }

    return 95; // Default
  };

  const getServicePrice = (serviceType: string): ServicePrice | undefined => {
    return servicePrices.find(p =>
      p.service_type.toLowerCase() === serviceType.toLowerCase() ||
      p.display_name.toLowerCase().includes(serviceType.toLowerCase().replace(/_/g, ' '))
    );
  };

  const formatServiceName = (service: ServiceLog): string => {
    const price = getServicePrice(service.service_type);
    return price?.display_name || service.service_type.replace(/_/g, ' ');
  };

  const calculateTotal = (): number => {
    return invoiceItems.reduce((total, item) => total + item.price, 0);
  };

  const loadVehiclesForCustomer = async (customerId: string): Promise<Vehicle[]> => {
    try {
      const res = await getVehicles(customerId);
      return res.vehicles;
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      return [];
    }
  };

  const loadRecentServicesForVehicle = async (vehicleId: string): Promise<ServiceLog[]> => {
    try {
      const res = await getServices(vehicleId, 100);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return res.services.filter(s => {
        const serviceDate = new Date(s.service_date);
        return serviceDate >= thirtyDaysAgo;
      });
    } catch (error) {
      console.error('Failed to load services:', error);
      return [];
    }
  };

  const startVoiceFlow = async () => {
    setError(null);
    setTranscript('');

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

      // Load vehicles for this customer
      const vehicles = await loadVehiclesForCustomer(customer.id);
      setCustomerVehicles(vehicles);

      if (vehicles.length === 0) {
        await speak(`${customer.name} has no vehicles registered.`);
        setStep('idle');
        return;
      }

      // Step 2: Ask for vehicle
      let vehicle: Vehicle;

      if (vehicles.length === 1) {
        vehicle = vehicles[0];
        setSelectedVehicle(vehicle);
        await speak(`Found ${customer.name} with a ${vehicle.year} ${vehicle.make} ${vehicle.model}.`);
      } else {
        setStep('asking-vehicle');
        const vehicleList = vehicles.map(v => `${v.year} ${v.make} ${v.model}`).join(', or ');
        await speak(`${customer.name} has ${vehicles.length} vehicles: ${vehicleList}. Which vehicle?`);

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

      // Step 3: Load recent services
      const services = await loadRecentServicesForVehicle(vehicle.id);
      setRecentServices(services);

      const items: InvoiceLineItem[] = [];

      // Helper to check if response is "done"
      const isDoneResponse = (text: string): boolean => {
        const donePatterns = ['done', 'finished', 'that\'s it', 'thats it', 'skip', 'stop', 'no more'];
        return donePatterns.some(p => text.toLowerCase().includes(p));
      };

      if (services.length > 0) {
        await speak(`Found ${services.length} service${services.length > 1 ? 's' : ''} in the last 30 days. Say done at any time to skip remaining services.`);

        // Go through each service and ask for hours and price
        for (let i = 0; i < services.length; i++) {
          setCurrentServiceIndex(i);
          const service = services[i];
          const serviceName = formatServiceName(service);
          const defaultPrice = getServicePrice(service.service_type);

          // Announce the service
          await speak(`Service ${i + 1}: ${serviceName}.`);

          // Ask for hours
          setStep('asking-service-hours');
          await speak("How many hours? Or say done to skip remaining services.");

          setStep('listening-service-hours');
          const hoursResponse = await startListening();

          // Check if user said "done"
          if (isDoneResponse(hoursResponse)) {
            await speak("Skipping remaining services.");
            break;
          }

          const hours = parseHours(hoursResponse);

          // Ask for price
          setStep('asking-service-price');
          const suggestedPrice = defaultPrice?.base_price || 95;
          await speak(`What's the price? The default is $${suggestedPrice}.`);

          setStep('listening-service-price');
          const priceResponse = await startListening();
          const price = parsePrice(priceResponse);

          const item: InvoiceLineItem = { name: serviceName, hours, price };
          items.push(item);
          setInvoiceItems([...items]);

          await speak(`Added ${serviceName}, ${hours} hour${hours !== 1 ? 's' : ''}, $${price}.`);
        }
      } else {
        await speak("No services found in the last 30 days for this vehicle.");
      }

      // Step 4: Ask if they want to add more - this is now the final step
      let addingMore = true;
      while (addingMore) {
        setStep('asking-more');
        await speak("Would you like to add anything else? Say yes to add more items, or no to create the invoice.");

        setStep('listening-more');
        const moreResponse = await startListening();

        if (isYesResponse(moreResponse)) {
          // Ask for custom service
          setStep('asking-custom-service');
          await speak("What service would you like to add?");

          setStep('listening-custom-service');
          const serviceResponse = await startListening();
          const customServiceName = serviceResponse.trim();

          // Ask for hours
          setStep('asking-custom-hours');
          await speak("How many hours?");

          setStep('listening-custom-hours');
          const customHoursResponse = await startListening();
          const customHours = parseHours(customHoursResponse);

          // Ask for price
          setStep('asking-custom-price');
          await speak("What's the price?");

          setStep('listening-custom-price');
          const customPriceResponse = await startListening();
          const customPrice = parsePrice(customPriceResponse);

          const customItem: InvoiceLineItem = { name: customServiceName, hours: customHours, price: customPrice };
          items.push(customItem);
          setInvoiceItems([...items]);

          await speak(`Added ${customServiceName}, ${customHours} hour${customHours !== 1 ? 's' : ''}, $${customPrice}.`);
        } else {
          // No more items - create the invoice
          addingMore = false;
        }
      }

      if (items.length === 0) {
        await speak("No items to invoice. Cancelling.");
        setStep('cancelled');
        return;
      }

      // Create the invoice directly
      const total = items.reduce((sum, item) => sum + item.price, 0);

      setStep('creating');
      await speak(`Creating invoice for $${total.toFixed(2)} plus tax.`);

      // Create the invoice
      const invoiceServices = items.map(item => ({
        name: item.name,
        price: item.price,
        labor_hours: item.hours,
      }));

      const result = await createQuickInvoice({
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        services: invoiceServices,
        tax_rate: 0.0825,
      });

      setCreatedInvoice(result.invoice);

      // Download PDF
      if (result.invoice?.id) {
        try {
          const blob = await downloadInvoicePdf(result.invoice.id);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${result.invoice.invoice_number}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (pdfError) {
          console.error('PDF download failed:', pdfError);
        }
      }

      setStep('complete');
      await speak(`Invoice ${result.invoice.invoice_number} created and PDF downloaded!`);
      onInvoiceCreated();

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
    setRecentServices([]);
    setCurrentServiceIndex(0);
    setInvoiceItems([]);
    setTranscript('');
    setError(null);
    setCustomerVehicles([]);
    setCreatedInvoice(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-xl md:mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Create Invoice</h2>
            <p className="text-purple-100 text-sm">Voice-guided invoice creation</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Status Display */}
          <div className="text-center mb-6">
            {step === 'idle' && (
              <div className="space-y-4">
                <button
                  onClick={startVoiceFlow}
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all hover:scale-105 cursor-pointer"
                >
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <p className="text-gray-500 text-sm">Starting voice invoice...</p>
              </div>
            )}

            {(step === 'asking-customer' || step === 'asking-vehicle' || step === 'asking-service-hours' || step === 'asking-service-price' || step === 'asking-more' || step === 'asking-custom-service' || step === 'asking-custom-hours' || step === 'asking-custom-price') && (
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
                  {step === 'asking-service-hours' && `"Service ${currentServiceIndex + 1}: How many hours? Or say done."`}
                  {step === 'asking-service-price' && `"What's the price?"`}
                  {step === 'asking-more' && '"Would you like to add anything else? Say yes or no."'}
                  {step === 'asking-custom-service' && '"What service would you like to add?"'}
                  {step === 'asking-custom-hours' && '"How many hours?"'}
                  {step === 'asking-custom-price' && '"What\'s the price?"'}
                </p>
              </div>
            )}

            {(step === 'listening-customer' || step === 'listening-vehicle' || step === 'listening-service-hours' || step === 'listening-service-price' || step === 'listening-more' || step === 'listening-custom-service' || step === 'listening-custom-hours' || step === 'listening-custom-price') && (
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

            {step === 'creating' && (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-yellow-700 font-medium">Creating Invoice...</p>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 font-medium">Invoice Created!</p>
                {createdInvoice && (
                  <p className="text-gray-600">Invoice #{createdInvoice.invoice_number}</p>
                )}
              </div>
            )}

            {step === 'cancelled' && (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">Invoice Creation Cancelled</p>
              </div>
            )}
          </div>

          {/* Progress Info */}
          {(matchedCustomer || selectedVehicle || invoiceItems.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm space-y-2">
              {matchedCustomer && (
                <p><span className="text-gray-500">Customer:</span> <span className="font-medium">{matchedCustomer.name}</span></p>
              )}
              {selectedVehicle && (
                <p><span className="text-gray-500">Vehicle:</span> <span className="font-medium">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span></p>
              )}
              {recentServices.length > 0 && step !== 'idle' && step !== 'asking-customer' && step !== 'listening-customer' && (
                <p><span className="text-gray-500">Progress:</span> <span className="font-medium">{Math.min(currentServiceIndex + 1, recentServices.length)} of {recentServices.length} services</span></p>
              )}
              {invoiceItems.length > 0 && (
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <p className="text-gray-500 mb-1">Invoice Items:</p>
                  <ul className="space-y-1">
                    {invoiceItems.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-green-700">{item.name} ({item.hours} hr{item.hours !== 1 ? 's' : ''})</span>
                        <span className="font-medium">${item.price.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-bold">
                    <span>Total (before tax):</span>
                    <span className="text-green-700">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {transcript && (
            <div className="bg-purple-50 rounded-lg p-3 mb-4 text-sm">
              <p className="text-purple-600">I heard: <span className="italic">"{transcript}"</span></p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3">
            {step === 'complete' && (
              <>
                <button onClick={() => { resetFlow(); startVoiceFlow(); }} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Create Another
                </button>
                {createdInvoice && (
                  <button
                    onClick={() => { onClose(); navigate(`/dashboard/invoices/${createdInvoice.id}`); }}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Invoice
                  </button>
                )}
                <button onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Done
                </button>
              </>
            )}
            {step === 'cancelled' && (
              <>
                <button onClick={() => { resetFlow(); startVoiceFlow(); }} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Try Again
                </button>
                <button onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Close
                </button>
              </>
            )}
            {step !== 'idle' && step !== 'complete' && step !== 'cancelled' && (
              <button onClick={resetFlow} className="px-5 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Quick invoice states
  const [showQuickInvoice, setShowQuickInvoice] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [loggedServices, setLoggedServices] = useState<ServiceLog[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [quickInvoiceLoading, setQuickInvoiceLoading] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Voice invoice modal state
  const [showVoiceInvoiceModal, setShowVoiceInvoiceModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedCustomerId) {
      loadVehicles(selectedCustomerId);
    } else {
      setVehicles([]);
      setSelectedVehicleId('');
      setLoggedServices([]);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedVehicleId) {
      loadLoggedServices(selectedVehicleId);
    } else {
      setLoggedServices([]);
    }
    setSelectedServiceIds(new Set());
  }, [selectedVehicleId]);

  const loadData = async () => {
    try {
      const [invoicesRes, statsRes, customersRes, pricesRes] = await Promise.all([
        getInvoices({ status: statusFilter || undefined, limit: 100 }),
        getInvoiceStats(),
        getCustomers(500),
        getServicePrices(),
      ]);
      setInvoices(invoicesRes.invoices);
      setStats(statsRes);
      setCustomers(customersRes.customers);
      setServicePrices(pricesRes.prices);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async (customerId: string) => {
    try {
      const res = await getVehicles(customerId);
      setVehicles(res.vehicles);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const loadLoggedServices = async (vehicleId: string) => {
    try {
      const res = await getServices(vehicleId, 50);
      setLoggedServices(res.services);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const getServicePrice = (serviceType: string): ServicePrice | undefined => {
    return servicePrices.find(p =>
      p.service_type.toLowerCase() === serviceType.toLowerCase() ||
      p.display_name.toLowerCase().includes(serviceType.toLowerCase().replace(/_/g, ' '))
    );
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceTranscript('');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setVoiceProcessing(true);
    setVoiceTranscript('Processing...');

    try {
      const result = await transcribeAudio(audioBlob);
      if (result.success && result.transcript) {
        setVoiceTranscript(result.transcript);

        // Try to match spoken services with logged services
        const transcript = result.transcript.toLowerCase();
        const matchedServices = new Set<string>();

        loggedServices.forEach(service => {
          const serviceType = service.service_type.toLowerCase().replace(/_/g, ' ');
          const notes = (service.notes || '').toLowerCase();

          // Check various matching patterns
          if (transcript.includes(serviceType) ||
              serviceType.split(' ').some(word => word.length > 3 && transcript.includes(word)) ||
              (notes && transcript.includes(notes.substring(0, 20)))) {
            matchedServices.add(service.id);
          }
        });

        if (matchedServices.size > 0) {
          setSelectedServiceIds(matchedServices);
        }
      } else {
        setVoiceTranscript('Could not transcribe audio. Please try again or select services manually.');
      }
    } catch (error) {
      console.error('Failed to process voice:', error);
      setVoiceTranscript('Error processing voice. Please select services manually.');
    } finally {
      setVoiceProcessing(false);
    }
  };

  const toggleServiceSelection = (serviceId: string) => {
    const newSelected = new Set(selectedServiceIds);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServiceIds(newSelected);
  };

  const calculateTotal = (): number => {
    let total = 0;
    selectedServiceIds.forEach(serviceId => {
      const service = loggedServices.find(s => s.id === serviceId);
      if (service) {
        const price = getServicePrice(service.service_type);
        if (price) {
          total += price.base_price;
        } else {
          total += 95; // Default price if no preset found
        }
      }
    });
    return total;
  };

  const handleCreateQuickInvoice = async () => {
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    if (!selectedVehicleId) {
      alert('Please select a vehicle');
      return;
    }

    if (selectedServiceIds.size === 0) {
      alert('Please select at least one service');
      return;
    }

    setQuickInvoiceLoading(true);

    try {
      // Build services array from selected logged services with preset prices
      const services = Array.from(selectedServiceIds).map(id => {
        const service = loggedServices.find(s => s.id === id);
        const price = service ? getServicePrice(service.service_type) : null;
        return {
          name: price?.display_name || service?.service_type.replace(/_/g, ' ') || 'Service',
          price: price?.base_price || 95,
          labor_hours: price?.labor_hours || 1,
        };
      });

      const result = await createQuickInvoice({
        customer_id: selectedCustomerId,
        vehicle_id: selectedVehicleId || undefined,
        services,
        tax_rate: 0.0825,
      });

      // Auto-download PDF
      if (result.invoice?.id) {
        try {
          const blob = await downloadInvoicePdf(result.invoice.id);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${result.invoice.invoice_number}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (pdfError) {
          console.error('PDF download failed:', pdfError);
        }
      }

      await loadData();
      setShowQuickInvoice(false);
      resetQuickInvoice();
      navigate(`/dashboard/invoices/${result.invoice.id}`);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setQuickInvoiceLoading(false);
    }
  };

  const resetQuickInvoice = () => {
    setSelectedCustomerId('');
    setSelectedVehicleId('');
    setSelectedServiceIds(new Set());
    setLoggedServices([]);
    setVoiceTranscript('');
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      setActionLoading(invoice.id);
      const blob = await downloadInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    if (!confirm(`Send invoice ${invoice.invoice_number} to ${invoice.customer?.email}?`)) return;

    try {
      setActionLoading(invoice.id);
      await sendInvoice(invoice.id);
      await loadData();
      alert('Invoice sent successfully');
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      setActionLoading(invoice.id);
      await markInvoicePaid(invoice.id);
      await loadData();
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      alert('Failed to mark invoice as paid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return;

    try {
      setActionLoading(invoice.id);
      await deleteInvoice(invoice.id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading invoices...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-0">Invoices</h1>
        <div className="flex flex-wrap gap-3">
          {/* Voice Create Invoice Button */}
          <button
            onClick={() => setShowVoiceInvoiceModal(true)}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Create Invoice
          </button>
          <button
            onClick={() => {
              setShowQuickInvoice(!showQuickInvoice);
              if (!showQuickInvoice) resetQuickInvoice();
            }}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              showQuickInvoice
                ? 'bg-gray-200 text-gray-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {showQuickInvoice ? 'Close Quick Invoice' : 'Quick Invoice'}
          </button>
          <Link
            to="/dashboard/invoices/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Full Invoice Form
          </Link>
        </div>
      </div>

      {/* Quick Invoice Panel */}
      {showQuickInvoice && (
        <div className="bg-white rounded-lg shadow-lg mb-6 border-2 border-green-200">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-lg">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Invoice Creator
            </h2>
            <p className="text-green-100 text-sm">Select a customer, then choose services to bill for</p>
          </div>

          <div className="p-6">
            {/* Step 1: Customer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Step 1: Select Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
              >
                <option value="">-- Choose a customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Vehicle Selection */}
            {selectedCustomerId && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Step 2: Select Vehicle
                </label>
                {vehicles.length === 0 ? (
                  <p className="text-gray-500">No vehicles found for this customer</p>
                ) : (
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  >
                    <option value="">-- Choose a vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model} {v.vin ? `(${v.vin})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Step 3: Voice Input or Manual Selection */}
            {selectedVehicleId && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Step 3: Select Logged Services to Bill (use voice or click)
                </label>

                {/* Voice Input */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-800">Voice Input</h4>
                      <p className="text-sm text-blue-600">
                        Say what you want to charge for (e.g., "oil change and brake service")
                      </p>
                    </div>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={voiceProcessing}
                      className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : voiceProcessing
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isRecording ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        )}
                      </svg>
                      {isRecording ? 'Stop' : voiceProcessing ? 'Processing...' : 'Record'}
                    </button>
                  </div>
                  {voiceTranscript && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Heard:</span> "{voiceTranscript}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Logged Services List */}
                {loggedServices.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">No logged services found for this vehicle.</p>
                    <p className="text-sm text-gray-400 mt-1">Log a service first to create an invoice.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                    {loggedServices.map((service) => {
                      const isSelected = selectedServiceIds.has(service.id);
                      const price = getServicePrice(service.service_type);

                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleServiceSelection(service.id)}
                          className={`w-full flex items-center justify-between p-4 text-left rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {service.service_type.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(service.service_date)}
                                {service.mileage_at_service && ` • ${service.mileage_at_service.toLocaleString()} mi`}
                              </p>
                              {service.notes && (
                                <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{service.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {price ? (
                              <>
                                <span className="text-xl font-bold text-green-600">
                                  {formatCurrency(price.base_price)}
                                </span>
                                <p className="text-xs text-gray-500">{price.labor_hours}h labor</p>
                              </>
                            ) : (
                              <>
                                <span className="text-xl font-bold text-amber-600">
                                  {formatCurrency(95)}
                                </span>
                                <p className="text-xs text-amber-500">Default price</p>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Summary & Create Button */}
            {selectedServiceIds.size > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-green-700">
                      {selectedServiceIds.size} service{selectedServiceIds.size > 1 ? 's' : ''} selected
                    </p>
                    <p className="text-2xl font-bold text-green-800">
                      Total: {formatCurrency(calculateTotal())}
                    </p>
                    <p className="text-xs text-green-600">+ 8.25% tax at checkout</p>
                  </div>
                  <button
                    onClick={handleCreateQuickInvoice}
                    disabled={quickInvoiceLoading}
                    className="px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {quickInvoiceLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Create Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.outstanding_amount)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-2xl font-bold text-blue-600">{stats.paid_count}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue_count}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="p-4 hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/dashboard/invoices/${invoice.id}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {invoice.invoice_number}
                    </Link>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[invoice.status]}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 truncate">{invoice.customer?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">
                    {invoice.vehicle ? `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : 'No vehicle'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(invoice.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                  <div className="flex justify-end gap-1 mt-2">
                    {actionLoading === invoice.id ? (
                      <span className="text-xs text-gray-400">...</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDownloadPdf(invoice)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg touch-target"
                          aria-label="Download PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleSendInvoice(invoice)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg touch-target"
                            aria-label="Send invoice"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <button
                            onClick={() => handleMarkPaid(invoice)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg touch-target"
                            aria-label="Mark as paid"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/dashboard/invoices/${invoice.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.customer?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.vehicle
                      ? `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}`
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[invoice.status]
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      {actionLoading === invoice.id ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDownloadPdf(invoice)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Download PDF"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          {invoice.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleSendInvoice(invoice)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Send to Customer"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(invoice)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <button
                              onClick={() => handleMarkPaid(invoice)}
                              className="text-green-600 hover:text-green-800"
                              title="Mark as Paid"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No invoices found. Click "Create Invoice" to create your first invoice using voice.
          </div>
        )}
      </div>

      {/* Voice Invoice Modal */}
      <VoiceInvoiceModal
        isOpen={showVoiceInvoiceModal}
        onClose={() => setShowVoiceInvoiceModal(false)}
        customers={customers}
        servicePrices={servicePrices}
        onInvoiceCreated={loadData}
      />
    </div>
  );
}

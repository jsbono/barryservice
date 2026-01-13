import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMakes, getModels, getYears, getServiceRecommendations } from '../lib/api';
import { ServiceRecommendation } from '../lib/types';
import { VehicleImage } from '../components/vehicles/VehicleImage';

// Service data for the services section
const services = [
  {
    icon: 'oil',
    name: 'Oil Change & Maintenance',
    description: 'Full synthetic and conventional oil changes with multi-point inspection',
    time: '30-45 min',
    details: ['Oil and filter replacement', 'Fluid level check', 'Tire pressure check', 'Visual brake inspection']
  },
  {
    icon: 'brake',
    name: 'Brake Service',
    description: 'Pads, rotors, fluid flush, and complete brake system inspection',
    time: '1-2 hours',
    details: ['Brake pad replacement', 'Rotor resurfacing or replacement', 'Brake fluid flush', 'Caliper inspection']
  },
  {
    icon: 'engine',
    name: 'Check Engine Diagnostics',
    description: 'Computer diagnostics to identify and resolve warning lights',
    time: '30-60 min',
    details: ['OBD-II scan', 'Code interpretation', 'System testing', 'Repair recommendations']
  },
  {
    icon: 'battery',
    name: 'Battery & Charging',
    description: 'Battery testing, replacement, and alternator diagnostics',
    time: '15-45 min',
    details: ['Battery load test', 'Charging system check', 'Terminal cleaning', 'Battery replacement']
  },
  {
    icon: 'suspension',
    name: 'Suspension & Steering',
    description: 'Shocks, struts, tie rods, and alignment services',
    time: '1-3 hours',
    details: ['Shock/strut replacement', 'Tie rod ends', 'Ball joints', 'Wheel alignment']
  },
  {
    icon: 'cooling',
    name: 'Cooling System',
    description: 'Radiator, water pump, thermostat, and coolant services',
    time: '1-2 hours',
    details: ['Coolant flush', 'Radiator repair', 'Water pump replacement', 'Thermostat service']
  },
  {
    icon: 'tire',
    name: 'Tires & Alignment',
    description: 'Tire sales, mounting, balancing, rotation, and alignment',
    time: '30 min - 1 hour',
    details: ['Tire installation', 'Wheel balancing', 'Tire rotation', '4-wheel alignment']
  },
  {
    icon: 'inspection',
    name: 'Pre-Purchase Inspection',
    description: 'Comprehensive inspection before you buy a used vehicle',
    time: '1-2 hours',
    details: ['150+ point inspection', 'Test drive evaluation', 'Fluid analysis', 'Written report']
  },
];

const reviews = [
  { name: 'Michael R.', car: '2019 Honda Accord', quote: 'Finally, a shop that shows me exactly what was done. The digital records are a game-changer.', rating: 5, date: '2 weeks ago' },
  { name: 'Sarah K.', car: '2021 Toyota RAV4', quote: 'No surprise charges. They called before doing anything extra. Will definitely be back.', rating: 5, date: '1 month ago' },
  { name: 'James T.', car: '2018 Ford F-150', quote: 'Quick service, fair prices, and they actually explain things in plain English.', rating: 5, date: '3 weeks ago' },
  { name: 'Emily L.', car: '2020 Subaru Outback', quote: 'Love the customer portal. I can see all my service history and what\'s coming up next.', rating: 5, date: '1 week ago' },
];

// Icon components for services
function ServiceIcon({ type, className }: { type: string; className?: string }) {
  const iconClass = className || "w-6 h-6";

  switch (type) {
    case 'oil':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
    case 'brake':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} /><circle cx="12" cy="12" r="4" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>;
    case 'engine':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>;
    case 'battery':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-3-7v2m3 14H9a2 2 0 01-2-2V6a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0114.07 1h.86a2 2 0 011.664.89l.812 1.22A2 2 0 0019.07 4H20a2 2 0 012 2v12a2 2 0 01-2 2h-5" /></svg>;
    case 'suspension':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;
    case 'cooling':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m-8-9H3m18 0h-1M5.6 5.6l.7.7m12.1-.7l-.7.7M5.6 18.4l.7-.7m12.1.7l-.7-.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case 'tire':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><circle cx="12" cy="12" r="3" strokeWidth={2} /></svg>;
    case 'inspection':
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    default:
      return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  }
}

export function PublicHome() {
  // Assessment form state
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [mileage, setMileage] = useState('');
  const [checkEngineLight, setCheckEngineLight] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<ServiceRecommendation[] | null>(null);
  const [activeTab, setActiveTab] = useState<'now' | 'soon' | 'good'>('now');

  // Service modal state
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);

  // Fallback makes data if API returns empty
  const fallbackMakes = [
    'Acura', 'Audi', 'BMW', 'Chevrolet', 'Ford', 'GMC', 'Honda', 'Hyundai',
    'Jeep', 'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Nissan', 'RAM',
    'Subaru', 'Tesla', 'Toyota', 'Volkswagen'
  ];

  // Load makes on mount
  useEffect(() => {
    getMakes()
      .then(res => {
        // Use API data if available, otherwise use fallback
        setMakes(res.makes && res.makes.length > 0 ? res.makes : fallbackMakes);
      })
      .catch(() => {
        // On error, use fallback makes
        setMakes(fallbackMakes);
      });
  }, []);

  // Fallback models by make
  const fallbackModels: Record<string, string[]> = {
    'Acura': ['MDX', 'RDX', 'TLX', 'ILX'],
    'Audi': ['A4', 'A6', 'Q5', 'Q7'],
    'BMW': ['3 Series', '5 Series', 'X3', 'X5'],
    'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe'],
    'Ford': ['F-150', 'Escape', 'Explorer', 'Mustang'],
    'GMC': ['Sierra', 'Yukon', 'Terrain', 'Acadia'],
    'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe'],
    'Jeep': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass'],
    'Kia': ['K5', 'Sportage', 'Telluride', 'Sorento'],
    'Lexus': ['ES', 'RX', 'NX', 'GX'],
    'Mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLE', 'GLC'],
    'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder'],
    'RAM': ['1500', '2500', '3500'],
    'Subaru': ['Outback', 'Forester', 'Crosstrek', 'Impreza'],
    'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X'],
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra'],
    'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas'],
  };

  // Load models when make changes
  useEffect(() => {
    if (selectedMake) {
      setModels([]);
      setYears([]);
      setSelectedModel('');
      setSelectedYear('');
      getModels(selectedMake)
        .then(res => {
          // Use API data if available, otherwise use fallback
          const apiModels = res.models && res.models.length > 0 ? res.models : (fallbackModels[selectedMake] || []);
          setModels(apiModels);
        })
        .catch(() => {
          setModels(fallbackModels[selectedMake] || []);
        });
    }
  }, [selectedMake]);

  // Generate fallback years (current year + 1 down to 1990)
  const generateFallbackYears = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear + 1; year >= 1990; year--) {
      years.push(year);
    }
    return years;
  };

  // Load years when model changes
  useEffect(() => {
    if (selectedMake && selectedModel) {
      setYears([]);
      setSelectedYear('');
      getYears(selectedMake, selectedModel)
        .then(res => {
          // Use API data if available, otherwise use fallback
          setYears(res.years && res.years.length > 0 ? res.years : generateFallbackYears());
        })
        .catch(() => {
          setYears(generateFallbackYears());
        });
    }
  }, [selectedMake, selectedModel]);

  const handleAssessment = async () => {
    if (!selectedMake || !selectedModel || !selectedYear || !mileage) return;

    setLoading(true);
    try {
      const result = await getServiceRecommendations(selectedMake, selectedModel, selectedYear);
      setAssessmentResults(result.services);
      setActiveTab('now');
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = selectedMake && selectedModel && selectedYear && mileage;

  // Categorize results (simplified - in production would use actual urgency data)
  const categorizedResults = {
    now: assessmentResults?.slice(0, 3) || [],
    soon: assessmentResults?.slice(3, 6) || [],
    good: assessmentResults?.slice(6) || [],
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24">
          {/* Mobile: Stack with tagline first, then image */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Content - Always first on mobile */}
            <div className="order-1 lg:order-1">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Fast, honest repairs.
                <br />
                <span className="text-amber-500">Accurate invoices.</span>
                <br />
                Zero confusion.
              </h1>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-gray-700 leading-relaxed max-w-xl">
                See what your car needs next, track every service, and get clear estimates from a real mechanic.
              </p>

              {/* CTAs */}
              <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
                <a
                  href="#assessment"
                  className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-900 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  Get Free Assessment
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a
                  href="#services"
                  className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  View Services
                </a>
              </div>

              {/* Trust Badges - Hidden on mobile, shown on larger screens */}
              <div className="hidden sm:flex mt-10 flex-wrap gap-6">
                {[
                  { icon: 'badge', text: 'ASE Certified' },
                  { icon: 'dollar', text: 'Upfront Pricing' },
                  { icon: 'document', text: 'Digital Records' },
                  { icon: 'bell', text: 'Text Updates' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {badge.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Image - Second on mobile, smaller height */}
            <div className="order-2 lg:order-2 relative w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80"
                  alt="Mechanic working on car engine"
                  className="w-full h-[200px] sm:h-[400px] lg:h-[500px] object-cover"
                />
                {/* Overlay Card - Hidden on mobile */}
                <div className="hidden sm:block absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Next Service Due</p>
                      <p className="text-sm text-gray-700">Oil Change + Multi-Point Inspection</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm text-gray-700">Est. time</p>
                      <p className="font-semibold text-amber-600">45 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Trust Badges - Horizontal scroll */}
          <div className="flex sm:hidden mt-6 gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { text: 'ASE Certified' },
              { text: 'Upfront Pricing' },
              { text: 'Digital Records' },
              { text: 'Text Updates' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-700 whitespace-nowrap bg-amber-50 px-3 py-2 rounded-full">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {badge.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FREE ASSESSMENT SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="assessment" className="py-20" style={{ background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Free Vehicle Assessment in 30 Seconds
            </h2>
            <p className="mt-4 text-lg text-gray-700">
              Enter your vehicle and mileage to see recommended service intervals
            </p>
          </div>

          {/* Assessment Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  disabled={!selectedModel}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-0 transition-colors disabled:bg-gray-50 disabled:text-gray-400 text-gray-900 bg-white appearance-none"
                  style={{ WebkitAppearance: 'menulist', color: selectedYear ? '#111827' : '#9CA3AF' }}
                >
                  <option value="" className="text-gray-400">{selectedModel ? 'Select Year' : 'Select model first'}</option>
                  {years.map(y => <option key={y} value={y} className="text-gray-900">{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-0 transition-colors text-gray-900 bg-white appearance-none"
                  style={{ WebkitAppearance: 'menulist', color: selectedMake ? '#111827' : '#9CA3AF' }}
                >
                  <option value="" className="text-gray-400">Select Make</option>
                  {makes.map(m => <option key={m} value={m} className="text-gray-900">{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedMake}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-0 transition-colors disabled:bg-gray-50 disabled:text-gray-400 text-gray-900 bg-white appearance-none"
                  style={{ WebkitAppearance: 'menulist', color: selectedModel ? '#111827' : '#9CA3AF' }}
                >
                  <option value="" className="text-gray-400">{selectedMake ? 'Select Model' : 'Select make first'}</option>
                  {models.map(m => <option key={m} value={m} className="text-gray-900">{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mileage</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Vehicle Preview - Shows when make/model/year are selected */}
            {selectedMake && selectedModel && selectedYear && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <VehicleImage
                    make={selectedMake}
                    model={selectedModel}
                    year={selectedYear}
                    size="lg"
                    className="shadow-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedYear} {selectedMake} {selectedModel}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      AI-generated vehicle image
                    </p>
                    {mileage && (
                      <div className="flex items-center mt-2 text-sm text-amber-600 font-medium">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {Number(mileage).toLocaleString()} miles
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Check Engine Toggle */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setCheckEngineLight(!checkEngineLight)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  checkEngineLight ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    checkEngineLight ? 'translate-x-6' : ''
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">Check Engine Light On?</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAssessment}
              disabled={!isFormComplete || loading}
              className={`mt-8 w-full py-4 px-8 text-lg font-semibold rounded-xl transition-all ${
                isFormComplete && !loading
                  ? 'text-gray-900 hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              style={isFormComplete && !loading ? {
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
              } : {}}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Get My Assessment'
              )}
            </button>
          </div>

          {/* Assessment Results */}
          {assessmentResults && (
            <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
              {/* Tabs */}
              <div className="flex border-b-2 border-gray-200">
                {[
                  { key: 'now', label: 'Recommended Now', count: categorizedResults.now.length },
                  { key: 'soon', label: 'Due Soon', count: categorizedResults.soon.length },
                  { key: 'good', label: 'Good for Now', count: categorizedResults.good.length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as 'now' | 'soon' | 'good')}
                    className={`flex-1 px-4 sm:px-6 py-5 text-base sm:text-lg font-bold transition-colors relative ${
                      activeTab === tab.key
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 px-2.5 py-1 rounded-full text-sm font-bold ${
                      activeTab === tab.key ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {tab.count}
                    </span>
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div className="p-6">
                {categorizedResults[activeTab].length === 0 ? (
                  <p className="text-center text-gray-700 py-8">No services in this category</p>
                ) : (
                  <div className="space-y-4">
                    {categorizedResults[activeTab].map((service, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <ServiceIcon type="oil" className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">{service.service_name}</h4>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-700">
                            {service.recommended_mileage && (
                              <span>Every {service.recommended_mileage.toLocaleString()} miles</span>
                            )}
                            {service.recommended_mileage && service.recommended_time_months && (
                              <span>•</span>
                            )}
                            {service.recommended_time_months && (
                              <span>Every {service.recommended_time_months >= 12
                                ? `${Math.floor(service.recommended_time_months / 12)} year${service.recommended_time_months >= 24 ? 's' : ''}`
                                : `${service.recommended_time_months} months`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button className="px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
                            Request Quote
                          </button>
                          <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="px-6 pb-6">
                <p className="text-xs text-gray-700 text-center">
                  This is a general recommendation based on common service intervals.
                  Final needs depend on your vehicle condition and manufacturer guidance.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SERVICES SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Services We Handle Every Day
            </h2>
            <p className="mt-4 text-lg text-gray-700">
              From routine maintenance to diagnostics, we keep it simple and documented
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <button
                key={i}
                onClick={() => setSelectedService(service)}
                className="group text-left bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                  <ServiceIcon type={service.icon} className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-sm text-gray-700">{service.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Service Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedService(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <ServiceIcon type={selectedService.icon} className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedService.name}</h3>
                </div>
                <button onClick={() => setSelectedService(null)} className="text-gray-400 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{selectedService.description}</p>
              <h4 className="font-semibold text-gray-900 mb-3">What's Included:</h4>
              <ul className="space-y-2 mb-6">
                {selectedService.details.map((detail, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {detail}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between py-4 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-700">Typical time</p>
                  <p className="font-semibold text-gray-900">{selectedService.time}</p>
                </div>
                <button
                  className="px-6 py-3 text-sm font-semibold text-gray-900 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  }}
                >
                  Book This Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              No More Guessing. Everything Gets Logged.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: 1,
                title: 'You book or request an assessment',
                description: 'Tell us your vehicle and mileage. We\'ll guide the next step.',
                icon: 'calendar',
              },
              {
                step: 2,
                title: 'We inspect, repair, and document',
                description: 'Photos, notes, parts, hours, and recommendations saved to your record.',
                icon: 'wrench',
              },
              {
                step: 3,
                title: 'You get a clean invoice and service history',
                description: 'View past invoices and what\'s due next in your portal.',
                icon: 'document',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-xl font-bold text-gray-900">
                    {item.step}
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block flex-1 h-0.5 bg-gray-700" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/portal/login"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-gray-900 rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
              }}
            >
              Create Free Account
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          REVIEWS SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="reviews" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left - Stats */}
            <div className="lg:col-span-2">
              <div className="sticky top-32">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">4.9 average rating</p>
                <p className="text-lg text-gray-700 mb-8">500+ happy customers</p>

                <div className="flex gap-4">
                  <a href="#" className="px-6 py-3 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    Read Reviews
                  </a>
                  <a href="#" className="px-6 py-3 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                    Leave a Review
                  </a>
                </div>

                {/* Trust strip */}
                <div className="mt-10 pt-10 border-t border-gray-200 space-y-4">
                  {['Warranty-friendly work', 'Clear estimates', 'No surprise add-ons'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Review Cards */}
            <div className="lg:col-span-3 space-y-6">
              {reviews.map((review, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, j) => (
                      <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{review.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{review.name}</p>
                      <p className="text-sm text-gray-700">{review.car}</p>
                    </div>
                    <p className="text-sm text-gray-400">{review.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          VALUE PROPS SECTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #fef9f0 0%, #fef3e2 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built for Customers Who Want Transparency
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: 'history', title: 'Digital service history', desc: 'Every service logged by vehicle, forever accessible' },
              { icon: 'receipt', title: 'Clear, itemized invoices', desc: 'Labor and parts broken down, no mystery charges' },
              { icon: 'camera', title: 'Photo updates and notes', desc: 'See what the mechanic sees during inspection' },
              { icon: 'bell', title: 'Service reminders', desc: 'Get notified for minor and major intervals' },
              { icon: 'cars', title: 'Multiple vehicles', desc: 'Track your whole household under one account' },
              { icon: 'lock', title: 'Secure portal access', desc: 'Passwordless login option for convenience' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-700">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA BANNER
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80"
            alt="Auto shop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900/80" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to stop guessing and start tracking?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Upfront estimates, documented work, and a portal that shows exactly what was done.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#assessment"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-gray-900 rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
              }}
            >
              Get Free Assessment
            </a>
            <a
              href="#services"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors"
            >
              Book Service
            </a>
          </div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 sm:hidden z-40">
        <div className="flex gap-3">
          <a
            href="#assessment"
            className="flex-1 py-3 text-center text-sm font-semibold text-gray-900 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
          >
            Assessment
          </a>
          <a
            href="#services"
            className="flex-1 py-3 text-center text-sm font-semibold text-white bg-gray-900 rounded-lg"
          >
            Book
          </a>
        </div>
      </div>
    </div>
  );
}

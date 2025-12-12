import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MakeModelYearSelector } from '../components/public/MakeModelYearSelector';
import { ServiceRecommendationList } from '../components/public/ServiceRecommendationList';
import { getServiceRecommendations } from '../lib/api';
import { ServiceRecommendation } from '../lib/types';

export function PublicHome() {
  const [services, setServices] = useState<ServiceRecommendation[]>([]);
  const [vehicle, setVehicle] = useState<{ make: string; model: string; year: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (make: string, model: string, year: number) => {
    setLoading(true);
    setError('');
    setVehicle({ make, model, year });

    try {
      const result = await getServiceRecommendations(make, model, year);
      setServices(result.services);
    } catch (err) {
      setError('Failed to fetch service recommendations. Please try again.');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-6 fade-in">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Trusted by 10,000+ vehicle owners
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 fade-in">
            <span className="text-gray-900">Vehicle Service</span>
            <br />
            <span className="text-gradient">Lookup</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto fade-in">
            Find recommended service intervals for your vehicle and keep your car running at its best.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16 -mt-8">
        <div className="slide-up">
          <MakeModelYearSelector onSelect={handleSelect} />
        </div>

        {error && (
          <div className="mt-6 glass-card p-4 border-l-4 border-red-500 fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-12 text-center fade-in">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Generating your vehicle report...</p>
          </div>
        )}

        {!loading && vehicle && (
          <div className="mt-8 slide-up">
            <ServiceRecommendationList services={services} vehicle={vehicle} />
          </div>
        )}

        {!vehicle && !loading && (
          <div className="mt-12 glass-card p-12 text-center fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select Your Vehicle</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Choose your vehicle's make, model, and year above to see personalized service recommendations with AI-generated artwork.
            </p>
          </div>
        )}

        {/* Customer Portal CTA */}
        <div className="mt-16 relative overflow-hidden rounded-3xl slide-up">
          <div className="absolute inset-0 animated-gradient opacity-90"></div>
          <div className="relative p-10 text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Existing Customer?
            </h2>
            <p className="text-white/90 mb-6 max-w-md mx-auto">
              Access your complete service history, recommended maintenance schedule, and upcoming appointments.
            </p>
            <Link
              to="/portal/login"
              className="inline-flex items-center bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
            >
              Customer Portal
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6 card-hover">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Accurate Data</h3>
            <p className="text-gray-500 text-sm">Manufacturer-recommended service intervals for all major makes and models.</p>
          </div>
          <div className="glass-card p-6 card-hover">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">AI Artwork</h3>
            <p className="text-gray-500 text-sm">Beautiful AI-generated artwork of your specific vehicle make and model.</p>
          </div>
          <div className="glass-card p-6 card-hover">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Mobile Ready</h3>
            <p className="text-gray-500 text-sm">Access your service information anytime, anywhere on any device.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

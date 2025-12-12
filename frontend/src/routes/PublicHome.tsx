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
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-semibold mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free Vehicle Service Guide
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-gray-900 mb-6 animate-slide-up">
            Know When Your Car
            <br />
            <span className="text-gradient-blue">Needs Service</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up delay-100">
            Get personalized maintenance recommendations for your vehicle with AI-generated artwork.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 pb-20 -mt-6">
        {/* Vehicle Selector Card */}
        <div className="animate-slide-up delay-200">
          <MakeModelYearSelector onSelect={handleSelect} />
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-6 card p-4 border-l-4 border-red-500 animate-scale-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-16 text-center animate-fade-in">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Generating your vehicle report...</p>
            <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
          </div>
        )}

        {/* Results */}
        {!loading && vehicle && (
          <div className="mt-8 animate-slide-up">
            <ServiceRecommendationList services={services} vehicle={vehicle} />
          </div>
        )}

        {/* Empty State */}
        {!vehicle && !loading && (
          <div className="mt-16 card p-12 text-center animate-fade-in delay-300">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Select Your Vehicle</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Choose your vehicle's make, model, and year above to see personalized service recommendations.
            </p>
          </div>
        )}

        {/* Customer Portal CTA */}
        <div className="mt-20 card overflow-hidden animate-fade-in delay-400">
          <div className="relative p-10 md:p-12" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1d4ed8 100%)' }}>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-3">
                  Already a Customer?
                </h2>
                <p className="text-blue-100 text-lg max-w-md">
                  Access your service history, scheduled appointments, and personalized recommendations.
                </p>
              </div>
              <Link
                to="/portal/login"
                className="flex-shrink-0 inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Customer Portal
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Accurate Data',
              description: 'Manufacturer-recommended service intervals for all major makes and models.',
              color: 'emerald'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              title: 'AI Artwork',
              description: 'Beautiful AI-generated artwork of your specific vehicle make and model.',
              color: 'blue'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ),
              title: 'Mobile Ready',
              description: 'Access your service information anytime, anywhere on any device.',
              color: 'amber'
            }
          ].map((feature, index) => (
            <div key={index} className="card p-6 card-hover animate-slide-up" style={{ animationDelay: `${400 + index * 100}ms` }}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                {feature.icon}
              </div>
              <h3 className="font-heading font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

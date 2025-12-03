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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vehicle Service Lookup
        </h1>
        <p className="text-gray-600">
          Find recommended service intervals for your vehicle
        </p>
      </div>

      <MakeModelYearSelector onSelect={handleSelect} />

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 text-center text-gray-500">
          Loading recommendations...
        </div>
      )}

      {!loading && vehicle && (
        <div className="mt-6">
          <ServiceRecommendationList services={services} vehicle={vehicle} />
        </div>
      )}

      {!vehicle && !loading && (
        <div className="mt-8 bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            Select your vehicle above to see recommended service intervals.
          </p>
        </div>
      )}

      {/* Customer Portal Link */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Existing Customer?
        </h2>
        <p className="text-blue-700 mb-4">
          Access your service history, recommended maintenance, and scheduled appointments.
        </p>
        <Link
          to="/portal/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Customer Portal Login
        </Link>
      </div>
    </div>
  );
}

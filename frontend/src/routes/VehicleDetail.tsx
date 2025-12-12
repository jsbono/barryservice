import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { VehicleInfo } from '../components/vehicles/VehicleInfo';
import { ServiceLogsTable } from '../components/vehicles/ServiceLogsTable';
import { ServiceLogForm } from '../components/vehicles/ServiceLogForm';
import { getVehicle, createServiceLog, getServiceRecommendations } from '../lib/api';
import { Vehicle, CreateServiceLogRequest, ServiceRecommendation } from '../lib/types';

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showSuggestedMaintenance, setShowSuggestedMaintenance] = useState(false);
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const loadVehicle = async () => {
    if (!id) return;
    try {
      const data = await getVehicle(id);
      setVehicle(data);
    } catch (error) {
      console.error('Failed to load vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const handleAddService = async (data: CreateServiceLogRequest) => {
    await createServiceLog(data);
    await loadVehicle();
  };

  const loadRecommendations = async () => {
    if (!vehicle) return;
    setLoadingRecommendations(true);
    try {
      const data = await getServiceRecommendations(vehicle.make, vehicle.model, vehicle.year);
      setRecommendations(data.services);
      setShowSuggestedMaintenance(true);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Determine if a service is due based on mileage
  const getServiceStatus = (rec: ServiceRecommendation) => {
    if (!vehicle?.mileage || !rec.recommended_mileage) return 'unknown';

    // Check if this service type was done recently
    const recentService = vehicle.service_logs?.find(
      (log) => log.service_type.toLowerCase() === rec.service_name.toLowerCase()
    );

    if (recentService?.next_service_mileage) {
      if (vehicle.mileage >= recentService.next_service_mileage) {
        return 'overdue';
      }
      if (vehicle.mileage >= recentService.next_service_mileage - 500) {
        return 'due-soon';
      }
      return 'ok';
    }

    // No service record - check against recommended mileage intervals
    const mileageSinceRecommended = vehicle.mileage % rec.recommended_mileage;

    if (mileageSinceRecommended > rec.recommended_mileage - 500) {
      return 'due-soon';
    }

    return 'unknown';
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading vehicle...</div>;
  }

  if (!vehicle) {
    return <div className="p-6 text-red-500">Vehicle not found.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        {vehicle.customer && (
          <Link
            to={`/dashboard/customers/${vehicle.customer.id}`}
            className="text-blue-600 hover:underline"
          >
            &larr; Back to {vehicle.customer.name}
          </Link>
        )}
      </div>

      <VehicleInfo vehicle={vehicle} />

      {vehicle.customer && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-700">Owner</h3>
          <p className="text-gray-500">
            <Link
              to={`/dashboard/customers/${vehicle.customer.id}`}
              className="text-blue-600 hover:underline"
            >
              {vehicle.customer.name}
            </Link>
            {' - '}{vehicle.customer.email}
          </p>
        </div>
      )}

      {/* Suggested Maintenance Button */}
      <div className="mt-4">
        <button
          onClick={loadRecommendations}
          disabled={loadingRecommendations}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loadingRecommendations ? 'Loading...' : 'View Suggested Maintenance'}
        </button>
      </div>

      {/* Suggested Maintenance Panel */}
      {showSuggestedMaintenance && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Suggested Maintenance for {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <button
              onClick={() => setShowSuggestedMaintenance(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Artistic Car Image Banner */}
          <div className="relative mb-4 rounded-lg overflow-hidden h-48">
            <img
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=300&fit=crop&auto=format"
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(1.2) contrast(1.1)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-transparent to-amber-900/40"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <h4 className="text-white text-xl font-bold drop-shadow-lg">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h4>
              {vehicle.mileage && (
                <p className="text-white/90 text-sm">
                  {vehicle.mileage.toLocaleString()} miles
                </p>
              )}
            </div>
          </div>

          {vehicle.mileage && (
            <p className="text-sm text-gray-600 mb-4">
              Current Mileage: <strong>{vehicle.mileage.toLocaleString()} miles</strong>
            </p>
          )}

          {recommendations.length === 0 ? (
            <p className="text-gray-500">No maintenance recommendations found for this vehicle.</p>
          ) : (
            <div className="space-y-6">
              {/* Minor Maintenance Section */}
              <div>
                <h4 className="text-md font-semibold text-blue-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Minor Maintenance (Routine Service)
                </h4>
                <div className="space-y-2">
                  {recommendations
                    .filter((rec) => rec.category === 'minor' || (!rec.category && (rec.recommended_mileage || 0) <= 25000))
                    .map((rec) => {
                      const status = getServiceStatus(rec);
                      return (
                        <div
                          key={rec.id}
                          className={`p-3 rounded-md border ${
                            status === 'overdue'
                              ? 'border-red-300 bg-red-50'
                              : status === 'due-soon'
                              ? 'border-yellow-300 bg-yellow-50'
                              : status === 'ok'
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-800">{rec.service_name}</h5>
                              <p className="text-sm text-gray-600">
                                {rec.recommended_mileage && (
                                  <span>Every {rec.recommended_mileage.toLocaleString()} miles</span>
                                )}
                                {rec.recommended_mileage && rec.recommended_time_months && ' or '}
                                {rec.recommended_time_months && (
                                  <span>every {rec.recommended_time_months} months</span>
                                )}
                              </p>
                              {vehicle.mileage && rec.recommended_mileage && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Next due around: {(Math.ceil(vehicle.mileage / rec.recommended_mileage) * rec.recommended_mileage).toLocaleString()} miles
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                status === 'overdue'
                                  ? 'bg-red-200 text-red-800'
                                  : status === 'due-soon'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : status === 'ok'
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {status === 'overdue'
                                ? 'Overdue'
                                : status === 'due-soon'
                                ? 'Due Soon'
                                : status === 'ok'
                                ? 'Up to Date'
                                : 'Check Schedule'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Major Maintenance Section */}
              <div>
                <h4 className="text-md font-semibold text-orange-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Major Maintenance (Significant Service)
                </h4>
                <div className="space-y-2">
                  {recommendations
                    .filter((rec) => rec.category === 'major' || (!rec.category && (rec.recommended_mileage || 0) > 25000))
                    .map((rec) => {
                      const status = getServiceStatus(rec);
                      return (
                        <div
                          key={rec.id}
                          className={`p-3 rounded-md border ${
                            status === 'overdue'
                              ? 'border-red-300 bg-red-50'
                              : status === 'due-soon'
                              ? 'border-yellow-300 bg-yellow-50'
                              : status === 'ok'
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-800">{rec.service_name}</h5>
                              <p className="text-sm text-gray-600">
                                {rec.recommended_mileage && (
                                  <span>Every {rec.recommended_mileage.toLocaleString()} miles</span>
                                )}
                                {rec.recommended_mileage && rec.recommended_time_months && ' or '}
                                {rec.recommended_time_months && (
                                  <span>every {rec.recommended_time_months} months</span>
                                )}
                              </p>
                              {vehicle.mileage && rec.recommended_mileage && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Next due around: {(Math.ceil(vehicle.mileage / rec.recommended_mileage) * rec.recommended_mileage).toLocaleString()} miles
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                status === 'overdue'
                                  ? 'bg-red-200 text-red-800'
                                  : status === 'due-soon'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : status === 'ok'
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {status === 'overdue'
                                ? 'Overdue'
                                : status === 'due-soon'
                                ? 'Due Soon'
                                : status === 'ok'
                                ? 'Up to Date'
                                : 'Check Schedule'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Service History</h2>
        <button
          onClick={() => setShowServiceForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Log Service
        </button>
      </div>

      <ServiceLogsTable serviceLogs={vehicle.service_logs || []} />

      {showServiceForm && (
        <ServiceLogForm
          vehicleId={vehicle.id}
          currentMileage={vehicle.mileage}
          onSubmit={handleAddService}
          onClose={() => setShowServiceForm(false)}
        />
      )}
    </div>
  );
}

import { ServiceRecommendation } from '../../lib/types';

interface Props {
  services: ServiceRecommendation[];
  vehicle: { make: string; model: string; year: number };
}

export function ServiceRecommendationList({ services, vehicle }: Props) {
  if (services.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-700">
          No service recommendations found for the {vehicle.year} {vehicle.make} {vehicle.model}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Artistic Car Image Banner */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={`https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop&auto=format`}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(1.3) contrast(1.1)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-800/40 to-amber-900/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-white/80 text-sm mt-1">Recommended Service Schedule</p>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {services.map((service) => (
          <div key={service.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{service.service_name}</h4>
                <div className="mt-1 text-sm text-gray-500 space-x-4">
                  {service.recommended_mileage && (
                    <span>Every {service.recommended_mileage.toLocaleString()} miles</span>
                  )}
                  {service.recommended_time_months && (
                    <span>
                      Every{' '}
                      {service.recommended_time_months >= 12
                        ? `${Math.floor(service.recommended_time_months / 12)} year${
                            service.recommended_time_months >= 24 ? 's' : ''
                          }`
                        : `${service.recommended_time_months} months`}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-blue-600 font-medium">
                {service.recommended_mileage && (
                  <span className="bg-blue-100 px-2 py-1 rounded text-sm">
                    {service.recommended_mileage.toLocaleString()} mi
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

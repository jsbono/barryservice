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
      <div className="bg-blue-600 text-white px-6 py-4">
        <h3 className="text-lg font-semibold">
          Recommended Services for {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
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

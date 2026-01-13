import { Link } from 'react-router-dom';
import { Vehicle } from '../../lib/types';
import { VehicleImage } from './VehicleImage';

interface Props {
  vehicles: Vehicle[];
  onDelete?: (id: string) => void;
}

export function VehiclesList({ vehicles, onDelete }: Props) {
  if (vehicles.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        No vehicles found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            {/* AI Generated Vehicle Image */}
            <VehicleImage
              make={vehicle.make}
              model={vehicle.model}
              year={vehicle.year}
              vehicleId={vehicle.id}
              size="md"
            />

            {/* Vehicle Info */}
            <div className="flex-1">
              <Link
                to={`/dashboard/vehicles/${vehicle.id}`}
                className="text-lg font-medium text-blue-600 hover:underline"
              >
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Link>
              <div className="mt-1 text-sm text-gray-500 space-x-4">
                {vehicle.vin && <span>VIN: {vehicle.vin}</span>}
                {vehicle.mileage && (
                  <span>Mileage: {vehicle.mileage.toLocaleString()} mi</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Link
                to={`/dashboard/voice?vehicle_id=${vehicle.id}`}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Log Service
              </Link>
              <Link
                to={`/dashboard/vehicles/${vehicle.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                View
              </Link>
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this vehicle?')) {
                      onDelete(vehicle.id);
                    }
                  }}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Vehicle } from '../../lib/types';

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
          <div className="flex justify-between items-start">
            <div>
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
            <div className="flex space-x-2">
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

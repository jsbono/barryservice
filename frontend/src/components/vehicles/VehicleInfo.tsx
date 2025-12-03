import { Vehicle } from '../../lib/types';

interface Props {
  vehicle: Vehicle;
}

export function VehicleInfo({ vehicle }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">VIN:</span>
          <span className="ml-2 font-medium">{vehicle.vin || 'Not provided'}</span>
        </div>
        <div>
          <span className="text-gray-500">Mileage:</span>
          <span className="ml-2 font-medium">
            {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Not recorded'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Added:</span>
          <span className="ml-2 font-medium">
            {new Date(vehicle.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

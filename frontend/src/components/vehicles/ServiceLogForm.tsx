import { useState } from 'react';
import { CreateServiceLogRequest } from '../../lib/types';

interface Props {
  vehicleId: string;
  currentMileage?: number;
  onSubmit: (data: CreateServiceLogRequest) => Promise<void>;
  onClose: () => void;
}

const SERVICE_TYPES = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'minor_service', label: 'Minor Service' },
  { value: 'major_service', label: 'Major Service' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'brake_inspection', label: 'Brake Inspection' },
  { value: 'transmission_fluid', label: 'Transmission Fluid' },
  { value: 'coolant_flush', label: 'Coolant Flush' },
  { value: 'air_filter', label: 'Air Filter' },
  { value: 'spark_plugs', label: 'Spark Plugs' },
  { value: 'other', label: 'Other' },
];

export function ServiceLogForm({ vehicleId, currentMileage, onSubmit, onClose }: Props) {
  const [serviceType, setServiceType] = useState('oil_change');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState(currentMileage?.toString() || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        vehicle_id: vehicleId,
        service_type: serviceType,
        service_date: serviceDate,
        mileage_at_service: mileage ? parseInt(mileage) : undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Log Service</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
              Service Type *
            </label>
            <select
              id="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-1">
                Service Date *
              </label>
              <input
                id="serviceDate"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">
                Mileage
              </label>
              <input
                id="mileage"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Current mileage"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Log Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

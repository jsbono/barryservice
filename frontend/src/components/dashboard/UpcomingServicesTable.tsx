import { Link } from 'react-router-dom';
import { ServiceLog } from '../../lib/types';

interface Props {
  services: ServiceLog[];
}

export function UpcomingServicesTable({ services }: Props) {
  if (services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Services</h3>
        <p className="text-gray-500">No upcoming services scheduled.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Upcoming Services</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Mileage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {service.vehicle?.customer && (
                    <Link
                      to={`/dashboard/customers/${service.vehicle.customer.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {service.vehicle.customer.name}
                    </Link>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {service.vehicle && (
                    <Link
                      to={`/dashboard/vehicles/${service.vehicle.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {service.vehicle.year} {service.vehicle.make} {service.vehicle.model}
                    </Link>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="capitalize">{service.service_type.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {service.next_service_date
                    ? new Date(service.next_service_date).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {service.next_service_mileage
                    ? `${service.next_service_mileage.toLocaleString()} mi`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

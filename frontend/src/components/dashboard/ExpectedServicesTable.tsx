import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExpectedServices, ExpectedService, ExpectedServicesResponse } from '../../lib/api';

export function ExpectedServicesTable() {
  const [data, setData] = useState<ExpectedServicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'due'>('due');

  const loadData = async () => {
    try {
      const result = await getExpectedServices(filter === 'due' ? 'due' : undefined, 30);
      setData(result);
    } catch (error) {
      console.error('Failed to load expected services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Expected Services</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Expected Services</h2>
        <p className="text-red-500">Failed to load expected services</p>
      </div>
    );
  }

  const getStatusBadge = (status: ExpectedService['status']) => {
    switch (status) {
      case 'overdue':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">
            Overdue
          </span>
        );
      case 'due_soon':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium">
            Due Soon
          </span>
        );
      case 'upcoming':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
            Upcoming
          </span>
        );
    }
  };

  const getCategoryBadge = (category: ExpectedService['category']) => {
    return category === 'major' ? (
      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
        Major
      </span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">
        Minor
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Expected Services</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('due')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'due'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Due/Overdue
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm text-gray-600">
              {data.summary.overdue} Overdue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm text-gray-600">
              {data.summary.due_soon} Due Soon
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm text-gray-600">
              {data.summary.upcoming} Upcoming
            </span>
          </div>
        </div>
      </div>

      {data.services.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No services {filter === 'due' ? 'due or overdue' : 'found'}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current / Due At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Miles Until Due
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.services.map((service, index) => (
                <tr
                  key={`${service.vehicle_id}-${service.service_name}-${index}`}
                  className={`hover:bg-gray-50 ${
                    service.status === 'overdue' ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(service.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {service.customer_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.customer_email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/dashboard/vehicles/${service.vehicle_id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {service.vehicle_info}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {service.service_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getCategoryBadge(service.category)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {service.current_mileage?.toLocaleString() || '?'} /{' '}
                    {service.next_due_mileage.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {service.miles_until_due !== null ? (
                      <span
                        className={`text-sm font-medium ${
                          service.miles_until_due <= 0
                            ? 'text-red-600'
                            : service.miles_until_due <= 1000
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {service.miles_until_due <= 0
                          ? `${Math.abs(service.miles_until_due).toLocaleString()} over`
                          : `${service.miles_until_due.toLocaleString()} mi`}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Unknown</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.services.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
          Showing {data.services.length} of {data.summary.total} expected services.
          This list is used for automated email reminders.
        </div>
      )}
    </div>
  );
}

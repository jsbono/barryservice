import { ServiceLog } from '../../lib/types';

interface Props {
  serviceLogs: ServiceLog[];
}

export function ServiceLogsTable({ serviceLogs }: Props) {
  if (serviceLogs.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        No service history recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mileage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Due Mileage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {serviceLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="capitalize font-medium">
                    {log.service_type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(log.service_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {log.mileage_at_service
                    ? `${log.mileage_at_service.toLocaleString()} mi`
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {log.next_service_date ? (
                    <span
                      className={
                        new Date(log.next_service_date) < new Date()
                          ? 'text-red-600 font-medium'
                          : 'text-gray-500'
                      }
                    >
                      {new Date(log.next_service_date).toLocaleDateString()}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {log.next_service_mileage
                    ? `${log.next_service_mileage.toLocaleString()} mi`
                    : '-'}
                </td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                  {log.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

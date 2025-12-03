import { Link } from 'react-router-dom';
import { ServiceLog } from '../../lib/types';

interface Props {
  activities: ServiceLog[];
}

export function RecentActivityList({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <p className="text-gray-500">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {activity.service_type.replace(/_/g, ' ')}
                </p>
                {activity.vehicle && (
                  <p className="text-sm text-gray-500">
                    <Link
                      to={`/dashboard/vehicles/${activity.vehicle.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {activity.vehicle.year} {activity.vehicle.make} {activity.vehicle.model}
                    </Link>
                    {activity.vehicle.customer && (
                      <span>
                        {' - '}
                        <Link
                          to={`/dashboard/customers/${activity.vehicle.customer.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {activity.vehicle.customer.name}
                        </Link>
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(activity.service_date).toLocaleDateString()}
              </div>
            </div>
            {activity.notes && (
              <p className="mt-1 text-sm text-gray-500">{activity.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

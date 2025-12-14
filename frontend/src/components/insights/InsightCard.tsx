import { Link } from 'react-router-dom';
import { Insight } from '../../lib/types';

interface Props {
  insight: Insight;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}

const priorityColors = {
  high: 'border-l-red-500 bg-red-50',
  medium: 'border-l-yellow-500 bg-yellow-50',
  low: 'border-l-blue-500 bg-blue-50',
};

const priorityBadges = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
};

const typeLabels = {
  service_due: 'Service Due',
  customer_health: 'Customer Health',
  revenue_opportunity: 'Revenue',
  anomaly: 'Anomaly',
  digest: 'Digest',
};

export function InsightCard({ insight, onDismiss, onMarkRead }: Props) {
  const isUnread = !insight.read_at;

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(insight.id);
    }
  };

  return (
    <div
      className={`border-l-4 rounded-lg p-4 mb-3 cursor-pointer transition-all hover:shadow-md ${
        priorityColors[insight.priority]
      } ${isUnread ? 'ring-2 ring-blue-300' : ''}`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded ${priorityBadges[insight.priority]}`}>
            {insight.priority.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            {typeLabels[insight.type]}
          </span>
          {isUnread && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(insight.id);
          }}
          className="text-gray-400 hover:text-gray-600 text-sm"
          title="Dismiss"
        >
          &times;
        </button>
      </div>

      <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
      <p className="text-sm text-gray-600 mb-3">{insight.body}</p>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex gap-4">
          {insight.vehicle && (
            <Link
              to={`/dashboard/vehicles/${insight.vehicle.id}`}
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {insight.vehicle.year} {insight.vehicle.make} {insight.vehicle.model}
            </Link>
          )}
          {insight.customer && (
            <Link
              to={`/dashboard/customers/${insight.customer.id}`}
              className="text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {insight.customer.name}
            </Link>
          )}
        </div>
        <span>{new Date(insight.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Calendar, Gauge, AlertTriangle, Clock, ChevronRight } from 'lucide-react';

interface UpcomingServiceData {
  id: string;
  vehicleId: string;
  vehicleName: string;
  serviceType: string;
  dueDate: string;
  dueMileage: number;
  status: string;
}

interface UpcomingServiceProps {
  service: UpcomingServiceData;
}

export default function UpcomingService({ service }: UpcomingServiceProps) {
  const isUrgent = service.status === 'due_soon' || service.status === 'overdue';

  const getStatusInfo = () => {
    switch (service.status) {
      case 'overdue':
        return {
          icon: AlertTriangle,
          label: 'Overdue',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-400',
          iconColor: 'text-red-500 dark:text-red-400',
          badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
        };
      case 'due_soon':
        return {
          icon: Clock,
          label: 'Due Soon',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-700 dark:text-orange-400',
          iconColor: 'text-orange-500 dark:text-orange-400',
          badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
        };
      default:
        return {
          icon: Calendar,
          label: 'Upcoming',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-400',
          iconColor: 'text-blue-500 dark:text-blue-400',
          badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={`card group cursor-pointer border ${statusInfo.borderColor} ${statusInfo.bgColor} transition-all hover:shadow-card-hover`}
    >
      <Link href={`/vehicles/${service.vehicleId}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${statusInfo.badgeColor}`}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {service.serviceType}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.badgeColor}`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {service.vehicleName}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-200/50 pt-4 dark:border-slate-700/50">
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className={`h-4 w-4 ${statusInfo.iconColor}`} />
            <span className={statusInfo.textColor}>{service.dueDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Gauge className="h-4 w-4" />
            <span>{service.dueMileage.toLocaleString()} mi</span>
          </div>
        </div>

        {isUrgent && (
          <div className="mt-4">
            <button
              className={`btn w-full justify-center ${
                service.status === 'overdue'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
              onClick={(e) => {
                e.preventDefault();
                // In a real app, this would open a scheduling modal
                alert('Schedule service modal would open');
              }}
            >
              Schedule Now
            </button>
          </div>
        )}
      </Link>
    </div>
  );
}

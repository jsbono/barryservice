'use client';

import {
  CheckCircle,
  Wrench,
  Calendar,
  Gauge,
  User,
  DollarSign,
} from 'lucide-react';

interface Service {
  id: string;
  date: string;
  type: string;
  description: string;
  mileage: number;
  cost: number;
  technician: string;
  status: string;
}

interface ServiceTimelineProps {
  services: Service[];
}

export default function ServiceTimeline({ services }: ServiceTimelineProps) {
  if (!services || services.length === 0) {
    return (
      <div className="card py-12 text-center">
        <Wrench className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
          No Service History
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Service records will appear here once your vehicle has been serviced.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 h-full w-0.5 bg-slate-200 dark:bg-slate-700" />

      {/* Service Items */}
      <div className="space-y-6">
        {services.map((service, index) => (
          <div key={service.id} className="relative flex gap-4">
            {/* Timeline Dot */}
            <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Service Card */}
            <div className="card flex-1 animate-slideIn" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {service.type}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {service.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    ${service.cost.toFixed(2)}
                  </p>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
                    Completed
                  </span>
                </div>
              </div>

              {/* Service Details */}
              <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span>{service.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Gauge className="h-4 w-4" />
                  <span>{service.mileage.toLocaleString()} mi</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <User className="h-4 w-4" />
                  <span>{service.technician}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="mt-8 card bg-slate-50 dark:bg-slate-800/50">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white">
              Service Summary
            </h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {services.length} services completed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-slate-400" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ${services.reduce((sum, s) => sum + s.cost, 0).toFixed(2)}
            </span>
            <span className="text-sm text-slate-500">total</span>
          </div>
        </div>
      </div>
    </div>
  );
}

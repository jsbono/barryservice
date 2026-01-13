'use client';

import Link from 'next/link';
import { Car, Calendar, Gauge, ChevronRight } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  mileage: number;
  imageUrl: string | null;
  lastService: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <div className="card group cursor-pointer transition-all hover:shadow-card-hover">
        <div className="flex items-start gap-4">
          {/* Vehicle Image/Icon */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/50">
            {vehicle.imageUrl ? (
              <img
                src={vehicle.imageUrl}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <Car className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            )}
          </div>

          {/* Vehicle Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                  {vehicle.licensePlate}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
            </div>

            {/* Vehicle Stats */}
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Gauge className="h-4 w-4" />
                <span>{vehicle.mileage.toLocaleString()} mi</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                <span>Service: {vehicle.lastService}</span>
              </div>
            </div>

            {/* Color Badge */}
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {vehicle.color}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

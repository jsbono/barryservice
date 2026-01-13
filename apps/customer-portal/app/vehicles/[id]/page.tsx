'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Hash,
  Palette,
  FileText,
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import ServiceTimeline from '@/components/ServiceTimeline';

// Mock data - would come from API based on ID
const mockVehicleData: Record<string, any> = {
  '1': {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licensePlate: 'ABC-1234',
    vin: '1HGBH41JXMN109186',
    color: 'Silver',
    mileage: 35000,
    lastService: '2024-01-15',
    nextServiceDue: '2024-04-15',
    nextServiceMileage: 40000,
    services: [
      {
        id: '1',
        date: '2024-01-15',
        type: 'Oil Change',
        description: 'Full synthetic oil change with filter replacement',
        mileage: 32500,
        cost: 89.99,
        technician: 'Mike Johnson',
        status: 'completed',
      },
      {
        id: '2',
        date: '2023-10-20',
        type: 'Brake Inspection',
        description: 'Front and rear brake pad inspection, rotors checked',
        mileage: 28000,
        cost: 45.00,
        technician: 'Sarah Williams',
        status: 'completed',
      },
      {
        id: '3',
        date: '2023-07-12',
        type: 'Tire Rotation',
        description: 'Four-wheel tire rotation and pressure adjustment',
        mileage: 24000,
        cost: 35.00,
        technician: 'Mike Johnson',
        status: 'completed',
      },
      {
        id: '4',
        date: '2023-04-05',
        type: 'Oil Change',
        description: 'Full synthetic oil change with filter replacement',
        mileage: 20000,
        cost: 85.99,
        technician: 'David Chen',
        status: 'completed',
      },
      {
        id: '5',
        date: '2023-01-18',
        type: '30K Service',
        description: 'Complete 30,000 mile service package including oil change, air filter, cabin filter, and fluid top-off',
        mileage: 15000,
        cost: 299.99,
        technician: 'Mike Johnson',
        status: 'completed',
      },
    ],
  },
  '2': {
    id: '2',
    make: 'Honda',
    model: 'CR-V',
    year: 2021,
    licensePlate: 'XYZ-5678',
    vin: '2HGFG12633H543210',
    color: 'Blue',
    mileage: 42000,
    lastService: '2024-02-20',
    nextServiceDue: '2024-04-20',
    nextServiceMileage: 45000,
    services: [
      {
        id: '1',
        date: '2024-02-20',
        type: 'Transmission Service',
        description: 'Transmission fluid flush and filter replacement',
        mileage: 40000,
        cost: 225.50,
        technician: 'Sarah Williams',
        status: 'completed',
      },
      {
        id: '2',
        date: '2024-01-08',
        type: 'Oil Change',
        description: 'Full synthetic oil change with filter replacement',
        mileage: 38500,
        cost: 79.99,
        technician: 'Mike Johnson',
        status: 'completed',
      },
      {
        id: '3',
        date: '2023-09-15',
        type: 'Brake Service',
        description: 'Front brake pad replacement',
        mileage: 35000,
        cost: 189.99,
        technician: 'David Chen',
        status: 'completed',
      },
    ],
  },
  '3': {
    id: '3',
    make: 'Ford',
    model: 'F-150',
    year: 2023,
    licensePlate: 'DEF-9012',
    vin: '1FTFW1ET5DFA12345',
    color: 'Black',
    mileage: 15000,
    lastService: '2024-03-05',
    nextServiceDue: '2024-06-05',
    nextServiceMileage: 20000,
    services: [
      {
        id: '1',
        date: '2024-03-05',
        type: 'Oil Change',
        description: 'First oil change, synthetic blend',
        mileage: 5000,
        cost: 75.00,
        technician: 'Mike Johnson',
        status: 'completed',
      },
    ],
  },
};

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'services'>('overview');

  const vehicle = mockVehicleData[vehicleId];

  if (!vehicle) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Car className="h-16 w-16 text-slate-300 dark:text-slate-600" />
        <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          Vehicle Not Found
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          The vehicle you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/vehicles" className="btn-primary mt-6">
          Back to Vehicles
        </Link>
      </div>
    );
  }

  const totalSpent = vehicle.services.reduce(
    (sum: number, service: any) => sum + service.cost,
    0
  );

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Back Button */}
      <Link
        href="/vehicles"
        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Vehicles
      </Link>

      {/* Vehicle Header */}
      <div className="card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/50">
              <Car className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                License Plate: {vehicle.licensePlate}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary">Edit Vehicle</button>
            <button className="btn-primary">Schedule Service</button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 dark:border-slate-700 sm:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
              <Gauge className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Mileage</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {vehicle.mileage.toLocaleString()} mi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
              <Palette className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Color</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {vehicle.color}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
              <Wrench className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Services</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {vehicle.services.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
              <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Spent</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Service Due */}
      <div className="card border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
              Next Service Due
            </h3>
            <p className="mt-1 text-orange-800 dark:text-orange-200">
              Oil Change recommended by{' '}
              <span className="font-medium">{vehicle.nextServiceDue}</span> or{' '}
              <span className="font-medium">
                {vehicle.nextServiceMileage.toLocaleString()} miles
              </span>
            </p>
          </div>
          <button className="btn-primary bg-orange-600 hover:bg-orange-700">
            Schedule Now
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
              activeTab === 'services'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Service History ({vehicle.services.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vehicle Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Vehicle Details
            </h2>
            <dl className="mt-4 space-y-4">
              <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                <dt className="text-slate-600 dark:text-slate-400">VIN</dt>
                <dd className="font-mono text-sm text-slate-900 dark:text-white">
                  {vehicle.vin}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                <dt className="text-slate-600 dark:text-slate-400">Year</dt>
                <dd className="text-slate-900 dark:text-white">{vehicle.year}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                <dt className="text-slate-600 dark:text-slate-400">Make</dt>
                <dd className="text-slate-900 dark:text-white">{vehicle.make}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                <dt className="text-slate-600 dark:text-slate-400">Model</dt>
                <dd className="text-slate-900 dark:text-white">{vehicle.model}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                <dt className="text-slate-600 dark:text-slate-400">Color</dt>
                <dd className="text-slate-900 dark:text-white">{vehicle.color}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600 dark:text-slate-400">
                  License Plate
                </dt>
                <dd className="text-slate-900 dark:text-white">
                  {vehicle.licensePlate}
                </dd>
              </div>
            </dl>
          </div>

          {/* Recent Service */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Most Recent Service
            </h2>
            {vehicle.services[0] && (
              <div className="mt-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {vehicle.services[0].type}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {vehicle.services[0].description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {vehicle.services[0].date}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Gauge className="h-4 w-4" />
                        {vehicle.services[0].mileage.toLocaleString()} mi
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                      ${vehicle.services[0].cost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ServiceTimeline services={vehicle.services} />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import DataTable from '@/components/DataTable';

interface VehicleWithCustomer {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  mileage: number;
  customer_name: string;
  customer_id: string;
  last_service: string;
  next_service_due: string;
}

const mockVehicles: VehicleWithCustomer[] = [
  {
    id: 'v1',
    make: 'Honda',
    model: 'Accord',
    year: 2021,
    vin: '1HGCV1F34MA123456',
    license_plate: 'ABC1234',
    mileage: 45000,
    customer_name: 'John Smith',
    customer_id: '1',
    last_service: '2024-06-15',
    next_service_due: '2024-09-15',
  },
  {
    id: 'v2',
    make: 'Toyota',
    model: 'RAV4',
    year: 2019,
    vin: '2T3BFREV5KW789012',
    license_plate: 'XYZ5678',
    mileage: 68000,
    customer_name: 'Sarah Williams',
    customer_id: '2',
    last_service: '2024-05-20',
    next_service_due: '2024-08-20',
  },
  {
    id: 'v3',
    make: 'Ford',
    model: 'F-150',
    year: 2020,
    vin: '1FTFW1E82LFA34567',
    license_plate: 'TRK9876',
    mileage: 52000,
    customer_name: 'Michael Johnson',
    customer_id: '3',
    last_service: '2024-04-10',
    next_service_due: '2024-07-10',
  },
  {
    id: 'v4',
    make: 'BMW',
    model: '330i',
    year: 2022,
    vin: 'WBA5R1C59N7890123',
    license_plate: 'LUX4321',
    mileage: 28000,
    customer_name: 'Emily Davis',
    customer_id: '4',
    last_service: '2024-06-01',
    next_service_due: '2024-09-01',
  },
  {
    id: 'v5',
    make: 'Chevrolet',
    model: 'Silverado',
    year: 2018,
    vin: '3GCPCSEC5JG123890',
    license_plate: 'WRK5432',
    mileage: 95000,
    customer_name: 'Robert Brown',
    customer_id: '5',
    last_service: '2024-03-25',
    next_service_due: '2024-06-25',
  },
];

export default function VehiclesPage() {
  const [vehicles] = useState<VehicleWithCustomer[]>(mockVehicles);
  const [selectedMake, setSelectedMake] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithCustomer | null>(null);

  const makes = [...new Set(vehicles.map((v) => v.make))];

  const filteredVehicles = selectedMake
    ? vehicles.filter((v) => v.make === selectedMake)
    : vehicles;

  const columns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      sortable: true,
      render: (vehicle: VehicleWithCustomer) => (
        <div>
          <p className="font-medium text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-sm text-gray-500">VIN: {vehicle.vin}</p>
        </div>
      ),
    },
    {
      key: 'license_plate',
      header: 'License Plate',
      sortable: true,
    },
    {
      key: 'customer_name',
      header: 'Owner',
      sortable: true,
      render: (vehicle: VehicleWithCustomer) => (
        <a href={`/customers/${vehicle.customer_id}`} className="text-indigo-600 hover:text-indigo-700">
          {vehicle.customer_name}
        </a>
      ),
    },
    {
      key: 'mileage',
      header: 'Mileage',
      sortable: true,
      render: (vehicle: VehicleWithCustomer) => (
        <span>{vehicle.mileage.toLocaleString()} mi</span>
      ),
    },
    {
      key: 'last_service',
      header: 'Last Service',
      sortable: true,
      render: (vehicle: VehicleWithCustomer) => (
        <span>{new Date(vehicle.last_service).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'next_service_due',
      header: 'Next Due',
      sortable: true,
      render: (vehicle: VehicleWithCustomer) => {
        const dueDate = new Date(vehicle.next_service_due);
        const today = new Date();
        const isOverdue = dueDate < today;
        const isDueSoon = dueDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000;

        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isOverdue
                ? 'bg-red-100 text-red-700'
                : isDueSoon
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {dueDate.toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  const actions = (vehicle: VehicleWithCustomer) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => {
          setSelectedVehicle(vehicle);
          setShowScheduleModal(true);
        }}
        className="px-3 py-1 text-xs font-medium text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50"
      >
        Override Schedule
      </button>
      <button className="p-1 text-gray-500 hover:text-indigo-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-500 mt-1">All registered vehicles in the system</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Makes</option>
              {makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 ml-auto">
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Export
            </button>
            <button className="px-4 py-2 text-sm text-red-600 hover:text-red-700">
              View Overdue
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Vehicles</p>
          <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Service Due Soon</p>
          <p className="text-2xl font-bold text-yellow-600">8</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">3</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">In Service Today</p>
          <p className="text-2xl font-bold text-green-600">5</p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredVehicles}
        columns={columns}
        searchable={true}
        searchKeys={['make', 'model', 'vin', 'license_plate', 'customer_name']}
        actions={actions}
        emptyMessage="No vehicles found"
      />

      {/* Schedule Override Modal */}
      {showScheduleModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Override Service Schedule</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </p>
              <p className="text-sm text-gray-500">Owner: {selectedVehicle.customer_name}</p>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Service Date
                </label>
                <input
                  type="date"
                  defaultValue={selectedVehicle.next_service_due}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Override
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Enter reason..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

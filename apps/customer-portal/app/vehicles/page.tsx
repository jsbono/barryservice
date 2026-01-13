'use client';

import { useState } from 'react';
import { Car, Search, Filter, Plus } from 'lucide-react';
import VehicleCard from '@/components/VehicleCard';

// Mock data - would come from API
const mockVehicles = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licensePlate: 'ABC-1234',
    vin: '1HGBH41JXMN109186',
    color: 'Silver',
    mileage: 35000,
    imageUrl: null,
    lastService: '2024-01-15',
  },
  {
    id: '2',
    make: 'Honda',
    model: 'CR-V',
    year: 2021,
    licensePlate: 'XYZ-5678',
    vin: '2HGFG12633H543210',
    color: 'Blue',
    mileage: 42000,
    imageUrl: null,
    lastService: '2024-02-20',
  },
  {
    id: '3',
    make: 'Ford',
    model: 'F-150',
    year: 2023,
    licensePlate: 'DEF-9012',
    vin: '1FTFW1ET5DFA12345',
    color: 'Black',
    mileage: 15000,
    imageUrl: null,
    lastService: '2024-03-05',
  },
];

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('year');

  const filteredVehicles = mockVehicles
    .filter((vehicle) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        vehicle.make.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        vehicle.licensePlate.toLowerCase().includes(searchLower) ||
        vehicle.year.toString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'make') return a.make.localeCompare(b.make);
      if (sortBy === 'mileage') return b.mileage - a.mileage;
      return 0;
    });

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Your Vehicles
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage and view details for all your registered vehicles.
          </p>
        </div>
        <button className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by make, model, or license plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600 dark:text-slate-400">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input w-auto"
            >
              <option value="year">Newest First</option>
              <option value="make">Make (A-Z)</option>
              <option value="mileage">Highest Mileage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="card py-12 text-center">
          <Car className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
            No vehicles found
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Add your first vehicle to get started.'}
          </p>
          {!searchQuery && (
            <button className="btn-primary mt-6 inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Vehicle
            </button>
          )}
        </div>
      )}

      {/* Vehicle Count */}
      {filteredVehicles.length > 0 && (
        <p className="text-center text-sm text-slate-500">
          Showing {filteredVehicles.length} of {mockVehicles.length} vehicles
        </p>
      )}
    </div>
  );
}

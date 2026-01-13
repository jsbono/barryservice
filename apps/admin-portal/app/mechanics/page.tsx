'use client';

import { useState } from 'react';
import DataTable from '@/components/DataTable';

interface MechanicRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  hourly_rate: number;
  is_active: boolean;
  services_completed: number;
  avg_rating: number;
  created_at: string;
}

const mockMechanics: MechanicRecord[] = [
  {
    id: 'm1',
    name: 'Mike Johnson',
    email: 'mike.johnson@motorai.com',
    phone: '(555) 111-2222',
    specializations: ['Engine', 'Transmission', 'Diagnostics'],
    hourly_rate: 75.0,
    is_active: true,
    services_completed: 342,
    avg_rating: 4.8,
    created_at: '2022-03-15T10:00:00Z',
  },
  {
    id: 'm2',
    name: 'David Chen',
    email: 'david.chen@motorai.com',
    phone: '(555) 222-3333',
    specializations: ['Brakes', 'Suspension', 'Alignment'],
    hourly_rate: 70.0,
    is_active: true,
    services_completed: 287,
    avg_rating: 4.9,
    created_at: '2022-06-01T10:00:00Z',
  },
  {
    id: 'm3',
    name: 'James Wilson',
    email: 'james.wilson@motorai.com',
    phone: '(555) 333-4444',
    specializations: ['Electrical', 'AC/Heating', 'Diagnostics'],
    hourly_rate: 72.0,
    is_active: true,
    services_completed: 215,
    avg_rating: 4.7,
    created_at: '2023-01-10T10:00:00Z',
  },
  {
    id: 'm4',
    name: 'Sarah Martinez',
    email: 'sarah.martinez@motorai.com',
    phone: '(555) 444-5555',
    specializations: ['Oil Service', 'Tires', 'General Maintenance'],
    hourly_rate: 65.0,
    is_active: true,
    services_completed: 456,
    avg_rating: 4.6,
    created_at: '2021-09-20T10:00:00Z',
  },
  {
    id: 'm5',
    name: 'Tom Anderson',
    email: 'tom.anderson@motorai.com',
    phone: '(555) 555-6666',
    specializations: ['Body Work', 'Paint', 'Detailing'],
    hourly_rate: 68.0,
    is_active: false,
    services_completed: 189,
    avg_rating: 4.5,
    created_at: '2022-11-05T10:00:00Z',
  },
];

export default function MechanicsPage() {
  const [mechanics] = useState<MechanicRecord[]>(mockMechanics);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filteredMechanics = showActiveOnly
    ? mechanics.filter((m) => m.is_active)
    : mechanics;

  const columns = [
    {
      key: 'name',
      header: 'Mechanic',
      sortable: true,
      render: (mechanic: MechanicRecord) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-indigo-600">
              {mechanic.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{mechanic.name}</p>
            <p className="text-sm text-gray-500">{mechanic.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: false,
    },
    {
      key: 'specializations',
      header: 'Specializations',
      sortable: false,
      render: (mechanic: MechanicRecord) => (
        <div className="flex flex-wrap gap-1">
          {mechanic.specializations.slice(0, 2).map((spec) => (
            <span
              key={spec}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {spec}
            </span>
          ))}
          {mechanic.specializations.length > 2 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{mechanic.specializations.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'hourly_rate',
      header: 'Hourly Rate',
      sortable: true,
      render: (mechanic: MechanicRecord) => (
        <span className="font-medium">${mechanic.hourly_rate.toFixed(2)}/hr</span>
      ),
    },
    {
      key: 'services_completed',
      header: 'Services',
      sortable: true,
      render: (mechanic: MechanicRecord) => (
        <span>{mechanic.services_completed}</span>
      ),
    },
    {
      key: 'avg_rating',
      header: 'Rating',
      sortable: true,
      render: (mechanic: MechanicRecord) => (
        <div className="flex items-center">
          <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-medium">{mechanic.avg_rating.toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (mechanic: MechanicRecord) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            mechanic.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {mechanic.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = (mechanic: MechanicRecord) => (
    <div className="flex items-center space-x-2">
      <button className="p-1 text-gray-500 hover:text-indigo-600" title="View Profile">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
      <button className="p-1 text-gray-500 hover:text-blue-600" title="Edit">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        className={`p-1 ${
          mechanic.is_active
            ? 'text-gray-500 hover:text-red-600'
            : 'text-gray-500 hover:text-green-600'
        }`}
        title={mechanic.is_active ? 'Deactivate' : 'Activate'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              mechanic.is_active
                ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            }
          />
        </svg>
      </button>
    </div>
  );

  const activeMechanics = mechanics.filter((m) => m.is_active).length;
  const totalServices = mechanics.reduce((sum, m) => sum + m.services_completed, 0);
  const avgRating =
    mechanics.reduce((sum, m) => sum + m.avg_rating, 0) / mechanics.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mechanics</h1>
          <p className="text-gray-500 mt-1">Manage your technician team</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Mechanic
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Mechanics</p>
          <p className="text-2xl font-bold text-gray-900">{mechanics.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeMechanics}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Services</p>
          <p className="text-2xl font-bold text-blue-600">{totalServices}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Avg. Rating</p>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Show Active Only</span>
          </label>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredMechanics}
        columns={columns}
        searchable={true}
        searchKeys={['name', 'email', 'phone']}
        actions={actions}
        emptyMessage="No mechanics found"
      />

      {/* Add Mechanic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Mechanic</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="john@motorai.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="65.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specializations
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Engine, Brakes, Diagnostics"
                />
                <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Add Mechanic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

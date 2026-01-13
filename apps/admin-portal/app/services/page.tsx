'use client';

import { useState } from 'react';
import DataTable from '@/components/DataTable';

interface ServiceRecord {
  id: string;
  vehicle: string;
  customer: string;
  service_type: string;
  mechanic: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  labor_hours: number;
  total_cost: number;
  created_at: string;
}

const mockServices: ServiceRecord[] = [
  {
    id: 's1',
    vehicle: '2021 Honda Accord',
    customer: 'John Smith',
    service_type: 'Oil Change',
    mechanic: 'Mike Johnson',
    status: 'completed',
    started_at: '2024-06-15T09:00:00Z',
    completed_at: '2024-06-15T09:45:00Z',
    labor_hours: 0.75,
    total_cost: 85.0,
    created_at: '2024-06-15T08:30:00Z',
  },
  {
    id: 's2',
    vehicle: '2019 Toyota RAV4',
    customer: 'Sarah Williams',
    service_type: 'Brake Inspection',
    mechanic: 'David Chen',
    status: 'in_progress',
    started_at: '2024-06-20T10:00:00Z',
    completed_at: null,
    labor_hours: 1.5,
    total_cost: 125.0,
    created_at: '2024-06-20T09:30:00Z',
  },
  {
    id: 's3',
    vehicle: '2020 Ford F-150',
    customer: 'Michael Johnson',
    service_type: 'Transmission Fluid Change',
    mechanic: 'James Wilson',
    status: 'pending',
    started_at: null,
    completed_at: null,
    labor_hours: 2.0,
    total_cost: 250.0,
    created_at: '2024-06-20T14:00:00Z',
  },
  {
    id: 's4',
    vehicle: '2022 BMW 330i',
    customer: 'Emily Davis',
    service_type: 'Full Inspection',
    mechanic: 'Mike Johnson',
    status: 'completed',
    started_at: '2024-06-18T08:00:00Z',
    completed_at: '2024-06-18T12:00:00Z',
    labor_hours: 4.0,
    total_cost: 350.0,
    created_at: '2024-06-17T16:00:00Z',
  },
  {
    id: 's5',
    vehicle: '2018 Chevrolet Silverado',
    customer: 'Robert Brown',
    service_type: 'Tire Rotation',
    mechanic: 'David Chen',
    status: 'cancelled',
    started_at: null,
    completed_at: null,
    labor_hours: 0.5,
    total_cost: 45.0,
    created_at: '2024-06-19T11:00:00Z',
  },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function ServicesPage() {
  const [services] = useState<ServiceRecord[]>(mockServices);
  const [statusFilter, setStatusFilter] = useState('');

  const filteredServices = statusFilter
    ? services.filter((s) => s.status === statusFilter)
    : services;

  const columns = [
    {
      key: 'id',
      header: 'Service ID',
      sortable: true,
      render: (service: ServiceRecord) => (
        <span className="font-mono text-sm text-indigo-600">{service.id}</span>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      sortable: true,
      render: (service: ServiceRecord) => (
        <div>
          <p className="font-medium text-gray-900">{service.vehicle}</p>
          <p className="text-sm text-gray-500">{service.customer}</p>
        </div>
      ),
    },
    {
      key: 'service_type',
      header: 'Service Type',
      sortable: true,
    },
    {
      key: 'mechanic',
      header: 'Mechanic',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (service: ServiceRecord) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[service.status]}`}>
          {service.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'total_cost',
      header: 'Total',
      sortable: true,
      render: (service: ServiceRecord) => (
        <span className="font-medium">${service.total_cost.toFixed(2)}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (service: ServiceRecord) => (
        <span className="text-sm">{new Date(service.created_at).toLocaleDateString()}</span>
      ),
    },
  ];

  const actions = (service: ServiceRecord) => (
    <div className="flex items-center space-x-2">
      <button className="p-1 text-gray-500 hover:text-indigo-600" title="View">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      <button className="p-1 text-gray-500 hover:text-blue-600" title="Edit">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {service.status === 'completed' && (
        <button className="p-1 text-gray-500 hover:text-green-600" title="Generate Invoice">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      )}
    </div>
  );

  const pendingCount = services.filter((s) => s.status === 'pending').length;
  const inProgressCount = services.filter((s) => s.status === 'in_progress').length;
  const completedCount = services.filter((s) => s.status === 'completed').length;
  const totalRevenue = services
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.total_cost, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Records</h1>
          <p className="text-gray-500 mt-1">All service records and work orders</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Completed Today</p>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Revenue Today</p>
          <p className="text-2xl font-bold text-indigo-600">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
              <option>Custom</option>
            </select>
          </div>
          <div className="ml-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredServices}
        columns={columns}
        searchable={true}
        searchKeys={['vehicle', 'customer', 'service_type', 'mechanic']}
        actions={actions}
        emptyMessage="No service records found"
      />
    </div>
  );
}

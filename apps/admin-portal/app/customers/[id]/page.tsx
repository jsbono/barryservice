'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Mock data for a customer
const mockCustomer = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '(555) 123-4567',
  address: '123 Main St, Anytown, CA 90210',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  vehicles: [
    {
      id: 'v1',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      vin: '1HGCV1F34MA123456',
      license_plate: 'ABC1234',
      mileage: 45000,
    },
    {
      id: 'v2',
      make: 'Toyota',
      model: 'RAV4',
      year: 2019,
      vin: '2T3BFREV5KW789012',
      license_plate: 'XYZ5678',
      mileage: 68000,
    },
  ],
  service_history: [
    {
      id: 's1',
      date: '2024-06-15',
      service: 'Oil Change',
      vehicle: '2021 Honda Accord',
      cost: 85.00,
      status: 'completed',
    },
    {
      id: 's2',
      date: '2024-05-20',
      service: 'Brake Inspection',
      vehicle: '2019 Toyota RAV4',
      cost: 125.00,
      status: 'completed',
    },
    {
      id: 's3',
      date: '2024-04-10',
      service: 'Tire Rotation',
      vehicle: '2021 Honda Accord',
      cost: 45.00,
      status: 'completed',
    },
  ],
  invoices: [
    {
      id: 'inv1',
      number: 'INV-2024-0234',
      date: '2024-06-15',
      amount: 85.00,
      status: 'paid',
    },
    {
      id: 'inv2',
      number: 'INV-2024-0189',
      date: '2024-05-20',
      amount: 125.00,
      status: 'paid',
    },
    {
      id: 'inv3',
      number: 'INV-2024-0145',
      date: '2024-04-10',
      amount: 45.00,
      status: 'paid',
    },
  ],
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(mockCustomer);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // In real app, fetch customer by params.id
    console.log('Loading customer:', params.id);
  }, [params.id]);

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'vehicles', name: 'Vehicles' },
    { id: 'services', name: 'Service History' },
    { id: 'invoices', name: 'Invoices' },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500">
        <Link href="/customers" className="hover:text-indigo-600">
          Customers
        </Link>
        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900">{customer.name}</span>
      </nav>

      {/* Customer Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {customer.name.charAt(0)}
              </span>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-gray-500">
                Customer since {new Date(customer.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Edit
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              New Service
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-600">{customer.email}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-gray-600">{customer.phone}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-600">{customer.address}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Vehicles</p>
              <p className="text-3xl font-bold text-blue-700">{customer.vehicles.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Total Services</p>
              <p className="text-3xl font-bold text-green-700">{customer.service_history.length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Lifetime Value</p>
              <p className="text-3xl font-bold text-purple-700">
                ${customer.invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            {customer.vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-500">VIN: {vehicle.vin}</p>
                    <p className="text-sm text-gray-500">
                      License: {vehicle.license_plate} | Mileage: {vehicle.mileage.toLocaleString()} mi
                    </p>
                  </div>
                  <button className="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50">
                    View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'services' && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500 border-b">
                <th className="pb-3">Date</th>
                <th className="pb-3">Service</th>
                <th className="pb-3">Vehicle</th>
                <th className="pb-3">Cost</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customer.service_history.map((service) => (
                <tr key={service.id}>
                  <td className="py-3 text-sm">{service.date}</td>
                  <td className="py-3 text-sm font-medium">{service.service}</td>
                  <td className="py-3 text-sm text-gray-500">{service.vehicle}</td>
                  <td className="py-3 text-sm">${service.cost.toFixed(2)}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      {service.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'invoices' && (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500 border-b">
                <th className="pb-3">Invoice #</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customer.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="py-3 text-sm font-medium text-indigo-600">{invoice.number}</td>
                  <td className="py-3 text-sm">{invoice.date}</td>
                  <td className="py-3 text-sm">${invoice.amount.toFixed(2)}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button className="text-sm text-indigo-600 hover:text-indigo-700">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

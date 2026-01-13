'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, FileText, Wrench, Calendar, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import VehicleCard from '@/components/VehicleCard';
import UpcomingService from '@/components/UpcomingService';

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
];

const mockUpcomingServices = [
  {
    id: '1',
    vehicleId: '1',
    vehicleName: '2022 Toyota Camry',
    serviceType: 'Oil Change',
    dueDate: '2024-04-15',
    dueMileage: 40000,
    status: 'upcoming',
  },
  {
    id: '2',
    vehicleId: '2',
    vehicleName: '2021 Honda CR-V',
    serviceType: 'Tire Rotation',
    dueDate: '2024-04-20',
    dueMileage: 45000,
    status: 'due_soon',
  },
];

const mockRecentInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-01-15',
    vehicle: '2022 Toyota Camry',
    total: 189.99,
    status: 'paid',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    date: '2024-02-20',
    vehicle: '2021 Honda CR-V',
    total: 425.50,
    status: 'paid',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    date: '2024-03-10',
    vehicle: '2022 Toyota Camry',
    total: 75.00,
    status: 'pending',
  },
];

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const stats = [
    {
      label: 'Vehicles',
      value: mockVehicles.length,
      icon: Car,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    },
    {
      label: 'Total Services',
      value: 12,
      icon: Wrench,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    },
    {
      label: 'Invoices',
      value: mockRecentInvoices.length,
      icon: FileText,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    },
    {
      label: 'Upcoming',
      value: mockUpcomingServices.length,
      icon: Calendar,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
    },
  ];

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          {greeting}, Customer
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Here&apos;s an overview of your vehicles and service history.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Services */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Upcoming Services
          </h2>
          <Link
            href="/vehicles"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {mockUpcomingServices.map((service) => (
            <UpcomingService key={service.id} service={service} />
          ))}
        </div>
      </div>

      {/* Vehicles Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Your Vehicles
          </h2>
          <Link
            href="/vehicles"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {mockVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Invoices
          </h2>
          <Link
            href="/invoices"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            View all
          </Link>
        </div>
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Invoice
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:table-cell">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {mockRecentInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-slate-500">{invoice.date}</p>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400 sm:table-cell">
                    {invoice.vehicle}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                      }`}
                    >
                      {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Download,
  ChevronRight,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import InvoiceTable from '@/components/InvoiceTable';

// Mock data - would come from API
const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    vehicleId: '1',
    vehicleName: '2022 Toyota Camry',
    services: ['Oil Change', 'Filter Replacement'],
    subtotal: 179.99,
    tax: 10.00,
    total: 189.99,
    status: 'paid',
    paidDate: '2024-01-15',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    date: '2024-02-20',
    dueDate: '2024-03-20',
    vehicleId: '2',
    vehicleName: '2021 Honda CR-V',
    services: ['Transmission Service', 'Fluid Flush'],
    subtotal: 400.00,
    tax: 25.50,
    total: 425.50,
    status: 'paid',
    paidDate: '2024-02-22',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    date: '2024-03-10',
    dueDate: '2024-04-10',
    vehicleId: '1',
    vehicleName: '2022 Toyota Camry',
    services: ['Tire Rotation'],
    subtotal: 70.00,
    tax: 5.00,
    total: 75.00,
    status: 'pending',
    paidDate: null,
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    date: '2024-03-05',
    dueDate: '2024-04-05',
    vehicleId: '3',
    vehicleName: '2023 Ford F-150',
    services: ['Oil Change'],
    subtotal: 70.00,
    tax: 5.00,
    total: 75.00,
    status: 'paid',
    paidDate: '2024-03-06',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2024-005',
    date: '2024-03-15',
    dueDate: '2024-04-15',
    vehicleId: '2',
    vehicleName: '2021 Honda CR-V',
    services: ['Brake Inspection', 'Alignment Check'],
    subtotal: 120.00,
    tax: 8.00,
    total: 128.00,
    status: 'overdue',
    paidDate: null,
  },
];

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');

  const filteredInvoices = mockInvoices
    .filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.vehicleName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const totalPaid = mockInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPending = mockInvoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const stats = [
    {
      label: 'Total Invoices',
      value: mockInvoices.length,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    },
    {
      label: 'Paid',
      value: `$${totalPaid.toFixed(2)}`,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    },
    {
      label: 'Outstanding',
      value: `$${totalPending.toFixed(2)}`,
      icon: Clock,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
    },
  ];

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Invoices
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          View and download your service invoices.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
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
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}
              className="input w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <InvoiceTable invoices={filteredInvoices} />

      {/* Invoice Count */}
      {filteredInvoices.length > 0 && (
        <p className="text-center text-sm text-slate-500">
          Showing {filteredInvoices.length} of {mockInvoices.length} invoices
        </p>
      )}
    </div>
  );
}

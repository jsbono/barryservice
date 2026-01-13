'use client';

import { useState } from 'react';
import DataTable from '@/components/DataTable';

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  service_description: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at: string | null;
  created_at: string;
}

const mockInvoices: InvoiceRecord[] = [
  {
    id: 'inv1',
    invoice_number: 'INV-2024-0234',
    customer_name: 'John Smith',
    customer_email: 'john.smith@email.com',
    service_description: 'Oil Change - 2021 Honda Accord',
    subtotal: 75.0,
    tax_amount: 10.0,
    total: 85.0,
    status: 'paid',
    due_date: '2024-06-30',
    paid_at: '2024-06-15',
    created_at: '2024-06-15T10:00:00Z',
  },
  {
    id: 'inv2',
    invoice_number: 'INV-2024-0235',
    customer_name: 'Sarah Williams',
    customer_email: 'sarah.w@email.com',
    service_description: 'Brake Inspection - 2019 Toyota RAV4',
    subtotal: 110.0,
    tax_amount: 15.0,
    total: 125.0,
    status: 'sent',
    due_date: '2024-07-05',
    paid_at: null,
    created_at: '2024-06-20T14:00:00Z',
  },
  {
    id: 'inv3',
    invoice_number: 'INV-2024-0236',
    customer_name: 'Michael Johnson',
    customer_email: 'mjohnson@email.com',
    service_description: 'Full Inspection - 2020 Ford F-150',
    subtotal: 220.0,
    tax_amount: 30.0,
    total: 250.0,
    status: 'overdue',
    due_date: '2024-06-01',
    paid_at: null,
    created_at: '2024-05-15T09:00:00Z',
  },
  {
    id: 'inv4',
    invoice_number: 'INV-2024-0237',
    customer_name: 'Emily Davis',
    customer_email: 'emily.davis@email.com',
    service_description: 'Tire Rotation & Balance - 2022 BMW 330i',
    subtotal: 85.0,
    tax_amount: 11.5,
    total: 96.5,
    status: 'draft',
    due_date: '2024-07-15',
    paid_at: null,
    created_at: '2024-06-21T11:00:00Z',
  },
  {
    id: 'inv5',
    invoice_number: 'INV-2024-0238',
    customer_name: 'Robert Brown',
    customer_email: 'rbrown@email.com',
    service_description: 'Transmission Fluid Change - 2018 Silverado',
    subtotal: 180.0,
    tax_amount: 24.3,
    total: 204.3,
    status: 'paid',
    due_date: '2024-06-20',
    paid_at: '2024-06-18',
    created_at: '2024-06-10T16:00:00Z',
  },
];

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function InvoicesPage() {
  const [invoices] = useState<InvoiceRecord[]>(mockInvoices);
  const [statusFilter, setStatusFilter] = useState('');

  const filteredInvoices = statusFilter
    ? invoices.filter((inv) => inv.status === statusFilter)
    : invoices;

  const columns = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
      render: (invoice: InvoiceRecord) => (
        <span className="font-mono text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer">
          {invoice.invoice_number}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      render: (invoice: InvoiceRecord) => (
        <div>
          <p className="font-medium text-gray-900">{invoice.customer_name}</p>
          <p className="text-sm text-gray-500">{invoice.customer_email}</p>
        </div>
      ),
    },
    {
      key: 'service_description',
      header: 'Description',
      sortable: false,
      render: (invoice: InvoiceRecord) => (
        <span className="text-sm text-gray-600 truncate max-w-xs block">
          {invoice.service_description}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Amount',
      sortable: true,
      render: (invoice: InvoiceRecord) => (
        <div>
          <p className="font-medium">${invoice.total.toFixed(2)}</p>
          <p className="text-xs text-gray-500">Tax: ${invoice.tax_amount.toFixed(2)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (invoice: InvoiceRecord) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[invoice.status]}`}
        >
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (invoice: InvoiceRecord) => {
        const dueDate = new Date(invoice.due_date);
        const isOverdue = invoice.status !== 'paid' && dueDate < new Date();
        return (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            {dueDate.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (invoice: InvoiceRecord) => (
        <span className="text-sm">{new Date(invoice.created_at).toLocaleDateString()}</span>
      ),
    },
  ];

  const actions = (invoice: InvoiceRecord) => (
    <div className="flex items-center space-x-2">
      <button className="p-1 text-gray-500 hover:text-indigo-600" title="View">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>
      <button className="p-1 text-gray-500 hover:text-blue-600" title="Download PDF">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      </button>
      {invoice.status === 'draft' && (
        <button className="p-1 text-gray-500 hover:text-green-600" title="Send">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      )}
      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
        <button className="p-1 text-gray-500 hover:text-green-600" title="Mark Paid">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      )}
    </div>
  );

  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage billing and payments</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Paid This Month</p>
          <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-blue-600">${totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 90 days</option>
              <option>This Year</option>
              <option>Custom</option>
            </select>
          </div>
          <div className="ml-auto flex space-x-2">
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Export
            </button>
            <button className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
              Send Reminders
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredInvoices}
        columns={columns}
        searchable={true}
        searchKeys={['invoice_number', 'customer_name', 'customer_email', 'service_description']}
        actions={actions}
        emptyMessage="No invoices found"
      />
    </div>
  );
}

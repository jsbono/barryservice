'use client';

import Link from 'next/link';
import {
  FileText,
  Download,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  vehicleId: string;
  vehicleName: string;
  services: string[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paidDate: string | null;
}

interface InvoiceTableProps {
  invoices: Invoice[];
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-400">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownload = (e: React.MouseEvent, invoiceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // In a real app, this would trigger a PDF download
    alert(`Downloading invoice ${invoiceId}`);
  };

  if (!invoices || invoices.length === 0) {
    return (
      <div className="card py-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
          No Invoices Found
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Invoices will appear here once services are completed.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Invoice
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Vehicle
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Services
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
                  {invoice.date}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-slate-900 dark:text-white">
                  {invoice.vehicleName}
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-[200px]">
                    <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                      {invoice.services.join(', ')}
                    </p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
                  ${invoice.total.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => handleDownload(e, invoice.id)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-700 dark:hover:text-primary-400"
                      title="View Details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700 md:hidden">
        {invoices.map((invoice) => (
          <Link
            key={invoice.id}
            href={`/invoices/${invoice.id}`}
            className="block p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-primary-600 dark:text-primary-400">
                  {invoice.invoiceNumber}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {invoice.vehicleName}
                </p>
              </div>
              {getStatusBadge(invoice.status)}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-slate-500">{invoice.date}</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                ${invoice.total.toFixed(2)}
              </p>
            </div>
            <p className="mt-2 truncate text-sm text-slate-500">
              {invoice.services.join(', ')}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

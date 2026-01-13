'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  Car,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Mail,
} from 'lucide-react';

// Mock data - would come from API
const mockInvoiceData: Record<string, any> = {
  '1': {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    vehicleId: '1',
    vehicleName: '2022 Toyota Camry',
    vehicleLicensePlate: 'ABC-1234',
    vehicleVin: '1HGBH41JXMN109186',
    mileageAtService: 32500,
    technician: 'Mike Johnson',
    status: 'paid',
    paidDate: '2024-01-15',
    paymentMethod: 'Credit Card',
    lineItems: [
      {
        description: 'Full Synthetic Oil Change',
        quantity: 1,
        unitPrice: 69.99,
        total: 69.99,
      },
      {
        description: 'Oil Filter - Premium',
        quantity: 1,
        unitPrice: 24.99,
        total: 24.99,
      },
      {
        description: 'Air Filter Replacement',
        quantity: 1,
        unitPrice: 39.99,
        total: 39.99,
      },
      {
        description: 'Fluid Top-Off',
        quantity: 1,
        unitPrice: 15.00,
        total: 15.00,
      },
      {
        description: 'Multi-Point Inspection',
        quantity: 1,
        unitPrice: 0.00,
        total: 0.00,
      },
      {
        description: 'Labor (1.5 hours)',
        quantity: 1.5,
        unitPrice: 20.00,
        total: 30.00,
      },
    ],
    subtotal: 179.97,
    tax: 10.02,
    total: 189.99,
    notes: 'Next oil change recommended at 37,500 miles or in 5,000 miles.',
    shopInfo: {
      name: 'MotorAI Service Center',
      address: '123 Main Street, Suite 100',
      city: 'Anytown, ST 12345',
      phone: '(555) 123-4567',
      email: 'service@motorai.com',
    },
    customerInfo: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(555) 987-6543',
      address: '456 Oak Avenue, Anytown, ST 12346',
    },
  },
  '2': {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    date: '2024-02-20',
    dueDate: '2024-03-20',
    vehicleId: '2',
    vehicleName: '2021 Honda CR-V',
    vehicleLicensePlate: 'XYZ-5678',
    vehicleVin: '2HGFG12633H543210',
    mileageAtService: 40000,
    technician: 'Sarah Williams',
    status: 'paid',
    paidDate: '2024-02-22',
    paymentMethod: 'Debit Card',
    lineItems: [
      {
        description: 'Transmission Fluid Flush',
        quantity: 1,
        unitPrice: 149.99,
        total: 149.99,
      },
      {
        description: 'Transmission Filter',
        quantity: 1,
        unitPrice: 45.00,
        total: 45.00,
      },
      {
        description: 'ATF Fluid (6 quarts)',
        quantity: 6,
        unitPrice: 18.00,
        total: 108.00,
      },
      {
        description: 'Labor (2 hours)',
        quantity: 2,
        unitPrice: 48.50,
        total: 97.00,
      },
    ],
    subtotal: 399.99,
    tax: 25.51,
    total: 425.50,
    notes: 'Transmission service complete. Next recommended at 80,000 miles.',
    shopInfo: {
      name: 'MotorAI Service Center',
      address: '123 Main Street, Suite 100',
      city: 'Anytown, ST 12345',
      phone: '(555) 123-4567',
      email: 'service@motorai.com',
    },
    customerInfo: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(555) 987-6543',
      address: '456 Oak Avenue, Anytown, ST 12346',
    },
  },
  '3': {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    date: '2024-03-10',
    dueDate: '2024-04-10',
    vehicleId: '1',
    vehicleName: '2022 Toyota Camry',
    vehicleLicensePlate: 'ABC-1234',
    vehicleVin: '1HGBH41JXMN109186',
    mileageAtService: 34500,
    technician: 'Mike Johnson',
    status: 'pending',
    paidDate: null,
    paymentMethod: null,
    lineItems: [
      {
        description: 'Tire Rotation - 4 Wheels',
        quantity: 1,
        unitPrice: 45.00,
        total: 45.00,
      },
      {
        description: 'Tire Pressure Check & Adjust',
        quantity: 1,
        unitPrice: 0.00,
        total: 0.00,
      },
      {
        description: 'Labor (0.5 hours)',
        quantity: 0.5,
        unitPrice: 50.00,
        total: 25.00,
      },
    ],
    subtotal: 70.00,
    tax: 5.00,
    total: 75.00,
    notes: 'Tires in good condition. Recommend replacement at 45,000 miles.',
    shopInfo: {
      name: 'MotorAI Service Center',
      address: '123 Main Street, Suite 100',
      city: 'Anytown, ST 12345',
      phone: '(555) 123-4567',
      email: 'service@motorai.com',
    },
    customerInfo: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(555) 987-6543',
      address: '456 Oak Avenue, Anytown, ST 12346',
    },
  },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const invoice = mockInvoiceData[invoiceId];

  if (!invoice) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <FileText className="h-16 w-16 text-slate-300 dark:text-slate-600" />
        <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          Invoice Not Found
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          The invoice you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/invoices" className="btn-primary mt-6">
          Back to Invoices
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/50 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownloadPDF = () => {
    // In a real app, this would generate/download a PDF
    alert('PDF download would be triggered here');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailInvoice = () => {
    // In a real app, this would send the invoice via email
    alert('Invoice would be emailed here');
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Back Button */}
      <Link
        href="/invoices"
        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Invoices
      </Link>

      {/* Invoice Header */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {invoice.invoiceNumber}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Issued on {invoice.date}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPDF}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleEmailInvoice}
              className="btn-outline inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content - Print-friendly layout */}
      <div className="card print:shadow-none" id="invoice-content">
        {/* Shop & Customer Info */}
        <div className="grid gap-6 border-b border-slate-200 pb-6 dark:border-slate-700 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
              From
            </h3>
            <div className="mt-2">
              <p className="font-semibold text-slate-900 dark:text-white">
                {invoice.shopInfo.name}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {invoice.shopInfo.address}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {invoice.shopInfo.city}
              </p>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {invoice.shopInfo.phone}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {invoice.shopInfo.email}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
              Bill To
            </h3>
            <div className="mt-2">
              <p className="font-semibold text-slate-900 dark:text-white">
                {invoice.customerInfo.name}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {invoice.customerInfo.address}
              </p>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {invoice.customerInfo.phone}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {invoice.customerInfo.email}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid gap-4 border-b border-slate-200 py-6 dark:border-slate-700 sm:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">Invoice Number</p>
            <p className="mt-1 font-medium text-slate-900 dark:text-white">
              {invoice.invoiceNumber}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Date Issued</p>
            <p className="mt-1 font-medium text-slate-900 dark:text-white">
              {invoice.date}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Due Date</p>
            <p className="mt-1 font-medium text-slate-900 dark:text-white">
              {invoice.dueDate}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Technician</p>
            <p className="mt-1 font-medium text-slate-900 dark:text-white">
              {invoice.technician}
            </p>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="border-b border-slate-200 py-6 dark:border-slate-700">
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Vehicle Information
          </h3>
          <div className="mt-3 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50">
              <Car className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {invoice.vehicleName}
              </p>
              <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>Plate: {invoice.vehicleLicensePlate}</span>
                <span>VIN: {invoice.vehicleVin}</span>
                <span>Mileage: {invoice.mileageAtService.toLocaleString()} mi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="py-6">
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Services & Parts
          </h3>
          <table className="mt-4 w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="pb-3 text-left text-sm font-medium text-slate-500">
                  Description
                </th>
                <th className="pb-3 text-right text-sm font-medium text-slate-500">
                  Qty
                </th>
                <th className="pb-3 text-right text-sm font-medium text-slate-500">
                  Unit Price
                </th>
                <th className="pb-3 text-right text-sm font-medium text-slate-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {invoice.lineItems.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="py-3 text-slate-900 dark:text-white">
                    {item.description}
                  </td>
                  <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right text-slate-600 dark:text-slate-400">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-medium text-slate-900 dark:text-white">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax</span>
                <span>${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                <span>Total</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.status === 'paid' && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Payment Received
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Paid on {invoice.paidDate} via {invoice.paymentMethod}
                </p>
              </div>
            </div>
          </div>
        )}

        {invoice.status === 'pending' && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    Payment Pending
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Due by {invoice.dueDate}
                  </p>
                </div>
              </div>
              <button className="btn-primary bg-yellow-600 hover:bg-yellow-700">
                Pay Now
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes
            </h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Invoice, InvoiceStatus } from '../lib/types';
import { getInvoice, downloadInvoicePdf, sendInvoice, markInvoicePaid, updateInvoice } from '../lib/api';

const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-600',
};

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      const data = await getInvoice(id!);
      setInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      const blob = await downloadInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;
    if (!confirm(`Send invoice ${invoice.invoice_number} to ${invoice.customer?.email}?`)) return;

    try {
      setActionLoading(true);
      await sendInvoice(invoice.id);
      await loadInvoice();
      alert('Invoice sent successfully');
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    try {
      setActionLoading(true);
      await markInvoicePaid(invoice.id);
      await loadInvoice();
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      alert('Failed to mark invoice as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice) return;
    if (!confirm('Cancel this invoice? This cannot be undone.')) return;

    try {
      setActionLoading(true);
      await updateInvoice(invoice.id, { status: 'cancelled' });
      await loadInvoice();
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      alert('Failed to cancel invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading invoice...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-red-600">Invoice not found</p>
        <Link to="/dashboard/invoices" className="text-blue-600 hover:text-blue-800">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/dashboard/invoices"
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
        </div>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[invoice.status]}`}
        >
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </span>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Customer & Vehicle Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6 pb-6 border-b">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
            {invoice.customer && (
              <div>
                <p className="font-semibold">{invoice.customer.name}</p>
                <p className="text-gray-600">{invoice.customer.email}</p>
                {invoice.customer.phone && (
                  <p className="text-gray-600">{invoice.customer.phone}</p>
                )}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Vehicle</h3>
            {invoice.vehicle && (
              <div>
                <p className="font-semibold">
                  {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                </p>
                {invoice.vehicle.vin && (
                  <p className="text-gray-600 text-sm">VIN: {invoice.vehicle.vin}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid md:grid-cols-3 gap-4 mb-6 pb-6 border-b text-sm">
          <div>
            <span className="text-gray-500">Invoice Date:</span>
            <p className="font-medium">{formatDate(invoice.created_at)}</p>
          </div>
          {invoice.due_date && (
            <div>
              <span className="text-gray-500">Due Date:</span>
              <p className="font-medium">{formatDate(invoice.due_date)}</p>
            </div>
          )}
          {invoice.paid_date && (
            <div>
              <span className="text-gray-500">Paid Date:</span>
              <p className="font-medium text-green-600">{formatDate(invoice.paid_date)}</p>
            </div>
          )}
        </div>

        {/* Line Items */}
        {invoice.line_items && invoice.line_items.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Line Items</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Type</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-center capitalize">{item.line_type}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2 text-right">{formatCurrency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Labor:</span>
              <span>{formatCurrency(invoice.labor_total)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Parts:</span>
              <span>{formatCurrency(invoice.parts_total)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm border-t">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(invoice.labor_total + invoice.parts_total)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Tax:</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold border-t-2">
              <span>Total:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownloadPdf}
          disabled={actionLoading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Download PDF
        </button>

        {invoice.status === 'draft' && (
          <button
            onClick={handleSendInvoice}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send to Customer
          </button>
        )}

        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
          <button
            onClick={handleMarkPaid}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Mark as Paid
          </button>
        )}

        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
          >
            Cancel Invoice
          </button>
        )}
      </div>
    </div>
  );
}

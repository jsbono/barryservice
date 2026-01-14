import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../lib/customerAuth';
import { Invoice } from '../../lib/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function PortalInvoices() {
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const isVehiclesActive = location.pathname === '/portal';
  const isInvoicesActive = location.pathname === '/portal/invoices';

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const response = await fetch(`${API_BASE}/portal/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      setDownloading(invoice.id);
      const token = localStorage.getItem('customer_token');
      const response = await fetch(`${API_BASE}/portal/invoices/${invoice.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF');
    } finally {
      setDownloading(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Calculate totals
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-900">
        <div className="px-4 py-4 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                }}
              >
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">My Invoices</h1>
                <p className="text-sm text-gray-500">{customer?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
            <div className="text-xs text-gray-600">Total Invoices</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            <div className="text-xs text-gray-600">Paid</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</div>
            <div className="text-xs text-gray-600">Total Value</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-5 pb-24">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full animate-pulse blur-lg"
                style={{ background: 'rgba(245, 158, 11, 0.3)' }}
              />
              <svg className="animate-spin w-10 h-10 text-amber-500 relative" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <span className="mt-4 text-sm font-medium text-gray-600">
              Loading invoices...
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-red-600">{error}</span>
          </div>
        )}

        {!loading && invoices.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}
            >
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Invoices Found</h3>
            <p className="text-sm text-gray-600">
              You don't have any invoices yet.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">{invoice.invoice_number}</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyle(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>

                {invoice.vehicle && (
                  <p className="text-sm text-gray-600 mb-3">
                    {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{formatDate(invoice.created_at)}</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
                </div>

                {invoice.due_date && invoice.status !== 'paid' && (
                  <p className="text-xs text-gray-600 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Due: {formatDate(invoice.due_date)}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleDownloadPdf(invoice)}
                    disabled={downloading === invoice.id}
                    className="flex items-center px-4 py-2 text-sm font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    {downloading === invoice.id ? (
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-bottom">
        <div className="flex max-w-md mx-auto">
          <Link
            to="/portal"
            className={`flex-1 flex flex-col items-center py-3 transition-colors ${
              isVehiclesActive ? 'text-amber-600' : 'text-gray-600'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${isVehiclesActive ? 'bg-amber-50' : ''}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span className="text-xs font-semibold mt-1">History</span>
          </Link>
          <Link
            to="/portal/invoices"
            className={`flex-1 flex flex-col items-center py-3 transition-colors ${
              isInvoicesActive ? 'text-amber-600' : 'text-gray-600'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${isInvoicesActive ? 'bg-amber-50' : ''}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold mt-1">Invoices</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

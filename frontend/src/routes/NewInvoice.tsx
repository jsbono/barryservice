import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Customer, Vehicle, ServiceLog, Part, ServicePrice } from '../lib/types';
import { getCustomers, getVehicles, getServices, getParts, createInvoice, getServicePrices, getDefaultLaborRate } from '../lib/api';

export function NewInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('service_id');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [_defaultLaborRate, setDefaultLaborRate] = useState<number>(95);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceLogId, setSelectedServiceLogId] = useState(preselectedServiceId || '');
  const [laborHours, setLaborHours] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(95);
  const [selectedParts, setSelectedParts] = useState<Array<{ part_id: string; quantity: number }>>([]);
  const [taxRate, setTaxRate] = useState(8.25);
  const [notes, setNotes] = useState('');
  const [usePresetPricing, setUsePresetPricing] = useState(true);
  const [selectedPresetPrice, setSelectedPresetPrice] = useState<ServicePrice | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadVehicles(selectedCustomerId);
    } else {
      setVehicles([]);
      setSelectedVehicleId('');
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedVehicleId) {
      loadServiceLogs(selectedVehicleId);
    } else {
      setServiceLogs([]);
      setSelectedServiceLogId('');
    }
  }, [selectedVehicleId]);

  const loadInitialData = async () => {
    try {
      const [customersRes, partsRes, pricesRes, laborRateRes] = await Promise.all([
        getCustomers(500),
        getParts(),
        getServicePrices(),
        getDefaultLaborRate().catch(() => ({ rate: { rate_per_hour: 95 } })),
      ]);
      setCustomers(customersRes.customers);
      setParts(partsRes.parts);
      setServicePrices(pricesRes.prices);
      if (laborRateRes.rate) {
        setDefaultLaborRate(laborRateRes.rate.rate_per_hour);
        setHourlyRate(laborRateRes.rate.rate_per_hour);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async (customerId: string) => {
    try {
      const res = await getVehicles(customerId);
      setVehicles(res.vehicles);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const loadServiceLogs = async (vehicleId: string) => {
    try {
      const res = await getServices(vehicleId, 50);
      setServiceLogs(res.services);
    } catch (error) {
      console.error('Failed to load service logs:', error);
    }
  };

  // Auto-fill pricing when a service log is selected
  const handleServiceLogSelect = (serviceLogId: string) => {
    setSelectedServiceLogId(serviceLogId);

    if (serviceLogId && usePresetPricing) {
      const serviceLog = serviceLogs.find(s => s.id === serviceLogId);
      if (serviceLog) {
        // Find matching service price by service_type
        const matchingPrice = servicePrices.find(p =>
          p.service_type.toLowerCase() === serviceLog.service_type.toLowerCase() ||
          p.display_name.toLowerCase().includes(serviceLog.service_type.toLowerCase().replace(/_/g, ' '))
        );

        if (matchingPrice) {
          setSelectedPresetPrice(matchingPrice);
          setLaborHours(matchingPrice.labor_hours);
        } else {
          setSelectedPresetPrice(null);
        }
      }
    }
  };

  const handleAddPart = () => {
    setSelectedParts([...selectedParts, { part_id: '', quantity: 1 }]);
  };

  const handleRemovePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: 'part_id' | 'quantity', value: string | number) => {
    const updated = [...selectedParts];
    if (field === 'part_id') {
      updated[index].part_id = value as string;
    } else {
      updated[index].quantity = Number(value);
    }
    setSelectedParts(updated);
  };

  const calculateTotals = () => {
    // Use preset price if enabled and selected, otherwise use hourly rate
    let laborTotal: number;
    if (usePresetPricing && selectedPresetPrice) {
      laborTotal = selectedPresetPrice.base_price;
    } else {
      laborTotal = laborHours * hourlyRate;
    }

    let partsTotal = 0;
    selectedParts.forEach((sp) => {
      const part = parts.find((p) => p.id === sp.part_id);
      if (part) {
        partsTotal += part.retail_price * sp.quantity;
      }
    });
    const subtotal = laborTotal + partsTotal;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    return { laborTotal, partsTotal, subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceLogId) {
      alert('Please select a service log');
      return;
    }

    setSubmitting(true);
    try {
      const invoice = await createInvoice({
        service_log_id: selectedServiceLogId,
        labor_hours: laborHours,
        hourly_rate: hourlyRate,
        parts: selectedParts.filter((p) => p.part_id),
        tax_rate: taxRate,
        notes: notes || undefined,
      });
      navigate(`/dashboard/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const totals = calculateTotals();

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Select Service</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedVehicleId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Log</label>
                <select
                  value={selectedServiceLogId}
                  onChange={(e) => handleServiceLogSelect(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a service log...</option>
                  {serviceLogs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.service_date).toLocaleDateString()} - {s.service_type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Method */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pricing</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={usePresetPricing}
                onChange={(e) => {
                  setUsePresetPricing(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedPresetPrice(null);
                  }
                }}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Use preset pricing</span>
            </label>
          </div>

          {usePresetPricing ? (
            /* Preset Pricing Mode */
            <div className="space-y-4">
              {selectedPresetPrice ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">{selectedPresetPrice.display_name}</p>
                      <p className="text-sm text-green-600">{selectedPresetPrice.description}</p>
                      <p className="text-xs text-green-500 mt-1">
                        Est. {selectedPresetPrice.labor_hours} hour{selectedPresetPrice.labor_hours !== 1 ? 's' : ''} labor
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(selectedPresetPrice.base_price)}</p>
                      <button
                        type="button"
                        onClick={() => setSelectedPresetPrice(null)}
                        className="text-xs text-green-600 hover:text-green-800 mt-1"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Service Price</label>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {servicePrices.filter(p => p.is_active).map((price) => (
                      <button
                        key={price.id}
                        type="button"
                        onClick={() => {
                          setSelectedPresetPrice(price);
                          setLaborHours(price.labor_hours);
                        }}
                        className="flex items-center justify-between p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{price.display_name}</p>
                          <p className="text-xs text-gray-500">{price.description}</p>
                        </div>
                        <span className="text-lg font-semibold text-green-600">{formatCurrency(price.base_price)}</span>
                      </button>
                    ))}
                  </div>
                  {servicePrices.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No service prices configured. Go to Settings to add prices.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Manual Labor Pricing Mode */
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                <input
                  type="number"
                  value={laborHours}
                  onChange={(e) => setLaborHours(Number(e.target.value))}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <p className="mt-4 text-right text-gray-600">
            {usePresetPricing ? 'Service' : 'Labor'} Total: <span className="font-semibold">{formatCurrency(totals.laborTotal)}</span>
          </p>
        </div>

        {/* Parts */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Parts</h2>
            <button
              type="button"
              onClick={handleAddPart}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Part
            </button>
          </div>

          {selectedParts.length === 0 ? (
            <p className="text-gray-500 text-sm">No parts added</p>
          ) : (
            <div className="space-y-3">
              {selectedParts.map((sp, index) => {
                const part = parts.find((p) => p.id === sp.part_id);
                return (
                  <div key={index} className="flex items-center gap-3">
                    <select
                      value={sp.part_id}
                      onChange={(e) => handlePartChange(index, 'part_id', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select part...</option>
                      {parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {formatCurrency(p.retail_price)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={sp.quantity}
                      onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                      min="1"
                      className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {part && (
                      <span className="w-24 text-right text-gray-600">
                        {formatCurrency(part.retail_price * sp.quantity)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-right text-gray-600">
            Parts Total: <span className="font-semibold">{formatCurrency(totals.partsTotal)}</span>
          </p>
        </div>

        {/* Tax & Notes */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Invoice Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {usePresetPricing && selectedPresetPrice
                  ? selectedPresetPrice.display_name
                  : 'Labor'}:
              </span>
              <span>{formatCurrency(totals.laborTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Parts:</span>
              <span>{formatCurrency(totals.partsTotal)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({taxRate}%):</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/invoices')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedServiceLogId || (usePresetPricing && !selectedPresetPrice)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}

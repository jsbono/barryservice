import { useState, useEffect } from 'react';
import { ServicePrice, LaborRate } from '../../lib/types';
import {
  getServicePrices,
  updateServicePrice,
  createServicePrice,
  deleteServicePrice,
  getLaborRates,
  updateLaborRate,
} from '../../lib/api';

export function ServicePricingForm() {
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    display_name: string;
    base_price: number;
    labor_hours: number;
    description: string;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({
    service_type: '',
    display_name: '',
    base_price: 0,
    labor_hours: 1,
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pricesRes, ratesRes] = await Promise.all([
        getServicePrices(true),
        getLaborRates(),
      ]);
      setPrices(pricesRes.prices);
      setLaborRates(ratesRes.rates);
    } catch (error) {
      console.error('Failed to load pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (price: ServicePrice) => {
    setEditingId(price.id);
    setEditValues({
      display_name: price.display_name,
      base_price: price.base_price,
      labor_hours: price.labor_hours,
      description: price.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValues) return;

    setSaving(id);
    try {
      await updateServicePrice(id, editValues);
      await loadData();
      setEditingId(null);
      setEditValues(null);
    } catch (error) {
      console.error('Failed to update service price:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleActive = async (price: ServicePrice) => {
    setSaving(price.id);
    try {
      await updateServicePrice(price.id, { is_active: !price.is_active });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle service:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service price?')) return;

    setSaving(id);
    try {
      await deleteServicePrice(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete service price:', error);
      alert('Failed to delete');
    } finally {
      setSaving(null);
    }
  };

  const handleAddService = async () => {
    if (!newService.service_type || !newService.display_name) {
      alert('Service type and display name are required');
      return;
    }

    setSaving('new');
    try {
      await createServicePrice(newService);
      await loadData();
      setShowAddForm(false);
      setNewService({
        service_type: '',
        display_name: '',
        base_price: 0,
        labor_hours: 1,
        description: '',
      });
    } catch (error) {
      console.error('Failed to create service price:', error);
      alert('Failed to create service');
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateLaborRate = async (rate: LaborRate, newRate: number) => {
    setSaving(rate.id);
    try {
      await updateLaborRate(rate.id, { rate_per_hour: newRate });
      await loadData();
    } catch (error) {
      console.error('Failed to update labor rate:', error);
      alert('Failed to update labor rate');
    } finally {
      setSaving(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Labor Rates Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Labor Rates</h2>
        <div className="space-y-3">
          {laborRates.map((rate) => (
            <div key={rate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{rate.name}</span>
                {rate.is_default && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={rate.rate_per_hour}
                  onChange={(e) => {
                    const newRate = parseFloat(e.target.value) || 0;
                    handleUpdateLaborRate(rate, newRate);
                  }}
                  className="w-24 px-3 py-1.5 border rounded text-right"
                  step="0.01"
                  min="0"
                />
                <span className="text-gray-500">/ hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Prices Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Service Prices</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Service
          </button>
        </div>

        {/* Add New Service Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium mb-3">Add New Service</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Service Type (code)</label>
                <input
                  type="text"
                  value={newService.service_type}
                  onChange={(e) => setNewService({ ...newService, service_type: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., timing_belt"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newService.display_name}
                  onChange={(e) => setNewService({ ...newService, display_name: e.target.value })}
                  placeholder="e.g., Timing Belt Replacement"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Base Price ($)</label>
                <input
                  type="number"
                  value={newService.base_price}
                  onChange={(e) => setNewService({ ...newService, base_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Labor Hours</label>
                <input
                  type="number"
                  value={newService.labor_hours}
                  onChange={(e) => setNewService({ ...newService, labor_hours: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  step="0.5"
                  min="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Brief description of the service"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={saving === 'new'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving === 'new' ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </div>
        )}

        {/* Service List */}
        <div className="space-y-2">
          {prices.map((price) => (
            <div
              key={price.id}
              className={`p-4 rounded-lg border ${price.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}
            >
              {editingId === price.id && editValues ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={editValues.display_name}
                        onChange={(e) => setEditValues({ ...editValues, display_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Base Price ($)</label>
                      <input
                        type="number"
                        value={editValues.base_price}
                        onChange={(e) => setEditValues({ ...editValues, base_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Labor Hours</label>
                      <input
                        type="number"
                        value={editValues.labor_hours}
                        onChange={(e) => setEditValues({ ...editValues, labor_hours: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                        step="0.5"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={editValues.description}
                        onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(price.id)}
                      disabled={saving === price.id}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving === price.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${!price.is_active ? 'text-gray-400' : ''}`}>
                        {price.display_name}
                      </span>
                      {!price.is_active && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {price.description || price.service_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {price.labor_hours} hour{price.labor_hours !== 1 ? 's' : ''} estimated
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-bold ${!price.is_active ? 'text-gray-400' : 'text-green-600'}`}>
                      {formatCurrency(price.base_price)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(price)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(price)}
                        className={`p-2 rounded-lg ${price.is_active ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                        title={price.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {price.is_active ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(price.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {prices.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No service prices configured. Click "Add Service" to create one.
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { VehiclesList } from '../components/vehicles/VehiclesList';
import { VehicleFormModal } from '../components/vehicles/VehicleFormModal';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { getCustomer, updateCustomer, createVehicle, deleteVehicle, setCustomerPassword } from '../lib/api';
import { Customer, CreateVehicleRequest, CreateCustomerRequest } from '../lib/types';

function SetPasswordModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await setCustomerPassword(customerId, password);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Set Customer Portal Password</h2>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded p-4 text-green-700">
            Password set successfully! Customer can now log in to the portal.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password (min 6 characters)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm password"
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Setting...' : 'Set Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const loadCustomer = async () => {
    if (!id) return;
    try {
      const data = await getCustomer(id);
      setCustomer(data);
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const handleAddVehicle = async (data: CreateVehicleRequest) => {
    await createVehicle(data);
    await loadCustomer();
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await deleteVehicle(vehicleId);
      await loadCustomer();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  const handleUpdateCustomer = async (data: CreateCustomerRequest) => {
    if (!id) return;
    await updateCustomer(id, data);
    await loadCustomer();
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading customer...</div>;
  }

  if (!customer) {
    return <div className="p-6 text-red-500">Customer not found.</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/dashboard/customers" className="text-blue-600 hover:underline">
          &larr; Back to Customers
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="mt-2 text-gray-500 space-y-1">
              <p>Email: {customer.email}</p>
              {customer.phone && <p>Phone: {customer.phone}</p>}
              <p>Customer since: {new Date(customer.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-green-600 hover:underline"
            >
              Set Portal Password
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Vehicles ({customer.vehicles?.length || 0})</h2>
        <button
          onClick={() => setShowVehicleModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Vehicle
        </button>
      </div>

      <VehiclesList
        vehicles={customer.vehicles || []}
        onDelete={handleDeleteVehicle}
      />

      {showVehicleModal && (
        <VehicleFormModal
          customerId={customer.id}
          onSubmit={handleAddVehicle}
          onClose={() => setShowVehicleModal(false)}
        />
      )}

      {showEditModal && (
        <CustomerFormModal
          customer={customer}
          onSubmit={handleUpdateCustomer}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showPasswordModal && (
        <SetPasswordModal
          customerId={customer.id}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
}

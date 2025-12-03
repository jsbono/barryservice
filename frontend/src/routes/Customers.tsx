import { useEffect, useState } from 'react';
import { CustomersTable } from '../components/customers/CustomersTable';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { getCustomers, createCustomer, deleteCustomer } from '../lib/api';
import { Customer, CreateCustomerRequest } from '../lib/types';

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCustomers = async () => {
    try {
      const result = await getCustomers();
      setCustomers(result.customers);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreate = async (data: CreateCustomerRequest) => {
    await createCustomer(data);
    await loadCustomers();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      await loadCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-gray-500">Loading customers...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Customer
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <CustomersTable customers={filteredCustomers} onDelete={handleDelete} />

      {showModal && (
        <CustomerFormModal
          onSubmit={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

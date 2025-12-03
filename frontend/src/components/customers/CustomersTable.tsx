import { Link } from 'react-router-dom';
import { Customer } from '../../lib/types';

interface Props {
  customers: Customer[];
  onDelete: (id: string) => void;
}

export function CustomersTable({ customers, onDelete }: Props) {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No customers found. Add your first customer to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/dashboard/customers/${customer.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {customer.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {customer.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {customer.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Link
                    to={`/dashboard/customers/${customer.id}`}
                    className="text-blue-600 hover:underline mr-4"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this customer?')) {
                        onDelete(customer.id);
                      }
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

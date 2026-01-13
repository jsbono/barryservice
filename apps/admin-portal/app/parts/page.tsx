'use client';

import { useState } from 'react';
import DataTable from '@/components/DataTable';
import PartsForm from '@/components/PartsForm';
import type { Part } from '@/lib/supabase';

const mockParts: Part[] = [
  {
    id: 'p1',
    sku: 'BRK-PAD-001',
    name: 'Premium Brake Pads (Front)',
    description: 'High-performance ceramic brake pads for front wheels',
    cost_price: 25.0,
    retail_price: 65.0,
    stock_quantity: 24,
    min_stock_level: 10,
    category: 'Brake System',
    manufacturer: 'Bosch',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-06-15T10:30:00Z',
  },
  {
    id: 'p2',
    sku: 'OIL-SYN-5W30',
    name: 'Synthetic Motor Oil 5W-30',
    description: 'Full synthetic motor oil, 5 quart bottle',
    cost_price: 18.0,
    retail_price: 42.0,
    stock_quantity: 48,
    min_stock_level: 20,
    category: 'Fluids & Lubricants',
    manufacturer: 'Mobil 1',
    created_at: '2024-02-10T14:00:00Z',
    updated_at: '2024-06-10T14:00:00Z',
  },
  {
    id: 'p3',
    sku: 'FLT-AIR-UNI',
    name: 'Universal Air Filter',
    description: 'High-flow replacement air filter',
    cost_price: 12.0,
    retail_price: 28.0,
    stock_quantity: 3,
    min_stock_level: 15,
    category: 'Filters',
    manufacturer: 'K&N',
    created_at: '2024-03-05T09:00:00Z',
    updated_at: '2024-05-20T09:00:00Z',
  },
  {
    id: 'p4',
    sku: 'SPK-PLG-IR',
    name: 'Iridium Spark Plugs (Set of 4)',
    description: 'Long-life iridium spark plugs',
    cost_price: 32.0,
    retail_price: 75.0,
    stock_quantity: 18,
    min_stock_level: 8,
    category: 'Engine Parts',
    manufacturer: 'NGK',
    created_at: '2024-01-20T11:00:00Z',
    updated_at: '2024-04-15T11:00:00Z',
  },
  {
    id: 'p5',
    sku: 'FLT-OIL-TOY',
    name: 'Oil Filter - Toyota Compatible',
    description: 'OEM-spec oil filter for Toyota vehicles',
    cost_price: 6.0,
    retail_price: 15.0,
    stock_quantity: 56,
    min_stock_level: 25,
    category: 'Filters',
    manufacturer: 'Toyota',
    created_at: '2024-02-28T16:00:00Z',
    updated_at: '2024-06-01T16:00:00Z',
  },
];

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>(mockParts);
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  const categories = [...new Set(parts.map((p) => p.category).filter(Boolean))];

  const filteredParts = parts.filter((part) => {
    if (categoryFilter && part.category !== categoryFilter) return false;
    if (showLowStock && part.stock_quantity >= part.min_stock_level) return false;
    return true;
  });

  const handleSubmit = (data: Omit<Part, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingPart) {
      // Update existing part
      setParts((prev) =>
        prev.map((p) =>
          p.id === editingPart.id
            ? { ...p, ...data, updated_at: new Date().toISOString() }
            : p
        )
      );
    } else {
      // Add new part
      const newPart: Part = {
        ...data,
        id: `p${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setParts((prev) => [...prev, newPart]);
    }
    setShowForm(false);
    setEditingPart(undefined);
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setShowForm(true);
  };

  const handleDelete = (partId: string) => {
    if (confirm('Are you sure you want to delete this part?')) {
      setParts((prev) => prev.filter((p) => p.id !== partId));
    }
  };

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      render: (part: Part) => (
        <span className="font-mono text-sm text-indigo-600">{part.sku}</span>
      ),
    },
    {
      key: 'name',
      header: 'Part Name',
      sortable: true,
      render: (part: Part) => (
        <div>
          <p className="font-medium text-gray-900">{part.name}</p>
          {part.manufacturer && (
            <p className="text-sm text-gray-500">{part.manufacturer}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (part: Part) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
          {part.category || 'Uncategorized'}
        </span>
      ),
    },
    {
      key: 'cost_price',
      header: 'Cost',
      sortable: true,
      render: (part: Part) => <span>${part.cost_price.toFixed(2)}</span>,
    },
    {
      key: 'retail_price',
      header: 'Retail',
      sortable: true,
      render: (part: Part) => (
        <span className="font-medium">${part.retail_price.toFixed(2)}</span>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'Stock',
      sortable: true,
      render: (part: Part) => {
        const isLow = part.stock_quantity < part.min_stock_level;
        return (
          <div className="flex items-center">
            <span className={isLow ? 'text-red-600 font-medium' : ''}>
              {part.stock_quantity}
            </span>
            {isLow && (
              <svg
                className="w-4 h-4 ml-1 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>
        );
      },
    },
    {
      key: 'margin',
      header: 'Margin',
      sortable: false,
      render: (part: Part) => {
        const margin = ((part.retail_price - part.cost_price) / part.cost_price) * 100;
        return (
          <span className="text-green-600 font-medium">{margin.toFixed(0)}%</span>
        );
      },
    },
  ];

  const actions = (part: Part) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleEdit(part)}
        className="p-1 text-gray-500 hover:text-blue-600"
        title="Edit"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
      <button
        onClick={() => handleDelete(part.id)}
        className="p-1 text-gray-500 hover:text-red-600"
        title="Delete"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );

  const lowStockCount = parts.filter((p) => p.stock_quantity < p.min_stock_level).length;
  const totalValue = parts.reduce((sum, p) => sum + p.retail_price * p.stock_quantity, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Catalog</h1>
          <p className="text-gray-500 mt-1">Manage inventory and pricing</p>
        </div>
        <button
          onClick={() => {
            setEditingPart(undefined);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Part
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Parts</p>
          <p className="text-2xl font-bold text-gray-900">{parts.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold text-indigo-600">{categories.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Inventory Value</p>
          <p className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Low Stock Only</span>
            </label>
          </div>
          <div className="ml-auto flex space-x-2">
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Import CSV
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredParts}
        columns={columns}
        searchable={true}
        searchKeys={['sku', 'name', 'manufacturer', 'category']}
        actions={actions}
        emptyMessage="No parts found"
      />

      {/* Add/Edit Part Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPart ? 'Edit Part' : 'Add New Part'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPart(undefined);
                }}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <PartsForm
              part={editingPart}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingPart(undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

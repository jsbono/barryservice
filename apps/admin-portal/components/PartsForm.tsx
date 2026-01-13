'use client';

import { useState, useEffect } from 'react';
import type { Part } from '@/lib/supabase';

interface PartsFormProps {
  part?: Part;
  onSubmit: (data: Omit<Part, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PartsForm({
  part,
  onSubmit,
  onCancel,
  isLoading = false,
}: PartsFormProps) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    cost_price: 0,
    retail_price: 0,
    stock_quantity: 0,
    min_stock_level: 5,
    category: '',
    manufacturer: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (part) {
      setFormData({
        sku: part.sku,
        name: part.name,
        description: part.description || '',
        cost_price: part.cost_price,
        retail_price: part.retail_price,
        stock_quantity: part.stock_quantity,
        min_stock_level: part.min_stock_level,
        category: part.category || '',
        manufacturer: part.manufacturer || '',
      });
    }
  }, [part]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (formData.cost_price < 0) {
      newErrors.cost_price = 'Cost price must be positive';
    }
    if (formData.retail_price < 0) {
      newErrors.retail_price = 'Retail price must be positive';
    }
    if (formData.retail_price < formData.cost_price) {
      newErrors.retail_price = 'Retail price should be greater than cost price';
    }
    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity must be positive';
    }
    if (formData.min_stock_level < 0) {
      newErrors.min_stock_level = 'Minimum stock level must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const categories = [
    'Engine Parts',
    'Brake System',
    'Suspension',
    'Electrical',
    'Filters',
    'Fluids & Lubricants',
    'Exhaust System',
    'Transmission',
    'Cooling System',
    'Body Parts',
    'Accessories',
    'Other',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SKU */}
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.sku ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., BRK-PAD-001"
          />
          {errors.sku && <p className="mt-1 text-sm text-red-500">{errors.sku}</p>}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Part Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Premium Brake Pads"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Manufacturer */}
        <div>
          <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
            Manufacturer
          </label>
          <input
            type="text"
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Bosch"
          />
        </div>

        {/* Cost Price */}
        <div>
          <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-1">
            Cost Price <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              id="cost_price"
              name="cost_price"
              value={formData.cost_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.cost_price ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.cost_price && (
            <p className="mt-1 text-sm text-red-500">{errors.cost_price}</p>
          )}
        </div>

        {/* Retail Price */}
        <div>
          <label htmlFor="retail_price" className="block text-sm font-medium text-gray-700 mb-1">
            Retail Price <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              id="retail_price"
              name="retail_price"
              value={formData.retail_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.retail_price ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.retail_price && (
            <p className="mt-1 text-sm text-red-500">{errors.retail_price}</p>
          )}
        </div>

        {/* Stock Quantity */}
        <div>
          <label
            htmlFor="stock_quantity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Stock Quantity
          </label>
          <input
            type="number"
            id="stock_quantity"
            name="stock_quantity"
            value={formData.stock_quantity}
            onChange={handleChange}
            min="0"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.stock_quantity && (
            <p className="mt-1 text-sm text-red-500">{errors.stock_quantity}</p>
          )}
        </div>

        {/* Min Stock Level */}
        <div>
          <label
            htmlFor="min_stock_level"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Min Stock Level
          </label>
          <input
            type="number"
            id="min_stock_level"
            name="min_stock_level"
            value={formData.min_stock_level}
            onChange={handleChange}
            min="0"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.min_stock_level ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.min_stock_level && (
            <p className="mt-1 text-sm text-red-500">{errors.min_stock_level}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Part description..."
        />
      </div>

      {/* Profit Margin Display */}
      {formData.cost_price > 0 && formData.retail_price > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Profit Margin:{' '}
            <span className="font-semibold text-green-600">
              {(
                ((formData.retail_price - formData.cost_price) / formData.cost_price) *
                100
              ).toFixed(1)}
              %
            </span>
            <span className="text-gray-500 ml-2">
              (${(formData.retail_price - formData.cost_price).toFixed(2)} per unit)
            </span>
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : part ? 'Update Part' : 'Add Part'}
        </button>
      </div>
    </form>
  );
}

'use client';

import { useState, useEffect } from 'react';
import type { ServiceTemplate } from '@/lib/supabase';

interface ServiceTemplateFormProps {
  template?: ServiceTemplate;
  onSubmit: (data: Omit<ServiceTemplate, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ServiceTemplateForm({
  template,
  onSubmit,
  onCancel,
  isLoading = false,
}: ServiceTemplateFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    labor_hours: 1,
    default_parts: [] as string[],
    category: '',
    is_active: true,
  });

  const [partInput, setPartInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        code: template.code,
        name: template.name,
        description: template.description || '',
        labor_hours: template.labor_hours,
        default_parts: template.default_parts || [],
        category: template.category,
        is_active: template.is_active,
      });
    }
  }, [template]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Service code is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }
    if (formData.labor_hours <= 0) {
      newErrors.labor_hours = 'Labor hours must be greater than 0';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
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

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddPart = () => {
    if (partInput.trim() && !formData.default_parts.includes(partInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        default_parts: [...prev.default_parts, partInput.trim()],
      }));
      setPartInput('');
    }
  };

  const handleRemovePart = (part: string) => {
    setFormData((prev) => ({
      ...prev,
      default_parts: prev.default_parts.filter((p) => p !== part),
    }));
  };

  const categories = [
    'Maintenance',
    'Repair',
    'Inspection',
    'Diagnostic',
    'Tire Service',
    'Oil Service',
    'Brake Service',
    'Engine Service',
    'Transmission Service',
    'Electrical Service',
    'AC/Heating Service',
    'Body Work',
    'Other',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Service Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., OIL-CHANGE-STD"
          />
          {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
        </div>

        {/* Service Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Service Name <span className="text-red-500">*</span>
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
            placeholder="e.g., Standard Oil Change"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
        </div>

        {/* Labor Hours */}
        <div>
          <label htmlFor="labor_hours" className="block text-sm font-medium text-gray-700 mb-1">
            Labor Hours <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="labor_hours"
            name="labor_hours"
            value={formData.labor_hours}
            onChange={handleChange}
            step="0.25"
            min="0.25"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.labor_hours ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.labor_hours && (
            <p className="mt-1 text-sm text-red-500">{errors.labor_hours}</p>
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
          placeholder="Describe the service..."
        />
      </div>

      {/* Default Parts */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Parts</label>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            value={partInput}
            onChange={(e) => setPartInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPart())}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter part SKU and press Enter"
          />
          <button
            type="button"
            onClick={handleAddPart}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Add
          </button>
        </div>
        {formData.default_parts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.default_parts.map((part) => (
              <span
                key={part}
                className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
              >
                {part}
                <button
                  type="button"
                  onClick={() => handleRemovePart(part)}
                  className="ml-2 text-indigo-500 hover:text-indigo-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
          Service template is active
        </label>
      </div>

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
          {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  );
}

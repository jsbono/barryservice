'use client';

import { useState } from 'react';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import ServiceTemplateForm from '@/components/ServiceTemplateForm';
import type { ServiceTemplate } from '@/lib/supabase';

const mockTemplates: ServiceTemplate[] = [
  {
    id: 't1',
    code: 'OIL-STD',
    name: 'Standard Oil Change',
    description: 'Conventional oil change with filter replacement and fluid top-off',
    labor_hours: 0.5,
    default_parts: ['OIL-SYN-5W30', 'FLT-OIL-UNI'],
    category: 'Oil Service',
    is_active: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 't2',
    code: 'OIL-SYN',
    name: 'Synthetic Oil Change',
    description: 'Full synthetic oil change with premium filter',
    labor_hours: 0.5,
    default_parts: ['OIL-SYN-5W30', 'FLT-OIL-PRE'],
    category: 'Oil Service',
    is_active: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 't3',
    code: 'BRK-INS',
    name: 'Brake Inspection',
    description: 'Complete brake system inspection including pads, rotors, and fluid',
    labor_hours: 1.0,
    default_parts: [],
    category: 'Brake Service',
    is_active: true,
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
  },
  {
    id: 't4',
    code: 'BRK-PAD-F',
    name: 'Front Brake Pad Replacement',
    description: 'Replace front brake pads and resurface rotors',
    labor_hours: 2.0,
    default_parts: ['BRK-PAD-001'],
    category: 'Brake Service',
    is_active: true,
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
  },
  {
    id: 't5',
    code: 'TIRE-ROT',
    name: 'Tire Rotation',
    description: 'Rotate all four tires and check tire pressure',
    labor_hours: 0.5,
    default_parts: [],
    category: 'Tire Service',
    is_active: true,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 't6',
    code: 'DIAG-ENG',
    name: 'Engine Diagnostic',
    description: 'Full computer diagnostic for engine issues',
    labor_hours: 1.5,
    default_parts: [],
    category: 'Diagnostic',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 't7',
    code: 'INSP-FULL',
    name: 'Full Vehicle Inspection',
    description: 'Comprehensive multi-point inspection of all systems',
    labor_hours: 2.0,
    default_parts: [],
    category: 'Inspection',
    is_active: true,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
  {
    id: 't8',
    code: 'AC-RECHARGE',
    name: 'AC Recharge',
    description: 'Evacuate and recharge AC system with new refrigerant',
    labor_hours: 1.0,
    default_parts: ['AC-REF-R134A'],
    category: 'AC/Heating Service',
    is_active: false,
    created_at: '2024-02-15T10:00:00Z',
    updated_at: '2024-02-15T10:00:00Z',
  },
];

export default function ServiceTemplatesPage() {
  const [templates, setTemplates] = useState<ServiceTemplate[]>(mockTemplates);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ServiceTemplate | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = [...new Set(templates.map((t) => t.category))];

  const filteredTemplates = categoryFilter
    ? templates.filter((t) => t.category === categoryFilter)
    : templates;

  const handleSubmit = (data: Omit<ServiceTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, ...data, updated_at: new Date().toISOString() }
            : t
        )
      );
    } else {
      const newTemplate: ServiceTemplate = {
        ...data,
        id: `t${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTemplates((prev) => [...prev, newTemplate]);
    }
    setShowForm(false);
    setEditingTemplate(undefined);
  };

  const handleEdit = (template: ServiceTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleToggleActive = (templateId: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, is_active: !t.is_active } : t
      )
    );
  };

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (template: ServiceTemplate) => (
        <span className="font-mono text-sm text-indigo-600">{template.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Service Name',
      sortable: true,
      render: (template: ServiceTemplate) => (
        <div>
          <p className="font-medium text-gray-900">{template.name}</p>
          {template.description && (
            <p className="text-sm text-gray-500 truncate max-w-xs">{template.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (template: ServiceTemplate) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
          {template.category}
        </span>
      ),
    },
    {
      key: 'labor_hours',
      header: 'Labor Hours',
      sortable: true,
      render: (template: ServiceTemplate) => (
        <span>{template.labor_hours} hr</span>
      ),
    },
    {
      key: 'default_parts',
      header: 'Default Parts',
      sortable: false,
      render: (template: ServiceTemplate) => (
        <span className="text-sm text-gray-500">
          {template.default_parts && template.default_parts.length > 0
            ? `${template.default_parts.length} part(s)`
            : 'None'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (template: ServiceTemplate) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            template.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {template.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = (template: ServiceTemplate) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleEdit(template)}
        className="p-1 text-gray-500 hover:text-blue-600"
        title="Edit"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={() => handleToggleActive(template.id)}
        className={`p-1 ${
          template.is_active
            ? 'text-gray-500 hover:text-yellow-600'
            : 'text-gray-500 hover:text-green-600'
        }`}
        title={template.is_active ? 'Deactivate' : 'Activate'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              template.is_active
                ? 'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z'
                : 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
            }
          />
        </svg>
      </button>
      <button
        onClick={() => handleDelete(template.id)}
        className="p-1 text-gray-500 hover:text-red-600"
        title="Delete"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  const activeCount = templates.filter((t) => t.is_active).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Templates</h1>
          <p className="text-gray-500 mt-1">Manage service codes and templates</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(undefined);
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Template
        </button>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <nav className="flex space-x-4">
          <Link
            href="/settings"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
          >
            General
          </Link>
          <Link
            href="/settings/service-templates"
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg"
          >
            Service Templates
          </Link>
        </nav>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Templates</p>
          <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold text-indigo-600">{categories.length}</p>
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
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredTemplates}
        columns={columns}
        searchable={true}
        searchKeys={['code', 'name', 'category']}
        actions={actions}
        emptyMessage="No service templates found"
      />

      {/* Add/Edit Template Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Service Template' : 'Add Service Template'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(undefined);
                }}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ServiceTemplateForm
              template={editingTemplate}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTemplate(undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/StatsCard';
import RevenueChart from '@/components/RevenueChart';
import ActivityFeed from '@/components/ActivityFeed';

// Mock data for demonstration
const mockRevenueData = [
  { date: 'Jan', revenue: 45000, services: 120 },
  { date: 'Feb', revenue: 52000, services: 145 },
  { date: 'Mar', revenue: 48000, services: 132 },
  { date: 'Apr', revenue: 61000, services: 167 },
  { date: 'May', revenue: 55000, services: 155 },
  { date: 'Jun', revenue: 67000, services: 189 },
  { date: 'Jul', revenue: 72000, services: 201 },
];

const mockActivities = [
  {
    id: '1',
    type: 'service' as const,
    action: 'Service Completed',
    description: 'Oil change for 2021 Honda Accord - VIN: 1HGCV1F34MA123456',
    user: 'Mike Johnson',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: '2',
    type: 'invoice' as const,
    action: 'Invoice Paid',
    description: 'Invoice #INV-2024-0234 - $485.00',
    user: 'System',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: '3',
    type: 'customer' as const,
    action: 'New Customer Registered',
    description: 'Sarah Williams - sarah.w@email.com',
    user: 'Front Desk',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: '4',
    type: 'part' as const,
    action: 'Low Stock Alert',
    description: 'Brake Pads (BRK-PAD-001) - Only 3 units remaining',
    user: 'System',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: '5',
    type: 'mechanic' as const,
    action: 'Mechanic Clocked In',
    description: 'David Chen started shift',
    user: 'David Chen',
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: '6',
    type: 'service' as const,
    action: 'Service Started',
    description: 'Brake inspection for 2019 Toyota Camry',
    user: 'James Wilson',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    servicesCompleted: 0,
    activeCustomers: 0,
    pendingInvoices: 0,
  });

  useEffect(() => {
    // Simulate loading stats
    setStats({
      totalRevenue: 72450,
      servicesCompleted: 189,
      activeCustomers: 342,
      pendingInvoices: 23,
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change="12.5% from last month"
          changeType="positive"
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Services Completed"
          value={stats.servicesCompleted}
          change="8.2% from last month"
          changeType="positive"
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Active Customers"
          value={stats.activeCustomers}
          change="23 new this month"
          changeType="neutral"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Pending Invoices"
          value={stats.pendingInvoices}
          change="$8,450 outstanding"
          changeType="negative"
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={mockRevenueData} />
        </div>
        <div>
          <ActivityFeed activities={mockActivities} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">New Service</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Add Customer</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Create Invoice</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Add Part</span>
          </button>
        </div>
      </div>
    </div>
  );
}

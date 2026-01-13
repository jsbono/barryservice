import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../../lib/customerAuth';
import { PortalVehicle, PortalRecommendedService } from '../../lib/types';
import { VehicleImage } from '../../components/vehicles/VehicleImage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Types for vehicle status
type VehicleStatus = 'overdue' | 'due_soon' | 'up_to_date' | 'unknown';

interface VehicleWithStatus extends PortalVehicle {
  status: VehicleStatus;
  statusLabel: string;
  recommendedCount: number;
  dueCount: number;
  nextRecommendation?: PortalRecommendedService;
}

// Status computation helper
function computeVehicleStatus(
  recommended: PortalRecommendedService[]
): { status: VehicleStatus; statusLabel: string; dueCount: number; nextRecommendation?: PortalRecommendedService } {
  const dueNow = recommended.filter(r => r.status === 'due');
  const upcoming = recommended.filter(r => r.status === 'upcoming');

  if (dueNow.length > 0) {
    return {
      status: 'overdue',
      statusLabel: `${dueNow.length} service${dueNow.length > 1 ? 's' : ''} due`,
      dueCount: dueNow.length,
      nextRecommendation: dueNow[0],
    };
  }

  if (upcoming.length > 0) {
    return {
      status: 'due_soon',
      statusLabel: `${upcoming.length} upcoming`,
      dueCount: 0,
      nextRecommendation: upcoming[0],
    };
  }

  return {
    status: 'up_to_date',
    statusLabel: 'All caught up',
    dueCount: 0,
  };
}

// Skeleton Loader Components
function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="bg-gray-200 h-40 w-full" />
      {/* Content placeholder */}
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-5 bg-gray-200 rounded w-2/3 mb-1" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-10 bg-gray-200 rounded-xl flex-1" />
          <div className="h-10 bg-gray-200 rounded-xl flex-1" />
        </div>
      </div>
    </div>
  );
}

// Vehicle Card Component
interface VehicleCardProps {
  vehicle: VehicleWithStatus;
  onRequestService: (vehicle: VehicleWithStatus) => void;
}

function VehicleCard({ vehicle, onRequestService }: VehicleCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    overdue: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    due_soon: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    up_to_date: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    unknown: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = statusConfig[vehicle.status];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all overflow-hidden relative">
      {/* Kebab Menu - Absolute positioned */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors bg-white/80 backdrop-blur-sm"
          aria-label="Vehicle options"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
              <Link
                to={`/portal/vehicle/${vehicle.id}`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Service History
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onRequestService(vehicle);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Request Service
              </button>
            </div>
          </>
        )}
      </div>

      {/* Vehicle Image - Full width at top */}
      <Link to={`/portal/vehicle/${vehicle.id}`} className="block">
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center p-4">
          <VehicleImage
            make={vehicle.make}
            model={vehicle.model}
            year={vehicle.year}
            vehicleId={vehicle.id}
            size="md"
          />
          {/* Status Badge - Overlaid on image */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${config.bg} ${config.text}`}>
              {config.icon}
              {vehicle.statusLabel}
            </span>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4">
        {/* Vehicle Name */}
        <Link to={`/portal/vehicle/${vehicle.id}`}>
          <h3 className="text-lg font-bold text-gray-900 hover:text-amber-600 transition-colors">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </Link>

        {/* Mileage */}
        {vehicle.mileage && (
          <div className="flex items-center mt-1.5 text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {vehicle.mileage.toLocaleString()} miles
          </div>
        )}

        {/* Recommended Next Step */}
        {vehicle.nextRecommendation && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Recommended Next
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{vehicle.nextRecommendation.service_name}</p>
                {vehicle.nextRecommendation.next_due_mileage && (
                  <p className="text-sm text-gray-600">
                    Due at {vehicle.nextRecommendation.next_due_mileage.toLocaleString()} mi
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Link
            to={`/portal/vehicle/${vehicle.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            History
          </Link>
          <button
            onClick={() => onRequestService(vehicle)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Service
          </button>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  onAddVehicle: () => void;
  onHowItWorks: () => void;
}

function EmptyState({ onAddVehicle, onHowItWorks }: EmptyStateProps) {
  const steps = [
    {
      number: 1,
      title: 'Add Your Vehicle',
      description: 'Enter your vehicle details to get started with personalized service tracking.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Get Recommendations',
      description: 'Receive personalized service recommendations based on your vehicle and mileage.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Schedule Service',
      description: 'Request service appointments and track your vehicle\'s maintenance history.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="text-center py-8">
      {/* Hero */}
      <div
        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
        style={{
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        }}
      >
        <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your Garage</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Add your vehicles to get personalized service recommendations and keep track of maintenance history.
      </p>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
        {steps.map((step) => (
          <div key={step.number} className="bg-white rounded-2xl p-5 border border-gray-100 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                }}
              >
                <span className="text-amber-700 font-bold">{step.number}</span>
              </div>
              <h3 className="font-bold text-gray-900">{step.title}</h3>
            </div>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onAddVehicle}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-gray-900 rounded-xl transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            boxShadow: '0 4px 14px -3px rgba(245, 158, 11, 0.4)',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Your First Vehicle
        </button>
        <button
          onClick={onHowItWorks}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How It Works
        </button>
      </div>
    </div>
  );
}

// How It Works Drawer
interface HowItWorksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function HowItWorksDrawer({ isOpen, onClose }: HowItWorksDrawerProps) {
  const features = [
    {
      title: 'Multiple Vehicles',
      description: 'Track service history and recommendations for all your vehicles in one place.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      title: 'Smart Recommendations',
      description: 'Get personalized service recommendations based on your vehicle\'s make, model, and mileage.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: 'Service History',
      description: 'View complete service records for each vehicle, including dates, mileage, and notes.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: 'Status Tracking',
      description: 'See at a glance which vehicles need attention with color-coded status indicators.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Invoice Access',
      description: 'View and download invoices for all completed services.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">How It Works</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close drawer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 mb-8">
            Your Vehicles Dashboard helps you stay on top of maintenance for all your vehicles. Here's what you can do:
          </p>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  }}
                >
                  <span className="text-amber-700">{feature.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Status Legend */}
          <div className="mt-8 p-5 bg-gray-50 rounded-2xl">
            <h4 className="font-bold text-gray-900 mb-4">Status Indicators</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Overdue
                </span>
                <span className="text-sm text-gray-600">Service is past due</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Due Soon
                </span>
                <span className="text-sm text-gray-600">Service coming up</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Up to Date
                </span>
                <span className="text-sm text-gray-600">All services current</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full py-3 text-base font-semibold text-gray-900 rounded-xl transition-all hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            }}
          >
            Got It
          </button>
        </div>
      </div>
    </>
  );
}

// Add Vehicle Modal
interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { make: string; model: string; year: number; mileage?: number }) => Promise<void>;
}

function AddVehicleModal({ isOpen, onClose, onSubmit }: AddVehicleModalProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<string>('');
  const [mileage, setMileage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!make.trim() || !model.trim() || !year) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        mileage: mileage ? parseInt(mileage) : undefined,
      });
      onClose();
      setMake('');
      setModel('');
      setYear('');
      setMileage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 flex items-end md:items-center justify-center md:p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
            <h2 className="text-xl font-bold text-gray-900">Add Vehicle</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-600">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                >
                  <option value="">Select year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="make" className="block text-sm font-semibold text-gray-700 mb-2">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  id="make"
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                  placeholder="e.g., Toyota"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-semibold text-gray-700 mb-2">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  id="model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  placeholder="e.g., Camry"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="mileage" className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Mileage
                </label>
                <input
                  id="mileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g., 50000"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Helps us provide accurate service recommendations
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 text-base font-semibold text-gray-900 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Add Vehicle'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// Request Service Modal
interface RequestServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleWithStatus | null;
  onSubmit: (data: { vehicleId: string; serviceType: string; description: string }) => Promise<void>;
}

function RequestServiceModal({ isOpen, onClose, vehicle, onSubmit }: RequestServiceModalProps) {
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const serviceTypes = [
    'Oil Change',
    'Tire Rotation',
    'Brake Service',
    'Battery Check/Replace',
    'Air Filter Replacement',
    'Transmission Service',
    'Coolant Flush',
    'Spark Plug Replacement',
    'Wheel Alignment',
    'General Inspection',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vehicle || !serviceType) {
      setError('Please select a service type');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        vehicleId: vehicle.id,
        serviceType,
        description: description.trim(),
      });
      onClose();
      setServiceType('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 flex items-end md:items-center justify-center md:p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Request Service</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-600">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="serviceType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="serviceType"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 transition-colors text-gray-900 bg-white"
                >
                  <option value="">Select service type</option>
                  {serviceTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description / Notes
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe any symptoms or specific concerns..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 transition-colors text-gray-900 placeholder-gray-400 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 text-base font-semibold text-gray-900 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// Main Dashboard Component
export function PortalDashboard() {
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicles, setVehicles] = useState<VehicleWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showRequestService, setShowRequestService] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithStatus | null>(null);

  const token = localStorage.getItem('customer_token');

  useEffect(() => {
    fetchVehiclesWithStatus();
  }, []);

  const fetchWithAuth = async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
  };

  const fetchVehiclesWithStatus = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`${API_BASE}/portal/me/vehicles`);
      const vehiclesData: PortalVehicle[] = data.vehicles;

      // Fetch recommendations for each vehicle to compute status
      const vehiclesWithStatus: VehicleWithStatus[] = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          try {
            const recommendedData = await fetchWithAuth(`${API_BASE}/portal/vehicle/${vehicle.id}/recommended`);
            const recommended: PortalRecommendedService[] = recommendedData.recommended || [];
            const { status, statusLabel, dueCount, nextRecommendation } = computeVehicleStatus(recommended);

            return {
              ...vehicle,
              status,
              statusLabel,
              recommendedCount: recommended.length,
              dueCount,
              nextRecommendation,
            };
          } catch {
            return {
              ...vehicle,
              status: 'unknown' as VehicleStatus,
              statusLabel: 'Status unknown',
              recommendedCount: 0,
              dueCount: 0,
            };
          }
        })
      );

      // Sort: overdue first, then due_soon, then up_to_date
      vehiclesWithStatus.sort((a, b) => {
        const order = { overdue: 0, due_soon: 1, up_to_date: 2, unknown: 3 };
        return order[a.status] - order[b.status];
      });

      setVehicles(vehiclesWithStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const handleAddVehicle = async (data: { make: string; model: string; year: number; mileage?: number }) => {
    const response = await fetch(`${API_BASE}/portal/me/vehicles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to add vehicle');
    }

    await fetchVehiclesWithStatus();
  };

  const handleRequestService = async (data: { vehicleId: string; serviceType: string; description: string }) => {
    const response = await fetch(`${API_BASE}/portal/service-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to submit service request');
    }

    // Show success feedback
    alert('Service request submitted! The shop will contact you soon.');
  };

  const openRequestService = (vehicle: VehicleWithStatus) => {
    setSelectedVehicle(vehicle);
    setShowRequestService(true);
  };

  const isVehiclesActive = location.pathname === '/portal';
  const isInvoicesActive = location.pathname === '/portal/invoices';

  // Stats computation
  const overdueCount = vehicles.filter(v => v.status === 'overdue').length;
  const dueSoonCount = vehicles.filter(v => v.status === 'due_soon').length;
  const upToDateCount = vehicles.filter(v => v.status === 'up_to_date').length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-900">
        <div className="px-4 py-4 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                }}
              >
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white truncate">
                  {customer?.name || 'My Garage'}
                </h1>
                <p className="text-sm text-gray-500">Customer Portal</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-5 pb-24">
        {/* Vehicles Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Vehicles</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowItWorks(true)}
              className="p-2.5 rounded-xl text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              aria-label="How it works"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowAddVehicle(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-900 rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 4px 14px -3px rgba(245, 158, 11, 0.4)',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {!loading && vehicles.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">Overdue</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{dueSoonCount}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">Due Soon</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{upToDateCount}</div>
              <div className="text-xs font-medium text-gray-600 mt-1">Up to Date</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <VehicleCardSkeleton />
            <VehicleCardSkeleton />
            <VehicleCardSkeleton />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-700">Error loading vehicles</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={fetchVehiclesWithStatus}
              className="ml-auto px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && vehicles.length === 0 && (
          <EmptyState
            onAddVehicle={() => setShowAddVehicle(true)}
            onHowItWorks={() => setShowHowItWorks(true)}
          />
        )}

        {/* Vehicles Grid */}
        {!loading && !error && vehicles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onRequestService={openRequestService}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-bottom">
        <div className="flex max-w-md mx-auto">
          <Link
            to="/portal"
            className={`flex-1 flex flex-col items-center py-3 transition-colors ${
              isVehiclesActive ? 'text-amber-600' : 'text-gray-600'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${isVehiclesActive ? 'bg-amber-50' : ''}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <span className="text-xs font-semibold mt-1">Vehicles</span>
          </Link>
          <Link
            to="/portal/invoices"
            className={`flex-1 flex flex-col items-center py-3 transition-colors ${
              isInvoicesActive ? 'text-amber-600' : 'text-gray-600'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${isInvoicesActive ? 'bg-amber-50' : ''}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold mt-1">Invoices</span>
          </Link>
        </div>
      </nav>

      {/* Modals & Drawers */}
      <HowItWorksDrawer
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      <AddVehicleModal
        isOpen={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        onSubmit={handleAddVehicle}
      />

      <RequestServiceModal
        isOpen={showRequestService}
        onClose={() => {
          setShowRequestService(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        onSubmit={handleRequestService}
      />
    </div>
  );
}

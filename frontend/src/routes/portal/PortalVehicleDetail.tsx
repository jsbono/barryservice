import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../lib/customerAuth';
import {
  PortalVehicle,
  PortalServiceLog,
  PortalRecommendedService,
  PortalScheduledService,
} from '../../lib/types';

type TabType = 'services' | 'recommended' | 'scheduled';

export function PortalVehicleDetail() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { logout } = useCustomerAuth();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<PortalVehicle | null>(null);
  const [services, setServices] = useState<PortalServiceLog[]>([]);
  const [recommended, setRecommended] = useState<PortalRecommendedService[]>([]);
  const [scheduled, setScheduled] = useState<PortalScheduledService[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('customer_token');

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleData();
    }
  }, [vehicleId]);

  const fetchWithAuth = async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access denied');
      }
      throw new Error('Request failed');
    }

    return response.json();
  };

  const fetchVehicleData = async () => {
    setLoading(true);
    try {
      const [vehicleData, servicesData, recommendedData, scheduledData] = await Promise.all([
        fetchWithAuth(`/api/portal/vehicle/${vehicleId}`),
        fetchWithAuth(`/api/portal/vehicle/${vehicleId}/services`),
        fetchWithAuth(`/api/portal/vehicle/${vehicleId}/recommended`),
        fetchWithAuth(`/api/portal/vehicle/${vehicleId}/scheduled`),
      ]);

      setVehicle(vehicleData.vehicle);
      setServices(servicesData.services);
      setRecommended(recommendedData.recommended);
      setScheduled(scheduledData.scheduled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const dueCount = recommended.filter(r => r.status === 'due').length;
  const upcomingCount = recommended.filter(r => r.status === 'upcoming').length;
  const scheduledCount = scheduled.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full animate-pulse blur-lg"
              style={{ background: 'rgba(245, 158, 11, 0.3)' }}
            />
            <svg className="animate-spin w-10 h-10 text-amber-500 relative" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <span className="mt-4 text-sm font-medium text-gray-600">Loading vehicle...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-gray-900 text-white p-4">
          <Link to="/portal" className="inline-flex items-center text-gray-500 hover:text-white">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-sm w-full">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{error}</h3>
            <Link
              to="/portal"
              className="inline-block mt-4 px-6 py-3 text-sm font-semibold text-gray-900 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              }}
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 sticky top-0 z-20">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between mb-3">
            <Link
              to="/portal"
              className="inline-flex items-center text-gray-500 hover:text-white text-sm transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
          <h1 className="text-lg font-bold text-white">
            {vehicle?.year} {vehicle?.make} {vehicle?.model}
          </h1>
          {vehicle?.mileage && (
            <p className="text-sm text-gray-500 flex items-center mt-1">
              <svg className="w-4 h-4 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {vehicle.mileage.toLocaleString()} miles
            </p>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[88px] z-10">
        <div className="flex">
          {[
            { key: 'services', label: 'History', count: services.length },
            { key: 'recommended', label: 'Recommended', count: recommended.length, badge: dueCount },
            { key: 'scheduled', label: 'Scheduled', count: scheduledCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors relative ${
                activeTab === tab.key
                  ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-2 right-2 sm:right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-safe">
        {/* Service History Tab */}
        {activeTab === 'services' && (
          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Service History</h3>
                <p className="text-sm text-gray-600">Service records will appear here after your first visit.</p>
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">{service.service_type}</h3>
                      <span className="text-sm text-gray-600 flex-shrink-0 ml-2">
                        {formatDate(service.service_date)}
                      </span>
                    </div>
                    {service.mileage_at_service && (
                      <p className="text-sm text-gray-600 flex items-center mb-2">
                        <svg className="w-4 h-4 mr-1.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {service.mileage_at_service.toLocaleString()} mi
                      </p>
                    )}
                    {service.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mt-2">
                        {service.notes}
                      </p>
                    )}
                    {service.next_service_mileage && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-amber-600 flex items-center font-semibold">
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Next at {service.next_service_mileage.toLocaleString()} mi
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Recommended Services Tab */}
        {activeTab === 'recommended' && (
          <div className="space-y-4">
            {recommended.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-sm text-gray-600">No services recommended at this time.</p>
              </div>
            ) : (
              <>
                {/* Due Now Section */}
                {dueCount > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                        Due Now
                      </span>
                      <span className="text-sm text-gray-600">({dueCount})</span>
                    </div>
                    <div className="space-y-3">
                      {recommended
                        .filter(r => r.status === 'due')
                        .map((rec) => (
                          <div key={rec.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 border-red-500">
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900">{rec.service_name}</h4>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {rec.category && (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                        rec.category === 'major' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {rec.category === 'major' ? 'Major' : 'Minor'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex-shrink-0">
                                  Due Now
                                </span>
                              </div>
                              {rec.next_due_mileage && (
                                <p className="text-sm text-gray-600 mt-3 flex items-center">
                                  <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  Due at {rec.next_due_mileage.toLocaleString()} mi
                                </p>
                              )}
                              {rec.last_service_date && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Last service: {formatDate(rec.last_service_date)}
                                  {rec.last_service_mileage && ` at ${rec.last_service_mileage.toLocaleString()} mi`}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Section */}
                {upcomingCount > 0 && (
                  <div className={dueCount > 0 ? 'mt-6' : ''}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                        Upcoming
                      </span>
                      <span className="text-sm text-gray-600">({upcomingCount})</span>
                    </div>
                    <div className="space-y-3">
                      {recommended
                        .filter(r => r.status === 'upcoming')
                        .map((rec) => (
                          <div key={rec.id} className="bg-white rounded-2xl shadow-sm p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{rec.service_name}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                  {rec.category && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                      rec.category === 'major' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {rec.category === 'major' ? 'Major' : 'Minor'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">
                                Upcoming
                              </span>
                            </div>
                            {rec.next_due_mileage && (
                              <p className="text-sm text-gray-600 mt-3 flex items-center">
                                <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Due at {rec.next_due_mileage.toLocaleString()} mi
                              </p>
                            )}
                            {rec.last_service_date && (
                              <p className="text-xs text-gray-500 mt-2">
                                Last service: {formatDate(rec.last_service_date)}
                                {rec.last_service_mileage && ` at ${rec.last_service_mileage.toLocaleString()} mi`}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Scheduled Services Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-3">
            {scheduled.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Scheduled Services</h3>
                <p className="text-sm text-gray-600">Contact your mechanic to schedule an appointment.</p>
              </div>
            ) : (
              scheduled.map((sched) => (
                <div key={sched.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-gray-900">{sched.service_type}</h3>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex-shrink-0">
                        Scheduled
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold">{formatDate(sched.scheduled_date)}</span>
                      {sched.scheduled_time && (
                        <span className="ml-2 text-gray-600">at {sched.scheduled_time}</span>
                      )}
                    </div>
                    {sched.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mt-3">
                        {sched.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t px-4 py-4 safe-area-bottom">
        <p className="text-center text-sm text-gray-600">
          Contact your mechanic shop to schedule services
        </p>
      </footer>
    </div>
  );
}

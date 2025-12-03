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
          <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-blue-600 text-white p-4 shadow-lg">
          <Link to="/portal" className="inline-flex items-center text-white/80 hover:text-white touch-manipulation py-1">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center max-w-sm w-full">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{error}</h3>
            <Link
              to="/portal"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium touch-manipulation"
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
      <header className="bg-blue-600 text-white shadow-lg sticky top-0 z-20">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between mb-2">
            <Link
              to="/portal"
              className="inline-flex items-center text-white/80 hover:text-white text-sm touch-manipulation py-1"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors touch-manipulation"
            >
              Logout
            </button>
          </div>
          <h1 className="text-lg font-bold">
            {vehicle?.year} {vehicle?.make} {vehicle?.model}
          </h1>
          {vehicle?.mileage && (
            <p className="text-blue-100 text-sm flex items-center mt-0.5">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {vehicle.mileage.toLocaleString()} miles
            </p>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[88px] z-10 shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors touch-manipulation ${
              activeTab === 'services'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors touch-manipulation relative ${
              activeTab === 'recommended'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500'
            }`}
          >
            Recommended
            {dueCount > 0 && (
              <span className="absolute -top-0.5 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {dueCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex-1 py-3.5 text-sm font-medium border-b-2 transition-colors touch-manipulation relative ${
              activeTab === 'scheduled'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500'
            }`}
          >
            Scheduled
            {scheduledCount > 0 && (
              <span className="absolute -top-0.5 right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {scheduledCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-safe">
        {/* Previous Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Service History</h3>
                <p className="text-gray-500 text-sm">Service records will appear here after your first visit.</p>
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-base">{service.service_type}</h3>
                    <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
                      {formatDate(service.service_date)}
                    </span>
                  </div>
                  {service.mileage_at_service && (
                    <p className="text-sm text-gray-600 flex items-center mb-2">
                      <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <p className="text-sm text-blue-600 mt-3 flex items-center font-medium">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Next at {service.next_service_mileage.toLocaleString()} mi
                    </p>
                  )}
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-500 text-sm">No services recommended at this time.</p>
              </div>
            ) : (
              <>
                {/* Due Now Section */}
                {dueCount > 0 && (
                  <div>
                    <div className="flex items-center mb-3">
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                        Due Now
                      </span>
                      <span className="ml-2 text-sm text-gray-500">({dueCount})</span>
                    </div>
                    <div className="space-y-3">
                      {recommended
                        .filter(r => r.status === 'due')
                        .map((rec) => (
                          <div key={rec.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 border-red-500">
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{rec.service_name}</h4>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {rec.category && (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        rec.category === 'major' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {rec.category === 'major' ? 'Major' : 'Minor'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full flex-shrink-0">
                                  Due Now
                                </span>
                              </div>
                              {rec.next_due_mileage && (
                                <p className="text-sm text-gray-600 mt-3 flex items-center">
                                  <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  Due at {rec.next_due_mileage.toLocaleString()} mi
                                </p>
                              )}
                              {rec.last_service_date && (
                                <p className="text-xs text-gray-400 mt-2">
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
                    <div className="flex items-center mb-3">
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                        Upcoming
                      </span>
                      <span className="ml-2 text-sm text-gray-500">({upcomingCount})</span>
                    </div>
                    <div className="space-y-3">
                      {recommended
                        .filter(r => r.status === 'upcoming')
                        .map((rec) => (
                          <div key={rec.id} className="bg-white rounded-2xl shadow-sm p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{rec.service_name}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                  {rec.category && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      rec.category === 'major' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {rec.category === 'major' ? 'Major' : 'Minor'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex-shrink-0">
                                Upcoming
                              </span>
                            </div>
                            {rec.next_due_mileage && (
                              <p className="text-sm text-gray-600 mt-3 flex items-center">
                                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Due at {rec.next_due_mileage.toLocaleString()} mi
                              </p>
                            )}
                            {rec.last_service_date && (
                              <p className="text-xs text-gray-400 mt-2">
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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Services</h3>
                <p className="text-gray-500 text-sm">Contact your mechanic to schedule an appointment.</p>
              </div>
            ) : (
              scheduled.map((sched) => (
                <div key={sched.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{sched.service_type}</h3>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex-shrink-0">
                      Scheduled
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(sched.scheduled_date)}</span>
                    {sched.scheduled_time && (
                      <span className="ml-2 text-gray-500">at {sched.scheduled_time}</span>
                    )}
                  </div>
                  {sched.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mt-3">
                      {sched.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t px-4 py-4 pb-safe">
        <p className="text-center text-gray-500 text-sm">
          Contact your mechanic shop to schedule services
        </p>
      </footer>
    </div>
  );
}

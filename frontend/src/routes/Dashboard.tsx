import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { StatsSummary } from '../components/dashboard/StatsSummary';
import { UpcomingServicesTable } from '../components/dashboard/UpcomingServicesTable';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { ExpectedServicesTable } from '../components/dashboard/ExpectedServicesTable';
import { getCustomers, getVehicles, getUpcomingServices, getRecentActivity } from '../lib/api';
import { ServiceLog } from '../lib/types';

function DashboardOverview() {
  const [stats, setStats] = useState({ customersCount: 0, vehiclesCount: 0, upcomingServicesCount: 0 });
  const [upcomingServices, setUpcomingServices] = useState<ServiceLog[]>([]);
  const [recentActivity, setRecentActivity] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [customersRes, vehiclesRes, upcomingRes, recentRes] = await Promise.all([
          getCustomers(1, 0),
          getVehicles(undefined, 1, 0),
          getUpcomingServices(),
          getRecentActivity(),
        ]);

        setStats({
          customersCount: customersRes.total,
          vehiclesCount: vehiclesRes.total,
          upcomingServicesCount: upcomingRes.services.length,
        });
        setUpcomingServices(upcomingRes.services);
        setRecentActivity(recentRes.services);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <StatsSummary stats={stats} />

      {/* Expected Services - Main Feature */}
      <div className="mb-6">
        <ExpectedServicesTable />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingServicesTable services={upcomingServices} />
        <RecentActivityList activities={recentActivity} />
      </div>
    </div>
  );
}

export function Dashboard() {
  const location = useLocation();
  const isOverview = location.pathname === '/dashboard';

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 bg-gray-100">
        {isOverview ? <DashboardOverview /> : <Outlet />}
      </main>
    </div>
  );
}

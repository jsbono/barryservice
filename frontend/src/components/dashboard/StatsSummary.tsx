interface Stats {
  customersCount: number;
  vehiclesCount: number;
  upcomingServicesCount: number;
}

interface Props {
  stats: Stats;
}

export function StatsSummary({ stats }: Props) {
  const statCards = [
    { label: 'Total Customers', value: stats.customersCount, color: 'bg-blue-500' },
    { label: 'Total Vehicles', value: stats.vehiclesCount, color: 'bg-green-500' },
    { label: 'Upcoming Services', value: stats.upcomingServicesCount, color: 'bg-yellow-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {statCards.map((stat) => (
        <div key={stat.label} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center`}>
              <span className="text-white text-xl font-bold">{stat.value}</span>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: '📊' },
  { path: '/dashboard/customers', label: 'Customers', icon: '👥' },
  { path: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:block w-64 bg-gray-800 text-white min-h-screen flex-shrink-0">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

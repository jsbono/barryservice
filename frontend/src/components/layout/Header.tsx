import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            Mechanic Service Tracker
          </Link>
          <nav className="flex items-center space-x-4">
            <Link to="/" className="hover:text-blue-200">
              Service Lookup
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hover:text-blue-200">
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

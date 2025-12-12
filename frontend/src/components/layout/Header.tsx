import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export function Header() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="animated-gradient text-white shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">AutoService Pro</span>
          </Link>

          <nav className="flex items-center space-x-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
            >
              Service Lookup
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-200 font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="ml-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2 rounded-xl font-semibold transition-all duration-200 border border-white/30"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="ml-2 bg-white text-indigo-600 hover:bg-white/90 px-5 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg"
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

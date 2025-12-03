import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { CustomerAuthProvider, useCustomerAuth } from './lib/customerAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PublicHome } from './routes/PublicHome';
import { Login } from './routes/Login';
import { Dashboard } from './routes/Dashboard';
import { Customers } from './routes/Customers';
import { CustomerDetail } from './routes/CustomerDetail';
import { VehicleDetail } from './routes/VehicleDetail';
import { Settings } from './routes/Settings';
import { PortalLogin } from './routes/portal/PortalLogin';
import { PortalDashboard } from './routes/portal/PortalDashboard';
import { PortalVehicleDetail } from './routes/portal/PortalVehicleDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ProtectedCustomerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useCustomerAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomerAuthProvider>
          <Routes>
            {/* Customer Portal routes - standalone, no main header/footer */}
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route
              path="/portal"
              element={
                <ProtectedCustomerRoute>
                  <PortalDashboard />
                </ProtectedCustomerRoute>
              }
            />
            <Route
              path="/portal/vehicle/:vehicleId"
              element={
                <ProtectedCustomerRoute>
                  <PortalVehicleDetail />
                </ProtectedCustomerRoute>
              }
            />

            {/* Main app routes with Header/Footer */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <PublicHome />
                </MainLayout>
              }
            />
            <Route
              path="/login"
              element={
                <MainLayout>
                  <Login />
                </MainLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            >
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="vehicles/:id" element={<VehicleDetail />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </CustomerAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

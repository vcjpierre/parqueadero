import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AdminRoute } from './components/AdminRoute.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { VehiculosPage } from './pages/VehiculosPage.jsx';
import { IngresoSalidaPage } from './pages/IngresoSalidaPage.jsx';
import { ConfiguracionPage } from './pages/ConfiguracionPage.jsx';
import { TarifasPage } from './pages/TarifasPage.jsx';
import { UsuariosPage } from './pages/UsuariosPage.jsx';
import { ReportesPage } from './pages/ReportesPage.jsx';

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="vehiculos" element={<VehiculosPage />} />
        <Route path="ingreso-salida" element={<IngresoSalidaPage />} />
        <Route
          path="configuracion"
          element={
            <AdminRoute>
              <ConfiguracionPage />
            </AdminRoute>
          }
        />
        <Route
          path="tarifas"
          element={
            <AdminRoute>
              <TarifasPage />
            </AdminRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <AdminRoute>
              <UsuariosPage />
            </AdminRoute>
          }
        />
        <Route path="reportes" element={<ReportesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

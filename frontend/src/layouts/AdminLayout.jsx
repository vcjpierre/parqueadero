import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vehiculos', label: 'Vehiculos' },
  { to: '/ingreso-salida', label: 'Ingreso / Salida' },
  { to: '/configuracion', label: 'Configuracion', adminOnly: true },
  { to: '/tarifas', label: 'Tarifas', adminOnly: true },
  { to: '/usuarios', label: 'Usuarios', adminOnly: true },
  { to: '/reportes', label: 'Reportes' },
];

export function AdminLayout() {
  const { userName, userRole, logout } = useAuth();

  return (
    <div className="min-vh-100 bg-light">
      <header className="navbar navbar-expand bg-white border-bottom">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Parqueadero</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">{userName || 'Usuario'}</span>
            <button className="btn btn-outline-danger btn-sm" onClick={logout} type="button">
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      <div className="container-fluid">
        <div className="row">
          <aside className="col-12 col-lg-2 py-3 border-end bg-white min-vh-content">
            <nav className="nav flex-column gap-2">
              {navItems
                .filter((i) => (i.adminOnly ? userRole === 'admin' : true))
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `btn text-start ${isActive ? 'btn-primary' : 'btn-outline-secondary'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
            </nav>
          </aside>

          <main className="col-12 col-lg-10 py-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    empresa: localStorage.getItem('savedEmpresa') || '900123456-7',
    usuario: localStorage.getItem('savedUsername') || '',
    password: '',
    recordar: Boolean(localStorage.getItem('savedUsername')),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reason = params.get('reason');
    if (reason) {
      setSessionNotice(reason);
      params.delete('reason');
      const nextSearch = params.toString();
      navigate({ pathname: '/login', search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', {
        empresa: form.empresa,
        usuario: form.usuario,
        password: form.password,
      });
      login({
        token: data.data.token,
        nombre: data.data.nombre,
        rol: data.data.rol,
        id_empresa: data.data.id_empresa,
        empresaNit: form.empresa,
      });
      if (form.recordar) {
        localStorage.setItem('savedUsername', form.usuario);
        localStorage.setItem('savedEmpresa', form.empresa);
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedEmpresa');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell d-flex align-items-center justify-content-center min-vh-100 p-3">
      <div className="card border-0 shadow auth-card w-100">
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 mb-2 text-center">Parqueadero</h1>
          <p className="text-center text-muted mb-4">Inicia sesion para continuar</p>

          <form onSubmit={onSubmit} className="d-grid gap-3">
            {sessionNotice ? <div className="alert alert-warning py-2 mb-0">{sessionNotice}</div> : null}

            <div>
              <label className="form-label">NIT Empresa</label>
              <input
                className="form-control"
                name="empresa"
                value={form.empresa}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Usuario</label>
              <input
                className="form-control"
                name="usuario"
                value={form.usuario}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Contraseña</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="recordar"
                id="recordar"
                checked={form.recordar}
                onChange={onChange}
              />
              <label className="form-check-label" htmlFor="recordar">
                Recordar sesion
              </label>
            </div>

            {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}

            <button disabled={loading} className="btn btn-primary w-100" type="submit">
              {loading ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

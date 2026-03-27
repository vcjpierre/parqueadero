import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';

const INIT_FORM = {
  id_usuario: '',
  nombre: '',
  usuario_login: '',
  contraseña: '',
  rol: 'operador',
  activo: true,
};

export function UsuariosPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(INIT_FORM);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [pwdUser, setPwdUser] = useState(null);
  const [pwd, setPwd] = useState({ new: '', confirm: '' });

  const load = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setItems(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los usuarios');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      const payload = {
        nombre: form.nombre,
        usuario_login: form.usuario_login,
        rol: form.rol,
        activo: form.activo,
      };
      if (form.contraseña) payload.contraseña = form.contraseña;

      if (form.id_usuario) {
        await api.put(`/usuarios/${form.id_usuario}`, payload);
        setOk('Usuario actualizado.');
      } else {
        await api.post('/usuarios', {
          ...payload,
          contraseña: form.contraseña,
        });
        setOk('Usuario creado.');
      }
      setForm(INIT_FORM);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el usuario');
    }
  };

  const edit = (u) => {
    setForm({
      id_usuario: u.id_usuario,
      nombre: u.nombre,
      usuario_login: u.usuario_login,
      contraseña: '',
      rol: u.rol,
      activo: Boolean(u.activo),
    });
  };

  const desactivar = async (id) => {
    if (!window.confirm('Deseas desactivar este usuario?')) return;
    setError('');
    setOk('');
    try {
      await api.delete(`/usuarios/${id}`);
      setOk('Usuario desactivado.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo desactivar usuario');
    }
  };

  const cambiarClave = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (!pwdUser) return;
    if (!pwd.new || pwd.new.length < 6) {
      setError('La nueva Contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (pwd.new !== pwd.confirm) {
      setError('Las Contraseñas no coinciden.');
      return;
    }
    try {
      await api.put(`/usuarios/${pwdUser.id_usuario}`, { contraseña: pwd.new });
      setPwdUser(null);
      setPwd({ new: '', confirm: '' });
      setOk('Contraseña actualizada.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar Contraseña');
    }
  };

  return (
    <div className="d-grid gap-4">
      <h2 className="h4 mb-0">Usuarios</h2>

      {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
      {ok ? <div className="alert alert-success py-2 mb-0">{ok}</div> : null}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form className="row g-2 align-items-end" onSubmit={save}>
            <div className="col-12 col-md-3">
              <label className="form-label mb-1">Nombre</label>
              <input className="form-control form-control-sm" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} required />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label mb-1">Usuario</label>
              <input className="form-control form-control-sm" value={form.usuario_login} onChange={(e) => setForm((p) => ({ ...p, usuario_login: e.target.value }))} required />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Contraseña</label>
              <input className="form-control form-control-sm" type="password" value={form.contraseña} onChange={(e) => setForm((p) => ({ ...p, contraseña: e.target.value }))} placeholder={form.id_usuario ? 'Opcional' : 'Obligatoria'} />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Rol</label>
              <select className="form-select form-select-sm" value={form.rol} onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}>
                <option value="admin">Admin</option>
                <option value="operador">Operador</option>
              </select>
            </div>
            <div className="col-12 col-md-2 d-flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit">{form.id_usuario ? 'Actualizar' : 'Crear'}</button>
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setForm(INIT_FORM)}>Limpiar</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Ultimo acceso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!items.length ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">Sin usuarios</td>
                </tr>
              ) : null}
              {items.map((u) => (
                <tr key={u.id_usuario}>
                  <td>{u.nombre}</td>
                  <td>{u.usuario_login}</td>
                  <td><span className={`badge ${u.rol === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>{u.rol}</span></td>
                  <td>{u.activo ? 'Si' : 'No'}</td>
                  <td>{u.ultimo_acceso ? formatDateTime(u.ultimo_acceso) : '-'}</td>
                  <td className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => edit(u)}>Editar</button>
                    <button className="btn btn-sm btn-outline-dark" onClick={() => setPwdUser(u)}>Clave</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => desactivar(u.id_usuario)}>Desactivar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pwdUser ? (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-dialog-centered d-block">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cambiar Contraseña: {pwdUser.usuario_login}</h5>
                <button className="btn-close" onClick={() => setPwdUser(null)} type="button" />
              </div>
              <form onSubmit={cambiarClave}>
                <div className="modal-body d-grid gap-2">
                  <input className="form-control" type="password" placeholder="Nueva Contraseña" value={pwd.new} onChange={(e) => setPwd((p) => ({ ...p, new: e.target.value }))} required />
                  <input className="form-control" type="password" placeholder="Confirmar Contraseña" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} required />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" type="button" onClick={() => setPwdUser(null)}>Cancelar</button>
                  <button className="btn btn-primary" type="submit">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

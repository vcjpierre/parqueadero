import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { formatCurrency, formatDateTime } from '../utils/format.js';

const INITIAL_FORM = {
  id_vehiculo: '',
  placa: '',
  tipo: 'carro',
  color: '',
  modelo: '',
};

export function VehiculosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fPlaca, setFPlaca] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [historial, setHistorial] = useState([]);
  const [historialPlaca, setHistorialPlaca] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/vehiculos');
      setItems(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible cargar los vehiculos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((v) => {
      const okTipo = !fTipo || v.tipo === fTipo;
      const okPlaca = !fPlaca || String(v.placa || '').toLowerCase().includes(fPlaca.toLowerCase());
      return okTipo && okPlaca;
    });
  }, [items, fTipo, fPlaca]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (form.id_vehiculo) {
        await api.put(`/vehiculos/${form.id_vehiculo}`, {
          placa: form.placa,
          tipo: form.tipo,
          color: form.color,
          modelo: form.modelo,
        });
      } else {
        await api.post('/vehiculos', {
          placa: form.placa,
          tipo: form.tipo,
          color: form.color,
          modelo: form.modelo,
        });
      }
      setForm(INITIAL_FORM);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el vehiculo');
    }
  };

  const edit = (item) => setForm({ ...item });

  const remove = async (id) => {
    if (!window.confirm('Deseas eliminar este vehiculo?')) return;
    setError('');
    try {
      await api.delete(`/vehiculos/${id}`);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const verHistorial = async (id, placa) => {
    setError('');
    try {
      const { data } = await api.get(`/vehiculos/${id}/historial`);
      setHistorial(data.data || []);
      setHistorialPlaca(placa);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar historial');
    }
  };

  return (
    <div className="d-grid gap-4">
      <h2 className="h4 mb-0">Vehiculos</h2>

      {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form className="row g-2 align-items-end" onSubmit={save}>
            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Placa</label>
              <input
                className="form-control form-control-sm"
                value={form.placa}
                onChange={(e) => setForm((p) => ({ ...p, placa: e.target.value.toUpperCase() }))}
                required
              />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Tipo</label>
              <select
                className="form-select form-select-sm"
                value={form.tipo}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
              >
                <option value="carro">Carro</option>
                <option value="moto">Moto</option>
                <option value="bici">Bici</option>
              </select>
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Color</label>
              <input
                className="form-control form-control-sm"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                required
              />
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Modelo</label>
              <input
                className="form-control form-control-sm"
                value={form.modelo}
                onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value }))}
              />
            </div>
            <div className="col-12 col-md-4 d-flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit">
                {form.id_vehiculo ? 'Actualizar' : 'Crear'}
              </button>
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setForm(INITIAL_FORM)}>
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex gap-2 flex-wrap">
          <select className="form-select form-select-sm w-auto" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="carro">Carro</option>
            <option value="moto">Moto</option>
            <option value="bici">Bici</option>
          </select>
          <input
            className="form-control form-control-sm w-auto"
            placeholder="Filtrar placa"
            value={fPlaca}
            onChange={(e) => setFPlaca(e.target.value)}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Color</th>
                <th>Modelo</th>
                <th>Registro</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    Sin registros
                  </td>
                </tr>
              ) : null}
              {filtered.map((v) => (
                <tr key={v.id_vehiculo}>
                  <td>{v.placa}</td>
                  <td>{v.tipo}</td>
                  <td>{v.color}</td>
                  <td>{v.modelo || '-'}</td>
                  <td>{formatDateTime(v.fecha_registro)}</td>
                  <td>
                    <span className={`badge ${v.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                      {v.estado}
                    </span>
                  </td>
                  <td className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => edit(v)}>
                      Editar
                    </button>
                    <button className="btn btn-sm btn-outline-dark" onClick={() => verHistorial(v.id_vehiculo, v.placa)}>
                      Historial
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(v.id_vehiculo)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {historialPlaca ? (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h3 className="h6 mb-0">Historial de {historialPlaca}</h3>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setHistorialPlaca('')}>
              Cerrar
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Pagado</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      Sin historial
                    </td>
                  </tr>
                ) : null}
                {historial.map((h) => (
                  <tr key={h.id_movimiento}>
                    <td>{h.id_movimiento}</td>
                    <td>{formatDateTime(h.fecha_entrada)}</td>
                    <td>{formatDateTime(h.fecha_salida)}</td>
                    <td>{h.estado}</td>
                    <td>{h.total_a_pagar ? formatCurrency(h.total_a_pagar) : '-'}</td>
                    <td>{formatCurrency(h.total_pagado || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

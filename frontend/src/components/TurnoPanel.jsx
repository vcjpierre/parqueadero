import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { formatCurrency, formatDateTime } from '../utils/format.js';

export function TurnoPanel() {
  const [turno, setTurno] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');
  const [openBase, setOpenBase] = useState('0');
  const [openObs, setOpenObs] = useState('');
  const [closeForm, setCloseForm] = useState({ efectivo: '', tarjeta: '', qr: '', obs: '' });

  const totalCierre = useMemo(() => {
    return (
      Number(closeForm.efectivo || 0) +
      Number(closeForm.tarjeta || 0) +
      Number(closeForm.qr || 0)
    );
  }, [closeForm]);

  const diferencia = useMemo(() => {
    const expected = Number(resumen?.totales?.total || 0);
    return totalCierre - expected;
  }, [resumen, totalCierre]);

  const load = async () => {
    setError('');
    try {
      const actual = await api.get('/turnos/actual');
      setTurno(actual.data.data || null);
      if (actual.data.data) {
        const sum = await api.get('/turnos/resumen');
        setResumen(sum.data.data || null);
      } else {
        setResumen(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo consultar el turno');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const abrirTurno = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/turnos/abrir', {
        base_inicial: Number(openBase || 0),
        observacion_apertura: openObs,
      });
      setOpenObs('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo abrir el turno');
    }
  };

  const cerrarTurno = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/turnos/cerrar', {
        total_efectivo: Number(closeForm.efectivo || 0),
        total_tarjeta: Number(closeForm.tarjeta || 0),
        total_qr: Number(closeForm.qr || 0),
        total_general: totalCierre,
        observacion_cierre: closeForm.obs,
      });
      setCloseForm({ efectivo: '', tarjeta: '', qr: '', obs: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cerrar el turno');
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h6 mb-0">Turno de caja</h3>
          <span className={`badge ${turno ? 'bg-success' : 'bg-secondary'}`}>
            {turno ? 'Abierto' : 'Cerrado'}
          </span>
        </div>

        {error ? <div className="alert alert-danger py-2 mb-3">{error}</div> : null}

        {!turno ? (
          <form onSubmit={abrirTurno} className="row g-2 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label mb-1">Base inicial</label>
              <input
                className="form-control form-control-sm"
                type="number"
                min="0"
                step="0.01"
                value={openBase}
                onChange={(e) => setOpenBase(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label mb-1">Observacion</label>
              <input
                className="form-control form-control-sm"
                value={openObs}
                onChange={(e) => setOpenObs(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-2">
              <button className="btn btn-primary btn-sm w-100" type="submit">
                Abrir
              </button>
            </div>
          </form>
        ) : (
          <div className="d-grid gap-3">
            <div className="small text-muted">
              Apertura: {formatDateTime(turno.fecha_apertura)} | Base: {formatCurrency(turno.base_inicial)}
            </div>
            <div className="small">
              Sistema esperado: <strong>{formatCurrency(resumen?.totales?.total || 0)}</strong>
            </div>
            <form onSubmit={cerrarTurno} className="row g-2 align-items-end">
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Efectivo</label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={closeForm.efectivo}
                  onChange={(e) => setCloseForm((p) => ({ ...p, efectivo: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label mb-1">Tarjeta</label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={closeForm.tarjeta}
                  onChange={(e) => setCloseForm((p) => ({ ...p, tarjeta: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-2">
                <label className="form-label mb-1">QR</label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={closeForm.qr}
                  onChange={(e) => setCloseForm((p) => ({ ...p, qr: e.target.value }))}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label mb-1">Observacion</label>
                <input
                  className="form-control form-control-sm"
                  value={closeForm.obs}
                  onChange={(e) => setCloseForm((p) => ({ ...p, obs: e.target.value }))}
                />
              </div>
              <div className="col-12 d-flex justify-content-between align-items-center">
                <div className={`small ${Math.abs(diferencia) < 0.01 ? 'text-success' : 'text-danger'}`}>
                  Diferencia: <strong>{formatCurrency(diferencia)}</strong>
                </div>
                <button className="btn btn-success btn-sm" type="submit">
                  Cerrar turno
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

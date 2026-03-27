import { useState } from 'react';
import { api } from '../api/client.js';
import { formatCurrency, formatDateTime } from '../utils/format.js';

const METODOS = ['efectivo', 'tarjeta', 'QR'];

export function IngresoSalidaPage() {
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [ingForm, setIngForm] = useState({ placa: '', tipo: 'carro' });
  const [salForm, setSalForm] = useState({ placa: '', metodo: 'efectivo' });
  const [ingreso, setIngreso] = useState(null);
  const [salida, setSalida] = useState(null);
  const [pagoRows, setPagoRows] = useState([{ metodo_pago: 'efectivo', monto: 0 }]);

  const clearMessages = () => {
    setError('');
    setOk('');
  };

  const requireTurno = async () => {
    const { data } = await api.get('/turnos/actual');
    if (!data.data) {
      throw new Error('Debes abrir turno de caja antes de registrar ingreso/salida.');
    }
  };

  const registrarIngreso = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await requireTurno();
      const { data } = await api.post('/movimientos/ingreso', {
        placa: ingForm.placa.trim().toUpperCase(),
        tipo: ingForm.tipo,
      });
      setIngreso(data.data);
      setIngForm((p) => ({ ...p, placa: '' }));
      setOk('Ingreso registrado correctamente.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No fue posible registrar ingreso.');
    }
  };

  const registrarSalida = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await requireTurno();
      const { data } = await api.post('/movimientos/salida', {
        placa: salForm.placa.trim().toUpperCase(),
      });
      setSalida(data.data);
      setPagoRows([{ metodo_pago: salForm.metodo, monto: Number(data.data.total || 0) }]);
      setSalForm((p) => ({ ...p, placa: '' }));
      setOk('Salida registrada. Completa los pagos si aplica.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No fue posible registrar salida.');
    }
  };

  const addPagoRow = () => {
    setPagoRows((p) => [...p, { metodo_pago: 'efectivo', monto: 0 }]);
  };

  const updatePago = (idx, key, value) => {
    setPagoRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const removePago = (idx) => {
    setPagoRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const totalPagado = pagoRows.reduce((a, b) => a + Number(b.monto || 0), 0);
  const diferencia = Number(totalPagado) - Number(salida?.total || 0);

  const confirmarPagos = async () => {
    clearMessages();
    if (!salida) return;
    try {
      const pagos = pagoRows
        .filter((p) => Number(p.monto) > 0)
        .map((p) => ({ metodo_pago: p.metodo_pago, monto: Number(p.monto) }));
      if (!pagos.length) {
        throw new Error('Debes registrar al menos un pago.');
      }
      await api.post('/pagos/bulk', {
        id_movimiento: salida.movimientoId,
        pagos,
      });
      setSalida((s) => ({ ...s, pagosList: pagos }));
      setOk('Pagos registrados correctamente.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No fue posible registrar pagos.');
    }
  };

  return (
    <div className="d-grid gap-4">
      <h2 className="h4 mb-0">Ingreso / Salida</h2>

      {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
      {ok ? <div className="alert alert-success py-2 mb-0">{ok}</div> : null}

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h3 className="h6 mb-0">Registrar ingreso</h3>
            </div>
            <div className="card-body">
              <form onSubmit={registrarIngreso} className="row g-2 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label mb-1">Placa</label>
                  <input
                    className="form-control form-control-sm"
                    value={ingForm.placa}
                    onChange={(e) => setIngForm((p) => ({ ...p, placa: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label mb-1">Tipo</label>
                  <select
                    className="form-select form-select-sm"
                    value={ingForm.tipo}
                    onChange={(e) => setIngForm((p) => ({ ...p, tipo: e.target.value }))}
                  >
                    <option value="carro">Carro</option>
                    <option value="moto">Moto</option>
                    <option value="bici">Bici</option>
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <button className="btn btn-success btn-sm w-100" type="submit">
                    Ingresar
                  </button>
                </div>
              </form>

              {ingreso ? (
                <div className="mt-4 border rounded p-3 bg-light-subtle small">
                  <p className="mb-1"><strong>Movimiento:</strong> #{ingreso.movimientoId}</p>
                  <p className="mb-1"><strong>Placa:</strong> {ingreso.placa}</p>
                  <p className="mb-1"><strong>Tipo:</strong> {ingreso.tipo}</p>
                  <p className="mb-1"><strong>Entrada:</strong> {formatDateTime(ingreso.fechaEntrada)}</p>
                  <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => window.print()}>
                    Imprimir
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h3 className="h6 mb-0">Registrar salida y pago</h3>
            </div>
            <div className="card-body">
              <form onSubmit={registrarSalida} className="row g-2 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label mb-1">Placa</label>
                  <input
                    className="form-control form-control-sm"
                    value={salForm.placa}
                    onChange={(e) => setSalForm((p) => ({ ...p, placa: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label mb-1">Metodo</label>
                  <select
                    className="form-select form-select-sm"
                    value={salForm.metodo}
                    onChange={(e) => setSalForm((p) => ({ ...p, metodo: e.target.value }))}
                  >
                    {METODOS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-3">
                  <button className="btn btn-danger btn-sm w-100" type="submit">
                    Finalizar
                  </button>
                </div>
              </form>

              {salida ? (
                <div className="mt-4 d-grid gap-3">
                  <div className="border rounded p-3 bg-light-subtle small">
                    <p className="mb-1"><strong>Movimiento:</strong> #{salida.movimientoId}</p>
                    <p className="mb-1"><strong>Placa:</strong> {salida.placa}</p>
                    <p className="mb-1"><strong>Tipo:</strong> {salida.tipo}</p>
                    <p className="mb-1"><strong>Entrada:</strong> {formatDateTime(salida.fechaEntrada)}</p>
                    <p className="mb-1"><strong>Salida:</strong> {formatDateTime(salida.fechaSalida)}</p>
                    <p className="mb-0"><strong>Total:</strong> {formatCurrency(salida.total)}</p>
                  </div>

                  <div className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h4 className="h6 mb-0">Pagos</h4>
                      <button className="btn btn-outline-primary btn-sm" type="button" onClick={addPagoRow}>
                        Agregar
                      </button>
                    </div>
                    <div className="d-grid gap-2">
                      {pagoRows.map((p, idx) => (
                        <div className="row g-2 align-items-center" key={`${idx}-${p.metodo_pago}`}>
                          <div className="col-6 col-md-4">
                            <select
                              className="form-select form-select-sm"
                              value={p.metodo_pago}
                              onChange={(e) => updatePago(idx, 'metodo_pago', e.target.value)}
                            >
                              {METODOS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-6 col-md-4">
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              value={p.monto}
                              onChange={(e) => updatePago(idx, 'monto', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-4 text-md-end">
                            <button
                              className="btn btn-outline-danger btn-sm"
                              type="button"
                              onClick={() => removePago(idx)}
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 small">
                      <p className="mb-1"><strong>Pagado:</strong> {formatCurrency(totalPagado)}</p>
                      <p className={`mb-0 ${diferencia >= 0 ? 'text-success' : 'text-danger'}`}>
                        <strong>{diferencia >= 0 ? 'Vuelto' : 'Falta'}:</strong> {formatCurrency(Math.abs(diferencia))}
                      </p>
                    </div>

                    <button className="btn btn-success btn-sm mt-3" type="button" onClick={confirmarPagos}>
                      Confirmar pagos
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

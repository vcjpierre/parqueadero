import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { formatCurrency, formatDateInput, formatDateTime } from '../utils/format.js';

export function ReportesPage() {
  const today = useMemo(() => formatDateInput(), []);
  const [filters, setFilters] = useState({
    desde: today,
    hasta: today,
    tipo: '',
    estado: '',
    placa: '',
    metodo: '',
  });
  const [kpis, setKpis] = useState({ ingresos: 0, tickets: 0, promedioTicket: 0, ocupacion: 0 });
  const [movs, setMovs] = useState([]);
  const [topPlacas, setTopPlacas] = useState([]);
  const [byDia, setByDia] = useState([]);
  const [byMetodo, setByMetodo] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const params = {
        desde: filters.desde,
        hasta: filters.hasta,
      };
      const movParams = {
        ...params,
        page: 0,
        pageSize: 30,
      };
      if (filters.tipo) movParams.tipo = filters.tipo;
      if (filters.estado) movParams.estado = filters.estado;
      if (filters.placa) movParams.placa = filters.placa;

      const diaParams = { ...params };
      if (filters.metodo) diaParams.metodo = filters.metodo;

      const [kpi, dia, metodo, movimientos, top, cierre] = await Promise.all([
        api.get('/reportes/kpis', { params }),
        api.get('/reportes/ingresos-por-dia', { params: diaParams }),
        api.get('/reportes/ingresos-por-metodo', { params }),
        api.get('/reportes/movimientos', { params: movParams }),
        api.get('/reportes/top-placas', { params: { ...params, limit: 10 } }),
        api.get('/reportes/turnos', { params }),
      ]);

      setKpis(kpi.data.data || {});
      setByDia(dia.data.data || []);
      setByMetodo(metodo.data.data || []);
      setMovs(movimientos.data.data || []);
      setTopPlacas(top.data.data || []);
      setTurnos(cierre.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los reportes');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const quickHoy = () => setFilters((p) => ({ ...p, desde: today, hasta: today }));

  const quickUltimos7 = () => {
    const d = new Date();
    const d2 = new Date(d);
    d2.setDate(d.getDate() - 6);
    setFilters((p) => ({ ...p, desde: formatDateInput(d2), hasta: formatDateInput(d) }));
  };

  const quickMes = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const first = `${y}-${m}-01`;
    const lastDay = new Date(y, Number(m), 0).getDate();
    const last = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    setFilters((p) => ({ ...p, desde: first, hasta: last }));
  };

  useEffect(() => {
    load();
  }, [filters.desde, filters.hasta]);

  const exportExcel = async () => {
    setError('');
    try {
      const params = new URLSearchParams({ desde: filters.desde, hasta: filters.hasta });
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.placa) params.append('placa', filters.placa);
      const r = await api.get(`/reportes/export/xlsx?${params.toString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_movimientos_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo exportar Excel');
    }
  };

  const exportPdf = async () => {
    setError('');
    try {
      const params = {
        desde: filters.desde,
        hasta: filters.hasta,
      };
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.estado) params.estado = filters.estado;
      if (filters.placa) params.placa = filters.placa;
      const { data } = await api.get('/reportes/movimientos-ajustados', { params });
      const lines = [
        `Reporte de movimientos (${filters.desde} a ${filters.hasta})`,
        '',
        ...((data.data || []).map((r) =>
          `#${r.id_movimiento} | ${r.placa} | ${r.tipo} | ${formatDateTime(r.fecha_entrada)} | ${formatCurrency(r.total_a_pagar)}`,
        )),
      ];
      const win = window.open('', '_blank', 'width=900,height=700');
      win.document.write(`<pre style="font-family:monospace;white-space:pre-wrap">${lines.join('\n')}</pre>`);
      win.document.close();
      win.focus();
      win.print();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo exportar PDF');
    }
  };

  const reimprimir = async (id) => {
    setError('');
    try {
      const { data } = await api.get(`/movimientos/factura/${id}`);
      const f = data.data;
      const html = [
        `<h3>Factura salida #${f.movimientoId}</h3>`,
        `<p>Placa: <strong>${f.placa}</strong></p>`,
        `<p>Tipo: ${f.tipo}</p>`,
        `<p>Entrada: ${formatDateTime(f.fechaEntrada)}</p>`,
        `<p>Salida: ${formatDateTime(f.fechaSalida)}</p>`,
        `<p>Total: <strong>${formatCurrency(f.total)}</strong></p>`,
      ].join('');
      const w = window.open('', '_blank', 'width=600,height=700');
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible reimprimir');
    }
  };

  const exportTurnos = async () => {
    setError('');
    try {
      const r = await api.get('/reportes/turnos/export/xlsx', {
        params: { desde: filters.desde, hasta: filters.hasta },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cierres_turno_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo exportar cierres');
    }
  };

  return (
    <div className="d-grid gap-4">
      <h2 className="h4 mb-0">Reportes</h2>

      {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}

      <div className="card border-0 shadow-sm">
        <div className="card-body d-grid gap-2">
          <div className="row g-2">
            <div className="col-6 col-md-2">
              <label className="form-label mb-1 small">Desde</label>
              <input className="form-control form-control-sm" type="date" value={filters.desde} onChange={(e) => setFilters((p) => ({ ...p, desde: e.target.value }))} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label mb-1 small">Hasta</label>
              <input className="form-control form-control-sm" type="date" value={filters.hasta} onChange={(e) => setFilters((p) => ({ ...p, hasta: e.target.value }))} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label mb-1 small">Tipo</label>
              <select className="form-select form-select-sm" value={filters.tipo} onChange={(e) => setFilters((p) => ({ ...p, tipo: e.target.value }))}>
                <option value="">Todos</option>
                <option value="carro">Carro</option>
                <option value="moto">Moto</option>
                <option value="bici">Bici</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label mb-1 small">Estado</label>
              <select className="form-select form-select-sm" value={filters.estado} onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}>
                <option value="">Finalizados</option>
                <option value="finalizado">Finalizado</option>
                <option value="activo">Activo</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label mb-1 small">Metodo dia</label>
              <select className="form-select form-select-sm" value={filters.metodo} onChange={(e) => setFilters((p) => ({ ...p, metodo: e.target.value }))}>
                <option value="">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="QR">QR</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label mb-1 small">Placa</label>
              <input className="form-control form-control-sm" value={filters.placa} onChange={(e) => setFilters((p) => ({ ...p, placa: e.target.value }))} />
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-outline-secondary btn-sm" onClick={quickHoy}>Hoy</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={quickUltimos7}>Ultimos 7</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={quickMes}>Mes actual</button>
            <button className="btn btn-primary btn-sm" onClick={load}>Aplicar filtros</button>
            <button className="btn btn-outline-primary btn-sm" onClick={exportPdf}>Exportar PDF</button>
            <button className="btn btn-outline-success btn-sm" onClick={exportExcel}>Exportar Excel</button>
            <button className="btn btn-outline-dark btn-sm" onClick={exportTurnos}>Excel cierres</button>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm h-100"><div className="card-body"><small className="text-muted">Ingresos</small><div className="h6 mb-0">{formatCurrency(kpis.ingresos || 0)}</div></div></div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm h-100"><div className="card-body"><small className="text-muted">Tickets</small><div className="h6 mb-0">{kpis.tickets || 0}</div></div></div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm h-100"><div className="card-body"><small className="text-muted">Promedio</small><div className="h6 mb-0">{formatCurrency(kpis.promedioTicket || 0)}</div></div></div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm h-100"><div className="card-body"><small className="text-muted">Ocupacion</small><div className="h6 mb-0">{kpis.ocupacion || 0}%</div></div></div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white"><h3 className="h6 mb-0">Movimientos</h3></div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th><th>Placa</th><th>Tipo</th><th>Entrada</th><th>Salida</th><th>Estado</th><th>Total</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {!movs.length ? <tr><td colSpan="8" className="text-center text-muted">Sin datos</td></tr> : null}
                  {movs.map((m) => (
                    <tr key={m.id_movimiento}>
                      <td>{m.id_movimiento}</td>
                      <td>{m.placa}</td>
                      <td>{m.tipo}</td>
                      <td>{formatDateTime(m.fecha_entrada)}</td>
                      <td>{formatDateTime(m.fecha_salida)}</td>
                      <td>{m.estado}</td>
                      <td>{m.total_a_pagar ? formatCurrency(m.total_a_pagar) : '-'}</td>
                      <td>
                        {m.estado === 'finalizado' ? <button className="btn btn-sm btn-outline-primary" onClick={() => reimprimir(m.id_movimiento)}>Reimprimir</button> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4 d-grid gap-3">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white"><h3 className="h6 mb-0">Top placas</h3></div>
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead><tr><th>Placa</th><th>Tipo</th><th>Visitas</th><th>Total</th></tr></thead>
                <tbody>
                  {!topPlacas.length ? <tr><td colSpan="4" className="text-center text-muted">Sin datos</td></tr> : null}
                  {topPlacas.map((t) => (
                    <tr key={`${t.placa}-${t.tipo}`}>
                      <td>{t.placa}</td><td>{t.tipo}</td><td>{t.visitas}</td><td>{formatCurrency(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white"><h3 className="h6 mb-0">Ingresos por dia</h3></div>
            <ul className="list-group list-group-flush">
              {!byDia.length ? <li className="list-group-item text-muted">Sin datos</li> : null}
              {byDia.map((d) => (
                <li className="list-group-item d-flex justify-content-between" key={d.fecha}><span>{d.fecha}</span><strong>{formatCurrency(d.total)}</strong></li>
              ))}
            </ul>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white"><h3 className="h6 mb-0">Ingresos por metodo</h3></div>
            <ul className="list-group list-group-flush">
              {!byMetodo.length ? <li className="list-group-item text-muted">Sin datos</li> : null}
              {byMetodo.map((m) => (
                <li className="list-group-item d-flex justify-content-between" key={m.metodo_pago}><span>{m.metodo_pago}</span><strong>{formatCurrency(m.total)}</strong></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h3 className="h6 mb-0">Cierres de turno</h3>
          <small className="text-muted">{turnos.length} registros</small>
        </div>
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>#</th><th>Apertura</th><th>Cierre</th><th>Usuario</th><th>Base</th><th>Total</th><th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {!turnos.length ? <tr><td colSpan="7" className="text-center text-muted">Sin cierres</td></tr> : null}
              {turnos.map((t) => (
                <tr key={t.id_turno}>
                  <td>{t.id_turno}</td>
                  <td>{formatDateTime(t.fecha_apertura)}</td>
                  <td>{formatDateTime(t.fecha_cierre)}</td>
                  <td>{t.usuario || t.usuario_login}</td>
                  <td>{formatCurrency(t.base_inicial)}</td>
                  <td>{formatCurrency(t.total_general)}</td>
                  <td className={Number(t.diferencia || 0) === 0 ? 'text-success' : 'text-danger'}>{formatCurrency(t.diferencia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

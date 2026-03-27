import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const INIT_FORM = {
  tipo_vehiculo: 'carro',
  modo_cobro: 'mixto',
  valor_minuto: 0,
  valor_hora: 0,
  valor_dia_completo: 0,
  paso_minutos_a_horas: 60,
  paso_horas_a_dias: 12,
  redondeo_horas: 'arriba',
  redondeo_dias: 'arriba',
};

export function TarifasPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(INIT_FORM);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/tarifas/current');
      setItems(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las tarifas');
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
      await api.put('/tarifas', {
        ...form,
        valor_minuto: Number(form.valor_minuto || 0),
        valor_hora: Number(form.valor_hora || 0),
        valor_dia_completo: Number(form.valor_dia_completo || 0),
        paso_minutos_a_horas: Number(form.paso_minutos_a_horas || 0),
        paso_horas_a_dias: Number(form.paso_horas_a_dias || 0),
      });
      setOk('Tarifa guardada.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la tarifa');
    }
  };

  const disableMin = !(form.modo_cobro === 'minuto' || form.modo_cobro === 'mixto');
  const disableHora = !(form.modo_cobro === 'hora' || form.modo_cobro === 'mixto');
  const disableDia = !(form.modo_cobro === 'dia' || form.modo_cobro === 'mixto');
  const disableEscalas = form.modo_cobro !== 'mixto';

  return (
    <div className="d-grid gap-4">
      <h2 className="h4 mb-0">Tarifas</h2>

      {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
      {ok ? <div className="alert alert-success py-2 mb-0">{ok}</div> : null}

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h3 className="h6 mb-0">Actualizar tarifa</h3>
            </div>
            <div className="card-body">
              <form className="d-grid gap-2" onSubmit={save}>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label mb-1 small">Tipo</label>
                    <select className="form-select form-select-sm" value={form.tipo_vehiculo} onChange={(e) => setForm((p) => ({ ...p, tipo_vehiculo: e.target.value }))}>
                      <option value="carro">Carro</option>
                      <option value="moto">Moto</option>
                      <option value="bici">Bici</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label mb-1 small">Modo</label>
                    <select className="form-select form-select-sm" value={form.modo_cobro} onChange={(e) => setForm((p) => ({ ...p, modo_cobro: e.target.value }))}>
                      <option value="minuto">Minuto</option>
                      <option value="hora">Hora</option>
                      <option value="dia">Dia</option>
                      <option value="mixto">Mixto</option>
                    </select>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label mb-1 small">Valor minuto</label>
                    <input className="form-control form-control-sm" type="number" disabled={disableMin} value={form.valor_minuto} onChange={(e) => setForm((p) => ({ ...p, valor_minuto: e.target.value }))} />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1 small">Valor hora</label>
                    <input className="form-control form-control-sm" type="number" disabled={disableHora} value={form.valor_hora} onChange={(e) => setForm((p) => ({ ...p, valor_hora: e.target.value }))} />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1 small">Valor dia</label>
                    <input className="form-control form-control-sm" type="number" disabled={disableDia} value={form.valor_dia_completo} onChange={(e) => setForm((p) => ({ ...p, valor_dia_completo: e.target.value }))} />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label mb-1 small">Paso min-&gt;hora</label>
                    <input className="form-control form-control-sm" type="number" disabled={disableEscalas} value={form.paso_minutos_a_horas} onChange={(e) => setForm((p) => ({ ...p, paso_minutos_a_horas: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label mb-1 small">Paso hora-&gt;dia</label>
                    <input className="form-control form-control-sm" type="number" disabled={disableEscalas} value={form.paso_horas_a_dias} onChange={(e) => setForm((p) => ({ ...p, paso_horas_a_dias: e.target.value }))} />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label mb-1 small">Redondeo horas</label>
                    <select className="form-select form-select-sm" disabled={disableEscalas} value={form.redondeo_horas} onChange={(e) => setForm((p) => ({ ...p, redondeo_horas: e.target.value }))}>
                      <option value="arriba">Arriba</option>
                      <option value="abajo">Abajo</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label mb-1 small">Redondeo dias</label>
                    <select className="form-select form-select-sm" disabled={disableEscalas} value={form.redondeo_dias} onChange={(e) => setForm((p) => ({ ...p, redondeo_dias: e.target.value }))}>
                      <option value="arriba">Arriba</option>
                      <option value="abajo">Abajo</option>
                    </select>
                  </div>
                </div>

                <button className="btn btn-primary btn-sm mt-1" type="submit">Guardar</button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h3 className="h6 mb-0">Tarifas activas</h3>
            </div>
            <ul className="list-group list-group-flush">
              {items.map((t) => (
                <li className="list-group-item" key={`${t.id_tarifa}-${t.tipo_vehiculo}`}>
                  <div className="d-flex justify-content-between">
                    <strong className="text-capitalize">{t.tipo_vehiculo}</strong>
                    <span className="badge bg-primary">{t.modo_cobro}</span>
                  </div>
                  <small className="d-block">Min: {t.valor_minuto} | Hora: {t.valor_hora} | Dia: {t.valor_dia_completo}</small>
                  <small className="text-muted">Escalas: {t.paso_minutos_a_horas}m -&gt; {t.paso_horas_a_dias}h</small>
                </li>
              ))}
              {!items.length ? <li className="list-group-item text-muted">Sin tarifas activas</li> : null}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

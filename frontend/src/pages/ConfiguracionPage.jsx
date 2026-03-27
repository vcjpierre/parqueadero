import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const INIT_EMPRESA = {
  nombre: '',
  nit: '',
  direccion: '',
  telefono: '',
  email: '',
};

const INIT_CONFIG = {
  capacidad_total_carros: 0,
  capacidad_total_motos: 0,
  capacidad_total_bicicletas: 0,
  horario_apertura: '06:00',
  horario_cierre: '22:00',
  iva_porcentaje: 0,
  moneda: 'COP',
  zona_horaria: 'America/Bogota',
  operacion_24h: false,
};

export function ConfiguracionPage() {
  const [empresa, setEmpresa] = useState(INIT_EMPRESA);
  const [config, setConfig] = useState(INIT_CONFIG);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    setError('');
    try {
      const [e, c] = await Promise.all([api.get('/empresa/me'), api.get('/empresa/config')]);
      setEmpresa({ ...INIT_EMPRESA, ...(e.data.data || {}) });
      setConfig({ ...INIT_CONFIG, ...(c.data.data || {}) });
      try {
        const r = await api.get('/empresa/logo', { responseType: 'blob' });
        setLogoUrl(URL.createObjectURL(r.data));
      } catch {
        setLogoUrl('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar configuracion');
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, []);

  const saveEmpresa = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.put('/empresa', empresa);
      setOk('Datos de empresa actualizados.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar empresa');
    }
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.put('/empresa/config', {
        ...config,
        capacidad_total_carros: Number(config.capacidad_total_carros || 0),
        capacidad_total_motos: Number(config.capacidad_total_motos || 0),
        capacidad_total_bicicletas: Number(config.capacidad_total_bicicletas || 0),
        iva_porcentaje: Number(config.iva_porcentaje || 0),
      });
      setOk('Configuracion operativa actualizada.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar configuracion');
    }
  };

  const subirLogo = async () => {
    setError('');
    setOk('');
    if (!logoFile) {
      setError('Selecciona un archivo de logo.');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      await api.post('/empresa/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
      setOk('Logo actualizado.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo subir logo');
    }
  };

  return (
    <div className="d-grid gap-4">
      <h2 className="h4 mb-0">Configuracion</h2>

      {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
      {ok ? <div className="alert alert-success py-2 mb-0">{ok}</div> : null}

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h3 className="h6 mb-0">Empresa</h3>
            </div>
            <div className="card-body">
              <form className="d-grid gap-2" onSubmit={saveEmpresa}>
                <input className="form-control form-control-sm" placeholder="Nombre" value={empresa.nombre || ''} onChange={(e) => setEmpresa((p) => ({ ...p, nombre: e.target.value }))} />
                <input className="form-control form-control-sm" placeholder="NIT" value={empresa.nit || ''} onChange={(e) => setEmpresa((p) => ({ ...p, nit: e.target.value }))} />
                <input className="form-control form-control-sm" placeholder="Direccion" value={empresa.direccion || ''} onChange={(e) => setEmpresa((p) => ({ ...p, direccion: e.target.value }))} />
                <input className="form-control form-control-sm" placeholder="Telefono" value={empresa.telefono || ''} onChange={(e) => setEmpresa((p) => ({ ...p, telefono: e.target.value }))} />
                <input className="form-control form-control-sm" placeholder="Email" value={empresa.email || ''} onChange={(e) => setEmpresa((p) => ({ ...p, email: e.target.value }))} />
                <button className="btn btn-primary btn-sm mt-1" type="submit">Guardar empresa</button>
              </form>

              <hr />

              <div className="d-grid gap-2">
                <input
                  type="file"
                  className="form-control form-control-sm"
                  accept="image/png,image/jpeg,image/jpg,image/gif"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                <button className="btn btn-outline-primary btn-sm" type="button" onClick={subirLogo}>
                  Subir logo
                </button>
                {logoUrl ? <img src={logoUrl} alt="logo" style={{ maxWidth: '180px', maxHeight: '120px' }} /> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h3 className="h6 mb-0">Operacion</h3>
            </div>
            <div className="card-body">
              <form className="d-grid gap-2" onSubmit={saveConfig}>
                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label mb-1 small">Carros</label>
                    <input className="form-control form-control-sm" type="number" value={config.capacidad_total_carros} onChange={(e) => setConfig((p) => ({ ...p, capacidad_total_carros: e.target.value }))} />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1 small">Motos</label>
                    <input className="form-control form-control-sm" type="number" value={config.capacidad_total_motos} onChange={(e) => setConfig((p) => ({ ...p, capacidad_total_motos: e.target.value }))} />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1 small">Bicis</label>
                    <input className="form-control form-control-sm" type="number" value={config.capacidad_total_bicicletas} onChange={(e) => setConfig((p) => ({ ...p, capacidad_total_bicicletas: e.target.value }))} />
                  </div>
                </div>

                <div className="form-check mt-1">
                  <input className="form-check-input" id="op24" type="checkbox" checked={Boolean(config.operacion_24h)} onChange={(e) => setConfig((p) => ({ ...p, operacion_24h: e.target.checked }))} />
                  <label className="form-check-label small" htmlFor="op24">Operacion 24 horas</label>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label mb-1 small">Apertura</label>
                    <input className="form-control form-control-sm" type="time" disabled={Boolean(config.operacion_24h)} value={String(config.horario_apertura || '').slice(0, 5)} onChange={(e) => setConfig((p) => ({ ...p, horario_apertura: e.target.value }))} />
                  </div>
                  <div className="col-6">
                    <label className="form-label mb-1 small">Cierre</label>
                    <input className="form-control form-control-sm" type="time" disabled={Boolean(config.operacion_24h)} value={String(config.horario_cierre || '').slice(0, 5)} onChange={(e) => setConfig((p) => ({ ...p, horario_cierre: e.target.value }))} />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label mb-1 small">IVA %</label>
                    <input className="form-control form-control-sm" type="number" value={config.iva_porcentaje} onChange={(e) => setConfig((p) => ({ ...p, iva_porcentaje: e.target.value }))} />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1 small">Moneda</label>
                    <input className="form-control form-control-sm" value={config.moneda || 'COP'} onChange={(e) => setConfig((p) => ({ ...p, moneda: e.target.value }))} />
                  </div>
                  <div className="col-4">
                    <label className="form-label mb-1 small">Zona horaria</label>
                    <input className="form-control form-control-sm" value={config.zona_horaria || 'America/Bogota'} onChange={(e) => setConfig((p) => ({ ...p, zona_horaria: e.target.value }))} />
                  </div>
                </div>

                <button className="btn btn-primary btn-sm mt-1" type="submit">Guardar configuracion</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

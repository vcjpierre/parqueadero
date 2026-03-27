import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client.js';
import { formatCurrency, formatDateTime, formatDateInput } from '../utils/format.js';
import { TurnoPanel } from '../components/TurnoPanel.jsx';

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [ocupacion, setOcupacion] = useState(0);
  const [modalData, setModalData] = useState(null);
  const [modalClosing, setModalClosing] = useState(false);

  const byType = useMemo(() => {
    const map = { carro: 0, moto: 0, bici: 0 };
    (stats?.currentVehiclesByType || []).forEach((t) => {
      map[t.tipo] = Number(t.count || 0);
    });
    return map;
  }, [stats]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, kpiRes] = await Promise.all([
        api.get('/dashboard/stats?page=0&pageSize=8'),
        api.get('/reportes/kpis', {
          params: {
            desde: formatDateInput(),
            hasta: formatDateInput(),
          },
        }),
      ]);
      setStats(statsRes.data);
      setOcupacion(kpiRes.data?.data?.ocupacion || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'No fue posible cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!modalClosing) return undefined;

    const timeoutId = window.setTimeout(() => {
      setModalData(null);
      setModalClosing(false);
    }, 160);

    return () => window.clearTimeout(timeoutId);
  }, [modalClosing]);

  useEffect(() => {
    if (!modalData) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setModalClosing(true);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modalData]);

  const closeModal = () => {
    setModalClosing(true);
  };

  const verDetalle = async (id) => {
    try {
      const { data } = await api.get(`/movimientos/detalle/${id}`);
      setModalData(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el detalle');
    }
  };

  return (
    <div className="d-grid gap-4">
      <TurnoPanel />
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="h4 mb-0">Dashboard</h2>
        <button className="btn btn-outline-primary btn-sm" onClick={loadData} type="button">
          Actualizar
        </button>
      </div>

      {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">Vehiculos actuales</p>
              <div className="d-flex gap-3 small">
                <span>Carros: {byType.carro}</span>
                <span>Motos: {byType.moto}</span>
                <span>Bicis: {byType.bici}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">Ingresos hoy</p>
              <h3 className="h5 mb-0">{formatCurrency(stats?.todayIncome || 0)}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <p className="text-muted mb-1">Ocupacion</p>
              <h3 className="h5 mb-0">{ocupacion}%</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <h3 className="h6 mb-0">Actividad reciente</h3>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && (stats?.recentActivity || []).length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    Sin actividad
                  </td>
                </tr>
              ) : null}
              {(stats?.recentActivity || []).map((a) => (
                <tr key={a.id}>
                  <td>{a.placa}</td>
                  <td className="text-capitalize">{a.tipo}</td>
                  <td>{formatDateTime(a.entrada)}</td>
                  <td>
                    <span className={`badge ${a.estado === 'activo' ? 'bg-success' : 'bg-secondary'}`}>
                      {a.estado}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => verDetalle(a.id)}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalData
        ? createPortal(
            <div
              className={`modal-backdrop-custom ${modalClosing ? 'modal-closing' : ''}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="detalle-movimiento-title"
              onClick={closeModal}
            >
              <div className="modal-card-custom" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                  <h5 className="modal-title" id="detalle-movimiento-title">
                    Movimiento #{modalData.id_movimiento}
                  </h5>
                  <button className="btn-close" onClick={closeModal} type="button" />
                </div>
                <div className="modal-body">
                  <div className="modal-detail-grid">
                    <div className="modal-detail-item">
                      <span className="modal-detail-label">Placa</span>
                      <span className="modal-detail-value">{modalData.placa}</span>
                    </div>
                    <div className="modal-detail-item">
                      <span className="modal-detail-label">Tipo</span>
                      <span className="modal-detail-value text-capitalize">{modalData.tipo}</span>
                    </div>
                    <div className="modal-detail-item">
                      <span className="modal-detail-label">Entrada</span>
                      <span className="modal-detail-value">{formatDateTime(modalData.fecha_entrada)}</span>
                    </div>
                    <div className="modal-detail-item">
                      <span className="modal-detail-label">Salida</span>
                      <span className="modal-detail-value">{formatDateTime(modalData.fecha_salida)}</span>
                    </div>
                    <div className="modal-detail-item modal-detail-item-total">
                      <span className="modal-detail-label">Total</span>
                      <span className="modal-detail-value">{formatCurrency(modalData.total_a_pagar)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

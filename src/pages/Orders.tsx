import { useEffect, useState } from 'react';
import { Check, X, ExternalLink } from 'lucide-react';
import { apiClient } from '../apiClient';

// transferProofUrl es relativo (ej: /uploads/transfer-proofs/x.png), vive
// fuera del prefijo /api/v1 — reconstruimos el host base para armar la URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const FILES_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'PENDIENTE',
  PAID: 'APROBADA',
  FAILED: 'FALLIDA',
  CANCELLED: 'RECHAZADA',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING_PAYMENT: { bg: 'rgba(251, 191, 36, 0.2)', fg: '#FBBF24' },
  PAID: { bg: 'rgba(34, 197, 94, 0.2)', fg: '#86EFAC' },
  FAILED: { bg: 'rgba(239, 68, 68, 0.2)', fg: '#FCA5A5' },
  CANCELLED: { bg: 'rgba(143, 143, 163, 0.2)', fg: '#8F8FA3' },
};

function formatMoney(cents: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(cents / 100);
}

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING_PAYMENT');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = new URLSearchParams({ paymentMethod: 'BANK_TRANSFER' });
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiClient.get<any[]>(`/orders?${params.toString()}`);
      setOrders(data);
      setSelected((prev: any) => {
        if (!prev) return null;
        return data.find(o => o.id === prev.id) || null;
      });
    } catch (e) {
      if (showLoader) alert('Error al cargar órdenes');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleValidate = async (approve: boolean) => {
    if (!selected) return;
    if (!approve && !rejectionReason.trim()) {
      alert('Ingresá un motivo de rechazo.');
      return;
    }
    setProcessing(true);
    try {
      await apiClient.patch(`/orders/${selected.id}/validate-transfer`, {
        approve,
        rejectionReason: approve ? undefined : rejectionReason,
      });
      setSelected(null);
      setRejectionReason('');
      await load(false);
    } catch (e: any) {
      alert('Error al validar la orden: ' + (e.message || ''));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ color: '#8F8FA3' }}>Cargando órdenes...</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Pagos por Transferencia</h1>
      <p style={{ color: '#8F8FA3', marginBottom: 32 }}>Validá los comprobantes para activar las entradas.</p>

      <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 24, display: 'flex', gap: 12 }}>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="PENDING_PAYMENT">Pendientes</option>
          <option value="PAID">Aprobadas</option>
          <option value="CANCELLED">Rechazadas</option>
          <option value="">Todas</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div style={{ color: '#8F8FA3', textAlign: 'center', marginTop: 40 }}>
          No hay órdenes por transferencia en este estado.
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2D2D45' }}>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Comprador</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Evento</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Entradas</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Total</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const colors = STATUS_COLORS[o.status] ?? STATUS_COLORS.PENDING_PAYMENT;
                return (
                  <tr
                    key={o.id}
                    style={{ borderBottom: '1px solid #2D2D45', cursor: 'pointer' }}
                    onClick={() => setSelected(o)}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{o.buyer?.fullName || o.buyer?.email}</td>
                    <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{o.event?.title}</td>
                    <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{o.tickets?.length ?? 0}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{formatMoney(o.totalCents, o.currency)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ backgroundColor: colors.bg, color: colors.fg, padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: 480, padding: 32, borderRadius: 24, maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>Orden de {selected.buyer?.fullName ?? selected.buyer?.email}</h2>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>Evento</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.event?.title}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>Entradas ({selected.tickets?.length ?? 0})</div>
              <div style={{ fontSize: 14, color: '#B9B9C8' }}>{selected.tickets?.length ?? 0} unidad(es)</div>
            </div>

            {selected.addons?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>Adicionales</div>
                {selected.addons.map((a: any) => (
                  <div key={a.id} style={{ fontSize: 14, color: '#B9B9C8' }}>
                    {a.quantity}× {a.addon?.name}{a.variant ? ` (${a.variant.label})` : ''}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>Total</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#A78BFA' }}>{formatMoney(selected.totalCents, selected.currency)}</div>
            </div>

            {selected.transferReference && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>Referencia</div>
                <div style={{ fontSize: 14, fontFamily: 'monospace' }}>{selected.transferReference}</div>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 8 }}>Comprobante</div>
              {selected.transferProofUrl ? (
                <a
                  href={`${FILES_BASE_URL}${selected.transferProofUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#A78BFA', textDecoration: 'none', fontWeight: 600 }}
                >
                  <ExternalLink size={16} /> Ver comprobante
                </a>
              ) : (
                <div style={{ color: '#8F8FA3', fontSize: 14 }}>Todavía no subió comprobante.</div>
              )}
            </div>

            {selected.status === 'PENDING_PAYMENT' ? (
              <>
                <textarea
                  className="input"
                  placeholder="Motivo de rechazo (solo si vas a rechazar)"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={2}
                  style={{ width: '100%', marginBottom: 16, boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => handleValidate(false)}
                    disabled={processing}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <X size={18} /> Rechazar
                  </button>
                  <button
                    onClick={() => handleValidate(true)}
                    disabled={processing}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    <Check size={18} /> Aprobar
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: STATUS_COLORS[selected.status]?.fg, fontWeight: 700 }}>
                {STATUS_LABEL[selected.status]}
                {selected.rejectionReason && ` — ${selected.rejectionReason}`}
              </div>
            )}

            <button
              onClick={() => { setSelected(null); setRejectionReason(''); }}
              style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 12, border: '1px solid #2D2D45', background: 'transparent', color: '#8F8FA3', cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

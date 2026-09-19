import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { apiClient } from '../apiClient';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'PENDIENTE',
  APPROVED: 'APROBADA',
  REJECTED: 'RECHAZADA',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: 'rgba(251, 191, 36, 0.2)', fg: '#FBBF24' },
  APPROVED: { bg: 'rgba(34, 197, 94, 0.2)', fg: '#86EFAC' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.2)', fg: '#FCA5A5' },
};

export function AccessRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiClient.get<any[]>(`/access-requests/admin?${params.toString()}`);
      setRequests(data);
      setSelected((prev: any) => {
        if (!prev) return null;
        return data.find(r => r.id === prev.id) || null;
      });
    } catch (e) {
      if (showLoader) alert('Error al cargar solicitudes de acceso');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const openDetail = async (request: any) => {
    setSelected(request);
    setCategoryId('');
    setRejectionReason('');
    setCategories([]);
    if (request.status === 'PENDING') {
      try {
        const data = await apiClient.get<any[]>(`/events/${request.eventId}/categories/admin`);
        setCategories(data.filter((c: any) => c.isActive));
      } catch {
        alert('No se pudieron cargar las categorías del evento.');
      }
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    if (!categoryId) {
      alert('Elegí en qué categoría entra esta persona.');
      return;
    }
    setProcessing(true);
    try {
      await apiClient.patch(`/access-requests/${selected.id}/approve`, { categoryId });
      setSelected(null);
      await load(false);
    } catch (e: any) {
      alert('Error al aprobar: ' + (e.message || ''));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await apiClient.patch(`/access-requests/${selected.id}/reject`, { reason: rejectionReason || undefined });
      setSelected(null);
      await load(false);
    } catch (e: any) {
      alert('Error al rechazar: ' + (e.message || ''));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Cargando solicitudes de acceso...</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Solicitudes de acceso</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
        Pedidos de "tengo código de acceso" desde cualquier evento (acreditación de prensa, invitados, etc.). Al aprobar, elegís la categoría y se genera una entrada real con QR, sin cobro.
      </p>

      <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 24, display: 'flex', gap: 12 }}>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="PENDING">Pendientes</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
          <option value="">Todas</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40 }}>
          No hay solicitudes de acceso en este estado.
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Persona</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Evento</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Teléfono</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Código / motivo</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => {
                const colors = STATUS_COLORS[r.status] ?? STATUS_COLORS.PENDING;
                return (
                  <tr
                    key={r.id}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                    onClick={() => openDetail(r)}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{r.user?.fullName || r.user?.email}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{r.event?.title}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{r.phone || '—'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                      {r.code || '—'}{r.note ? ` · ${r.note}` : ''}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ backgroundColor: colors.bg, color: colors.fg, padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                        {STATUS_LABEL[r.status] ?? r.status}
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
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{selected.user?.fullName ?? selected.user?.email}</h2>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 4 }}>Evento</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.event?.title}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 4 }}>Teléfono (para chequear antes de aprobar)</div>
              <div style={{ fontSize: 15, fontFamily: 'monospace', fontWeight: 600 }}>{selected.phone || '—'}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 4 }}>Código</div>
              <div style={{ fontSize: 14, fontFamily: 'monospace' }}>{selected.code || '—'}</div>
            </div>

            {selected.note && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 4 }}>Nota / medio</div>
                <div style={{ fontSize: 14 }}>{selected.note}</div>
              </div>
            )}

            {selected.status === 'PENDING' ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'block', marginBottom: 8 }}>Categoría de la entrada</label>
                  <select className="input" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                    <option value="">Elegir categoría...</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.maxCapacity - c.reservedCount} disponibles)</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 6 }}>Cargando categorías...</div>
                  )}
                </div>

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
                    onClick={handleReject}
                    disabled={processing}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <X size={18} /> Rechazar
                  </button>
                  <button onClick={handleApprove} disabled={processing} className="btn-primary" style={{ flex: 1 }}>
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
              onClick={() => setSelected(null)}
              style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { apiClient } from '../apiClient';

function formatMoney(cents: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(cents / 100);
}

const emptyForm = {
  title: '',
  description: '',
  eventId: '',
  videoUrl: '',
  muxAssetId: '',
  muxPlaybackId: '',
  thumbnailUrl: '',
  isFree: false,
  includedInSubscription: true,
  sellable: false,
  price: '', // en pesos, se convierte a centavos al guardar
};

export function Content() {
  const [events, setEvents] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    apiClient.get<any[]>('/events').then(setEvents).catch(console.error);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/recordings');
      setRecordings(data);
    } catch (e) {
      alert('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (rec: any) => {
    setEditingId(rec.id);
    setFormData({
      title: rec.title,
      description: rec.description || '',
      eventId: rec.eventId || '',
      videoUrl: rec.videoUrl || '',
      muxAssetId: rec.muxAssetId || '',
      muxPlaybackId: rec.muxPlaybackId || '',
      thumbnailUrl: rec.thumbnailUrl || '',
      isFree: rec.isFree,
      includedInSubscription: rec.includedInSubscription,
      sellable: rec.priceCents != null,
      price: rec.priceCents != null ? (rec.priceCents / 100).toString() : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto: any = {
      title: formData.title,
      description: formData.description || undefined,
      eventId: formData.eventId || undefined,
      videoUrl: formData.videoUrl || undefined,
      muxAssetId: formData.muxAssetId || undefined,
      muxPlaybackId: formData.muxPlaybackId || undefined,
      thumbnailUrl: formData.thumbnailUrl || undefined,
      isFree: formData.isFree,
      includedInSubscription: formData.includedInSubscription,
      priceCents: formData.sellable ? Math.round(parseFloat(formData.price || '0') * 100) : null,
    };

    try {
      if (editingId) {
        const updated = await apiClient.patch<any>(`/recordings/${editingId}`, dto);
        setRecordings(prev => prev.map(r => r.id === editingId ? updated : r));
      } else {
        const created = await apiClient.post<any>('/recordings', dto);
        setRecordings(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e: any) {
      alert('Error al guardar el contenido: ' + (e.message || ''));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta grabación?')) return;
    try {
      await apiClient.fetch(`/recordings/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert('Error al eliminar la grabación');
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Cargando contenido...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ marginTop: 0, marginBottom: 0, fontSize: 28 }}>Contenido / Streaming</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={20} /> Nueva grabación
        </button>
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
        Grabaciones que INVS comparte en la sección Streaming — cada una puede ser gratis, incluida en la suscripción, y/o vendida suelta (los tres modos son combinables, no excluyentes).
      </p>

      {recordings.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40 }}>No hay grabaciones cargadas todavía.</div>
      ) : (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Título</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Evento</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Acceso</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Precio suelto</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recordings.map(rec => (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{rec.title}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{rec.event?.title ?? '— (suelto)'}</td>
                  <td style={{ padding: '16px 24px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {rec.isFree && (
                      <span style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: '#86EFAC', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>GRATIS</span>
                    )}
                    {rec.includedInSubscription && (
                      <span style={{ backgroundColor: 'rgba(167,139,250,0.2)', color: '#C4B5FD', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>SUSCRIPCIÓN</span>
                    )}
                    {rec.priceCents != null && (
                      <span style={{ backgroundColor: 'rgba(251,191,36,0.2)', color: '#FBBF24', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>COMPRA</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{rec.priceCents != null ? formatMoney(rec.priceCents, rec.currency) : '—'}</td>
                  <td style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
                    <button onClick={() => openEditModal(rec)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 8 }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(rec.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 8 }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: 520, padding: 32, borderRadius: 24, maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{editingId ? 'Editar grabación' : 'Nueva grabación'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input className="input" placeholder="Título" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              <textarea className="input" placeholder="Descripción (opcional)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />

              <div>
                <label style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'block', marginBottom: 6 }}>Evento vinculado (opcional — dejalo vacío para contenido suelto)</label>
                <select className="input" value={formData.eventId} onChange={e => setFormData({ ...formData, eventId: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }}>
                  <option value="">Sin evento (contenido suelto)</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>

              <div>
                <label style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'block', marginBottom: 6 }}>Fuente del video — cargá una URL de YouTube O los IDs de Mux</label>
                <input className="input" placeholder="URL de YouTube (ej: https://www.youtube.com/watch?v=...)" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <input className="input" placeholder="Mux Asset ID (solo si no usás URL)" value={formData.muxAssetId} onChange={e => setFormData({ ...formData, muxAssetId: e.target.value })} />
              <input className="input" placeholder="Mux Playback ID (solo si no usás URL)" value={formData.muxPlaybackId} onChange={e => setFormData({ ...formData, muxPlaybackId: e.target.value })} />
              <input className="input" placeholder="URL de thumbnail (opcional)" value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} />

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({ ...formData, isFree: e.target.checked })} />
                  Gratis para cualquier usuario logueado
                </label>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={formData.includedInSubscription} onChange={e => setFormData({ ...formData, includedInSubscription: e.target.checked })} />
                  Incluido con una suscripción activa
                </label>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={formData.sellable} onChange={e => setFormData({ ...formData, sellable: e.target.checked })} />
                  Vender por separado (pago único)
                </label>
                {formData.sellable && (
                  <input className="input" type="number" step="0.01" placeholder="Precio en $ (ej: 2500)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                )}
                <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: '4px 0 0', lineHeight: 1.5 }}>
                  Estos 3 modos no son excluyentes — un video puede estar incluido en la suscripción y ADEMÁS venderse suelto para quien no está suscripto.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', color: '#FFF', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

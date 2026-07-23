import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../apiClient';

export function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    location: '',
    mode: 'PRESENCIAL',
    status: 'DRAFT',
    liveIsFree: false,
    liveIncludedInSubscription: true,
    liveSellable: false,
    livePrice: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiClient.get<any[]>('/events');
      setEvents(data);
    } catch (e) {
      alert('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este evento?')) return;
    try {
      await apiClient.fetch(`/events/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      alert('Error al eliminar evento');
    }
  };

  const handleEditClick = (ev: any) => {
    setEditingEvent(ev.id);
    setFormData({
      title: ev.title,
      description: ev.description || '',
      date: new Date(ev.date).toISOString().slice(0, 16),
      location: ev.location || '',
      mode: ev.mode,
      status: ev.status,
      liveIsFree: ev.liveIsFree ?? false,
      liveIncludedInSubscription: ev.liveIncludedInSubscription ?? true,
      liveSellable: ev.livePriceCents != null,
      livePrice: ev.livePriceCents != null ? (ev.livePriceCents / 100).toString() : '',
    });
    setPhotos(ev.photos ?? []);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setPhotos([]);
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 16),
      location: '',
      mode: 'PRESENCIAL',
      status: 'DRAFT',
      liveIsFree: false,
      liveIncludedInSubscription: true,
      liveSellable: false,
      livePrice: '',
    });
    setShowModal(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEvent) return;

    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const updated = await apiClient.fetch(`/events/${editingEvent}/photos`, { method: 'POST', body: fd });
      setPhotos(updated.photos);
      setEvents(prev => prev.map(ev => ev.id === editingEvent ? updated : ev));
    } catch (err: any) {
      alert('Error al subir foto: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!editingEvent) return;
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      const updated = await apiClient.fetch(`/events/${editingEvent}/photos/${photoId}`, { method: 'DELETE' });
      setPhotos(updated.photos);
      setEvents(prev => prev.map(ev => ev.id === editingEvent ? updated : ev));
    } catch (err: any) {
      alert('Error al borrar foto: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { status, liveSellable, livePrice, ...rest } = formData;
      const dto = {
        ...rest,
        livePriceCents: liveSellable ? Math.round(parseFloat(livePrice || '0') * 100) : null,
      };
      if (editingEvent) {
        // Edit mode (status can be updated together)
        const finalEvent = await apiClient.patch<any>(`/events/${editingEvent}`, {
          ...dto,
          status,
          date: new Date(formData.date).toISOString()
        });
        setEvents(prev => prev.map(ev => ev.id === editingEvent ? finalEvent : ev));
        setShowModal(false);
      } else {
        // Create mode
        const created = await apiClient.post<any>('/events', {
          ...dto,
          date: new Date(formData.date).toISOString()
        });

        let finalEvent = created;
        if (status !== 'DRAFT') {
          finalEvent = await apiClient.patch<any>(`/events/${created.id}`, { status });
        }
        setEvents(prev => [finalEvent, ...prev]);
        // No cerramos el modal: pasamos a modo edición del evento recién creado
        // para poder cargar sus fotos sin tener que volver a abrirlo.
        setEditingEvent(finalEvent.id);
        setPhotos(finalEvent.photos ?? []);
      }
    } catch (e: any) {
      alert('Error al guardar evento: ' + (e.message || JSON.stringify(e)));
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Cargando eventos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Gestión de Eventos</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Creá, editá y publicá eventos.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={20} /> Crear Evento
        </button>
      </div>

      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500, width: 90 }}>Foto</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Título</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Fecha</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Modalidad</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <img
                    src={ev.coverImageUrl}
                    alt={ev.title}
                    style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)' }}
                  />
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{ev.title}</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{new Date(ev.date).toLocaleString()}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ backgroundColor: 'var(--color-surface)', padding: '4px 10px', borderRadius: 20, fontSize: 13, color: 'var(--color-accent)' }}>
                    {ev.mode}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEditClick(ev)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 8 }}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(ev.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 8 }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: 540, padding: 32, borderRadius: 24, maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{editingEvent ? 'Editar Evento' : 'Crear Evento'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input className="input" placeholder="Título" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              <textarea className="input" placeholder="Descripción" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
              <input className="input" type="datetime-local" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
              <input className="input" placeholder="Ubicación (opcional)" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
              <select className="input" value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value })}>
                <option value="PRESENCIAL">Presencial</option>
                <option value="STREAMING">Streaming</option>
                <option value="HIBRIDO">Híbrido</option>
              </select>
              <select className="input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="DRAFT">Borrador (DRAFT)</option>
                <option value="PUBLISHED">Publicado (PUBLISHED)</option>
              </select>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>Fotos del evento</span>
                {!editingEvent ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>
                    Guardá el evento para poder cargar fotos.
                  </p>
                ) : (
                  <>
                    {photos.length > 0 && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {photos.map(p => (
                          <div key={p.id} style={{ position: 'relative' }}>
                            <img
                              src={p.url}
                              alt=""
                              style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }}
                            />
                            <button
                              type="button"
                              onClick={() => handlePhotoDelete(p.id)}
                              style={{ position: 'absolute', top: -8, right: -8, background: 'var(--color-danger)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {photos.length === 0 && (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ImageIcon size={16} /> Sin fotos propias — se muestra una imagen por defecto hasta que cargues alguna.
                      </p>
                    )}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handlePhotoUpload} disabled={uploadingPhoto} style={{ color: 'var(--color-text-secondary)', fontSize: 14 }} />
                    {uploadingPhoto && <div style={{ color: 'var(--color-accent)', fontSize: 12 }}>Subiendo imagen...</div>}
                  </>
                )}
              </div>

              {formData.mode !== 'PRESENCIAL' && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>Acceso al streaming en vivo</span>
                  <label style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={formData.liveIsFree} onChange={e => setFormData({ ...formData, liveIsFree: e.target.checked })} />
                    Gratis para cualquier usuario logueado
                  </label>
                  <label style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={formData.liveIncludedInSubscription} onChange={e => setFormData({ ...formData, liveIncludedInSubscription: e.target.checked })} />
                    Incluido con una suscripción activa
                  </label>
                  <label style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={formData.liveSellable} onChange={e => setFormData({ ...formData, liveSellable: e.target.checked })} />
                    Vender por separado (pago único, pay-per-view)
                  </label>
                  {formData.liveSellable && (
                    <input className="input" type="number" step="0.01" placeholder="Precio en $ (ej: 1800)" value={formData.livePrice} onChange={e => setFormData({ ...formData, livePrice: e.target.value })} required />
                  )}
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: '4px 0 0', lineHeight: 1.5 }}>
                    Estos 3 modos no son excluyentes entre sí — podés combinarlos.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
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

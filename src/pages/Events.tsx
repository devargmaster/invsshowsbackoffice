import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { apiClient } from '../apiClient';

export function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    location: '',
    mode: 'PRESENCIAL',
    status: 'DRAFT'
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
      status: ev.status
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 16),
      location: '',
      mode: 'PRESENCIAL',
      status: 'DRAFT'
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { status, ...dto } = formData;
      let finalEvent;
      
      if (editingEvent) {
        // Edit mode (status can be updated together)
        finalEvent = await apiClient.patch<any>(`/events/${editingEvent}`, {
          ...dto,
          status,
          date: new Date(formData.date).toISOString()
        });
        setEvents(prev => prev.map(ev => ev.id === editingEvent ? finalEvent : ev));
      } else {
        // Create mode
        const created = await apiClient.post<any>('/events', {
          ...dto,
          date: new Date(formData.date).toISOString()
        });
        
        finalEvent = created;
        if (status !== 'DRAFT') {
           finalEvent = await apiClient.patch<any>(`/events/${created.id}`, { status });
        }
        setEvents(prev => [finalEvent, ...prev]);
      }
      
      setShowModal(false);
    } catch (e: any) {
      alert('Error al guardar evento: ' + (e.message || JSON.stringify(e)));
    }
  };

  if (loading) return <div style={{ color: '#8F8FA3' }}>Cargando eventos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Gestión de Eventos</h1>
          <p style={{ color: '#8F8FA3', margin: 0 }}>Creá, editá y publicá eventos.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={20} /> Crear Evento
        </button>
      </div>

      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2D2D45' }}>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Título</th>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Fecha</th>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Modalidad</th>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id} style={{ borderBottom: '1px solid #2D2D45' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{ev.title}</td>
                <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{new Date(ev.date).toLocaleString()}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ backgroundColor: '#181827', padding: '4px 10px', borderRadius: 20, fontSize: 13, color: '#A78BFA' }}>
                    {ev.mode}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEditClick(ev)} style={{ background: 'none', border: 'none', color: '#8F8FA3', cursor: 'pointer', padding: 8 }}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(ev.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 8 }}>
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
          <div className="glass" style={{ width: 500, padding: 32, borderRadius: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{editingEvent ? 'Editar Evento' : 'Crear Evento'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input className="input" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <textarea className="input" placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
              <input className="input" type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              <input className="input" placeholder="Ubicación (opcional)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              <select className="input" value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})}>
                <option value="PRESENCIAL">Presencial</option>
                <option value="STREAMING">Streaming</option>
                <option value="HIBRIDO">Híbrido</option>
              </select>
              <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="DRAFT">Borrador (DRAFT)</option>
                <option value="PUBLISHED">Publicado (PUBLISHED)</option>
              </select>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid #2D2D45', background: 'transparent', color: '#FFF', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { apiClient } from '../apiClient';

function formatMoney(cents: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(cents / 100);
}

const emptyForm = {
  name: '',
  description: '',
  price: '', // en pesos, se convierte a centavos al guardar
  maxCapacity: '',
  accessStartsAt: '',
};

export function Categories() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    apiClient.get<any[]>('/events').then(setEvents).catch(console.error);
  }, []);

  const load = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>(`/events/${selectedEventId}/categories/admin`);
      setCategories(data);
    } catch (e) {
      alert('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedEventId]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      price: (cat.priceCents / 100).toString(),
      maxCapacity: cat.maxCapacity.toString(),
      accessStartsAt: cat.accessStartsAt ? new Date(cat.accessStartsAt).toISOString().slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto: any = {
      name: formData.name,
      description: formData.description || undefined,
      priceCents: Math.round(parseFloat(formData.price || '0') * 100),
      maxCapacity: parseInt(formData.maxCapacity || '0', 10),
      accessStartsAt: formData.accessStartsAt ? new Date(formData.accessStartsAt).toISOString() : undefined,
    };

    try {
      if (editingId) {
        const updated = await apiClient.patch<any>(`/categories/${editingId}`, dto);
        setCategories(prev => prev.map(c => c.id === editingId ? updated : c));
      } else {
        const created = await apiClient.post<any>(`/events/${selectedEventId}/categories`, dto);
        setCategories(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (e: any) {
      alert('Error al guardar categoría: ' + (e.message || ''));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta categoría? Si ya tiene entradas vendidas, se desactiva en vez de borrarse.')) return;
    try {
      await apiClient.fetch(`/categories/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert('Error al eliminar categoría');
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Categorías de Entrada</h1>
      <p style={{ color: '#8F8FA3', marginBottom: 32 }}>
        Cada categoría puede tener su propio precio, horario de acceso y aforo (el límite de 50 simultáneos de Panda aplica por categoría, no por evento).
      </p>

      <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <select className="input" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} style={{ flex: 1 }}>
          <option value="">Seleccioná un evento...</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <button className="btn-primary" onClick={openCreateModal} disabled={!selectedEventId}>
          <Plus size={20} /> Nueva categoría
        </button>
      </div>

      {loading && <div style={{ color: '#8F8FA3' }}>Cargando categorías...</div>}

      {!loading && selectedEventId && categories.length === 0 && (
        <div style={{ color: '#8F8FA3', textAlign: 'center', marginTop: 40 }}>Este evento no tiene categorías todavía.</div>
      )}

      {!loading && categories.length > 0 && (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2D2D45' }}>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Nombre</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Precio</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Aforo</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Estado</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #2D2D45', opacity: cat.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{formatMoney(cat.priceCents, cat.currency)}</td>
                  <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{cat.reservedCount} / {cat.maxCapacity}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ backgroundColor: cat.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(143,143,163,0.2)', color: cat.isActive ? '#86EFAC' : '#8F8FA3', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                      {cat.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
                    <button onClick={() => openEditModal(cat)} style={{ background: 'none', border: 'none', color: '#8F8FA3', cursor: 'pointer', padding: 8 }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 8 }}>
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
          <div className="glass" style={{ width: 480, padding: 32, borderRadius: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input className="input" placeholder="Nombre (ej: VIP)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              <textarea className="input" placeholder="Descripción (opcional)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />
              <input className="input" type="number" step="0.01" placeholder="Precio en $ (ej: 15000)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
              <input className="input" type="number" placeholder="Aforo máximo" value={formData.maxCapacity} onChange={e => setFormData({ ...formData, maxCapacity: e.target.value })} required />
              <div>
                <label style={{ color: '#8F8FA3', fontSize: 13, display: 'block', marginBottom: 6 }}>Hora de ingreso propia (opcional, ej: VIP entra antes)</label>
                <input className="input" type="datetime-local" value={formData.accessStartsAt} onChange={e => setFormData({ ...formData, accessStartsAt: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
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

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { apiClient } from '../apiClient';

function formatMoney(cents: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(cents / 100);
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  hasVariants: false,
  variantsCsv: '', // solo se usa al crear (ej: "S,M,L,XL")
};

export function Addons() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [newVariantLabel, setNewVariantLabel] = useState('');

  useEffect(() => {
    apiClient.get<any[]>('/events').then(setEvents).catch(console.error);
  }, []);

  const load = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>(`/events/${selectedEventId}/addons/admin`);
      setAddons(data);
    } catch (e) {
      alert('Error al cargar adicionales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedEventId]);

  const openCreateModal = () => {
    setEditingAddon(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (addon: any) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description || '',
      price: (addon.priceCents / 100).toString(),
      hasVariants: addon.hasVariants,
      variantsCsv: '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddon) {
        const updated = await apiClient.patch<any>(`/addons/${editingAddon.id}`, {
          name: formData.name,
          description: formData.description || undefined,
          priceCents: Math.round(parseFloat(formData.price || '0') * 100),
        });
        setAddons(prev => prev.map(a => a.id === editingAddon.id ? { ...updated, variants: a.variants } : a));
      } else {
        const variants = formData.hasVariants
          ? formData.variantsCsv.split(',').map(v => v.trim()).filter(Boolean)
          : undefined;
        const created = await apiClient.post<any>(`/events/${selectedEventId}/addons`, {
          name: formData.name,
          description: formData.description || undefined,
          priceCents: Math.round(parseFloat(formData.price || '0') * 100),
          hasVariants: formData.hasVariants,
          variants,
        });
        setAddons(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (e: any) {
      alert('Error al guardar adicional: ' + (e.message || ''));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este adicional? Si ya tiene ventas, se desactiva en vez de borrarse.')) return;
    try {
      await apiClient.fetch(`/addons/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert('Error al eliminar adicional');
    }
  };

  const handleAddVariant = async () => {
    if (!editingAddon || !newVariantLabel.trim()) return;
    try {
      const variant = await apiClient.post<any>(`/addons/${editingAddon.id}/variants`, { label: newVariantLabel.trim() });
      setEditingAddon((prev: any) => ({ ...prev, variants: [...(prev.variants ?? []), variant] }));
      setAddons(prev => prev.map(a => a.id === editingAddon.id ? { ...a, variants: [...(a.variants ?? []), variant] } : a));
      setNewVariantLabel('');
    } catch (e) {
      alert('Error al agregar variante');
    }
  };

  const handleRemoveVariant = async (variantId: string) => {
    if (!editingAddon) return;
    try {
      await apiClient.fetch(`/addons/variants/${variantId}`, { method: 'DELETE' });
      setEditingAddon((prev: any) => ({ ...prev, variants: prev.variants.filter((v: any) => v.id !== variantId) }));
      setAddons(prev => prev.map(a => a.id === editingAddon.id ? { ...a, variants: a.variants.filter((v: any) => v.id !== variantId) } : a));
    } catch (e: any) {
      alert('No se pudo eliminar la variante (probablemente ya tiene ventas).');
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Adicionales</h1>
      <p style={{ color: '#8F8FA3', marginBottom: 32 }}>Remeras, cuadros dorados, conmemorativos — extras para decorar la experiencia.</p>

      <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <select className="input" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} style={{ flex: 1 }}>
          <option value="">Seleccioná un evento...</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <button className="btn-primary" onClick={openCreateModal} disabled={!selectedEventId}>
          <Plus size={20} /> Nuevo adicional
        </button>
      </div>

      {loading && <div style={{ color: '#8F8FA3' }}>Cargando adicionales...</div>}

      {!loading && selectedEventId && addons.length === 0 && (
        <div style={{ color: '#8F8FA3', textAlign: 'center', marginTop: 40 }}>Este evento no tiene adicionales todavía.</div>
      )}

      {!loading && addons.length > 0 && (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2D2D45' }}>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Nombre</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Precio</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Variantes</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Estado</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {addons.map(addon => (
                <tr key={addon.id} style={{ borderBottom: '1px solid #2D2D45', opacity: addon.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{addon.name}</td>
                  <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{formatMoney(addon.priceCents, addon.currency)}</td>
                  <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>
                    {addon.hasVariants ? (addon.variants?.map((v: any) => v.label).join(', ') || '—') : 'Sin variantes'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ backgroundColor: addon.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(143,143,163,0.2)', color: addon.isActive ? '#86EFAC' : '#8F8FA3', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                      {addon.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
                    <button onClick={() => openEditModal(addon)} style={{ background: 'none', border: 'none', color: '#8F8FA3', cursor: 'pointer', padding: 8 }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(addon.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 8 }}>
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
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{editingAddon ? 'Editar adicional' : 'Nuevo adicional'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input className="input" placeholder="Nombre (ej: Remera conmemorativa)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              <textarea className="input" placeholder="Descripción (opcional)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />
              <input className="input" type="number" step="0.01" placeholder="Precio en $ (ej: 8000)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />

              {!editingAddon && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B9B9C8', fontSize: 14 }}>
                    <input type="checkbox" checked={formData.hasVariants} onChange={e => setFormData({ ...formData, hasVariants: e.target.checked })} />
                    Tiene variantes (ej: talles)
                  </label>
                  {formData.hasVariants && (
                    <input
                      className="input"
                      placeholder="Talles separados por coma (ej: S,M,L,XL)"
                      value={formData.variantsCsv}
                      onChange={e => setFormData({ ...formData, variantsCsv: e.target.value })}
                    />
                  )}
                </>
              )}

              {editingAddon?.hasVariants && (
                <div>
                  <label style={{ color: '#8F8FA3', fontSize: 13, display: 'block', marginBottom: 8 }}>Variantes</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {editingAddon.variants?.map((v: any) => (
                      <span key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#181827', padding: '6px 10px', borderRadius: 20, fontSize: 13 }}>
                        {v.label}
                        <button type="button" onClick={() => handleRemoveVariant(v.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex' }}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" placeholder="Nueva variante (ej: XXL)" value={newVariantLabel} onChange={e => setNewVariantLabel(e.target.value)} style={{ flex: 1 }} />
                    <button type="button" onClick={handleAddVariant} className="btn-primary" style={{ padding: '10px 16px' }}>Agregar</button>
                  </div>
                </div>
              )}

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

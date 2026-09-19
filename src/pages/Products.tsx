import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../apiClient';

function formatMoney(cents: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(cents / 100);
}

const emptyForm = {
  name: '',
  category: 'PRODUCTO' as 'PRODUCTO' | 'SERVICIO',
  description: '',
  price: '',
  hasVariants: false,
  variantsCsv: '', // solo se usa al crear (ej: "S,M,L,XL")
  showInStore: false,
  eventIds: [] as string[],
};

export function Products() {
  const [events, setEvents] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'TODOS' | 'PRODUCTO' | 'SERVICIO'>('TODOS');

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    apiClient.get<any[]>('/events').then(setEvents).catch(console.error);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/addons/admin');
      setProducts(data);
    } catch (e) {
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category || 'PRODUCTO',
      description: product.description || '',
      price: (product.priceCents / 100).toString(),
      hasVariants: product.hasVariants,
      variantsCsv: '',
      showInStore: product.showInStore,
      eventIds: (product.eventLinks ?? []).map((l: any) => l.eventId),
    });
    setShowModal(true);
  };

  const toggleEventId = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      eventIds: prev.eventIds.includes(eventId)
        ? prev.eventIds.filter(id => id !== eventId)
        : [...prev.eventIds, eventId],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const updated = await apiClient.patch<any>(`/addons/${editingProduct.id}`, {
          name: formData.name,
          category: formData.category,
          description: formData.description || undefined,
          priceCents: Math.round(parseFloat(formData.price || '0') * 100),
          showInStore: formData.showInStore,
          eventIds: formData.eventIds,
        });
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...updated, variants: p.variants } : p));
        setShowModal(false);
      } else {
        const variants = formData.hasVariants
          ? formData.variantsCsv.split(',').map(v => v.trim()).filter(Boolean)
          : undefined;
        const created = await apiClient.post<any>('/addons', {
          name: formData.name,
          category: formData.category,
          description: formData.description || undefined,
          priceCents: Math.round(parseFloat(formData.price || '0') * 100),
          hasVariants: formData.hasVariants,
          variants,
          showInStore: formData.showInStore,
          eventIds: formData.eventIds,
        });
        setProducts(prev => [...prev, created]);
        // No cerramos el modal: pasamos a modo edición del producto recién
        // creado para poder cargarle una foto sin volver a abrirlo.
        setEditingProduct(created);
      }
    } catch (e: any) {
      alert('Error al guardar producto: ' + (e.message || ''));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este producto? Si ya tiene ventas, se desactiva en vez de borrarse.')) return;
    try {
      await apiClient.fetch(`/addons/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert('Error al eliminar producto');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const updated = await apiClient.fetch(`/addons/${editingProduct.id}/image`, { method: 'POST', body: fd });
      setEditingProduct((prev: any) => ({ ...prev, imageUrl: updated.imageUrl }));
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, imageUrl: updated.imageUrl } : p));
    } catch (err: any) {
      alert('Error al subir imagen: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageRemove = async () => {
    if (!editingProduct) return;
    try {
      const updated = await apiClient.fetch(`/addons/${editingProduct.id}/image`, { method: 'DELETE' });
      setEditingProduct((prev: any) => ({ ...prev, imageUrl: updated.imageUrl }));
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, imageUrl: updated.imageUrl } : p));
    } catch (err: any) {
      alert('Error al quitar imagen: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleAddVariant = async () => {
    if (!editingProduct || !newVariantLabel.trim()) return;
    try {
      const variant = await apiClient.post<any>(`/addons/${editingProduct.id}/variants`, { label: newVariantLabel.trim() });
      setEditingProduct((prev: any) => ({ ...prev, variants: [...(prev.variants ?? []), variant] }));
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, variants: [...(p.variants ?? []), variant] } : p));
      setNewVariantLabel('');
    } catch (e) {
      alert('Error al agregar variante');
    }
  };

  const handleRemoveVariant = async (variantId: string) => {
    if (!editingProduct) return;
    try {
      await apiClient.fetch(`/addons/variants/${variantId}`, { method: 'DELETE' });
      setEditingProduct((prev: any) => ({ ...prev, variants: prev.variants.filter((v: any) => v.id !== variantId) }));
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, variants: p.variants.filter((v: any) => v.id !== variantId) } : p));
    } catch (e: any) {
      alert('No se pudo eliminar la variante (probablemente ya tiene ventas).');
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Productos y servicios</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
        Catálogo de productos (remeras, cuadros, merchandising) y servicios (mastering, mezcla, producción): vendibles en la Tienda y/o como complemento de una o varias Experiencias.
      </p>

      <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['TODOS', 'PRODUCTO', 'SERVICIO'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setCategoryFilter(opt)}
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid var(--color-border)',
                background: categoryFilter === opt ? 'var(--color-accent)' : 'transparent',
                color: categoryFilter === opt ? 'var(--color-bg)' : 'var(--color-text-secondary)',
              }}
            >
              {opt === 'TODOS' ? 'Todos' : opt === 'PRODUCTO' ? 'Productos' : 'Servicios'}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={20} /> Nuevo
        </button>
      </div>

      {loading && <div style={{ color: 'var(--color-text-muted)' }}>Cargando productos...</div>}

      {!loading && products.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40 }}>Todavía no hay productos cargados.</div>
      )}

      {(() => {
        const filtered = categoryFilter === 'TODOS' ? products : products.filter(p => (p.category || 'PRODUCTO') === categoryFilter);
        return !loading && products.length > 0 && (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500, width: 70 }}>Foto</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Nombre</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Categoría</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Precio</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Tienda</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Experiencias</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Estado</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)', opacity: product.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '16px 24px' }}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{product.name}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      backgroundColor: product.category === 'SERVICIO' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(96, 165, 250, 0.2)',
                      color: product.category === 'SERVICIO' ? '#D8B4FE' : '#93C5FD',
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    }}>
                      {product.category === 'SERVICIO' ? 'SERVICIO' : 'PRODUCTO'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{formatMoney(product.priceCents, product.currency)}</td>
                  <td style={{ padding: '16px 24px' }}>
                    {product.showInStore ? (
                      <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86EFAC', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>SÍ</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                    {(product.eventLinks ?? []).length > 0
                      ? product.eventLinks.map((l: any) => l.event?.title).filter(Boolean).join(', ')
                      : '—'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ backgroundColor: product.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(143,143,163,0.2)', color: product.isActive ? '#86EFAC' : 'var(--color-text-muted)', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                      {product.isActive ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
                    <button onClick={() => openEditModal(product)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 8 }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 8 }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        );
      })()}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: 480, padding: 32, borderRadius: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input className="input" placeholder="Nombre (ej: Remera conmemorativa)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

              <div>
                <label style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'block', marginBottom: 8 }}>Categoría</label>
                <select className="input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as 'PRODUCTO' | 'SERVICIO' })}>
                  <option value="PRODUCTO">Producto (remera, merchandising)</option>
                  <option value="SERVICIO">Servicio (mastering, mezcla, producción)</option>
                </select>
              </div>

              <textarea className="input" placeholder="Descripción (opcional)" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} />
              <input className="input" type="number" step="0.01" placeholder="Precio en $ (ej: 8000)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 14 }}>
                <input type="checkbox" checked={formData.showInStore} onChange={e => setFormData({ ...formData, showInStore: e.target.checked })} />
                Mostrar en la Tienda (se puede comprar suelto, sin entrada)
              </label>

              <div>
                <label style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'block', marginBottom: 8 }}>
                  Complemento de estas Experiencias (opcional, puede ser ninguna o varias)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: 10 }}>
                  {events.length === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No hay experiencias creadas.</span>}
                  {events.map(ev => (
                    <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                      <input type="checkbox" checked={formData.eventIds.includes(ev.id)} onChange={() => toggleEventId(ev.id)} />
                      {ev.title}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'block', marginBottom: 8 }}>Foto (para que el comprador vea qué está comprando)</label>
                {!editingProduct ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>Guardá el producto para poder cargar una foto.</p>
                ) : (
                  <>
                    {editingProduct.imageUrl && (
                      <div style={{ position: 'relative', width: 90, marginBottom: 10 }}>
                        <img
                          src={editingProduct.imageUrl}
                          alt=""
                          style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }}
                        />
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          style={{ position: 'absolute', top: -8, right: -8, background: 'var(--color-danger)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageUpload} disabled={uploadingImage} style={{ color: 'var(--color-text-secondary)', fontSize: 14 }} />
                    {uploadingImage && <div style={{ color: 'var(--color-accent)', fontSize: 12, marginTop: 6 }}>Subiendo imagen...</div>}
                  </>
                )}
              </div>

              {!editingProduct && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 14 }}>
                    <input type="checkbox" checked={formData.hasVariants} onChange={e => setFormData({ ...formData, hasVariants: e.target.checked })} />
                    Tiene variantes {formData.category === 'SERVICIO' ? '(ej: básico/premium)' : '(ej: talles)'}
                  </label>
                  {formData.hasVariants && (
                    <input
                      className="input"
                      placeholder={formData.category === 'SERVICIO' ? 'Opciones separadas por coma (ej: Básico,Premium)' : 'Talles separados por coma (ej: S,M,L,XL)'}
                      value={formData.variantsCsv}
                      onChange={e => setFormData({ ...formData, variantsCsv: e.target.value })}
                    />
                  )}
                </>
              )}

              {editingProduct?.hasVariants && (
                <div>
                  <label style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'block', marginBottom: 8 }}>Variantes</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {editingProduct.variants?.map((v: any) => (
                      <span key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-surface)', padding: '6px 10px', borderRadius: 20, fontSize: 13 }}>
                        {v.label}
                        <button type="button" onClick={() => handleRemoveVariant(v.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex' }}>
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

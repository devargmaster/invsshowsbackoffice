import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Image } from 'lucide-react';
import { apiClient } from '../apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const FILES_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const emptyForm = {
  imageUrl: '',
  title: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
};

export function CarouselPhotos() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await apiClient.get<any[]>('/admin/carousel-photos');
      setPhotos(data);
    } catch (e) {
      alert('Error al cargar fotos de carrusel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta foto del carrusel?')) return;
    try {
      await apiClient.fetch(`/admin/carousel-photos/${id}`, { method: 'DELETE' });
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('Error al eliminar foto del carrusel');
    }
  };

  const handleEditClick = (photo: any) => {
    setEditingPhoto(photo.id);
    setFormData({
      imageUrl: photo.imageUrl,
      title: photo.title || '',
      linkUrl: photo.linkUrl || '',
      sortOrder: photo.sortOrder,
      isActive: photo.isActive,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingPhoto(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.fetch('/admin/carousel-photos/upload', {
        method: 'POST',
        body: fd,
      });
      setFormData(prev => ({ ...prev, imageUrl: res.imageUrl }));
    } catch (err: any) {
      alert('Error al subir imagen: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sortOrder: parseInt(formData.sortOrder as any, 10) || 0,
      };

      if (editingPhoto) {
        const updated = await apiClient.patch<any>(`/admin/carousel-photos/${editingPhoto}`, payload);
        setPhotos(prev => prev.map(p => p.id === editingPhoto ? updated : p));
      } else {
        const created = await apiClient.post<any>('/admin/carousel-photos', payload);
        setPhotos(prev => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      setShowModal(false);
    } catch (e: any) {
      alert('Error al guardar foto: ' + (e.message || JSON.stringify(e)));
    }
  };

  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${FILES_BASE_URL}${url}`;
  };

  if (loading) return <div style={{ color: '#8F8FA3' }}>Cargando fotos de carrusel...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Fotos de Carrusel</h1>
          <p style={{ color: '#8F8FA3', margin: 0 }}>Cargá y administrá las fotos del carrusel en la página principal.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={20} /> Agregar Foto
        </button>
      </div>

      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        {photos.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8F8FA3' }}>
            <Image size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No hay fotos en el carrusel.</p>
          </div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2D2D45' }}>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500, width: 120 }}>Vista Previa</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Título</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Link de Redirección</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500, width: 100 }}>Orden</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500, width: 100 }}>Estado</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500, width: 120 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {photos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #2D2D45' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <img 
                      src={getFullImageUrl(p.imageUrl)} 
                      alt={p.title || 'Carrusel'} 
                      style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 8, border: '1px solid #2D2D45' }} 
                    />
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{p.title || <span style={{ color: '#555' }}>—</span>}</td>
                  <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{p.linkUrl || <span style={{ color: '#555' }}>—</span>}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{p.sortOrder}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      backgroundColor: p.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                      color: p.isActive ? '#86EFAC' : '#FCA5A5', 
                      padding: '4px 10px', 
                      borderRadius: 20, 
                      fontSize: 13 
                    }}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleEditClick(p)} style={{ background: 'none', border: 'none', color: '#8F8FA3', cursor: 'pointer', padding: 8 }}>
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 8 }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: 500, padding: 32, borderRadius: 24, maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{editingPhoto ? 'Editar Foto' : 'Agregar Foto'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: '#8F8FA3', fontSize: 13, fontWeight: 600 }}>Cargar Imagen</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ color: '#B9B9C8', fontSize: 14 }} 
                />
                {uploading && <div style={{ color: '#A78BFA', fontSize: 12 }}>Subiendo imagen...</div>}
                
                <input 
                  className="input" 
                  placeholder="O ingresá URL absoluta de la imagen" 
                  value={formData.imageUrl} 
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} 
                  required 
                />
              </div>

              {formData.imageUrl && (
                <div>
                  <span style={{ color: '#8F8FA3', fontSize: 12, display: 'block', marginBottom: 4 }}>Vista previa:</span>
                  <img 
                    src={getFullImageUrl(formData.imageUrl)} 
                    alt="Vista previa" 
                    style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid #2D2D45' }} 
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: '#8F8FA3', fontSize: 13, fontWeight: 600 }}>Título (Opcional)</label>
                <input 
                  className="input" 
                  placeholder="Título para mostrar en el banner" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: '#8F8FA3', fontSize: 13, fontWeight: 600 }}>Link de redirección (Opcional)</label>
                <input 
                  className="input" 
                  placeholder="Ej: /eventos/evt-id-123" 
                  value={formData.linkUrl} 
                  onChange={e => setFormData({ ...formData, linkUrl: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ color: '#8F8FA3', fontSize: 13, fontWeight: 600 }}>Orden</label>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="0" 
                    value={formData.sortOrder} 
                    onChange={e => setFormData({ ...formData, sortOrder: e.target.value as any })} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={formData.isActive} 
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })} 
                  />
                  <label htmlFor="isActive" style={{ color: '#B9B9C8', fontSize: 14, cursor: 'pointer' }}>Activo</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid #2D2D45', background: 'transparent', color: '#FFF', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={uploading}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

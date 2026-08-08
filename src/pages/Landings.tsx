import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { apiClient } from '../apiClient';

const BLOCK_TYPES = ['hero', 'text', 'gallery', 'cta', 'countdown', 'video'] as const;
type BlockType = (typeof BLOCK_TYPES)[number];

// content/style se editan como JSON de texto en esta primera versión —
// cada tipo de bloque tiene una forma distinta y todavía no vale la pena
// un formulario con campos propios por tipo (eso es el siguiente paso,
// con vista previa en vivo). Ver la documentación de producto sobre el
// catálogo de bloques para las claves esperadas de cada `type`.
interface BlockFormState {
  id: string;
  type: BlockType;
  contentText: string;
  styleText: string;
}

const emptyLandingForm = {
  slug: '',
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  seoTitle: '',
  seoDescription: '',
};

function newBlockId() {
  return `blk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptyBlock(type: BlockType = 'text'): BlockFormState {
  return { id: newBlockId(), type, contentText: '{}', styleText: '{}' };
}

export function Landings() {
  const [landings, setLandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyLandingForm);
  const [blocks, setBlocks] = useState<BlockFormState[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/landings/admin');
      setLandings(data);
    } catch (e) {
      alert('Error al cargar landings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyLandingForm);
    setBlocks([]);
    setShowModal(true);
  };

  const openEditModal = (landing: any) => {
    setEditingId(landing.id);
    setFormData({
      slug: landing.slug,
      status: landing.status,
      seoTitle: landing.seoTitle || '',
      seoDescription: landing.seoDescription || '',
    });
    setBlocks(
      (landing.blocks ?? []).map((b: any) => ({
        id: b.id,
        type: b.type,
        contentText: JSON.stringify(b.content ?? {}, null, 2),
        styleText: JSON.stringify(b.style ?? {}, null, 2),
      })),
    );
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta landing? No se puede deshacer.')) return;
    try {
      await apiClient.fetch(`/landings/admin/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert('Error al eliminar landing');
    }
  };

  const addBlock = () => setBlocks(prev => [...prev, emptyBlock()]);
  const removeBlock = (id: string) => setBlocks(prev => prev.filter(b => b.id !== id));
  const moveBlock = (index: number, dir: -1 | 1) => {
    setBlocks(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const updateBlock = (id: string, patch: Partial<BlockFormState>) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let parsedBlocks: any[];
    try {
      parsedBlocks = blocks.map((b, i) => {
        try {
          return { id: b.id, type: b.type, content: JSON.parse(b.contentText || '{}'), style: JSON.parse(b.styleText || '{}') };
        } catch {
          throw new Error(`El bloque #${i + 1} (${b.type}) tiene JSON inválido en Contenido o Estilo.`);
        }
      });
    } catch (err: any) {
      alert(err.message);
      return;
    }

    const dto = {
      slug: formData.slug,
      status: formData.status,
      seoTitle: formData.seoTitle || undefined,
      seoDescription: formData.seoDescription || undefined,
      blocks: parsedBlocks,
    };

    setSaving(true);
    try {
      if (editingId) {
        await apiClient.patch(`/landings/admin/${editingId}`, dto);
      } else {
        await apiClient.post('/landings/admin', dto);
      }
      setShowModal(false);
      await load();
    } catch (e: any) {
      alert('Error al guardar landing: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Landings</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
        Páginas armadas por bloques — se publican solas, sin pedir un deploy. Se ven en invs-web en <code>/l/&lt;slug&gt;</code>.
      </p>

      <div style={{ marginBottom: 24 }}>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={20} /> Nueva landing
        </button>
      </div>

      {loading && <div style={{ color: 'var(--color-text-muted)' }}>Cargando landings...</div>}

      {!loading && landings.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40 }}>Todavía no hay landings creadas.</div>
      )}

      {!loading && landings.length > 0 && (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Slug</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Estado</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Bloques</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Actualizada</th>
                <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {landings.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{l.slug}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      backgroundColor: l.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(143,143,163,0.2)',
                      color: l.status === 'PUBLISHED' ? '#86EFAC' : 'var(--color-text-muted)',
                      padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                    }}>
                      {l.status === 'PUBLISHED' ? 'PUBLICADA' : 'BORRADOR'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{(l.blocks ?? []).length}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{new Date(l.updatedAt).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '16px 24px', display: 'flex', gap: 8 }}>
                    {l.status === 'PUBLISHED' && (
                      <a href={`https://invs-web.vercel.app/l/${l.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', padding: 8 }} title="Ver landing">
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <button onClick={() => openEditModal(l)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 8 }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 8 }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="glass" style={{ width: 640, maxHeight: '88vh', overflowY: 'auto', padding: 32, borderRadius: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>{editingId ? 'Editar landing' : 'Nueva landing'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                className="input"
                placeholder="Slug (ej: invs-live-session-7)"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                required
              />
              <select className="input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}>
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicada</option>
              </select>
              <input
                className="input"
                placeholder="Título SEO (opcional)"
                value={formData.seoTitle}
                onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Descripción SEO (opcional)"
                value={formData.seoDescription}
                onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                rows={2}
              />

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>Bloques ({blocks.length})</span>
                  <button type="button" onClick={addBlock} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={14} /> Agregar bloque
                  </button>
                </div>

                {blocks.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Esta landing todavía no tiene bloques.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {blocks.map((block, i) => (
                    <div key={block.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                        <select
                          className="input"
                          value={block.type}
                          onChange={e => updateBlock(block.id, { type: e.target.value as BlockType })}
                          style={{ flex: 1 }}
                        >
                          {BLOCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 6, opacity: i === 0 ? 0.3 : 1 }}>
                          <ChevronUp size={16} />
                        </button>
                        <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 6, opacity: i === blocks.length - 1 ? 0.3 : 1 }}>
                          <ChevronDown size={16} />
                        </button>
                        <button type="button" onClick={() => removeBlock(block.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 6 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <label style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>Contenido (JSON)</label>
                      <textarea
                        className="input"
                        value={block.contentText}
                        onChange={e => updateBlock(block.id, { contentText: e.target.value })}
                        rows={3}
                        style={{ fontFamily: 'monospace', fontSize: 12.5, marginBottom: 8 }}
                      />
                      <label style={{ color: 'var(--color-text-muted)', fontSize: 11, display: 'block', marginBottom: 4 }}>Estilo (JSON, opcional)</label>
                      <textarea
                        className="input"
                        value={block.styleText}
                        onChange={e => updateBlock(block.id, { styleText: e.target.value })}
                        rows={2}
                        style={{ fontFamily: 'monospace', fontSize: 12.5 }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} disabled={saving} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', color: '#FFF', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

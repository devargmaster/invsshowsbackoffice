import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { apiClient } from '../apiClient';
import { BLOCK_TYPES, BLOCK_FIELD_CONFIG, type LandingBlockType } from '../landings/blockFieldConfig';
import { BlockFieldsForm } from '../landings/BlockFieldsForm';
import { LandingPreview, type PreviewTheme } from '../landings/LandingPreview';

interface BlockState {
  id: string;
  type: LandingBlockType;
  content: Record<string, any>;
  style: Record<string, any>;
}

const emptyLandingForm = {
  slug: '',
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  seoTitle: '',
  seoDescription: '',
  customCss: '',
};

function newBlockId() {
  return `blk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptyBlock(type: LandingBlockType = 'text'): BlockState {
  return { id: newBlockId(), type, content: {}, style: {} };
}

export function Landings() {
  const [landings, setLandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyLandingForm);
  const [blocks, setBlocks] = useState<BlockState[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme | null>(null);

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

  // La paleta real de invs-web — para que la vista previa no use el tema
  // violeta propio del backoffice. Es un endpoint público, no hace falta
  // ningún permiso especial.
  useEffect(() => {
    apiClient.get<PreviewTheme>('/theme').then(setPreviewTheme).catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyLandingForm);
    setBlocks([]);
    setExpandedId(null);
    setShowModal(true);
  };

  const openEditModal = (landing: any) => {
    setEditingId(landing.id);
    setFormData({
      slug: landing.slug,
      status: landing.status,
      seoTitle: landing.seoTitle || '',
      seoDescription: landing.seoDescription || '',
      customCss: landing.customCss || '',
    });
    const loadedBlocks: BlockState[] = (landing.blocks ?? []).map((b: any) => ({
      id: b.id,
      type: b.type,
      content: b.content ?? {},
      style: b.style ?? {},
    }));
    setBlocks(loadedBlocks);
    setExpandedId(loadedBlocks[0]?.id ?? null);
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

  const addBlock = () => {
    const block = emptyBlock();
    setBlocks(prev => [...prev, block]);
    setExpandedId(block.id);
  };
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
  const setBlockType = (id: string, type: LandingBlockType) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { id: b.id, type, content: {}, style: {} } : b)));
  };
  const setBlockContent = (id: string, key: string, value: any) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, content: { ...b.content, [key]: value } } : b)));
  };
  const setBlockStyle = (id: string, key: string, value: any) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, style: { ...b.style, [key]: value } } : b)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const dto = {
      slug: formData.slug,
      status: formData.status,
      seoTitle: formData.seoTitle || undefined,
      seoDescription: formData.seoDescription || undefined,
      customCss: formData.customCss || undefined,
      blocks: blocks.map(({ id, type, content, style }) => ({ id, type, content, style })),
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
          <div className="glass" style={{ width: 1080, maxWidth: '96vw', maxHeight: '92vh', display: 'flex', borderRadius: 24, overflow: 'hidden' }}>

            {/* ── Columna editor ─────────────────────────────────────── */}
            <form onSubmit={handleSave} style={{ flex: '1.3 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', padding: 28, overflowY: 'auto' }}>
              <h2 style={{ marginTop: 0, marginBottom: 20 }}>{editingId ? 'Editar landing' : 'Nueva landing'}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
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
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>Bloques ({blocks.length})</span>
                  <button type="button" onClick={addBlock} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={14} /> Agregar bloque
                  </button>
                </div>

                {blocks.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Esta landing todavía no tiene bloques.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {blocks.map((block, i) => {
                    const config = BLOCK_FIELD_CONFIG[block.type];
                    const isOpen = expandedId === block.id;
                    return (
                      <div key={block.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedId(isOpen ? null : block.id)}
                          style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 10, cursor: 'pointer' }}
                        >
                          <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s', color: 'var(--color-text-muted)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{block.type}</span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {config.summarize(block.content)}
                          </span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(i, -1); }} disabled={i === 0} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, opacity: i === 0 ? 0.3 : 1 }}>
                            <ChevronUp size={15} />
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(i, 1); }} disabled={i === blocks.length - 1} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4, opacity: i === blocks.length - 1 ? 0.3 : 1 }}>
                            <ChevronDown size={15} />
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 4 }}>
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {isOpen && (
                          <div style={{ padding: '4px 14px 16px', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ marginTop: 12, marginBottom: 14 }}>
                              <label style={{ color: 'var(--color-text-muted)', fontSize: 12, display: 'block', marginBottom: 4 }}>Tipo de bloque</label>
                              <select className="input" value={block.type} onChange={(e) => setBlockType(block.id, e.target.value as LandingBlockType)}>
                                {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>

                            <p style={{ color: 'var(--color-text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 8px' }}>Contenido</p>
                            <BlockFieldsForm
                              fields={config.contentFields}
                              values={block.content}
                              onChange={(key, value) => setBlockContent(block.id, key, value)}
                            />

                            {config.styleFields.length > 0 && (
                              <>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '12px 0 8px' }}>Estilo</p>
                                <BlockFieldsForm
                                  fields={config.styleFields}
                                  values={block.style}
                                  onChange={(key, value) => setBlockStyle(block.id, key, value)}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginBottom: 8 }}>
                <label style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  CSS custom (opcional — escape hatch acotado a esta landing)
                </label>
                <textarea
                  className="input"
                  placeholder=".lp-hero__title { font-size: 3rem; }"
                  value={formData.customCss}
                  onChange={e => setFormData({ ...formData, customCss: e.target.value })}
                  rows={3}
                  style={{ fontFamily: 'monospace', fontSize: 12.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowModal(false)} disabled={saving} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid var(--color-border)', background: 'transparent', color: '#FFF', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>

            {/* ── Columna preview ────────────────────────────────────── */}
            <div style={{ flex: '1 1 0', minWidth: 0, borderLeft: '1px solid var(--color-border)', padding: 20, overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                Vista previa en vivo
              </p>
              <LandingPreview blocks={blocks} theme={previewTheme} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

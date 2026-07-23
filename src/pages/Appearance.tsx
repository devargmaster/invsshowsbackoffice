import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../apiClient';
import { applyTheme, cssVarFor, DEFAULT_THEME, THEME_CACHE_KEY, type ThemePalette } from '../theme/applyTheme';

const PALETTE_FIELDS: { key: keyof ThemePalette; label: string }[] = [
  { key: 'colorBg', label: 'Fondo' },
  { key: 'colorSurface', label: 'Superficie' },
  { key: 'colorBorder', label: 'Borde' },
  { key: 'colorAccent', label: 'Acento' },
  { key: 'colorAccentHover', label: 'Acento (hover)' },
  { key: 'colorText', label: 'Texto principal' },
  { key: 'colorTextSecondary', label: 'Texto secundario' },
  { key: 'colorTextMuted', label: 'Texto apagado' },
  { key: 'colorSuccess', label: 'Éxito' },
  { key: 'colorDanger', label: 'Peligro' },
];

export function Appearance() {
  const [formData, setFormData] = useState<ThemePalette | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef<ThemePalette | null>(null);

  useEffect(() => {
    load();
    // Si el admin navega a otra pantalla sin guardar, revertimos el preview
    // en vivo a la última paleta guardada — si no, queda "pegada".
    return () => {
      if (savedRef.current) applyTheme(savedRef.current);
    };
  }, []);

  const load = async () => {
    try {
      const data = await apiClient.get<ThemePalette>('/theme');
      savedRef.current = data;
      setFormData(data);
    } catch (e: any) {
      alert('Error al cargar la paleta: ' + (e.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key: keyof ThemePalette, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
    document.documentElement.style.setProperty(cssVarFor(key), value);
  };

  // Solo actualiza el preview en vivo y el form — no guarda solo. El admin
  // decide si confirma con "Guardar" o sigue ajustando desde acá.
  const handleResetToDefaults = () => {
    setFormData(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    try {
      const updated = await apiClient.patch<ThemePalette>('/admin/theme', formData);
      savedRef.current = updated;
      setFormData(updated);
      localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(updated));
      alert('Paleta guardada. invs-web la va a mostrar en la próxima carga de página.');
    } catch (e: any) {
      alert('Error al guardar: ' + (e.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Cargando paleta...</div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Apariencia</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Paleta de colores global de INVS — se aplica en vivo acá y en invs-web, sin necesitar un redeploy.
        </p>
      </div>

      <div className="glass" style={{ borderRadius: 16, padding: 32, maxWidth: 480 }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formData &&
            PALETTE_FIELDS.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>{label}</label>
                <input
                  type="color"
                  value={formData[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  style={{ width: 48, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }}
                />
              </div>
            ))}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={handleResetToDefaults}
              disabled={saving}
              style={{
                flex: 1, padding: '14px 24px', borderRadius: 12, border: '1px solid var(--color-border)',
                background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', fontSize: 15, fontWeight: 600,
              }}
            >
              Restablecer defaults
            </button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

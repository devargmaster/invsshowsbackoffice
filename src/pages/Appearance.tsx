import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../apiClient';
import {
  applyTheme,
  cssVarFor,
  DEFAULT_THEME,
  THEME_CACHE_KEY,
  THEME_MODULES,
  type ThemeModuleKey,
  type ThemeModuleOverride,
  type ThemePalette,
} from '../theme/applyTheme';

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

const EMPTY_OVERRIDE: ThemeModuleOverride = {
  colorBg: null,
  colorSurface: null,
  colorBorder: null,
  colorAccent: null,
  colorAccentHover: null,
  colorText: null,
  colorTextSecondary: null,
  colorTextMuted: null,
  colorSuccess: null,
  colorDanger: null,
};

export function Appearance() {
  const [tab, setTab] = useState<'GLOBAL' | ThemeModuleKey>('GLOBAL');

  const [formData, setFormData] = useState<ThemePalette | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef<ThemePalette | null>(null);

  const [moduleOverrides, setModuleOverrides] = useState<Record<ThemeModuleKey, ThemeModuleOverride> | null>(null);
  const [savingModule, setSavingModule] = useState(false);

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
      const [global, modules] = await Promise.all([
        apiClient.get<ThemePalette>('/theme'),
        apiClient.get<Record<ThemeModuleKey, ThemeModuleOverride>>('/admin/theme/modules'),
      ]);
      savedRef.current = global;
      setFormData(global);
      setModuleOverrides(modules);
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

  const handleModuleToggle = (moduleKey: ThemeModuleKey, colorKey: keyof ThemePalette, enabled: boolean) => {
    setModuleOverrides((prev) => {
      const current = prev ?? ({} as Record<ThemeModuleKey, ThemeModuleOverride>);
      const currentOverride = current[moduleKey] ?? EMPTY_OVERRIDE;
      return {
        ...current,
        [moduleKey]: {
          ...currentOverride,
          // Al prender el toggle sin valor previo, arranca del color
          // global efectivo — así el picker nunca abre vacío.
          [colorKey]: enabled ? currentOverride[colorKey] ?? formData?.[colorKey] ?? DEFAULT_THEME[colorKey] : null,
        },
      };
    });
  };

  const handleModuleColorChange = (moduleKey: ThemeModuleKey, colorKey: keyof ThemePalette, value: string) => {
    setModuleOverrides((prev) => {
      const current = prev ?? ({} as Record<ThemeModuleKey, ThemeModuleOverride>);
      const currentOverride = current[moduleKey] ?? EMPTY_OVERRIDE;
      return { ...current, [moduleKey]: { ...currentOverride, [colorKey]: value } };
    });
  };

  const handleSaveModule = async (moduleKey: ThemeModuleKey) => {
    if (!moduleOverrides) return;
    setSavingModule(true);
    try {
      const updated = await apiClient.patch<ThemeModuleOverride>(
        `/admin/theme/modules/${moduleKey}`,
        moduleOverrides[moduleKey] ?? EMPTY_OVERRIDE,
      );
      setModuleOverrides((prev) => (prev ? { ...prev, [moduleKey]: updated } : prev));
      alert(`Paleta de "${THEME_MODULES.find((m) => m.key === moduleKey)?.label}" guardada.`);
    } catch (e: any) {
      alert('Error al guardar: ' + (e.message || 'Error desconocido'));
    } finally {
      setSavingModule(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Cargando paleta...</div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Apariencia</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Paleta de colores de INVS — se aplica en vivo en invs-web, sin necesitar un redeploy.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
        {[{ key: 'GLOBAL' as const, label: 'Global' }, ...THEME_MODULES].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: tab === key ? '2px solid var(--color-accent)' : '2px solid transparent',
              background: 'none',
              color: tab === key ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'GLOBAL' && formData && (
        <div className="glass" style={{ borderRadius: 16, padding: 32, maxWidth: 480 }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PALETTE_FIELDS.map(({ key, label }) => (
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
      )}

      {tab !== 'GLOBAL' && formData && moduleOverrides && (
        <div className="glass" style={{ borderRadius: 16, padding: 32, maxWidth: 480 }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
            Activá solo los colores que querés personalizar para este módulo de invs-web. Los que quedan apagados
            heredan la paleta global.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PALETTE_FIELDS.map(({ key, label }) => {
              const override = moduleOverrides[tab] ?? EMPTY_OVERRIDE;
              const enabled = override[key] != null;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => handleModuleToggle(tab, key, e.target.checked)}
                    />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>{label}</span>
                  </label>
                  {enabled ? (
                    <input
                      type="color"
                      value={override[key] as string}
                      onChange={(e) => handleModuleColorChange(tab, key, e.target.value)}
                      style={{ width: 48, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }}
                    />
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Hereda global</span>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="btn-primary"
              disabled={savingModule}
              onClick={() => handleSaveModule(tab)}
              style={{ marginTop: 8 }}
            >
              {savingModule ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface ThemePalette {
  colorBg: string;
  colorSurface: string;
  colorBorder: string;
  colorAccent: string;
  colorAccentHover: string;
  colorText: string;
  colorTextSecondary: string;
  colorTextMuted: string;
  colorSuccess: string;
  colorDanger: string;
}

export const THEME_CACHE_KEY = 'invs_theme_cache';

// Mismos valores que DEFAULT_THEME en invs-backend/src/theme/theme.service.ts
// — para el botón "Restablecer" de /appearance, así el admin puede volver
// atrás si experimenta y no se acuerda cuáles eran los colores originales.
export const DEFAULT_THEME: ThemePalette = {
  colorBg: '#0B0C0E',
  colorSurface: '#15171A',
  colorBorder: '#30343A',
  colorAccent: '#D9F5F8',
  colorAccentHover: '#F4FEFF',
  colorText: '#F4F4F2',
  colorTextSecondary: '#B8BBC0',
  colorTextMuted: '#7C8188',
  colorSuccess: '#3DCC8C',
  colorDanger: '#FF626A',
};

// Módulos de invs-web que admiten override parcial de paleta — el
// backoffice en sí no se subdivide, se queda con un único tema (ver
// ThemeModuleOverride en invs-backend).
export type ThemeModuleKey = 'EVENTS' | 'STREAMING';

export const THEME_MODULES: { key: ThemeModuleKey; label: string }[] = [
  { key: 'EVENTS', label: 'Eventos' },
  { key: 'STREAMING', label: 'Streaming' },
];

// Override crudo de un módulo: cada color es hex (personalizado) o null
// (hereda el valor global). Refleja 1:1 lo que expone el backend.
export type ThemeModuleOverride = Record<keyof ThemePalette, string | null>;

const CSS_VAR_BY_KEY: Record<keyof ThemePalette, string> = {
  colorBg: '--color-bg',
  colorSurface: '--color-surface',
  colorBorder: '--color-border',
  colorAccent: '--color-accent',
  colorAccentHover: '--color-accent-hover',
  colorText: '--color-text',
  colorTextSecondary: '--color-text-secondary',
  colorTextMuted: '--color-text-muted',
  colorSuccess: '--color-success',
  colorDanger: '--color-danger',
};

export function applyTheme(palette: ThemePalette) {
  const root = document.documentElement.style;
  for (const key of Object.keys(CSS_VAR_BY_KEY) as (keyof ThemePalette)[]) {
    root.setProperty(CSS_VAR_BY_KEY[key], palette[key]);
  }
}

export function cssVarFor(key: keyof ThemePalette): string {
  return CSS_VAR_BY_KEY[key];
}

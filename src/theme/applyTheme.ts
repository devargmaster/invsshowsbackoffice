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
  colorBg: '#0B0B12',
  colorSurface: '#13131F',
  colorBorder: '#1E1E33',
  colorAccent: '#A78BFA',
  colorAccentHover: '#8B5CF6',
  colorText: '#F0F0F5',
  colorTextSecondary: '#C4C4D4',
  colorTextMuted: '#8F8FA3',
  colorSuccess: '#22C55E',
  colorDanger: '#EF4444',
};

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

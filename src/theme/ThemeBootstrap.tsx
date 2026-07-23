import { useEffect } from 'react';
import { apiClient } from '../apiClient';
import { applyTheme, THEME_CACHE_KEY, type ThemePalette } from './applyTheme';

// Se monta una sola vez por encima de <Routes>, para que el tema alcance
// también a /login (fuera de <AdminLayout>). No renderiza nada.
export function ThemeBootstrap() {
  useEffect(() => {
    apiClient
      .get<ThemePalette>('/theme')
      .then((palette) => {
        applyTheme(palette);
        localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(palette));
      })
      .catch(() => {
        // Sin conexión o error puntual: se queda con el default/cache ya aplicado.
      });
  }, []);

  return null;
}

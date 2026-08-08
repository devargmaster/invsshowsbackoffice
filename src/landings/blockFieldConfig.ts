// Config de campos por tipo de bloque — la fuente de verdad de qué inputs
// mostrar en el editor. Tiene que reflejar exactamente las claves que leen
// los componentes de invs-web (HeroBlock, TextBlock, etc.) en
// src/components/landing-blocks/*.tsx — si se agrega un campo nuevo ahí,
// agregarlo acá también, si no el admin no tiene forma de cargarlo.

export type FieldType = 'text' | 'textarea' | 'url' | 'boolean' | 'color' | 'select' | 'datetime' | 'imagelist';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export type LandingBlockType = 'hero' | 'text' | 'gallery' | 'cta' | 'countdown' | 'video';

export const BLOCK_TYPES: { value: LandingBlockType; label: string }[] = [
  { value: 'hero', label: 'Hero' },
  { value: 'text', label: 'Texto' },
  { value: 'gallery', label: 'Galería' },
  { value: 'cta', label: 'CTA' },
  { value: 'countdown', label: 'Countdown' },
  { value: 'video', label: 'Video / streaming' },
];

interface BlockTypeConfig {
  contentFields: FieldConfig[];
  styleFields: FieldConfig[];
  // Resume el bloque en su fila colapsada (ej: 'Texto — "Sobre el show"')
  summarize: (content: Record<string, any>) => string;
}

export const BLOCK_FIELD_CONFIG: Record<LandingBlockType, BlockTypeConfig> = {
  hero: {
    contentFields: [
      { key: 'eyebrow', label: 'Eyebrow (texto chico arriba del título)', type: 'text', placeholder: 'INVS LIVE SESSION #7' },
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Una noche de jazz en Estudios Panda' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Presencial y streaming en vivo' },
      { key: 'ctaLabel', label: 'Texto del botón', type: 'text', placeholder: 'Conseguir entradas' },
      { key: 'ctaHref', label: 'Link del botón', type: 'url', placeholder: '/eventos/mi-evento' },
    ],
    styleFields: [
      { key: 'backgroundImage', label: 'Imagen de fondo', type: 'url', placeholder: 'https://...' },
      { key: 'overlay', label: 'Overlay sobre la imagen', type: 'color', placeholder: 'rgba(0,0,0,0.55)' },
      { key: 'fullBleed', label: 'Ancho completo (full-bleed)', type: 'boolean' },
      { key: 'textAlign', label: 'Alineación del texto', type: 'select', options: [{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }] },
      { key: 'textColor', label: 'Color del texto', type: 'color', placeholder: '#FFFFFF' },
    ],
    summarize: (c) => c.title || 'Sin título',
  },
  text: {
    contentFields: [
      { key: 'heading', label: 'Título', type: 'text', placeholder: 'Sobre el show' },
      { key: 'body', label: 'Texto', type: 'textarea', placeholder: 'Fernando Samalea y su trío...' },
    ],
    styleFields: [
      { key: 'textAlign', label: 'Alineación', type: 'select', options: [{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }] },
      { key: 'maxWidth', label: 'Ancho máximo (ej: 640px)', type: 'text', placeholder: '640px' },
    ],
    summarize: (c) => c.heading || (c.body ? String(c.body).slice(0, 40) + '…' : 'Sin texto'),
  },
  gallery: {
    contentFields: [
      { key: 'images', label: 'Imágenes (una URL por línea)', type: 'imagelist' },
    ],
    styleFields: [
      { key: 'layout', label: 'Disposición', type: 'select', options: [{ value: '', label: 'Collage (por defecto)' }, { value: 'grid', label: 'Grilla pareja' }] },
    ],
    summarize: (c) => `${(c.images ?? []).length} foto(s)`,
  },
  cta: {
    contentFields: [
      { key: 'label', label: 'Texto del botón', type: 'text', placeholder: 'Comprar entrada' },
      { key: 'href', label: 'Link', type: 'url', placeholder: '/eventos/mi-evento' },
    ],
    styleFields: [
      { key: 'variant', label: 'Estilo', type: 'select', options: [{ value: 'primary', label: 'Principal (celeste)' }, { value: 'secondary', label: 'Secundario (contorno)' }] },
      { key: 'align', label: 'Alineación', type: 'select', options: [{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }] },
    ],
    summarize: (c) => c.label || 'Sin texto',
  },
  countdown: {
    contentFields: [
      { key: 'targetDate', label: 'Fecha objetivo', type: 'datetime' },
      { key: 'label', label: 'Etiqueta', type: 'text', placeholder: 'Empieza en' },
    ],
    styleFields: [
      { key: 'align', label: 'Alineación', type: 'select', options: [{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }] },
    ],
    summarize: (c) => (c.targetDate ? new Date(c.targetDate).toLocaleString('es-AR') : 'Sin fecha'),
  },
  video: {
    contentFields: [
      { key: 'playbackUrl', label: 'URL de reproducción', type: 'url', placeholder: 'https://...' },
      {
        key: 'providerType', label: 'Proveedor', type: 'select',
        options: [{ value: 'mux', label: 'Mux' }, { value: 'youtube', label: 'YouTube' }, { value: 'twitch', label: 'Twitch' }, { value: 'vimeo', label: 'Vimeo' }],
      },
      { key: 'title', label: 'Título (opcional)', type: 'text' },
    ],
    styleFields: [],
    summarize: (c) => c.providerType ? `Proveedor: ${c.providerType}` : 'Sin proveedor',
  },
};

import type { CSSProperties } from 'react';
import type { LandingBlockType } from './blockFieldConfig';
import './LandingPreview.css';

export interface PreviewTheme {
  colorBg: string;
  colorSurface: string;
  colorBorder: string;
  colorAccent: string;
  colorAccentHover: string;
  colorText: string;
  colorTextSecondary: string;
  colorTextMuted: string;
}

interface PreviewBlock {
  id: string;
  type: LandingBlockType;
  content: Record<string, any>;
  style?: Record<string, any>;
}

interface LandingPreviewProps {
  blocks: PreviewBlock[];
  theme: PreviewTheme | null;
}

function themeToCssVars(theme: PreviewTheme): CSSProperties {
  return {
    ['--color-bg' as any]: theme.colorBg,
    ['--color-surface' as any]: theme.colorSurface,
    ['--color-border' as any]: theme.colorBorder,
    ['--color-accent' as any]: theme.colorAccent,
    ['--color-accent-hover' as any]: theme.colorAccentHover,
    ['--color-text' as any]: theme.colorText,
    ['--color-text-secondary' as any]: theme.colorTextSecondary,
    ['--color-text-muted' as any]: theme.colorTextMuted,
    // Mismo orden que --gradient-primary en invs-web/src/index.css: claro
    // primero, acento saturado después.
    ['--p-gradient-primary' as any]: `linear-gradient(135deg, ${theme.colorAccentHover} 0%, ${theme.colorAccent} 100%)`,
    ['--p-font-family' as any]: "Inter, -apple-system, sans-serif",
  };
}

function getRemaining(targetDate: string) {
  const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
}

function PreviewBlockView({ block }: { block: PreviewBlock }) {
  const { content, style = {} } = block;

  switch (block.type) {
    case 'hero': {
      const { eyebrow, title, subtitle, ctaLabel, ctaHref } = content;
      const { backgroundImage, overlay, textAlign, textColor } = style;
      return (
        <div
          className="lp-hero"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
            textAlign: textAlign === 'center' ? 'center' : 'left',
          }}
        >
          {backgroundImage && <div className="lp-hero__overlay" style={{ background: overlay || 'rgba(0,0,0,0.4)' }} />}
          <div className="lp-hero__inner" style={{ color: textColor, margin: textAlign === 'center' ? '0 auto' : undefined }}>
            {eyebrow && <p className="lp-hero__eyebrow">{eyebrow}</p>}
            <h1 className="lp-hero__title">{title || 'Título del hero'}</h1>
            {subtitle && <p className="lp-hero__subtitle">{subtitle}</p>}
            {ctaLabel && ctaHref && <span className="lp-hero__cta">{ctaLabel}</span>}
          </div>
        </div>
      );
    }

    case 'text':
      return (
        <div className="lp-text" style={{ textAlign: style.textAlign, maxWidth: style.maxWidth }}>
          {content.heading && <h2 className="lp-text__heading">{content.heading}</h2>}
          <p className="lp-text__body">{content.body || 'Texto del bloque...'}</p>
        </div>
      );

    case 'gallery': {
      const images: string[] = content.images ?? [];
      if (images.length === 0) return <div className="lp-gallery__empty">Sin fotos todavía</div>;
      return (
        <div className={`lp-gallery ${style.layout === 'grid' ? 'lp-gallery--grid' : ''}`}>
          {images.slice(0, 3).map((src, i) => <img key={i} src={src} alt="" className="lp-gallery__img" />)}
        </div>
      );
    }

    case 'cta':
      if (!content.label) return null;
      return (
        <div className="lp-cta" style={{ textAlign: style.align || 'center' }}>
          <span className={`lp-cta__btn lp-cta__btn--${style.variant || 'primary'}`}>{content.label}</span>
        </div>
      );

    case 'countdown': {
      if (!content.targetDate) return null;
      const r = getRemaining(content.targetDate);
      return (
        <div className="lp-countdown" style={{ justifyContent: style.align === 'left' ? 'flex-start' : style.align === 'right' ? 'flex-end' : 'center' }}>
          {content.label && <span className="lp-countdown__label">{content.label}</span>}
          <div><div className="lp-countdown__num">{r.days}</div><div className="lp-countdown__unitlabel">DÍAS</div></div>
          <div><div className="lp-countdown__num">{r.hours}</div><div className="lp-countdown__unitlabel">HS</div></div>
          <div><div className="lp-countdown__num">{r.minutes}</div><div className="lp-countdown__unitlabel">MIN</div></div>
        </div>
      );
    }

    case 'video':
      return (
        <div className="lp-video">
          <span>▶</span>
          <span>{content.providerType ? `Video (${content.providerType})` : 'Video sin proveedor'}</span>
        </div>
      );

    default:
      return null;
  }
}

export function LandingPreview({ blocks, theme }: LandingPreviewProps) {
  if (!theme) {
    return <div className="landing-preview__empty">Cargando paleta real de invs-web...</div>;
  }

  return (
    <div className="landing-preview" style={themeToCssVars(theme)}>
      {blocks.length === 0 ? (
        <div className="landing-preview__empty">Agregá un bloque para ver la vista previa acá.</div>
      ) : (
        <div className="landing-preview__blocks">
          {blocks.map((block) => <PreviewBlockView key={block.id} block={block} />)}
        </div>
      )}
    </div>
  );
}

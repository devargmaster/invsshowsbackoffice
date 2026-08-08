import type { CSSProperties } from 'react';
import type { FieldConfig } from './blockFieldConfig';

interface BlockFieldsFormProps {
  fields: FieldConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const labelStyle: CSSProperties = { color: 'var(--color-text-muted)', fontSize: 12, display: 'block', marginBottom: 4 };
const rowStyle: CSSProperties = { marginBottom: 10 };

function toDatetimeLocal(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

export function BlockFieldsForm({ fields, values, onChange }: BlockFieldsFormProps) {
  if (fields.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>Este bloque no tiene más opciones.</p>;
  }

  return (
    <>
      {fields.map((field) => {
        const value = values[field.key];

        if (field.type === 'boolean') {
          return (
            <label key={field.key} style={{ ...rowStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!value} onChange={(e) => onChange(field.key, e.target.checked)} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{field.label}</span>
            </label>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.key} style={rowStyle}>
              <label style={labelStyle}>{field.label}</label>
              <select className="input" value={value ?? ''} onChange={(e) => onChange(field.key, e.target.value || undefined)}>
                <option value="">—</option>
                {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          );
        }

        if (field.type === 'textarea') {
          return (
            <div key={field.key} style={rowStyle}>
              <label style={labelStyle}>{field.label}</label>
              <textarea
                className="input"
                rows={3}
                placeholder={field.placeholder}
                value={value ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </div>
          );
        }

        if (field.type === 'imagelist') {
          const text = Array.isArray(value) ? value.join('\n') : '';
          return (
            <div key={field.key} style={rowStyle}>
              <label style={labelStyle}>{field.label}</label>
              <textarea
                className="input"
                rows={3}
                placeholder={'https://...\nhttps://...'}
                value={text}
                onChange={(e) => onChange(field.key, e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))}
              />
            </div>
          );
        }

        if (field.type === 'datetime') {
          return (
            <div key={field.key} style={rowStyle}>
              <label style={labelStyle}>{field.label}</label>
              <input
                className="input"
                type="datetime-local"
                value={toDatetimeLocal(value)}
                onChange={(e) => onChange(field.key, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              />
            </div>
          );
        }

        if (field.type === 'color') {
          return (
            <div key={field.key} style={rowStyle}>
              <label style={labelStyle}>{field.label}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="input"
                  type="text"
                  placeholder={field.placeholder}
                  value={value ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--color-border)', background: value || 'transparent', flexShrink: 0 }} />
              </div>
            </div>
          );
        }

        // text | url
        return (
          <div key={field.key} style={rowStyle}>
            <label style={labelStyle}>{field.label}</label>
            <input
              className="input"
              type="text"
              placeholder={field.placeholder}
              value={value ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          </div>
        );
      })}
    </>
  );
}

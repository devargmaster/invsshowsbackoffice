import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';

export function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null); // null = todavía no se sabe

  useEffect(() => {
    const checkStatus = () => {
      apiClient.get<any[]>('/events')
        .then((data) => {
          setEvents(data);
          setApiOnline(true);
        })
        .catch((err) => {
          console.error(err);
          setApiOnline(false);
        });
    };
    checkStatus();
    // "Resumen del sistema en tiempo real" — sin esto, el estado quedaba
    // pegado en lo que haya dado la carga inicial de la página.
    const interval = setInterval(checkStatus, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Bienvenido al Backoffice</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>Resumen del sistema en tiempo real.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
        <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8 }}>Total Eventos</div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{events.length}</div>
        </div>
        
        <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8 }}>Estado de API</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600,
            color: apiOnline === null ? 'var(--color-text-muted)' : apiOnline ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: apiOnline === null ? 'var(--color-text-muted)' : apiOnline ? 'var(--color-success)' : 'var(--color-danger)',
            }} />
            {apiOnline === null ? 'Verificando...' : apiOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: 40, marginBottom: 20, fontSize: 20 }}>Eventos Recientes</h2>
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Título</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Fecha</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Modalidad</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{ev.title}</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{new Date(ev.date).toLocaleDateString()}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ backgroundColor: 'var(--color-surface)', padding: '4px 10px', borderRadius: 20, fontSize: 13, color: 'var(--color-accent)' }}>
                    {ev.mode}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                   <span style={{ color: ev.status === 'PUBLISHED' ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{ev.status}</span>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando datos...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

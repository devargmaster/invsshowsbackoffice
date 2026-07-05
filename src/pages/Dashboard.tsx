import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';

export function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get<any[]>('/events')
      .then(setEvents)
      .catch(console.error);
  }, []);

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Bienvenido al Backoffice</h1>
      <p style={{ color: '#8F8FA3', marginBottom: 32 }}>Resumen del sistema en tiempo real.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
        <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ color: '#8F8FA3', fontSize: 14, marginBottom: 8 }}>Total Eventos</div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{events.length}</div>
        </div>
        
        <div className="glass" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ color: '#8F8FA3', fontSize: 14, marginBottom: 8 }}>Estado de API</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600, color: '#22C55E' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22C55E' }} /> Online
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: 40, marginBottom: 20, fontSize: 20 }}>Eventos Recientes</h2>
      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2D2D45' }}>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Título</th>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Fecha</th>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Modalidad</th>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id} style={{ borderBottom: '1px solid #2D2D45' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{ev.title}</td>
                <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{new Date(ev.date).toLocaleDateString()}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ backgroundColor: '#181827', padding: '4px 10px', borderRadius: 20, fontSize: 13, color: '#A78BFA' }}>
                    {ev.mode}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                   <span style={{ color: ev.status === 'PUBLISHED' ? '#22C55E' : '#8F8FA3' }}>{ev.status}</span>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#8F8FA3' }}>Cargando datos...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

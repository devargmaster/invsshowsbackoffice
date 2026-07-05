import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiClient } from '../apiClient';

export function Tickets() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    apiClient.get<any[]>('/events')
      .then(setEvents)
      .catch(console.error);
  }, []);

  const handleSearch = async (showLoader = true) => {
    if (!selectedEventId) return;
    if (showLoader) setLoading(true);
    try {
      const data = await apiClient.get<any[]>(`/tickets/event/${selectedEventId}`);
      setTickets(data);
      setSelectedTicket(prev => {
        if (!prev) return null;
        return data.find(t => t.id === prev.id) || prev;
      });
    } catch (e) {
      if (showLoader) alert('Error al buscar entradas');
      setTickets([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedEventId) return;

    // Initial fetch
    handleSearch(true);

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      handleSearch(false); // background refresh without loader
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedEventId]);

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Gestión de Entradas</h1>
      <p style={{ color: '#8F8FA3', marginBottom: 32 }}>Buscá un evento para ver las entradas vendidas.</p>

      <div className="glass" style={{ padding: 24, borderRadius: 16, display: 'flex', gap: 16, marginBottom: 32 }}>
        <select
          className="input"
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">Seleccioná un evento...</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={() => handleSearch(true)} disabled={!selectedEventId || loading}>
          <Search size={20} /> Actualizar
        </button>
      </div>

      {loading && <div style={{ color: '#8F8FA3' }}>Cargando entradas...</div>}

      {!loading && tickets.length > 0 && (
        <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2D2D45' }}>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>ID Ticket</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Asistente</th>
                <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr
                  key={t.id}
                  style={{ borderBottom: '1px solid #2D2D45', cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={() => setSelectedTicket(t)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px 24px', color: '#B9B9C8', fontSize: 13 }}>{t.id}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{t.user?.fullName || t.user?.email || t.userId}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      backgroundColor: t.used ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                      color: t.used ? '#FCA5A5' : '#86EFAC',
                      padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700
                    }}>
                      {t.used ? 'UTILIZADO' : 'VÁLIDO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && selectedEventId && tickets.length === 0 && (
        <div style={{ color: '#8F8FA3', textAlign: 'center', marginTop: 40 }}>
          No se encontraron entradas para este evento.
        </div>
      )}

      {selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ width: 450, padding: 32, borderRadius: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>Detalle del Asistente</h2>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>ID Usuario</div>
              <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#A78BFA' }}>{selectedTicket.userId}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{selectedTicket.user?.email || 'N/A'}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>Nombre Completo</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{selectedTicket.user?.fullName || 'N/A'}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#8F8FA3', fontSize: 13, marginBottom: 4 }}>Estado del Ticket</div>
              {selectedTicket.used ? (
                <div style={{ color: '#FCA5A5', fontWeight: 600 }}>UTILIZADO el {new Date(selectedTicket.usedAt).toLocaleString()}</div>
              ) : (
                <div style={{ color: '#86EFAC', fontWeight: 600 }}>VÁLIDO (Sin usar)</div>
              )}
            </div>

            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setSelectedTicket(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

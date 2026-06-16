import React, { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await apiClient.get<any[]>('/users');
      setUsers(data);
    } catch (e: any) {
      console.error(e);
      alert('Error al cargar usuarios: ' + (e.message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await apiClient.patch(`/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (e) {
      alert('Error al cambiar rol');
    }
  };

  if (loading) return <div style={{ color: '#8F8FA3' }}>Cargando usuarios...</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Gestión de Usuarios</h1>
      <p style={{ color: '#8F8FA3', marginBottom: 32 }}>Administrá los permisos de los usuarios del sistema.</p>

      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2D2D45' }}>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Nombre</th>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Email</th>
              <th style={{ padding: '16px 24px', color: '#8F8FA3', fontWeight: 500 }}>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #2D2D45' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{u.fullName || '—'}</td>
                <td style={{ padding: '16px 24px', color: '#B9B9C8' }}>{u.email}</td>
                <td style={{ padding: '16px 24px' }}>
                  <select 
                    value={u.role} 
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{ backgroundColor: '#181827', color: '#A78BFA', padding: '6px 12px', borderRadius: 8, border: '1px solid #2D2D45', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="USER">USER</option>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

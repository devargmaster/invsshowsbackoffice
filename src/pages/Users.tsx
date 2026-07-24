import { useEffect, useState } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import { apiClient } from '../apiClient';

// Decodificado nada más para UX (ocultar "eliminar" en la propia fila) —
// la autorización real la hace el backend, esto no es una verificación
// de seguridad.
function currentUserId(): string | null {
  try {
    const token = localStorage.getItem('invs_admin_token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).sub ?? null;
  } catch {
    return null;
  }
}

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const myId = currentUserId();

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

  // Solo para ADMIN/STAFF — la comunidad se resetea su propia contraseña
  // por mail (el backend ya lo rechaza igual, esto es nada más UX).
  const handleResetPassword = async (u: any) => {
    if (!window.confirm(`¿Resetear la contraseña de ${u.email}? Se genera una nueva al azar.`)) return;
    try {
      const { newPassword } = await apiClient.post<{ email: string; newPassword: string }>(`/users/${u.id}/reset-password`, {});
      alert(`Nueva contraseña para ${u.email}:\n\n${newPassword}\n\nCopiala ahora — no se vuelve a mostrar.`);
    } catch (e: any) {
      alert('Error al resetear contraseña: ' + (e.message || ''));
    }
  };

  const handleDelete = async (u: any) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${u.email}? No se puede deshacer.`)) return;
    try {
      await apiClient.fetch(`/users/${u.id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (e: any) {
      alert('Error al eliminar: ' + (e.message || ''));
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Cargando usuarios...</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Gestión de Usuarios</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>Administrá los permisos de los usuarios del sistema.</p>

      <div className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Nombre</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Email</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Rol</th>
              <th style={{ padding: '16px 24px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{u.fullName || '—'}</td>
                <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                <td style={{ padding: '16px 24px' }}>
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-accent)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="USER">USER</option>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {u.role !== 'USER' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleResetPassword(u)}
                        title="Resetear contraseña"
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 8 }}
                      >
                        <KeyRound size={18} />
                      </button>
                      {u.id !== myId && (
                        <button
                          onClick={() => handleDelete(u)}
                          title="Eliminar cuenta"
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 8 }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Calendar, Ticket, Users, Activity, CreditCard, Tags, Shirt, Video, Wallet, KeyRound, Palette } from 'lucide-react';
import { apiClient } from '../apiClient';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    if (!localStorage.getItem('invs_admin_token')) {
      navigate('/');
      return;
    }
    apiClient
      .get<{ role: string }>('/users/me')
      .then((me) => setRole(me.role))
      .catch(() => {
        /* apiClient ya maneja el 401 (logout + redirect) */
      });
  }, [navigate]);

  // Pantallas admin-only: si un STAFF navega directo por URL, lo mandamos al dashboard.
  useEffect(() => {
    if (role && !isAdmin && (location.pathname === '/payment-settings' || location.pathname === '/appearance')) {
      navigate('/dashboard');
    }
  }, [role, isAdmin, location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('invs_admin_token');
    navigate('/');
  };

  const navItemStyle = (path: string) => {
    const isActive = location.pathname === path;
    return {
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      borderRadius: 12, textDecoration: 'none',
      backgroundColor: isActive ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
      color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
      fontWeight: isActive ? 600 : 400,
      transition: 'all 0.2s'
    };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      <aside className="glass" style={{ width: 260, borderLeft: 'none', borderTop: 'none', borderBottom: 'none', borderRadius: 0, padding: 24, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: 2, marginBottom: 40 }}>INVS</h2>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/dashboard" style={navItemStyle('/dashboard')}><Activity size={20} /> Dashboard</Link>
          <Link to="/events" style={navItemStyle('/events')}><Calendar size={20} /> Eventos</Link>
          <Link to="/categories" style={navItemStyle('/categories')}><Tags size={20} /> Categorías</Link>
          <Link to="/addons" style={navItemStyle('/addons')}><Shirt size={20} /> Adicionales</Link>
          <Link to="/content" style={navItemStyle('/content')}><Video size={20} /> Contenido</Link>
          <Link to="/orders" style={navItemStyle('/orders')}><CreditCard size={20} /> Pagos</Link>
          <Link to="/content-purchases" style={navItemStyle('/content-purchases')}><Wallet size={20} /> Compras de Contenido</Link>
          <Link to="/tickets" style={navItemStyle('/tickets')}><Ticket size={20} /> Entradas</Link>
          <Link to="/users" style={navItemStyle('/users')}><Users size={20} /> Usuarios</Link>
          {isAdmin && (
            <Link to="/payment-settings" style={navItemStyle('/payment-settings')}><KeyRound size={20} /> Mercado Pago</Link>
          )}
          {isAdmin && (
            <Link to="/appearance" style={navItemStyle('/appearance')}><Palette size={20} /> Apariencia</Link>
          )}
        </nav>

        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', fontWeight: 600 }}>
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </aside>

      <main style={{ flex: 1, padding: 40, overflowY: 'auto', boxSizing: 'border-box' }}>
        <Outlet />
      </main>
    </div>
  );
}

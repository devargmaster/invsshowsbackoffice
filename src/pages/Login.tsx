import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../apiClient';

export function Login() {
  const [email, setEmail] = useState('admin@invs.app');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await apiClient.post<any>('/auth/login', { email, password });
      console.log('Login Response:', res);
      const token = res.accessToken || res.access_token; // Just in case!
      localStorage.setItem('invs_admin_token', token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 400, padding: 40, borderRadius: 24 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: 2, textAlign: 'center' }}>INVS</h1>
        <p style={{ color: '#8F8FA3', textAlign: 'center', marginBottom: 32 }}>Backoffice Access</p>
        
        {error && <div style={{ backgroundColor: '#3D1515', color: '#FCA5A5', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Ingresando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  );
}

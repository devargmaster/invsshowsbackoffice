import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { apiClient } from '../apiClient';

interface PaymentSettingsPublic {
  configured: boolean;
  environment: 'sandbox' | 'production' | null;
  publicKey: string | null;
  lastFour: string | null;
  webhookConfigured: boolean;
}

const emptyForm = {
  environment: 'sandbox' as 'sandbox' | 'production',
  accessToken: '',
  publicKey: '',
  webhookSecret: '',
};

export function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettingsPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiClient.get<PaymentSettingsPublic>('/admin/payment-settings/mercadopago');
      setSettings(data);
      setFormData((prev) => ({
        ...prev,
        environment: data.environment ?? 'sandbox',
        publicKey: data.publicKey ?? '',
      }));
    } catch (e: any) {
      alert('Error al cargar la configuración de Mercado Pago: ' + (e.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        environment: formData.environment,
        publicKey: formData.publicKey || undefined,
        accessToken: formData.accessToken || undefined,
        webhookSecret: formData.webhookSecret || undefined,
      };
      const updated = await apiClient.patch<PaymentSettingsPublic>('/admin/payment-settings/mercadopago', payload);
      setSettings(updated);
      setFormData((prev) => ({ ...prev, accessToken: '', webhookSecret: '' }));
      alert('Configuración guardada.');
    } catch (e: any) {
      alert('Error al guardar: ' + (e.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Cargando configuración de pagos...</div>;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>Mercado Pago</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Credenciales de Mercado Pago para el checkout de INVS. Se guardan cifradas — quien administre esta
          pantalla puede reemplazarlas en cualquier momento (por ejemplo, para pasar de una cuenta de prueba a la
          cuenta real) sin necesitar un redeploy.
        </p>
      </div>

      <div className="glass" style={{ borderRadius: 16, padding: 32, maxWidth: 520 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            padding: '12px 16px', borderRadius: 12,
            backgroundColor: settings?.configured ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          }}
        >
          <KeyRound size={20} color={settings?.configured ? '#86EFAC' : '#FCA5A5'} />
          <span style={{ color: settings?.configured ? '#86EFAC' : '#FCA5A5', fontSize: 14 }}>
            {settings?.configured
              ? `Configurado (•••• ${settings.lastFour}) — ambiente ${settings.environment}`
              : 'Todavía no hay ninguna credencial cargada'}
          </span>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>Ambiente</label>
            <select
              className="input"
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value as 'sandbox' | 'production' })}
            >
              <option value="sandbox">Sandbox (pruebas)</option>
              <option value="production">Producción</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>Access Token</label>
            <input
              className="input"
              type="password"
              placeholder={settings?.configured ? `•••• ${settings.lastFour} — dejar vacío para no reemplazar` : 'TEST-... / APP_USR-...'}
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              autoComplete="off"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>Public Key</label>
            <input
              className="input"
              placeholder="APP_USR-... / TEST-..."
              value={formData.publicKey}
              onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>
              Clave secreta de webhooks {settings?.webhookConfigured && <span style={{ color: '#86EFAC' }}>(configurada)</span>}
            </label>
            <input
              className="input"
              type="password"
              placeholder={settings?.webhookConfigured ? 'Configurada — dejar vacío para no reemplazar' : 'Panel de Mercado Pago → Notificaciones → Firma secreta'}
              value={formData.webhookSecret}
              onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
              autoComplete="off"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}

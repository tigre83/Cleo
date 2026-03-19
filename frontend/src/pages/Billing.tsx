import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const plans = [
  { key: 'basic', name: 'Basic', price: '$29/mes', features: ['1 bot', '1,000 mensajes/mes', 'Widget web'] },
  { key: 'pro', name: 'Pro', price: '$79/mes', features: ['5 bots', '10,000 mensajes/mes', 'Widget + WhatsApp', 'Soporte prioritario'] },
  { key: 'enterprise', name: 'Enterprise', price: '$199/mes', features: ['Bots ilimitados', 'Mensajes ilimitados', 'Todos los canales', 'Soporte dedicado', 'API personalizada'] },
];

export default function Billing() {
  const { client } = useAuth();

  const subscribe = async (plan: string) => {
    try {
      const { data } = await api.post('/billing/checkout', { plan });
      window.location.href = data.url;
    } catch (err) {
      alert('Error al crear sesion de pago');
    }
  };

  const openPortal = async () => {
    try {
      const { data } = await api.post('/billing/portal');
      window.location.href = data.url;
    } catch (err) {
      alert('Error al abrir portal de facturacion');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Suscripcion</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Plan actual: <span className={`badge badge-${client?.subscription_plan}`}>{client?.subscription_plan}</span>
      </p>

      {client?.subscription_plan !== 'free' && (
        <button className="btn-secondary" onClick={openPortal} style={{ marginBottom: 24 }}>
          Gestionar suscripcion en Stripe
        </button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {plans.map((plan) => (
          <div
            key={plan.key}
            className="card"
            style={{
              borderColor: client?.subscription_plan === plan.key ? 'var(--primary)' : 'var(--border)',
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>{plan.price}</p>
            <ul style={{ listStyle: 'none', marginBottom: 20 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ padding: '4px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                  ✓ {f}
                </li>
              ))}
            </ul>
            {client?.subscription_plan === plan.key ? (
              <button className="btn-secondary" disabled style={{ width: '100%' }}>
                Plan actual
              </button>
            ) : (
              <button className="btn-primary" onClick={() => subscribe(plan.key)} style={{ width: '100%' }}>
                Suscribirse
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

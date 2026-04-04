import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';

interface Business {
  id: string;
  email: string;
  business_name: string;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  messages_used: number;
  email_verified: boolean;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  mrr: number;
  churnRate: number;
  planCounts: Record<string, number>;
}

type AdminStep = 'login' | '2fa' | 'dashboard';

export default function Admin() {
  const [step, setStep] = useState<AdminStep>(() =>
    localStorage.getItem('cleo_admin_token') ? 'dashboard' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<Business[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');

  const adminHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('cleo_admin_token')}` },
  });

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users', adminHeaders()),
        api.get('/admin/stats', adminHeaders()),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch {
      localStorage.removeItem('cleo_admin_token');
      setStep('login');
    }
  };

  useEffect(() => {
    if (step === 'dashboard') fetchData();
  }, [step]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/admin/login', { email, password });
      setStep('2fa');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/admin/verify-2fa', { code: code.toUpperCase() });
      localStorage.setItem('cleo_admin_token', data.token);
      setStep('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, updates: { plan?: string; status?: string }) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}`, updates, adminHeaders());
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const logout = () => {
    localStorage.removeItem('cleo_admin_token');
    setStep('login');
    setEmail('');
    setPassword('');
    setCode('');
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.business_name.toLowerCase().includes(search.toLowerCase())
  );

  // --- Login screen ---
  if (step === 'login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="card" style={{ width: 400 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>Cleo</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Panel de Administración</p>
          {error && <div style={{ background: '#ef444420', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 2FA screen ---
  if (step === '2fa') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="card" style={{ width: 400 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>Cleo</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Ingresa el código enviado a tu email</p>
          {error && <div style={{ background: '#ef444420', color: 'var(--danger)', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <form onSubmit={handleVerify2FA}>
            <div style={{ marginBottom: 24 }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: 'monospace' }}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || code.length < 6}>
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Dashboard ---
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>Cleo Admin</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Panel de administración</p>
          </div>
          <button className="btn-secondary" onClick={logout} style={{ fontSize: 13 }}>
            Cerrar sesión
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Total Usuarios</p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalUsers}</p>
            </div>
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Usuarios Activos</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{stats.activeUsers}</p>
            </div>
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>MRR</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#22D3EE' }}>${stats.mrr}</p>
            </div>
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Churn Rate</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: stats.churnRate > 10 ? 'var(--danger)' : 'var(--text)' }}>{stats.churnRate}%</p>
            </div>
          </div>
        )}

        {/* Plan distribution */}
        {stats && (
          <div className="card" style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Distribución de Planes</h3>
            <div style={{ display: 'flex', gap: 24 }}>
              {Object.entries(stats.planCounts).map(([plan, count]) => (
                <div key={plan} style={{ textAlign: 'center' }}>
                  <span className={`badge badge-${plan}`} style={{ fontSize: 14, padding: '4px 14px' }}>{plan}</span>
                  <p style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Usuarios ({filtered.length})</h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email o nombre..."
              style={{ width: 300 }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Negocio</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Plan</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Estado</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mensajes</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Registrado</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 500 }}>{u.business_name}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <select
                        value={u.plan}
                        onChange={(e) => updateUser(u.id, { plan: e.target.value })}
                        style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                      >
                        <option value="free">free</option>
                        <option value="basic">basic</option>
                        <option value="pro">pro</option>
                        <option value="enterprise">enterprise</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: u.status === 'active' ? '#22c55e20' : u.status === 'suspended' ? '#ef444420' : '#f59e0b20',
                          color: u.status === 'active' ? 'var(--success)' : u.status === 'suspended' ? 'var(--danger)' : 'var(--warning)',
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{u.messages_used}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', fontSize: 12 }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      {u.status === 'active' ? (
                        <button
                          className="btn-danger"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => updateUser(u.id, { status: 'suspended' })}
                        >
                          Suspender
                        </button>
                      ) : u.status === 'suspended' ? (
                        <button
                          className="btn-primary"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => updateUser(u.id, { status: 'active' })}
                        >
                          Reactivar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                No se encontraron usuarios
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/billing', label: 'Suscripcion' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { client, logout } = useAuth();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 20px', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>Cleo</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Plataforma de Chatbots IA</p>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '10px 20px',
                color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: location.pathname === item.path ? 600 : 400,
                borderLeft: location.pathname === item.path ? '3px solid var(--primary)' : '3px solid transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '0 20px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {client?.email}
          </p>
          <button className="btn-secondary" onClick={logout} style={{ width: '100%', fontSize: 12 }}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>{children}</main>
    </div>
  );
}

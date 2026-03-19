import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Bot } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { client } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('Eres un asistente util y amable.');
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic'>('openai');

  const fetchBots = async () => {
    const { data } = await api.get('/bots');
    setBots(data);
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const createBot = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/bots', { name, system_prompt: systemPrompt, ai_provider: aiProvider });
    setShowForm(false);
    setName('');
    fetchBots();
  };

  const deleteBot = async (id: string) => {
    if (!confirm('Eliminar este bot?')) return;
    await api.delete(`/bots/${id}`);
    fetchBots();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Plan: <span className={`badge badge-${client?.subscription_plan}`}>{client?.subscription_plan}</span>
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Nuevo Bot
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Crear nuevo bot</h3>
          <form onSubmit={createBot}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Bot de Ventas" required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Proveedor IA</label>
              <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value as any)}>
                <option value="openai">OpenAI (GPT-4o-mini)</option>
                <option value="anthropic">Anthropic (Claude Haiku)</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Prompt del sistema</label>
              <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} />
            </div>
            <button type="submit" className="btn-primary">Crear Bot</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {bots.map((bot) => (
          <div key={bot.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>{bot.name}</h3>
              <span className={`badge badge-${bot.ai_provider === 'openai' ? 'pro' : 'enterprise'}`}>
                {bot.ai_provider === 'openai' ? 'GPT-4o-mini' : 'Claude Haiku'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bot.system_prompt}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/bots/${bot.id}`}>
                <button className="btn-secondary" style={{ fontSize: 12 }}>Configurar</button>
              </Link>
              <Link to={`/bots/${bot.id}/conversations`}>
                <button className="btn-secondary" style={{ fontSize: 12 }}>Conversaciones</button>
              </Link>
              <button className="btn-danger" style={{ fontSize: 12 }} onClick={() => deleteBot(bot.id)}>
                Eliminar
              </button>
            </div>

            {bot.widget_enabled && (
              <div style={{ marginTop: 12, padding: 10, background: 'var(--bg)', borderRadius: 8, fontSize: 12 }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Widget embed:</p>
                <code style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>
                  {`<script src="${window.location.origin}/widget.js" data-bot-id="${bot.id}"></script>`}
                </code>
              </div>
            )}
          </div>
        ))}

        {bots.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1/-1', padding: 48 }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No tienes bots aun</p>
            <p>Crea tu primer bot para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}

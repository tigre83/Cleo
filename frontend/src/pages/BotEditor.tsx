import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Bot } from '../types';

export default function BotEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<Bot | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/bots/${id}`).then(({ data }) => setBot(data)).catch(() => navigate('/dashboard'));
  }, [id, navigate]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!bot) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/bots/${id}`, {
        name: bot.name,
        system_prompt: bot.system_prompt,
        ai_provider: bot.ai_provider,
        ai_model: bot.ai_model,
        temperature: bot.temperature,
        max_tokens: bot.max_tokens,
        whatsapp_phone_id: bot.whatsapp_phone_id || undefined,
        whatsapp_token: bot.whatsapp_token || undefined,
        widget_enabled: bot.widget_enabled,
        widget_color: bot.widget_color,
        widget_title: bot.widget_title,
        widget_greeting: bot.widget_greeting,
      });
      setBot(data);
      setMessage('Guardado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!bot) return <div>Cargando...</div>;

  const update = (field: keyof Bot, value: any) => setBot({ ...bot, [field]: value });

  return (
    <div style={{ maxWidth: 700 }}>
      <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginBottom: 16, fontSize: 13 }}>
        ← Volver
      </button>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Configurar Bot</h2>

      {message && (
        <div style={{ background: message.includes('Error') ? '#ef444420' : '#22c55e20', color: message.includes('Error') ? 'var(--danger)' : 'var(--success)', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {message}
        </div>
      )}

      <form onSubmit={save}>
        {/* General */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>General</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Nombre</label>
            <input value={bot.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Prompt del sistema</label>
            <textarea value={bot.system_prompt} onChange={(e) => update('system_prompt', e.target.value)} rows={5} />
          </div>
        </div>

        {/* AI Config */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Configuracion IA</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Proveedor</label>
              <select value={bot.ai_provider} onChange={(e) => update('ai_provider', e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Modelo</label>
              <input value={bot.ai_model} onChange={(e) => update('ai_model', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Temperatura ({bot.temperature})</label>
              <input type="range" min="0" max="2" step="0.1" value={bot.temperature} onChange={(e) => update('temperature', parseFloat(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Max tokens</label>
              <input type="number" value={bot.max_tokens} onChange={(e) => update('max_tokens', parseInt(e.target.value))} />
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>WhatsApp</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Phone Number ID</label>
            <input value={bot.whatsapp_phone_id || ''} onChange={(e) => update('whatsapp_phone_id', e.target.value)} placeholder="Desde Meta Business" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Access Token</label>
            <input type="password" value={bot.whatsapp_token || ''} onChange={(e) => update('whatsapp_token', e.target.value)} placeholder="Token de Meta" />
          </div>
        </div>

        {/* Widget */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Widget Web</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={bot.widget_enabled} onChange={(e) => update('widget_enabled', e.target.checked)} />
              Widget habilitado
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={bot.widget_color} onChange={(e) => update('widget_color', e.target.value)} style={{ width: 40, height: 36, padding: 2 }} />
                <input value={bot.widget_color} onChange={(e) => update('widget_color', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Titulo</label>
              <input value={bot.widget_title} onChange={(e) => update('widget_title', e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)' }}>Saludo inicial</label>
            <input value={bot.widget_greeting} onChange={(e) => update('widget_greeting', e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}

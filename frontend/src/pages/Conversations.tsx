import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Conversation, Message } from '../types';

export default function Conversations() {
  const { id: botId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    api.get(`/conversations/bot/${botId}`).then(({ data }) => setConversations(data));
  }, [botId]);

  const loadMessages = async (convId: string) => {
    setSelectedConv(convId);
    const { data } = await api.get(`/conversations/${convId}/messages`);
    setMessages(data);
  };

  return (
    <div>
      <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginBottom: 16, fontSize: 13 }}>
        ← Volver
      </button>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Conversaciones</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 180px)' }}>
        {/* Conversation list */}
        <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border)', paddingRight: 16 }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => loadMessages(conv.id)}
              style={{
                padding: 12,
                borderRadius: 8,
                marginBottom: 8,
                cursor: 'pointer',
                background: selectedConv === conv.id ? 'var(--bg-input)' : 'transparent',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {conv.contact_name || conv.external_id || 'Anonimo'}
                </span>
                <span className={`badge badge-${conv.channel}`}>{conv.channel}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {new Date(conv.updated_at).toLocaleDateString('es')}
              </span>
            </div>
          ))}
          {conversations.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>
              Sin conversaciones aun
            </p>
          )}
        </div>

        {/* Messages */}
        <div style={{ overflowY: 'auto', padding: '0 16px' }}>
          {selectedConv ? (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-input)',
                    color: 'var(--text)',
                    fontSize: 14,
                  }}
                >
                  {msg.content}
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {new Date(msg.created_at).toLocaleTimeString('es')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              Selecciona una conversacion
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

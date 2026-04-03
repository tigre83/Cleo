# Cleo — Asistente IA + Agendamiento para PYMEs

> Tu asistente de IA que atiende clientes por WhatsApp, agenda citas y confirma — sin intervención humana.

## Qué es Cleo

SaaS para pequeños negocios en Ecuador (peluquerías, clínicas dentales, spas, manicuristas) que combina:
- **Agendamiento de citas** automático
- **IA conversacional** en WhatsApp que responde, agenda y confirma

El cliente usa su propio número de WhatsApp Business. Cleo se conecta via WhatsApp Cloud API de Meta.

## Stack

| Capa | Tecnología |
|------|-----------|
| **IA** | Claude API (claude-sonnet) — Anthropic |
| **Backend** | Node.js + TypeScript + Express |
| **Base de datos** | PostgreSQL via Supabase |
| **Auth** | Supabase Auth |
| **WhatsApp** | Meta WhatsApp Cloud API (Embedded Signup) |
| **Pagos** | Kushki (Ecuador) |
| **Hosting** | Vercel (frontend) + Railway (backend) |

## Estructura

```
cleo-project/
├── backend/
│   └── src/
│       ├── config/         # env, supabase client
│       ├── middleware/      # auth, rate limiting
│       ├── models/          # schema.sql
│       ├── routes/          # auth, business, webhook, appointments, conversations
│       └── services/        # ai.service, whatsapp.service, appointments.service
├── .env.example
├── .gitignore
└── docker-compose.yml
```

## Inicio Rápido

```bash
cd backend
cp .env.example .env   # Configurar variables
npm install
npm run dev
```

## Planes

| Plan | Precio | Conversaciones |
|------|--------|---------------|
| Básico | $39/mes | 500/mes |
| Negocio | $79/mes | 2,000/mes |
| Pro | $149/mes | 5,000/mes + integraciones |

Trial: 7 días gratis sin tarjeta.

## Licencia

Propietario — © 2026 Cleo. Todos los derechos reservados.

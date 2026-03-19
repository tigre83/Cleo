# Cleo - Plataforma de Chatbots IA

Plataforma SaaS multi-tenant para crear y gestionar chatbots de IA con soporte para WhatsApp y widget web embebible.

## Arquitectura

- **Backend**: Node.js + TypeScript + Express
- **Frontend**: React + Vite (panel de administracion)
- **Widget**: Script JS embebible para sitios web
- **Base de datos**: PostgreSQL via Supabase
- **IA**: OpenAI GPT-4o-mini / Anthropic Claude Haiku
- **Canales**: WhatsApp (Meta Cloud API) + Widget web
- **Pagos**: Stripe Subscriptions + Customer Portal

## Estructura del proyecto

```
├── backend/          # API REST (Express + TypeScript)
│   ├── src/
│   │   ├── config/       # Env, Supabase, Stripe
│   │   ├── middleware/    # Auth JWT
│   │   ├── routes/        # Auth, Bots, Conversations, Webhook, Widget, Billing
│   │   ├── services/      # AI, Conversation, WhatsApp, Stripe
│   │   └── types/
│   └── supabase-schema.sql
├── frontend/         # Panel del cliente (React + Vite)
│   └── src/
│       ├── components/    # Layout
│       ├── pages/         # Login, Register, Dashboard, BotEditor, Conversations, Billing
│       ├── hooks/         # useAuth
│       └── services/      # API client
├── widget/           # Chat widget embebible
│   └── src/widget.js
├── Dockerfile
└── docker-compose.yml
```

## Setup

### 1. Base de datos
Ejecuta `backend/supabase-schema.sql` en tu proyecto de Supabase.

### 2. Backend
```bash
cd backend
cp .env.example .env  # Configura las variables
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Widget
```bash
cd widget
npm install
npm run build
```

Embed en cualquier sitio:
```html
<script src="https://tu-dominio.com/widget.js" data-bot-id="BOT_ID"></script>
```

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Perfil actual |
| GET/POST/PUT/DELETE | `/api/bots` | CRUD de bots |
| GET | `/api/conversations/bot/:botId` | Listar conversaciones |
| GET | `/api/conversations/:id/messages` | Ver mensajes |
| GET/POST | `/api/webhook/whatsapp` | Webhook de WhatsApp |
| GET | `/api/widget/config/:botId` | Config del widget |
| POST | `/api/widget/message/:botId` | Enviar mensaje via widget |
| POST | `/api/billing/checkout` | Crear sesion de pago |
| POST | `/api/billing/portal` | Portal de Stripe |
| POST | `/api/billing/webhook` | Webhook de Stripe |

## Deploy (Azure App Service)

```bash
docker build -t cleo .
docker-compose up -d
```

O directamente en Azure App Service con la imagen Docker.

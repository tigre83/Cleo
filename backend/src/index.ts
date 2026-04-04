import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth';
import botRoutes from './routes/bots';
import conversationRoutes from './routes/conversations';
import webhookRoutes from './routes/webhook';
import widgetRoutes from './routes/widget';
import billingRoutes from './routes/billing';
import adminRoutes from './routes/admin';

const app = express();

// Stripe webhook needs raw body
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  (req as any).rawBody = req.body;
  req.body = JSON.parse(req.body.toString());
  next();
});

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(Number(env.PORT), () => {
  console.log(`🤖 Cleo backend running on port ${env.PORT}`);
});

export default app;

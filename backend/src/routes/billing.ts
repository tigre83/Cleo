import { Router, Request, Response } from 'express';
import { stripe } from '../config/stripe';
import { env } from '../config/env';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  createCheckoutSession,
  createCustomerPortalSession,
  handleStripeWebhook,
} from '../services/stripe';

const router = Router();

// Stripe webhook (raw body required - mounted separately in index.ts)
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

// Create checkout session
router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = req.body;
    if (!['basic', 'pro', 'enterprise'].includes(plan)) {
      res.status(400).json({ error: 'Plan inválido' });
      return;
    }

    const url = await createCheckoutSession(
      req.client!.clientId,
      req.client!.email,
      plan
    );

    res.json({ url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
});

// Customer portal
router.post('/portal', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const url = await createCustomerPortalSession(req.client!.clientId);
    res.json({ url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Error creando sesión del portal' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { handleWhatsAppWebhook, verifyWhatsAppWebhook } from '../services/whatsapp';

const router = Router();

// WhatsApp webhook verification (GET)
router.get('/whatsapp', (req: Request, res: Response) => {
  const challenge = verifyWhatsAppWebhook(req.query as any);
  if (challenge) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Verification failed');
  }
});

// WhatsApp webhook messages (POST)
router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    await handleWhatsAppWebhook(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    res.status(200).send('OK'); // Always return 200 to Meta
  }
});

export default router;

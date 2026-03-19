import { stripe } from '../config/stripe';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import Stripe from 'stripe';

export async function createCheckoutSession(
  clientId: string,
  email: string,
  plan: 'basic' | 'pro' | 'enterprise'
): Promise<string> {
  const priceMap: Record<string, string | undefined> = {
    basic: env.STRIPE_PRICE_BASIC,
    pro: env.STRIPE_PRICE_PRO,
    enterprise: env.STRIPE_PRICE_ENTERPRISE,
  };

  const priceId = priceMap[plan];
  if (!priceId) throw new Error(`Price not configured for plan: ${plan}`);

  // Get or create Stripe customer
  const { data: client } = await supabase
    .from('clients')
    .select('stripe_customer_id')
    .eq('id', clientId)
    .single();

  let customerId = client?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { clientId } });
    customerId = customer.id;
    await supabase
      .from('clients')
      .update({ stripe_customer_id: customerId })
      .eq('id', clientId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/pricing`,
  });

  return session.url!;
}

export async function createCustomerPortalSession(clientId: string): Promise<string> {
  const { data: client } = await supabase
    .from('clients')
    .select('stripe_customer_id')
    .eq('id', clientId)
    .single();

  if (!client?.stripe_customer_id) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: client.stripe_customer_id,
    return_url: `${env.FRONTEND_URL}/dashboard`,
  });

  return session.url;
}

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;
      const priceId = subscription.items.data[0]?.price.id;

      let plan: string = 'free';
      if (priceId === env.STRIPE_PRICE_BASIC) plan = 'basic';
      else if (priceId === env.STRIPE_PRICE_PRO) plan = 'pro';
      else if (priceId === env.STRIPE_PRICE_ENTERPRISE) plan = 'enterprise';

      await supabase
        .from('clients')
        .update({
          subscription_plan: plan,
          subscription_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabase
        .from('clients')
        .update({
          subscription_plan: 'free',
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
      break;
    }
  }
}

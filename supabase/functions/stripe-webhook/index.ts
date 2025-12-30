import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

// Tier configuration
const TIER_CONFIG: Record<string, { role: string; generationsLimit: number; name: string }> = {
  starter: { role: 'starter', generationsLimit: 100, name: 'Starter' },
  pro: { role: 'pro', generationsLimit: 500, name: 'Pro' },
};

// Helper to send emails via the send-email edge function
async function sendEmail(payload: {
  type: string;
  to: string;
  name: string;
  plan?: string;
  generations?: number;
}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send email:', error);
    } else {
      console.log(`Email sent: ${payload.type} to ${payload.to}`);
    }
  } catch (error) {
    console.error('Email send error:', error);
  }
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Processing webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;

        // Determine tier from price ID
        const tierKey = Object.keys(TIER_CONFIG).find(key =>
          priceId?.includes(key)
        ) || 'starter';
        const tierConfig = TIER_CONFIG[tierKey];

        // Get user ID from subscription metadata or customer
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          // Get user profile for email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, display_name')
            .eq('id', userId)
            .single();

          await supabase.from('profiles').update({
            stripe_subscription_id: subscriptionId,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            role: tierConfig.role,
            ai_generations_limit: tierConfig.generationsLimit,
            ai_generations_used: 0, // Reset on new subscription
          }).eq('id', userId);

          console.log(`User ${userId} upgraded to ${tierConfig.role}`);

          // Send subscription confirmation email
          if (profile?.email) {
            await sendEmail({
              type: 'subscriptionConfirmed',
              to: profile.email,
              name: profile.display_name || profile.email.split('@')[0],
              plan: tierConfig.name,
              generations: tierConfig.generationsLimit,
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;

        // Get user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Determine tier from price ID
          const tierKey = Object.keys(TIER_CONFIG).find(key =>
            priceId?.includes(key)
          ) || 'starter';
          const tierConfig = TIER_CONFIG[tierKey];

          await supabase.from('profiles').update({
            stripe_subscription_id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            role: tierConfig.role,
            ai_generations_limit: tierConfig.generationsLimit,
          }).eq('id', profile.id);

          console.log(`Subscription updated for user ${profile.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by Stripe customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Downgrade to free tier
          await supabase.from('profiles').update({
            stripe_subscription_id: null,
            current_period_end: null,
            role: 'free',
            ai_generations_limit: 25,
          }).eq('id', profile.id);

          console.log(`User ${profile.id} downgraded to free tier`);

          // Send cancellation email
          if (profile.email) {
            await sendEmail({
              type: 'subscriptionCancelled',
              to: profile.email,
              name: profile.display_name || profile.email.split('@')[0],
            });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        // Only process subscription renewals (not first payment)
        if (invoice.billing_reason === 'subscription_cycle') {
          // Get user by Stripe customer ID
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (profile) {
            // Reset monthly generations on renewal
            await supabase.from('profiles').update({
              ai_generations_used: 0,
            }).eq('id', profile.id);

            console.log(`Monthly generations reset for user ${profile.id}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`Payment failed for customer ${customerId}`);
        // Could send notification email here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});

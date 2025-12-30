import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe configuration
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

// Pricing tiers configuration
export const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null, // No Stripe price for free tier
    generations: 25,
    projects: 3,
    features: [
      '25 AI generations/month',
      '3 projects',
      'Basic features',
    ],
  },
  starter: {
    name: 'Starter',
    price: 9,
    priceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID || '',
    generations: 100,
    projects: 10,
    features: [
      '100 AI generations/month',
      '10 projects',
      'Export PRD',
      'Version history',
      'Priority support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || '',
    generations: 500,
    projects: -1, // Unlimited
    features: [
      '500 AI generations/month',
      'Unlimited projects',
      'Export PRD',
      'Version history',
      'Priority support',
      'Early access to new features',
    ],
  },
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

// Create checkout session via Supabase Edge Function
export const createCheckoutSession = async (
  userId: string,
  userEmail: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string } | { error: string }> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId,
          userEmail,
          priceId,
          successUrl,
          cancelUrl,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || 'Failed to create checkout session' };
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { error: 'Failed to create checkout session' };
  }
};

// Create customer portal session for managing subscription
export const createPortalSession = async (
  userId: string,
  returnUrl: string
): Promise<{ url: string } | { error: string }> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId,
          returnUrl,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || 'Failed to create portal session' };
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating portal session:', error);
    return { error: 'Failed to create portal session' };
  }
};

// Get tier from role
export const getTierFromRole = (role: string): PricingTier => {
  if (role === 'pro') return 'pro';
  if (role === 'starter') return 'starter';
  return 'free';
};

// Check if subscription is active
export const isSubscriptionActive = (currentPeriodEnd: string | null): boolean => {
  if (!currentPeriodEnd) return false;
  return new Date(currentPeriodEnd) > new Date();
};

// Format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};

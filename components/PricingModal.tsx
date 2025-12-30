import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  PRICING_TIERS,
  PricingTier,
  createCheckoutSession,
  createPortalSession,
  formatPrice,
  getTierFromRole,
} from '../services/stripeService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState<PricingTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTier = profile?.role ? getTierFromRole(profile.role) : 'free';
  const hasActiveSubscription = profile?.stripe_subscription_id && profile?.current_period_end
    && new Date(profile.current_period_end) > new Date();

  const handleSubscribe = async (tier: PricingTier) => {
    if (!user || !profile) {
      setError('Please sign in to subscribe');
      return;
    }

    if (tier === 'free') return;

    const priceId = PRICING_TIERS[tier].priceId;
    if (!priceId) {
      setError('Pricing not configured. Please contact support.');
      return;
    }

    setLoading(tier);
    setError(null);

    const baseUrl = window.location.origin + window.location.pathname;
    const result = await createCheckoutSession(
      user.id,
      user.email || '',
      priceId,
      `${baseUrl}?success=true`,
      `${baseUrl}?canceled=true`
    );

    if ('error' in result) {
      setError(result.error);
      setLoading(null);
      return;
    }

    // Redirect to Stripe Checkout
    window.location.href = result.url;
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading('starter'); // Just to show loading state
    setError(null);

    const baseUrl = window.location.origin + window.location.pathname;
    const result = await createPortalSession(user.id, baseUrl);

    if ('error' in result) {
      setError(result.error);
      setLoading(null);
      return;
    }

    // Redirect to Stripe Customer Portal
    window.location.href = result.url;
  };

  const renderTierCard = (tierKey: PricingTier) => {
    const tier = PRICING_TIERS[tierKey];
    const isCurrentTier = currentTier === tierKey;
    const isPopular = tierKey === 'pro';
    const isUpgrade = tierKey !== 'free' &&
      (currentTier === 'free' || (currentTier === 'starter' && tierKey === 'pro'));

    return (
      <div
        key={tierKey}
        className={`relative rounded-2xl p-6 ${
          isPopular
            ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/50'
            : 'bg-white/5 border border-white/10'
        } ${isCurrentTier ? 'ring-2 ring-green-500/50' : ''}`}
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            MOST POPULAR
          </div>
        )}

        {isCurrentTier && (
          <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            CURRENT
          </div>
        )}

        <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>

        <div className="mb-4">
          <span className="text-4xl font-bold text-white">{formatPrice(tier.price)}</span>
          {tier.price > 0 && <span className="text-white/60">/month</span>}
        </div>

        <ul className="space-y-3 mb-6">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-white/80">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {tierKey === 'free' ? (
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl bg-white/10 text-white/50 font-medium cursor-not-allowed"
          >
            {isCurrentTier ? 'Current Plan' : 'Free Forever'}
          </button>
        ) : isCurrentTier ? (
          <button
            onClick={handleManageSubscription}
            disabled={loading !== null}
            className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            {loading ? 'Loading...' : 'Manage Subscription'}
          </button>
        ) : (
          <button
            onClick={() => handleSubscribe(tierKey)}
            disabled={loading !== null || !isUpgrade}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
              isPopular
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            } ${loading === tierKey ? 'opacity-50 cursor-wait' : ''} ${!isUpgrade ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading === tierKey ? 'Loading...' : isUpgrade ? `Upgrade to ${tier.name}` : 'Current or Lower'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="relative p-8 text-center border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
          <p className="text-white/60">
            Unlock more AI generations and features to supercharge your product design workflow
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-8 mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Pricing cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderTierCard('free')}
            {renderTierCard('starter')}
            {renderTierCard('pro')}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 text-center">
          <p className="text-white/40 text-sm">
            All plans include a 7-day free trial. Cancel anytime.
            <br />
            Questions? <a href="mailto:support@jalanea.com" className="text-indigo-400 hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;

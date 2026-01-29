import Stripe from 'stripe';

// Stripe 클라이언트를 lazy initialization으로 생성
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // @ts-expect-error - API version mismatch between installed types and actual API
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
}

// 호환성을 위해 getter로 export
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
};

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    dailyLimit: 5,
    platforms: 3,
    features: ['5회/일 생성', '3개 플랫폼', '기본 지원'],
  },
  pro: {
    name: 'Pro',
    price: 9,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    dailyLimit: Infinity,
    platforms: 5,
    features: ['무제한 생성', '5개 플랫폼', '우선 지원', '히스토리 저장'],
  },
} as const;

export type PlanType = keyof typeof PLANS;

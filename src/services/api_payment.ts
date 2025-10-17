// src/services/api_payments.ts

import { api } from './api'; 
import type { AxiosResponse } from 'axios';


// --- Enums ---
export enum SubscriptionPlanDuration {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired'
}

export enum PayoutStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

// --- Interfaces ---
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  duration: SubscriptionPlanDuration;
  is_active: boolean;
  has_trial: boolean;
  trial_days: number;
  features: string[];
  stripe_price_id?: string;
  stripe_product_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}

export interface StripeConnectedAccount {
  id: string;
  user_email: string;
  account_id: string;
  account_type: 'express' | 'custom';
  payouts_enabled: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
  default_currency: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPaymentMethod {
  payment_method_id: string;
  card_fingerprint: string | null;
  status: string;
  card?: {
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface PayoutRequestPayload {
  amount: number;
  currency?: string;
  purpose?: string;
  idempotency_key?: string;
}


export interface PaymentMethodListResponse {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created: string;
  is_default: boolean;
}


export interface Payout {
  id: string;
  user_email: string;
  connected_account_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  purpose: string | null;
  failure_reason: string | null;
  stripe_transfer_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_id: string;
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  is_active: boolean;
  in_trial: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentIntentStatus {
  status: string;
}

export interface PayoutHistoryResponse {
  results: Payout[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: Record<string, any>;
  };
  created: number;
}

// --- API Methods ---
export const paymentApi = {
  getActivePlans(): Promise<AxiosResponse<SubscriptionPlan[]>> {
    return api.get('/payments/plans/');
  },

  createCheckoutSession(planId: string): Promise<AxiosResponse<CheckoutSessionResponse>> {
    return api.post('/payments/create-checkout-session/', { plan_id: planId });
  },

  attachPaymentMethod(paymentMethodId: string): Promise<AxiosResponse<{ status: string }>> {
    return api.post('/payments/payment-method/', { payment_method_id: paymentMethodId });
  },

  getUserPaymentMethod(): Promise<AxiosResponse<UserPaymentMethod>> {
    return api.get('/payments/payment-method/');
  },

  createConnectedAccount(): Promise<AxiosResponse<StripeConnectedAccount>> {
    return api.post('/payments/connected-account/', {});
  },

  getConnectedAccountStatus(): Promise<AxiosResponse<StripeConnectedAccount>> {
    return api.get('/payments/connected-account/');
  },

  createAccountLink(refreshUrl: string, returnUrl: string): Promise<AxiosResponse<{ url: string }>> {
    return api.post('/payments/create-account-link/', { 
      refresh_url: refreshUrl, 
      return_url: returnUrl 
    });
  },


  getPayoutHistory(page = 1, pageSize = 10): Promise<AxiosResponse<PayoutHistoryResponse>> {
    return api.get('/payments/payouts/history/', {
      params: { page, page_size: pageSize }
    });
  },

  getUserSubscriptions(): Promise<AxiosResponse<UserSubscription[]>> {
    return api.get('/payments/subscriptions/');
  },

  cancelSubscription(subscriptionId: string): Promise<AxiosResponse<{ status: string }>> {
    return api.post(`/payments/subscriptions/${subscriptionId}/cancel/`);
  },

  reactivateSubscription(subscriptionId: string): Promise<AxiosResponse<{ status: string }>> {
    return api.post(`/payments/subscriptions/${subscriptionId}/reactivate/`);
  },

  getPaymentIntentStatus(paymentIntentId: string): Promise<AxiosResponse<PaymentIntentStatus>> {
    return api.get(`/payments/payment-intents/${paymentIntentId}/status/`);
  },

  getCheckoutSessionStatus(sessionId: string): Promise<AxiosResponse<{
    session_id: string;
    session_status: string;
    payment_status: string;
    subscription_id: string | null;
    payment_intent_id: string | null;
  }>> {
    return api.get(`/payments/checkout-sessions/${sessionId}/status/`);
  },
};


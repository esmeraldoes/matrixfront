// src/store/paymentSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import {
  PayoutStatus,
  type SubscriptionPlan,
  type UserSubscription,
  type UserPaymentMethod,
  type StripeConnectedAccount,
  type PayoutHistoryResponse,
  type WebhookEvent,
  SubscriptionStatus,
  type CheckoutSessionResponse
} from '../services/api_payment';
import type { RootState } from './store';
import {
  fetchSubscriptionPlans,
  createCheckoutSession,
  createConnectedAccount,
  fetchAccountLink,
  fetchConnectedAccountStatus,
  fetchUserSubscriptions,
  cancelSubscription,
  reactivateSubscription,
  attachPaymentMethod,
  fetchUserPaymentMethod,
  fetchPayoutHistory,
  verifyCheckoutSession,
} from './paymentThunks';
import { shallowEqual } from 'react-redux';

interface PaymentState {
  plans: SubscriptionPlan[];
  plansStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  plansError: string | null;

  checkoutSession: {
    url: string | null;
    sessionId: string | null;
    status: 'idle' | 'processing' | 'succeeded' | 'failed';
    error: string | null;
  };

  sessionVerification: {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    sessionStatus: string | null;
    paymentStatus: string | null;
  };

  subscriptions: UserSubscription[];
  subscriptionsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  subscriptionsError: string | null;

  paymentMethod: UserPaymentMethod | null;
  paymentMethodStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  paymentMethodError: string | null;

  connectedAccount: StripeConnectedAccount | null;
  connectedAccountStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  connectedAccountError: string | null;

  accountLinkUrl: string | null;
  accountLinkStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  accountLinkError: string | null;

  payoutHistory: PayoutHistoryResponse;
  payoutHistoryStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  payoutHistoryError: string | null;

  operations: {
    cancelSubscription: 'idle' | 'loading' | 'succeeded' | 'failed';
    reactivateSubscription: 'idle' | 'loading' | 'succeeded' | 'failed';
    attachPaymentMethod: 'idle' | 'loading' | 'succeeded' | 'failed';
    requestPayout: 'idle' | 'loading' | 'succeeded' | 'failed';
    createConnectedAccount: 'idle' | 'loading' | 'succeeded' | 'failed';
  };
  operationError: string | null;
}

interface StripeAccountUpdatedEvent {
  id: string;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
  default_currency: string | null;
  country: string | null;
}

const initialPayoutHistory: PayoutHistoryResponse = {
  results: [],
  count: 0,
  next: null,
  previous: null
};

const initialState: PaymentState = {
  plans: [],
  plansStatus: 'idle',
  plansError: null,

  checkoutSession: {
    url: null,
    sessionId: null,
    status: 'idle',
    error: null
  },

  sessionVerification: {
    status: 'idle',
    error: null,
    sessionStatus: null,
    paymentStatus: null,
  },

  subscriptions: [],
  subscriptionsStatus: 'idle',
  subscriptionsError: null,

  paymentMethod: null,
  paymentMethodStatus: 'idle',
  paymentMethodError: null,

  connectedAccount: null,
  connectedAccountStatus: 'idle',
  connectedAccountError: null,

  accountLinkUrl: null,
  accountLinkStatus: 'idle',
  accountLinkError: null,

  payoutHistory: initialPayoutHistory,
  payoutHistoryStatus: 'idle',
  payoutHistoryError: null,

  operations: {
    cancelSubscription: 'idle',
    reactivateSubscription: 'idle',
    attachPaymentMethod: 'idle',
    requestPayout: 'idle',
    createConnectedAccount: 'idle',
  },
  operationError: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    
    resetCheckoutState(state) {
      if (state.checkoutSession.status !== 'processing') {
        state.checkoutSession = {
          url: null,
          sessionId: null,
          status: 'idle',
          error: null
        };
      }
    },

    resetConnectedAccountState: (state) => {
      state.connectedAccount = null;
      state.connectedAccountStatus = 'idle';
      state.connectedAccountError = null;
      state.accountLinkUrl = null;
      state.accountLinkStatus = 'idle';
      state.accountLinkError = null;
    },
    
    resetOperationStatus: (state, action: PayloadAction<keyof PaymentState['operations']>) => {
      const operation = action.payload;
      if (operation in state.operations) {
        state.operations[operation] = 'idle';
      }
      state.operationError = null;
    },
    

    webhookEventReceived: (state, action: PayloadAction<WebhookEvent>) => {
      const { type, data } = action.payload;
      const event = data.object;

      switch(type) {
        case 'payment_intent.succeeded':
        case 'charge.succeeded': {
          const subscriptionIndex = state.subscriptions.findIndex(
            sub => sub.stripe_id === event.invoice?.subscription
          );
          
          if (subscriptionIndex !== -1) {
            state.subscriptions[subscriptionIndex].status = SubscriptionStatus.ACTIVE;
            state.subscriptions[subscriptionIndex].in_trial = false;
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscriptionIndex = state.subscriptions.findIndex(
            sub => sub.stripe_id === event.id
          );

          if (subscriptionIndex !== -1) {
            state.subscriptions[subscriptionIndex] = {
              ...state.subscriptions[subscriptionIndex],
              status: event.status,
              current_period_start: new Date(event.current_period_start * 1000).toISOString(),
              current_period_end: new Date(event.current_period_end * 1000).toISOString(),
              trial_start: event.trial_start ? new Date(event.trial_start * 1000).toISOString() : null,
              trial_end: event.trial_end ? new Date(event.trial_end * 1000).toISOString() : null,
              cancel_at_period_end: event.cancel_at_period_end,
              is_active: ['active', 'trialing'].includes(event.status) && 
                         event.current_period_end * 1000 > Date.now(),
              in_trial: event.status === 'trialing' && 
                        event.trial_end * 1000 > Date.now()
            };
          }
          break;
        }

        case 'payout.paid': {
          const payoutIndex = state.payoutHistory.results.findIndex(
            p => p.stripe_transfer_id === event.id
          );

          if (payoutIndex !== -1) {
            state.payoutHistory.results[payoutIndex] = {
              ...state.payoutHistory.results[payoutIndex],
              status: PayoutStatus.PAID,
              completed_at: new Date().toISOString()
            };
          }
          break;
        }

        case 'payout.failed': {
          const payoutIndex = state.payoutHistory.results.findIndex(
            p => p.stripe_transfer_id === event.id
          );

          if (payoutIndex !== -1) {
            state.payoutHistory.results[payoutIndex] = {
              ...state.payoutHistory.results[payoutIndex],
              status: PayoutStatus.FAILED,
              failure_reason: event.failure_message || 'Unknown error'
            };
          }
          break;
        }

        case 'account.updated': {
          const accountEvent = event as StripeAccountUpdatedEvent;
          const currentAccount = state.connectedAccount;
          
          if (currentAccount?.account_id === accountEvent.id) {
            state.connectedAccount = {
              ...currentAccount,
              payouts_enabled: accountEvent.payouts_enabled,
              charges_enabled: accountEvent.charges_enabled,
              details_submitted: accountEvent.details_submitted,
              default_currency: accountEvent.default_currency,
              country: accountEvent.country,
              updated_at: new Date().toISOString()
            };
          }
          break;
        }

        case 'commission.created': {
          if (!state.payoutHistory.results.some(p => p.id === event.id)) {
            state.payoutHistory.results.unshift({
              id: event.id,
              user_email: event.referrer_email,
              connected_account_id: event.connected_account_id,
              amount: event.amount,
              currency: event.currency,
              status: event.status,
              purpose: 'Commission payout',
              failure_reason: null,
              stripe_transfer_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              completed_at: null
            });
            state.payoutHistory.count += 1;
          }
          break;
        }

        default:
          console.debug(`Unhandled webhook event: ${type}`);
      }
    }
  },
  extraReducers: (builder) => {
    // Subscription Plans
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.plansStatus = 'loading';
        state.plansError = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action: PayloadAction<SubscriptionPlan[]>) => {
        state.plans = action.payload;
        state.plansStatus = 'succeeded';
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.plansStatus = 'failed';
        state.plansError = action.payload as string;
      });

    // Checkout Session
    builder
      .addCase(createCheckoutSession.pending, (state) => {
        state.checkoutSession.status = 'processing';
        state.checkoutSession.error = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state, action: PayloadAction<CheckoutSessionResponse>) => {
        state.checkoutSession.url = action.payload.url;
        state.checkoutSession.sessionId = action.payload.session_id;
        state.checkoutSession.status = 'succeeded';
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.checkoutSession.status = 'failed';
        state.checkoutSession.error = action.payload as string;
      });

    // User Subscriptions
    builder
      .addCase(fetchUserSubscriptions.pending, (state) => {
        state.subscriptionsStatus = 'loading';
        state.subscriptionsError = null;
      })
      .addCase(fetchUserSubscriptions.fulfilled, (state, action: PayloadAction<UserSubscription[]>) => {
        if (!shallowEqual(state.subscriptions, action.payload)) {
            state.subscriptions = action.payload;
          }
        state.subscriptionsStatus = 'succeeded';
      })
      .addCase(fetchUserSubscriptions.rejected, (state, action) => {
        state.subscriptionsStatus = 'failed';
        state.subscriptionsError = action.payload as string;
      });

    // Payment Method
    builder
      .addCase(fetchUserPaymentMethod.pending, (state) => {
        state.paymentMethodStatus = 'loading';
        state.paymentMethodError = null;
      })
      .addCase(fetchUserPaymentMethod.fulfilled, (state, action: PayloadAction<UserPaymentMethod | null>) => {
        state.paymentMethod = action.payload;
        state.paymentMethodStatus = 'succeeded';
      })
      .addCase(fetchUserPaymentMethod.rejected, (state, action) => {
        state.paymentMethodStatus = 'failed';
        state.paymentMethodError = action.payload as string;
      });

    // Connected Account
    builder
      .addCase(createConnectedAccount.pending, (state) => {
        state.operations.createConnectedAccount = 'loading';
        state.connectedAccountStatus = 'loading';
        state.connectedAccountError = null;
        state.operationError = null;
      })
      .addCase(createConnectedAccount.fulfilled, (state, action: PayloadAction<StripeConnectedAccount>) => {
        state.connectedAccount = action.payload;
        state.connectedAccountStatus = 'succeeded';
        state.operations.createConnectedAccount = 'succeeded';
      })
      .addCase(createConnectedAccount.rejected, (state, action) => {
        state.connectedAccountStatus = 'failed';
        state.connectedAccountError = action.payload as string;
        state.operations.createConnectedAccount = 'failed';
        state.operationError = action.payload as string;
      })
      .addCase(fetchConnectedAccountStatus.pending, (state) => {
        state.connectedAccountStatus = 'loading';
        state.connectedAccountError = null;
      })
      .addCase(fetchConnectedAccountStatus.fulfilled, (state, action: PayloadAction<StripeConnectedAccount | null>) => {
        state.connectedAccount = action.payload;
        state.connectedAccountStatus = 'succeeded';
      })
      .addCase(fetchConnectedAccountStatus.rejected, (state, action) => {
        state.connectedAccountStatus = 'failed';
        state.connectedAccountError = action.payload as string;
      });

    // Account Link
    builder
      .addCase(fetchAccountLink.pending, (state) => {
        state.accountLinkStatus = 'loading';
        state.accountLinkUrl = null;
        state.accountLinkError = null;
      })
      .addCase(fetchAccountLink.fulfilled, (state, action: PayloadAction<string>) => {
        state.accountLinkUrl = action.payload;
        state.accountLinkStatus = 'succeeded';
      })
      .addCase(fetchAccountLink.rejected, (state, action) => {
        state.accountLinkStatus = 'failed';
        state.accountLinkError = action.payload as string;
      });

    // Payout History
    builder
      .addCase(fetchPayoutHistory.pending, (state) => {
        state.payoutHistoryStatus = 'loading';
        state.payoutHistoryError = null;
      })
      .addCase(fetchPayoutHistory.fulfilled, (state, action: PayloadAction<PayoutHistoryResponse>) => {
        state.payoutHistory = action.payload;
        state.payoutHistoryStatus = 'succeeded';
      })
      .addCase(fetchPayoutHistory.rejected, (state, action) => {
        state.payoutHistoryStatus = 'failed';
        state.payoutHistoryError = action.payload as string;
      });

    // Subscription Operations
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.operations.cancelSubscription = 'loading';
        state.operationError = null;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.operations.cancelSubscription = 'succeeded';
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.operations.cancelSubscription = 'failed';
        state.operationError = action.payload as string;
      })
      .addCase(reactivateSubscription.pending, (state) => {
        state.operations.reactivateSubscription = 'loading';
        state.operationError = null;
      })
      .addCase(reactivateSubscription.fulfilled, (state) => {
        state.operations.reactivateSubscription = 'succeeded';
      })
      .addCase(reactivateSubscription.rejected, (state, action) => {
        state.operations.reactivateSubscription = 'failed';
        state.operationError = action.payload as string;
      })
      .addCase(attachPaymentMethod.pending, (state) => {
        state.operations.attachPaymentMethod = 'loading';
        state.operationError = null;
      })
      .addCase(attachPaymentMethod.fulfilled, (state) => {
        state.operations.attachPaymentMethod = 'succeeded';
      })
      .addCase(attachPaymentMethod.rejected, (state, action) => {
        state.operations.attachPaymentMethod = 'failed';
        state.operationError = action.payload as string;
      });

    builder
      .addCase(verifyCheckoutSession.pending, (state) => {
        state.sessionVerification.status = 'loading';
        state.sessionVerification.error = null;
      })
      .addCase(verifyCheckoutSession.fulfilled, (state, action) => {
        state.sessionVerification.status = 'succeeded';
        state.sessionVerification.sessionStatus = action.payload.session_status;
        state.sessionVerification.paymentStatus = action.payload.payment_status;
      })
      .addCase(verifyCheckoutSession.rejected, (state, action) => {
        state.sessionVerification.status = 'failed';
        state.sessionVerification.error = action.payload as string;
      });
  },
});

export const { 
  resetCheckoutState, 
  resetConnectedAccountState, 
  resetOperationStatus,
  webhookEventReceived
} = paymentSlice.actions;


export const selectPlansStatus = (state: RootState) => 
  state.payment?.plansStatus ?? 'idle';

export const selectPlansError = (state: RootState) => 
  state.payment?.plansError ?? null;


export const selectActivePlans = createSelector(
  [(state: RootState) => state.payment?.plans ?? []],
  (plans: SubscriptionPlan[]) => plans.filter((plan: SubscriptionPlan) => plan.is_active)
);

export const selectAllPlans = (state: RootState) => 
  state.payment?.plans ?? [];


export const selectCheckoutSession = (state: RootState) => 
  state.payment?.checkoutSession ?? {
    url: null,
    sessionId: null,
    status: 'idle',
    error: null
  };


export const selectSessionVerification = (state: RootState) => {
  if (!state.payment || !state.payment.sessionVerification) {
    return {
      status: 'idle' as const,
      error: null,
      sessionStatus: null,
      paymentStatus: null,
    };
  }
  return state.payment.sessionVerification;
};


export const selectUserSubscriptions = createSelector(
  [(state: RootState) => state.payment?.subscriptions ?? []],
  (subscriptions: UserSubscription[]) => subscriptions
);


export const selectUserPaymentMethod = (state: RootState) => 
  state.payment?.paymentMethod ?? null;

export const selectConnectedAccount = (state: RootState) => 
  state.payment?.connectedAccount ?? null;

export const selectAccountLinkUrl = (state: RootState) => 
  state.payment?.accountLinkUrl ?? null;


export const selectPayoutHistory = createSelector(
  [(state: RootState) => state.payment?.payoutHistory ?? initialPayoutHistory],
  (history: PayoutHistoryResponse) => history
);
export const selectOperationStatus = (operation: keyof PaymentState['operations']) => 
  (state: RootState) => state.payment?.operations?.[operation] ?? 'idle';

export default paymentSlice.reducer;



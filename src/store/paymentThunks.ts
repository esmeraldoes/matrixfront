// // // // src/store/paymentThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  paymentApi, 
  type PayoutRequestPayload,
  type SubscriptionPlan,
  type UserSubscription,
  type UserPaymentMethod,
  type StripeConnectedAccount,
  // type Payout,
  type PayoutHistoryResponse,
  type CheckoutSessionResponse,
  type PaymentIntentStatus
} from '../services/api_payment';
import axios from 'axios';

// Unified error handler
const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data?.error || 
           error.response.data?.detail || 
           error.response.data?.message || 
           `Request failed with status ${error.response.status}`;
  }
  
  if (error.request) {
    return 'No response received from server. Please check your network connection.';
  }
  
  return error.message || 'An unexpected error occurred';
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) { 
      await new Promise(resolve => setTimeout(resolve, 5000));
      return withRetry(fn, retries - 1, delay * 2);
    }
  }
  else if (error instanceof Error) {
    console.error('Retry error:', error.message);
  }
  
  if (retries <= 0) throw error;
  await new Promise(resolve => setTimeout(resolve, delay));
  return withRetry(fn, retries - 1, delay * 2);
}
};



export const fetchSubscriptionPlans = createAsyncThunk<SubscriptionPlan[]>(
  'payment/fetchSubscriptionPlans',
  async (_, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.getActivePlans();
        return response.data;
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);



const requestQueue: Array<() => void> = [];
let isProcessing = false;

const processQueue = () => {
  if (requestQueue.length === 0 || isProcessing) return;
  
  isProcessing = true;
  const nextRequest = requestQueue.shift()!;
  
  nextRequest();
  
  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, 500);
};

export const createCheckoutSession = createAsyncThunk(
  'payment/createCheckoutSession',
  (planId: string, { rejectWithValue }) => {
    return new Promise<CheckoutSessionResponse>((resolve, reject) => {
      const wrappedRequest = () => {
        paymentApi.createCheckoutSession(planId)
          .then(response => resolve(response.data))  
          .catch(reject);
      };
      
      requestQueue.push(wrappedRequest);
      processQueue();
    })
    .catch(error => rejectWithValue(handleApiError(error)));
  }
);


export const fetchUserSubscriptions = createAsyncThunk<UserSubscription[]>(
  'payment/fetchUserSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.getUserSubscriptions();

        return response.data;
      });
    } catch (error) {

      return rejectWithValue(handleApiError(error));
    }
  }
);

export const cancelSubscription = createAsyncThunk<void, string>(
  'payment/cancelSubscription',
  async (subscriptionId, { rejectWithValue }) => {
    try {
      await withRetry(async () => {
        const response = await paymentApi.cancelSubscription(subscriptionId);
        return response.data;
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);



export const reactivateSubscription = createAsyncThunk<void, string>(
  'payment/reactivateSubscription',
  async (subscriptionId, { rejectWithValue }) => {
    try {
      await withRetry(async () => {
        const response = await paymentApi.reactivateSubscription(subscriptionId);
         return response.data; 
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const attachPaymentMethod = createAsyncThunk<void, string>(
  'payment/attachPaymentMethod',
  async (paymentMethodId, { rejectWithValue }) => {
    try {
      await withRetry(async () => {
        await paymentApi.attachPaymentMethod(paymentMethodId);
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchUserPaymentMethod = createAsyncThunk<UserPaymentMethod | null>(
  'payment/fetchUserPaymentMethod',
  async (_, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.getUserPaymentMethod();
        return response.data;
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createConnectedAccount = createAsyncThunk<StripeConnectedAccount>(
  'payment/createConnectedAccount',
  async (_, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.createConnectedAccount();
        return response.data;
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchConnectedAccountStatus = createAsyncThunk<StripeConnectedAccount | null>(
  'payment/fetchConnectedAccountStatus',
  async (_, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.getConnectedAccountStatus();
        return response.data;
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchAccountLink = createAsyncThunk<string, { refreshUrl: string; returnUrl: string }>(
  'payment/fetchAccountLink',
  async ({ refreshUrl, returnUrl }, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.createAccountLink(refreshUrl, returnUrl);
        return response.data.url;
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchPayoutHistory = createAsyncThunk<PayoutHistoryResponse, { page?: number; pageSize?: number }>(
  'payment/fetchPayoutHistory',
  async ({ page = 1, pageSize = 10 }, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.getPayoutHistory(page, pageSize);
        return response.data;
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getPaymentIntentStatus = createAsyncThunk<PaymentIntentStatus, string>(
  'payment/getPaymentIntentStatus',
  async (paymentIntentId, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.getPaymentIntentStatus(paymentIntentId);
        return response.data;
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);


export const verifyCheckoutSession = createAsyncThunk(
  'payment/verifyCheckoutSession',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      return await withRetry(async () => {
        const response = await paymentApi.getCheckoutSessionStatus(sessionId);
        return response.data;
      });
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

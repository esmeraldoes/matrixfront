// src/services/api_refer.ts
import { api } from './api'; 
import type { AxiosResponse } from 'axios';
import type {
  ReferralInfo,
  Commission,
  UserStats,
  PayoutResponse,
  AdminPayout,
} from '../types/affiliates';

export const referralApi = {
  getReferralInfo(): Promise<AxiosResponse<ReferralInfo>> {
    return api.get('/affiliates/referral-info/').then(response => {
      return response;
    });
  },

  getUserCommissions(): Promise<AxiosResponse<Commission[]>> {
    return api.get('/affiliates/commissions/').then(response => {
      return response;
    });
  },

  getUserStats(): Promise<AxiosResponse<UserStats>> {
    return api.get('/affiliates/stats/').then(response => {
      return response;
    });
  },

  requestPayout(): Promise<AxiosResponse<PayoutResponse>> {
    return api.post('/affiliates/request-payout/');
  },

  approvePayout(payoutId: string): Promise<AxiosResponse<{ payout: AdminPayout; new_balance: string }>> {
    return api.post(`/affiliates/admin/payouts/${payoutId}/approve/`);
  },
};




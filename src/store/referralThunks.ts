// src/store/referralThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { referralApi } from '@/services/api_refer';

export const fetchReferralData = createAsyncThunk(
  'referrals/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const [info, commissions, stats] = await Promise.all([
        referralApi.getReferralInfo(),
        referralApi.getUserCommissions(),
        referralApi.getUserStats(),
      ]);
     

      return {
        info: info.data,
        commissions: commissions.data,
        stats: stats.data,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Failed to load referral data');
    }
  }
);

// Request a payout
export const requestPayout = createAsyncThunk(
  'referrals/requestPayout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await referralApi.requestPayout();
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Payout request failed');
    }
  }
);

// Admin: Approve payout
export const approvePayout = createAsyncThunk(
  'referrals/approvePayout',
  async (payoutId: string, { rejectWithValue }) => {
    try {
      const response = await referralApi.approvePayout(payoutId);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || 'Approval failed');
    }
  }
);


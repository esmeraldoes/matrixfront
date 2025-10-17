import { createSlice } from '@reduxjs/toolkit';
import { fetchReferralData, requestPayout, approvePayout } from './referralThunks';
import type { Commission, ReferralInfo, CommissionTier } from '@/types/affiliates';

interface ReferralState {
  info: ReferralInfo | null;
  commissions: Commission[];
  stats: {
    total_referred: number;
    successful_referrals: number;
    earned_commissions: number;
    pending_commissions: number;
    available_payout: number;
    current_tier: CommissionTier | null;
  } | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  payoutStatus: 'idle' | 'processing' | 'success' | 'failed';
}

const initialState: ReferralState = {
  info: null,
  commissions: [],
  stats: null,
  status: 'idle',
  error: null,
  payoutStatus: 'idle',
};

const referralSlice = createSlice({
  name: 'referrals',
  initialState,
  reducers: {
    resetPayoutStatus: (state) => {
      state.payoutStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferralData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchReferralData.fulfilled, (state, action) => {
        const { info, commissions, stats } = action.payload;

        state.info = {
          code: info.code || '',
          successful_referrals: info.successful_referrals || 0,
          active_referrals: info.active_referrals || 0,
          referrals: (info.referrals || []).map((r: any) => ({
            email: r.email || '',
            status: r.status || '',
            date: r.date || '',
            earned: r.earned || '0',
          })),
        };

        state.commissions = commissions || [];

        const tier = stats?.current_tier;
        state.stats = {
          total_referred: stats?.successful_referrals || 0,
          successful_referrals: stats?.successful_referrals || 0,
          earned_commissions: parseFloat(stats?.earned?.toString() || '0'),
          pending_commissions: parseFloat(stats?.pending?.toString() || '0'),
          available_payout: parseFloat(stats?.available?.toString() || '0'),
          current_tier: tier ? {
            id: tier.id?.toString() || '',
            name: tier.name || '',
            commission_rate: parseFloat(tier.commission_rate?.toString() || '0'),
            payout_threshold: parseFloat(tier.payout_threshold?.toString() || '0'),
            min_referrals: tier.min_referrals || 0,
            max_referrals: tier.max_referrals ?? null,
            is_active: tier.is_active ?? true
          } : null
        };

        state.status = 'succeeded';
      })
      .addCase(fetchReferralData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })

      // Payout
      .addCase(requestPayout.pending, (state) => {
        state.payoutStatus = 'processing';
      })
      .addCase(requestPayout.fulfilled, (state, action) => {
        state.payoutStatus = 'success';
        const amt = parseFloat(action.payload.amount ?? '0');
        if (state.stats) {
          state.stats.pending_commissions = Math.max(
            0,
            state.stats.pending_commissions - amt
          );
        }
      })
      .addCase(requestPayout.rejected, (state, action) => {
        state.payoutStatus = 'failed';
        state.error = action.payload as string;
      })

      // Admin
      .addCase(approvePayout.fulfilled, (state, action) => {
        const newBalance = parseFloat(action.payload.new_balance ?? '0');
        const payoutAmt = parseFloat(action.payload.payout?.amount ?? '0');

        if (state.stats) {
          state.stats.earned_commissions = newBalance;
          state.stats.pending_commissions = Math.max(
            0,
            state.stats.pending_commissions - payoutAmt
          );
        }
      });
  },
});

export const { resetPayoutStatus } = referralSlice.actions;
export default referralSlice.reducer;

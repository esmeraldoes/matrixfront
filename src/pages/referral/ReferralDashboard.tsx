// // src/pages/referral/ReferralDashboard.tsx

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchReferralData } from '@/store/referralThunks';
import { fetchConnectedAccountStatus, fetchPayoutHistory } from '@/store/paymentThunks';
import { ReferralStatsCard } from './ReferralStatsCard';
import { ReferralLinkCard } from './ReferralLinkCard';
import { ReferralListCard } from './ReferralListCard';
import { StripeOnboardingCard } from './StripeOnboardingCard';
import { PayoutHistoryCard } from './PayoutHistoryCard';
import { ReferralTierExplanation } from './ReferralTierExplanation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Share2 } from 'lucide-react';

export const ReferralDashboard = () => {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.referrals);

  useEffect(() => {
    // Fetch all necessary data on component mount
    dispatch(fetchReferralData());
    dispatch(fetchConnectedAccountStatus());
    dispatch(fetchPayoutHistory({ page: 1, pageSize: 10 }));
  }, [dispatch]);

  // Check for onboarding success URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('onboarding') === 'success') {
      // Refresh account status after returning from Stripe
      dispatch(fetchConnectedAccountStatus());
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/referrals');
    }
  }, [dispatch]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading referral data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Referral Data</AlertTitle>
        <AlertDescription>
          {error || 'Failed to load referral information. Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Share the Power of AI Trading</h2>
            <p className="text-emerald-100 max-w-2xl">
              Invite friends to join Matrix Trading and earn rewards for every successful referral.
              The more friends you bring, the more you earn! Payouts are processed automatically on the 27th of each month.
            </p>
          </div>
          <Share2 className="w-16 h-16 text-emerald-100 flex-shrink-0" />
        </div>
      </div>

      {/* Stats Section */}
      <ReferralStatsCard />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <ReferralLinkCard />
          <StripeOnboardingCard />
          <ReferralTierExplanation />
        </div>
        
        {/* Right Column - 1/3 width on large screens */}
        <div className="lg:col-span-1 space-y-6">
          <ReferralListCard />
          <PayoutHistoryCard />
        </div>
      </div>
    </div>
  );
};
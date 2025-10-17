// src/pages/referral/ReferralStatsCard.tsx

import { Users, DollarSign, Activity, Award, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import CountUp from 'react-countup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

const tierColorMap: Record<string, string> = {
  bronze: 'bg-yellow-600 text-yellow-600',
  silver: 'bg-gray-400 text-gray-400',
  gold: 'bg-yellow-400 text-yellow-400',
  platinum: 'bg-blue-400 text-blue-400',
  default: 'bg-muted text-muted-foreground',
};

const getTierColor = (tierName: string = '') => {
  const key = tierName?.toLowerCase().trim();
  return tierColorMap[key] || tierColorMap.default;
};



// Payout Eligibility Card Component
const PayoutEligibilityCard = () => {
  const { stats } = useAppSelector((state) => state.referrals);
  const { connectedAccount } = useAppSelector((state) => state.payment);

  if (!stats) return null;

  const isEligible = stats.available_payout >= (stats.current_tier?.payout_threshold || 0);
  const hasConnectedAccount = connectedAccount?.payouts_enabled;
  
  // Calculate next payout date (27th of current or next month)
  const nextPayoutDate = new Date();
  nextPayoutDate.setDate(27);
  if (nextPayoutDate < new Date()) {
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
  }

  return (
    <Card className="rounded-lg border border-gray-200 bg-white dark:border-emerald-700 dark:bg-emerald-900/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-800 dark:text-emerald-100">
          Next Payout
        </CardTitle>
        <CreditCard className="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-emerald-50">
          ${stats.available_payout.toFixed(2)}
        </div>
        
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            {hasConnectedAccount ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 text-red-500" />
            )}
            <span className={hasConnectedAccount ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              Stripe {hasConnectedAccount ? 'Connected' : 'Not Set Up'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            {isEligible ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 text-yellow-500" />
            )}
            <span className={isEligible ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
              {isEligible ? 'Above threshold' : `Need $${((stats.current_tier?.payout_threshold || 0) - stats.available_payout).toFixed(2)} more`}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-emerald-200 mt-2">
          Next payout: {nextPayoutDate.toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
};





export const ReferralStatsCard = () => {
  const { stats } = useAppSelector((state) => state.referrals);

  if (!stats) return null;

  const {
    successful_referrals,
    pending_commissions,
    earned_commissions,
    current_tier,
    available_payout
  } = stats;

  const tierName = current_tier?.name || 'Unknown';
  const tierRate = current_tier?.commission_rate ?? 0;
  const minReferrals = current_tier?.min_referrals ?? 1;
  const maxReferrals = current_tier?.max_referrals ?? 1;
  
  // Improved progress calculation with better edge cases
  const calculateTierProgress = () => {
    if (maxReferrals <= minReferrals) return 100;
    
    const progress = ((successful_referrals - minReferrals) / (maxReferrals - minReferrals)) * 100;
    
    // Ensure progress is between 0-100
    return Math.min(Math.max(progress, 0), 100);
  };

  const tierProgress = calculateTierProgress();
  const tierColor = getTierColor(tierName);

  // Calculate referrals needed for next tier
  const referralsToNextTier = maxReferrals - successful_referrals;
  const isMaxTier = maxReferrals === successful_referrals;
  const hasReachedMinTier = successful_referrals >= minReferrals;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Referrals */}
      <StatCard
        title="Total Referrals"
        icon={<Users className="h-4 w-4 text-emerald-500" />}
        value={successful_referrals}
        isInteger={true}
      />

      {/* Pending */}
      <StatCard
        title="Pending Commissions"
        icon={<Activity className="h-4 w-4 text-emerald-500" />}
        value={pending_commissions}
        prefix="$"
        color="text-emerald-600 dark:text-emerald-400"
      />

      {/* Earned */}
      <StatCard
        title="Earned Commissions"
        icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
        value={earned_commissions}
        prefix="$"
      />
       <StatCard
        title="Available Payout"
        icon={<CreditCard className="h-4 w-4 text-emerald-500" />}
        value={available_payout}
        prefix="$"
        color="text-green-600 dark:text-green-400"
      />

       <PayoutEligibilityCard />

      {/* Tier Info */}
      <Card className="rounded-lg border border-gray-200 bg-white dark:border-emerald-700 dark:bg-emerald-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-800 dark:text-emerald-100">Current Tier</CardTitle>
          <Award className={`h-4 w-4 ${tierColor.split(' ')[1]} text-emerald-500`} />
        </CardHeader>
        <CardContent className="text-gray-700 dark:text-emerald-50">
          <div className={`text-2xl font-bold ${tierColor.split(' ')[1]}`}>
            {tierName}
          </div>
          <p className="text-xs text-gray-500 dark:text-emerald-200">{tierRate}% commission rate</p>

          {/* Enhanced Progress bar section */}
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-emerald-200 mb-1">
              <span>Tier Progress</span>
              <span className="font-medium">{Math.floor(tierProgress)}%</span>
            </div>
            
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-emerald-900/20">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${tierColor.split(' ')[0]}`}
                style={{ width: `${tierProgress}%` }}
              />
            </div>

            {/* Referral progress text */}
            <div className="flex justify-between text-xs text-gray-500 dark:text-emerald-200">
              <span>
                {successful_referrals} / {maxReferrals} referrals
              </span>
              {!isMaxTier && hasReachedMinTier && (
                <span className="font-medium">
                  {referralsToNextTier} more for next tier
                </span>
              )}
              {!hasReachedMinTier && (
                <span className="font-medium">
                  {minReferrals - successful_referrals} to reach {tierName}
                </span>
              )}
              {isMaxTier && (
                <span className="font-medium text-green-500">
                  Max tier achieved!
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({
  title,
  icon,
  value,
  prefix = '',
  color = 'text-gray-900 dark:text-emerald-50',
  isInteger = false,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  prefix?: string;
  color?: string;
  isInteger?: boolean;
}) => (
  <Card className="rounded-lg border border-gray-200 bg-white dark:border-emerald-700 dark:bg-emerald-900/20">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-800 dark:text-emerald-100">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color}`}>
        <CountUp end={value} duration={1.2} separator="," prefix={prefix} decimals={isInteger ? 0 : 2} />
      </div>
      <p className="text-xs text-gray-500 dark:text-emerald-200">All-time</p>
    </CardContent>
  </Card>
);


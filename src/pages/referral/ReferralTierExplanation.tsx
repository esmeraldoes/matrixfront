// src/pages/referral/ReferralTierExplanation.tsx

import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

export const ReferralTierExplanation = () => {
  const { stats } = useAppSelector((state) => state.referrals);
  
  if (!stats?.current_tier) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-500" />
            Rewards Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No referral data available</p>
        </CardContent>
      </Card>
    );
  }

  const { current_tier } = stats;

  const { 
    name = 'N/A', 
    commission_rate = 0, 
    max_referrals = 0 
  } = current_tier;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Award className="h-5 w-5 text-emerald-500" />
          Rewards Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Current Tier: {name}
            </p>
            <p className="text-sm text-muted-foreground text-gray-900 dark:text-white">
              Commission Rate: {commission_rate}%
            </p>
          </div>
          <Award className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
            How it works
          </h4>
          <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-2">
            <li>• Share your unique referral link with friends</li>
            <li>• Earn <b>{commission_rate}%</b> commission on their trading fees</li>
            <li>• Refer <b>{max_referrals}</b> persons to move to the next tier</li>
            <li>• Unlock higher commission rates as you refer more friends</li>
            <li>• Get paid monthly directly to your account</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
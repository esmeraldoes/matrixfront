// src/pages/referral/ReferralListCard.tsx
import { User, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';

export const ReferralListCard = () => {
  const { info } = useAppSelector((state) => state.referrals);

  if (!info || info.referrals.length === 0) return null;

  return (
    <Card className="rounded-xl bg-white dark:bg-gray-800 border border-emerald-800/0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <User className="h-5 w-5 text-emerald-500" />
          Your Referrals
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {info.referrals.map((referral, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0">
                  <User className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p
                    className="font-medium text-gray-900 dark:text-white truncate max-w-[160px] sm:max-w-[220px] md:max-w-[300px]"
                    title={referral.email}
                  >
                    {referral.email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Joined on {new Date(referral.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-emerald-600 flex-shrink-0">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {referral.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

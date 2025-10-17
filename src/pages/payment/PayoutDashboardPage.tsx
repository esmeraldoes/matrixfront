// src/pages/payment/PayoutDashboardPage.tsx
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchConnectedAccountStatus,
  fetchPayoutHistory,
} from '@/store/paymentThunks'; 
import type { AppDispatch, RootState } from '@/store/store';
import PayoutHistoryTable from './PayoutHistoryTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, 
  Banknote, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Clock,
  DollarSign
} from 'lucide-react';

// Create memoized selectors to prevent unnecessary re-renders
const selectPaymentData = (state: RootState) => ({
  connectedAccount: state.payment.connectedAccount,
  payoutHistory: state.payment.payoutHistory,
  connectedAccountStatus: state.payment.connectedAccountStatus,
  payoutHistoryStatus: state.payment.payoutHistoryStatus,
});

const PayoutDashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    connectedAccount,
    payoutHistory,
    connectedAccountStatus,
    payoutHistoryStatus,
  } = useSelector(selectPaymentData);

  useEffect(() => {
    dispatch(fetchConnectedAccountStatus());
    dispatch(fetchPayoutHistory({ page: 1, pageSize: 10 }));
  }, [dispatch]);

  // Calculate next payout date (27th of current or next month)
  const nextPayoutDate = useMemo(() => {
    const today = new Date();
    const currentMonthPayout = new Date(today.getFullYear(), today.getMonth(), 27);
    
    if (today.getDate() > 27) {
      // If past 27th, next payout is 27th of next month
      return new Date(today.getFullYear(), today.getMonth() + 1, 27);
    } else if (today.getDate() === 27) {
      // If today is 27th, show today
      return today;
    } else {
      // If before 27th, show 27th of current month
      return currentMonthPayout;
    }
  }, []);

  // Calculate days until next payout
  const daysUntilPayout = useMemo(() => {
    const today = new Date();
    const timeDiff = nextPayoutDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }, [nextPayoutDate]);

  // Check if user needs to complete setup
  const needsSetup = !connectedAccount;
  const needsOnboarding = connectedAccount && !connectedAccount.details_submitted;
  const underReview = connectedAccount && connectedAccount.details_submitted && !connectedAccount.payouts_enabled;
  const readyForPayouts = connectedAccount && connectedAccount.payouts_enabled;

  // Safe access to payout history data
  const payoutResults = payoutHistory?.results || [];
  const payoutCount = payoutHistory?.count || 0;

  if (connectedAccountStatus === 'loading') {
    return (
      <div className="container mx-auto py-12 max-w-4xl">
        <LoadingSpinner text="Loading payout information..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Payout Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your affiliate commission payouts
        </p>
      </div>

      {/* Automatic Payout System Banner */}
      <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Automatic Payout System</h2>
            </div>
            <p className="text-blue-100 mb-4">
              💫 Payouts are processed <strong>automatically on the 27th of each month</strong>. 
              No manual requests needed!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  <strong>Next Payout:</strong> {nextPayoutDate.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  <strong>In:</strong> {daysUntilPayout} day{daysUntilPayout !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>
                  <strong>Minimum:</strong> $0.50
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{daysUntilPayout}</div>
            <div className="text-xs text-blue-100">days left</div>
          </div>
        </div>
      </div>

      {/* Account Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Status Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Account Status
          </h2>
          
          {needsSetup && (
            <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertTitle className="text-orange-800 dark:text-orange-200">
                Setup Required
              </AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                You need to set up a Stripe Connect account to receive payouts.
              </AlertDescription>
              <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
                <a href="/stripe-connect" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Set Up Payout Account
                </a>
              </Button>
            </Alert>
          )}

          {needsOnboarding && (
            <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                Complete Onboarding
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Please complete your Stripe onboarding to enable payouts.
              </AlertDescription>
              <Button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white">
                <a href="/stripe-connect" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Complete Setup
                </a>
              </Button>
            </Alert>
          )}

          {underReview && (
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">
                Under Review
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Your account is being reviewed by Stripe. This usually takes 1-2 business days.
              </AlertDescription>
            </Alert>
          )}

          {readyForPayouts && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Ready for Payouts!
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Your account is fully set up. You'll receive automatic payouts on the 27th of each month.
              </AlertDescription>
            </Alert>
          )}

          {/* Account Details */}
          {connectedAccount && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account ID:</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {connectedAccount.account_id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Country:</span>
                  <span className="text-gray-900 dark:text-white">{connectedAccount.country}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                  <span className="text-gray-900 dark:text-white">{connectedAccount.default_currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Details Submitted:</span>
                  <span className={connectedAccount.details_submitted ? "text-green-600 font-semibold" : "text-red-600"}>
                    {connectedAccount.details_submitted ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-6">
          {/* Next Payout Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Next Payout</h3>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {nextPayoutDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {daysUntilPayout === 0 
                  ? 'Today' 
                  : `${daysUntilPayout} day${daysUntilPayout !== 1 ? 's' : ''}`
                }
              </div>
            </div>
          </div>

          {/* Requirements Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Banknote className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Requirements</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Minimum: $0.50
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Automatic processing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                2-5 business days
              </li>
            </ul>
          </div>

          {/* Help Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Need Help?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Questions about payouts or account setup?
            </p>
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </div>

      {/* Payout History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payout History
          </h2>
          {payoutCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {payoutCount} total payout{payoutCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {payoutHistoryStatus === 'loading' ? (
          <LoadingSpinner text="Loading payout history..." />
        ) : payoutResults.length === 0 ? (
          <div className="text-center py-12">
            <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Payout History
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {readyForPayouts 
                ? "Your payouts will appear here after your first automatic payment on the 27th."
                : "Complete your account setup to start receiving payouts."
              }
            </p>
          </div>
        ) : (
          <PayoutHistoryTable payouts={payoutResults} />
        )}
      </div>

      {/* FAQ Section */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              When will I receive my payout?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Payouts are processed automatically on the 27th of each month. Funds typically arrive in your bank account within 2-5 business days.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              What's the minimum payout amount?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The minimum payout is $0.50, which is Stripe's requirement. You must also meet your commission tier's threshold.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Why is my account under review?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stripe reviews all new accounts for compliance. This usually takes 1-2 business days. You'll be notified when approved.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Can I change my bank account?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Yes, you can update your bank account information through your Stripe dashboard at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutDashboardPage;


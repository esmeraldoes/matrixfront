// SubscriptionCard.tsx
import React from 'react';
import { type UserSubscription, SubscriptionStatus } from '@/services/api_payment';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SubscriptionCardProps {
  subscription: UserSubscription;
  onCancel: () => void;
  onReactivate: () => void;
  isCanceling: boolean;
  isReactivating: boolean;
}

const getStatusStyles = (
  status: SubscriptionStatus,
  isCancelAtPeriodEnd: boolean
): { dot: string; text: string; label: string } => {
  const statusName = status.toLowerCase();

  if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING) {
    if (isCancelAtPeriodEnd) {
      return { dot: 'bg-yellow-400', text: 'text-yellow-600 dark:text-yellow-400', label: 'Cancelling soon' };
    }
    return { dot: 'bg-teal-400', text: 'text-teal-600 dark:text-teal-400', label: statusName };
  }

  if (status === SubscriptionStatus.CANCELED || status === SubscriptionStatus.INCOMPLETE_EXPIRED) {
    return { dot: 'bg-red-400', text: 'text-red-600 dark:text-red-400', label: statusName };
  }

  return { dot: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400', label: statusName };
};

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onCancel,
  onReactivate,
  isCanceling,
  isReactivating,
}) => {
  const isCancelAtPeriodEnd = subscription.cancel_at_period_end;
  const isCancellable =
    (subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING) &&
    !isCancelAtPeriodEnd;
  const statusStyles = getStatusStyles(subscription.status, isCancelAtPeriodEnd);
  const isActionLoading = isCanceling || isReactivating;

  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
        <div>
          <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {subscription.plan.name}
          </h3>
          <div className="flex items-center mt-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${statusStyles.dot}`} />
            <span className={`text-xs font-semibold capitalize ${statusStyles.text}`}>
              {statusStyles.label}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-extrabold text-gray-900 dark:text-white">
            ${subscription.plan.amount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            /{subscription.plan.duration}
          </p>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Subscription ID</p>
          <p className="text-gray-700 dark:text-gray-300 font-mono truncate">{subscription.id}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Billing Period</p>
          <p className="text-gray-700 dark:text-gray-300">
            {new Date(subscription.current_period_start).toLocaleDateString()} –{' '}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        </div>
      </div>

      {isCancelAtPeriodEnd && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-2 mb-3 rounded-md">
          <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
            Scheduled to cancel on {new Date(subscription.current_period_end).toLocaleDateString()}.
          </p>
        </div>
      )}

      <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        {isCancelAtPeriodEnd && (
          <Button
            onClick={onReactivate}
            disabled={isActionLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReactivating ? <LoadingSpinner size="sm" /> : 'Reactivate'}
          </Button>
        )}
        {isCancellable && (
          <Button
            onClick={onCancel}
            disabled={isActionLoading}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCanceling ? <LoadingSpinner size="sm" /> : 'Cancel'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
// SubscriptionsPage.tsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import type { UserSubscription } from '@/services/api_payment';
import {
  fetchUserSubscriptions,
  cancelSubscription,
  reactivateSubscription,
} from '@/store/paymentThunks';
import { resetOperationStatus } from '@/store/paymentSlice';
import type { AppDispatch, RootState } from '@/store/store';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import SubscriptionCard from './SubscriptionCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';


const SubscriptionsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);

  const subscriptions = useSelector(
    (state: RootState) => state.payment.subscriptions,
    shallowEqual
  );
  const status = useSelector(
    (state: RootState) => state.payment.subscriptionsStatus
  );
  const cancelStatus = useSelector(
    (state: RootState) => state.payment.operations.cancelSubscription
  );
  const reactivateStatus = useSelector(
    (state: RootState) => state.payment.operations.reactivateSubscription
  );

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUserSubscriptions());
    }
  }, [dispatch, status]);

  // Refetch subscriptions when cancel/reactivate operations complete
  useEffect(() => {
    if (cancelStatus === 'succeeded' || reactivateStatus === 'succeeded') {
      dispatch(fetchUserSubscriptions());
      // Reset operation status after refetching
      setTimeout(() => {
        dispatch(resetOperationStatus('cancelSubscription'));
        dispatch(resetOperationStatus('reactivateSubscription'));
      }, 1000);
    }
  }, [cancelStatus, reactivateStatus, dispatch]);

  const handleCancel = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setShowCancelModal(true);
  };

  const handleReactivate = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setShowReactivateModal(true);
  };

  const confirmCancel = () => {
    if (!selectedSubscription) return;

    dispatch(cancelSubscription(selectedSubscription.id))
      .unwrap()
      .then(() => {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled. You will retain access until the end of the current billing period.",
          variant: "default",
        });
        setShowCancelModal(false);
        setSelectedSubscription(null);
        // No need to manually refetch here - the useEffect will handle it
      })
      .catch((error) => {
        toast({
          title: "Cancellation Failed",
          description: error.message || "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
        setShowCancelModal(false);
        setSelectedSubscription(null);
      });
  };

  const confirmReactivate = () => {
    if (!selectedSubscription) return;

    dispatch(reactivateSubscription(selectedSubscription.id))
      .unwrap()
      .then(() => {
        toast({
          title: "Subscription Reactivated",
          description: "Your subscription has been reactivated successfully.",
          variant: "default",
        });
        setShowReactivateModal(false);
        setSelectedSubscription(null);
        // No need to manually refetch here - the useEffect will handle it
      })
      .catch((error) => {
        toast({
          title: "Reactivation Failed",
          description: error.message || "Failed to reactivate subscription. Please try again.",
          variant: "destructive",
        });
        setShowReactivateModal(false);
        setSelectedSubscription(null);
      });
  };

  if (status === 'loading')
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );

  if (status === 'failed')
    return (
      <div className="text-center p-10 bg-red-50 text-red-700 border border-red-200 rounded-lg max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-semibold mb-2">Error Loading Subscriptions</h2>
        <p>Could not fetch your subscription data. Please try again later.</p>
      </div>
    );

  return (
    <>
      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedSubscription(null);
        }}
        onConfirm={confirmCancel}
        title="Cancel Subscription"
        message={
          selectedSubscription ? (
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to cancel your <strong>{selectedSubscription.plan.name}</strong> subscription?
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You will retain access to all features until{' '}
                  <strong>{new Date(selectedSubscription.current_period_end).toLocaleDateString()}</strong>.
                </p>
              </div>
            </div>
          ) : null
        }
        confirmText="Cancel Subscription"
        variant="warning"
        isLoading={cancelStatus === 'loading'}
      />

      {/* Reactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showReactivateModal}
        onClose={() => {
          setShowReactivateModal(false);
          setSelectedSubscription(null);
        }}
        onConfirm={confirmReactivate}
        title="Reactivate Subscription"
        message={
          selectedSubscription ? (
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to reactivate your <strong>{selectedSubscription.plan.name}</strong> subscription?
            </p>
          ) : null
        }
        confirmText="Reactivate Subscription"
        variant="info"
        isLoading={reactivateStatus === 'loading'}
      />

      <div className="bg-white dark:bg-gray-900 min-h-screen py-12 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-300 mb-8 border-b pb-4">
            Your Subscriptions
          </h1>

          {subscriptions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg text-center border border-gray-200 dark:border-gray-700">
              <svg
                className="mx-auto h-12 w-12 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4 mb-4">
                No Active Subscriptions Found
              </p>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                It looks like you haven't subscribed to any of our plans yet.
              </p>
              <a
                href="/plans"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Plans
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {subscriptions.map((subscription: UserSubscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onCancel={() => handleCancel(subscription)}
                  onReactivate={() => handleReactivate(subscription)}
                  isCanceling={cancelStatus === 'loading'}
                  isReactivating={reactivateStatus === 'loading'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscriptionsPage;
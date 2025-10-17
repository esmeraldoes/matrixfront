import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSubscriptionPlans } from '@/store/paymentThunks';
import { selectActivePlans, selectPlansStatus, selectPlansError } from '@/store/paymentSlice';
import type { AppDispatch } from '@/store/store';
import PlanCard from './PlanCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const PlansPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const plans = useSelector(selectActivePlans);
  const status = useSelector(selectPlansStatus);
  const error = useSelector(selectPlansError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSubscriptionPlans());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <LoadingSpinner />;
  if (status === 'failed')
    return (
      <div className="text-center p-10 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-lg max-w-lg mx-auto mt-10 shadow-md">
        <h2 className="text-xl font-semibold mb-2">Failed to Load Plans 😔</h2>
        <p>{error}</p>
        <p className="mt-4 text-sm">Please try refreshing the page or contact support.</p>
      </div>
    );

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-200 sm:text-4xl">
            Choose Your Plan
          </h1>
          <p className="mt-2 text-md text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Unlock powerful features and scale your trades with a simple, transparent plan.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 md:grid-cols-2 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlansPage;


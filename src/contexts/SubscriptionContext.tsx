import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionService } from '../services/subscription';

interface SubscriptionContextType {
  isTrialActive: boolean;
  isPremium: boolean;
  trialEndsAt: Date | null;
  daysLeftInTrial: number;
  upgradeToPremium: (paymentMethodId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) return;
      try {
        const data = await subscriptionService.getSubscriptionStatus(user.id);
        setSubscription(data);
      } catch (error) {
        console.error('Error loading subscription:', error);
      }
    };

    loadSubscription();
  }, [user]);

  const isTrialActive = subscription?.status === 'TRIAL' && 
    new Date(subscription.trial_ends_at) > new Date();

  const isPremium = subscription?.status === 'ACTIVE';

  const trialEndsAt = subscription?.trial_ends_at ? 
    new Date(subscription.trial_ends_at) : null;

  const daysLeftInTrial = trialEndsAt ? 
    Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const upgradeToPremium = async (paymentMethodId: string) => {
    if (!user) throw new Error('User not authenticated');
    await subscriptionService.upgradeToPremium(user.id, paymentMethodId);
    const data = await subscriptionService.getSubscriptionStatus(user.id);
    setSubscription(data);
  };

  const cancelSubscription = async () => {
    if (!user) throw new Error('User not authenticated');
    await subscriptionService.cancelSubscription(user.id);
    const data = await subscriptionService.getSubscriptionStatus(user.id);
    setSubscription(data);
  };

  return (
    <SubscriptionContext.Provider value={{
      isTrialActive,
      isPremium,
      trialEndsAt,
      daysLeftInTrial,
      upgradeToPremium,
      cancelSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
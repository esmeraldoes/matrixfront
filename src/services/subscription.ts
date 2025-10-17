import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY || 'pk_test_51Qr3NcCVV6Nkon5YTT95VUx37LfK4FFesVShkzpKS5LK9udS2pk0zk8zRiuFI12wgwAvIkc4uzZXa528DVopo1IG00GKqyeuay', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const subscriptionService = {
  async startTrial(userId: string) {
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select()
      .eq('name', 'Free Trial')
      .single();

    if (!tier) throw new Error('Trial tier not found');

    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 7);

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier_id: tier.id,
        status: 'TRIAL',
        trial_ends_at: trialEnds.toISOString(),
        current_period_starts_at: new Date().toISOString(),
        current_period_ends_at: trialEnds.toISOString()
      });

    if (error) throw error;
  },

  async upgradeToPremium(userId: string, paymentMethodId: string) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (!user) throw new Error('User not found');

      const { data: tier } = await supabase
        .from('subscription_tiers')
        .select()
        .eq('name', 'Premium')
        .single();

      if (!tier) throw new Error('Premium tier not found');

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: import.meta.env.VITE_STRIPE_PRICE_ID }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update database
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          tier_id: tier.id,
          status: 'ACTIVE',
          current_period_starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_ends_at: new Date(subscription.current_period_end * 1000).toISOString()
        });

      if (error) throw error;

      return subscription;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  },

  async cancelSubscription(userId: string) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .single();

    if (!subscription) throw new Error('No active subscription found');

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (error) throw error;
  },

  async getSubscriptionStatus(userId: string) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_tiers (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return subscription;
  }
};
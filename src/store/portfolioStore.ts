// src/store/portfolioStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Portfolio, PortfolioSubscription, PortfolioTrade } from '@/hooks/usePortfolios';

interface PortfolioState {
  // Portfolio data
  portfolios: Portfolio[];
  portfolioSubscriptions: PortfolioSubscription[];
  portfolioTrades: PortfolioTrade[];
  selectedPortfolio: Portfolio | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  filters: {
    risk_level?: number;
    duration?: string;
    strategy_type?: string;
    min_investment?: number;
  };

  // Portfolio actions
  setPortfolios: (portfolios: Portfolio[]) => void;
  setSubscriptions: (subscriptions: PortfolioSubscription[]) => void;
  setTrades: (trades: PortfolioTrade[]) => void;
  setSelectedPortfolio: (portfolio: Portfolio | null) => void;
  
  // Subscription management
  addSubscription: (subscription: PortfolioSubscription) => void;
  updateSubscription: (id: number, changes: Partial<PortfolioSubscription>) => void;
  removeSubscription: (id: number) => void;
  
  // Filter management
  setFilters: (filters: Partial<PortfolioState['filters']>) => void;
  clearFilters: () => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility functions
  getSubscription: (portfolioId: number) => PortfolioSubscription | undefined;
  getPortfolioPerformance: (portfolioId: number) => number;
  getTotalInvested: () => number;
  getTotalValue: () => number;
}

const initialState = {
  portfolios: [],
  portfolioSubscriptions: [],
  portfolioTrades: [],
  selectedPortfolio: null,
  isLoading: false,
  error: null,
  filters: {},
};

export const usePortfolioStore = create<PortfolioState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Portfolio data setters
        setPortfolios: (portfolios) => {
          console.log('📊 Setting portfolios:', portfolios.length);
          set({ portfolios });
        },

        setSubscriptions: (subscriptions) => {
          console.log('📋 Setting portfolio subscriptions:', subscriptions.length);
          set({ portfolioSubscriptions: subscriptions });
        },

        setTrades: (trades) => {
          console.log('📈 Setting portfolio trades:', trades.length);
          set({ portfolioTrades: trades });
        },

        setSelectedPortfolio: (portfolio) => {
          console.log('🎯 Setting selected portfolio:', portfolio?.name);
          set({ selectedPortfolio: portfolio });
        },

        // Subscription management
        addSubscription: (subscription) => {
          set((state) => ({
            portfolioSubscriptions: [...state.portfolioSubscriptions, subscription]
          }));
        },

        updateSubscription: (id, changes) => {
          set((state) => ({
            portfolioSubscriptions: state.portfolioSubscriptions.map((sub) =>
              sub.id === id ? { ...sub, ...changes } : sub
            )
          }));
        },

        removeSubscription: (id) => {
          set((state) => ({
            portfolioSubscriptions: state.portfolioSubscriptions.filter((sub) => sub.id !== id)
          }));
        },

        // Filter management
        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters }
          }));
        },

        clearFilters: () => {
          set({ filters: {} });
        },

        // UI actions
        setLoading: (loading) => {
          set({ isLoading: loading });
        },

        setError: (error) => {
          console.error('🚨 Portfolio store error:', error);
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        // Utility functions
        getSubscription: (portfolioId) => {
          const state = get();
          return state.portfolioSubscriptions.find(
            sub => sub.portfolio === portfolioId && sub.status === 'active'
          );
        },

        getPortfolioPerformance: (portfolioId) => {
          const state = get();
          const portfolio = state.portfolios.find(p => p.id === portfolioId);
          return portfolio?.total_return || 0;
        },

        getTotalInvested: () => {
          const state = get();
          return state.portfolioSubscriptions.reduce(
            (total, sub) => total + sub.allocation_amount, 
            0
          );
        },

        getTotalValue: () => {
          const state = get();
          return state.portfolioSubscriptions.reduce(
            (total, sub) => total + sub.current_value, 
            0
          );
        },
      }),
      {
        name: 'portfolio-storage',
        partialize: (state) => ({
          portfolios: state.portfolios,
          portfolioSubscriptions: state.portfolioSubscriptions,
          portfolioTrades: state.portfolioTrades,
          selectedPortfolio: state.selectedPortfolio,
          filters: state.filters,
        }),
        version: 1,
      }
    ),
    {
      name: 'PortfolioStore',
    }
  )
);

// Derived state hooks
export const usePortfolios = () => {
  return usePortfolioStore((state) => ({
    portfolios: state.portfolios,
    isLoading: state.isLoading,
    filters: state.filters,
    setPortfolios: state.setPortfolios,
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
  }));
};

export const usePortfolioSubscriptions = () => {
  return usePortfolioStore((state) => ({
    subscriptions: state.portfolioSubscriptions,
    isLoading: state.isLoading,
    getSubscription: state.getSubscription,
    addSubscription: state.addSubscription,
    updateSubscription: state.updateSubscription,
    removeSubscription: state.removeSubscription,
    totalInvested: state.getTotalInvested(),
    totalValue: state.getTotalValue(),
  }));
};

export const useSelectedPortfolio = () => {
  return usePortfolioStore((state) => ({
    selectedPortfolio: state.selectedPortfolio,
    setSelectedPortfolio: state.setSelectedPortfolio,
    isSubscribed: state.selectedPortfolio 
      ? state.portfolioSubscriptions.some(
          sub => sub.portfolio === state.selectedPortfolio?.id && sub.status === 'active'
        )
      : false,
  }));
};

export const usePortfolioFilters = () => {
  return usePortfolioStore((state) => ({
    filters: state.filters,
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
  }));
};

export const usePortfolioStats = () => {
  return usePortfolioStore((state) => ({
    totalPortfolios: state.portfolios.length,
    totalSubscriptions: state.portfolioSubscriptions.length,
    totalInvested: state.getTotalInvested(),
    totalValue: state.getTotalValue(),
    activeSubscriptions: state.portfolioSubscriptions.filter(sub => sub.status === 'active').length,
  }));
};
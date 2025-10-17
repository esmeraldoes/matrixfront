// src/store/tradingStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { TradeEvent, Bar, Trade, Portfolio, PortfolioSubscription, PortfolioTrade } from "./types/trading";
import { nanoid } from "nanoid";
import { aggregateBars, timeframeToMilliseconds } from "@/utils/dataAggregation";
import { normalizeBar, type CandleWithVolume } from "@/utils/normalizerBars";

import type { 
  Position, Order,
  Quote, AccountSnapshot, PortfolioHistory, MarketTrade,
  Asset, MarketClock, MarketCalendarDay, Watchlist 
} from "./types/trading";

/* ----------------------------- Real-time Candle Types ----------------------------- */
export interface RealTimeCandle {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  isForming: boolean;
  tradeCount: number;
  startTime: number;
}

export interface HistoricalDataState {
  bars: CandleWithVolume[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  lastFetchTime: number | null;
  timeframe?: string;
}

export interface MarketDataUpdateOptions {
  append?: boolean;
  prepend?: boolean;
  reset?: boolean;
  hasMore?: boolean;
  timeframe?: string;
}

/* ----------------------------- Trading State Interface ----------------------------- */
interface TradingState {
  positions: Position[];
  orders: Order[];
  assets: Asset[];
  account: AccountSnapshot | null;
  selectedSymbol: string | null;
  timeframe: string;
  portfolioHistory: PortfolioHistory | null;

  marketData: Record<string, HistoricalDataState>;
  aggregatedMarketData: Record<string, Record<string, CandleWithVolume[]>>;

  quotes: Record<string, Quote>;
  tradeEvents: TradeEvent[];
  marketTrades: Record<string, MarketTrade[]>;

  currentPrices: Record<string, number>;

  isMarketDataConnected: boolean;
  isTradingConnected: boolean;
  isLoading: boolean;
  marketClock: MarketClock | null;
  marketCalendar: MarketCalendarDay[];
  watchlists: Watchlist[];
  selectedWatchlist: Watchlist | null;
  error: string | null;

  // Portfolio state
  portfolios: Portfolio[];
  portfolioSubscriptions: PortfolioSubscription[];
  portfolioTrades: PortfolioTrade[];
  selectedPortfolio: Portfolio | null;


  setSelectedSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: string) => void;

  updatePositions: (positions: Position[]) => void;
  updateOrders: (orders: Order[]) => void;
  updateOrder: (id: string, changes: Partial<Order>) => void;
  removeOrder: (id: string) => void;

  updateAccount: (account: AccountSnapshot) => void;
  updateAssets: (assets: Asset[]) => void;
  updatePortfolioHistory: (history: PortfolioHistory) => void;

  updateMarketData: (symbol: string, data: CandleWithVolume[], options?: MarketDataUpdateOptions) => void;
  addMarketData: (symbol: string, data: CandleWithVolume) => void;
  loadHistoricalBars: (symbol: string, bars: CandleWithVolume[], options?: { hasMore?: boolean; reset?: boolean; timeframe?: string }) => void;
  prependHistoricalBars: (symbol: string, bars: CandleWithVolume[]) => void;
  appendHistoricalBars: (symbol: string, bars: CandleWithVolume[]) => void;
  clearHistoricalBars: (symbol: string) => void;
  
  setMarketDataLoading: (symbol: string, loading: boolean, loadingMore?: boolean) => void;
  setMarketDataError: (symbol: string, error: string | null) => void;

  getOldestBarTime: (symbol: string) => number | null;
  getNewestBarTime: (symbol: string) => number | null;
  getBarsCount: (symbol: string) => number;
  getMarketDataState: (symbol: string) => HistoricalDataState | null;
  hasMarketData: (symbol: string) => boolean;

  updateQuote: (symbol: string, quote: Quote) => void;
  updateTrades: (symbol: string, trade: Trade) => void;
  updateBars: (symbol: string, bar: Bar) => void;
  addMarketTrade: (symbol: string, trade: MarketTrade) => void;

  updateCurrentPrice: (symbol: string, price: number) => void;

  addTradeEvent: (event: Omit<TradeEvent, "id">) => void;
  clearTradeEvents: () => void;

  updateMarketClock: (clock: MarketClock) => void;
  updateMarketCalendar: (calendar: MarketCalendarDay[]) => void;

  updateWatchlists: (watchlists: Watchlist[]) => void;
  setSelectedWatchlist: (watchlist: Watchlist | null) => void;
  addToWatchlist: (watchlistId: string, symbol: string) => void;
  removeFromWatchlist: (watchlistId: string, symbol: string) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (market: boolean, trading: boolean) => void;
  clearStore: () => void;
  
  aggregateMarketData: (symbol: string, timeframe: string) => CandleWithVolume[];
  getAggregatedData: (symbol: string, timeframe: string) => CandleWithVolume[];


   // Portfolio actions
  updatePortfolios: (portfolios: Portfolio[]) => void;
  updatePortfolioSubscriptions: (subscriptions: PortfolioSubscription[]) => void;
  updatePortfolioTrades: (trades: PortfolioTrade[]) => void;
  setSelectedPortfolio: (portfolio: Portfolio | null) => void;
  addPortfolioSubscription: (subscription: PortfolioSubscription) => void;
  updatePortfolioSubscription: (id: number, changes: Partial<PortfolioSubscription>) => void;
  removePortfolioSubscription: (id: number) => void;

   

}

/* ----------------------------- Initial State ----------------------------- */
const initialHistoricalDataState: HistoricalDataState = {
  bars: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  lastFetchTime: null,
};

const initialState = {
  positions: [],
  orders: [],
  assets: [],
  account: null,
  selectedSymbol: null,
  timeframe: "1m",
  portfolioHistory: null,
  marketData: {},
  aggregatedMarketData: {},
  quotes: {},
  tradeEvents: [],
  marketTrades: {},
  currentPrices: {}, // ADDED: Simple current prices
  isMarketDataConnected: false,
  isTradingConnected: false,
  isLoading: false,
  marketClock: null,
  marketCalendar: [],
  watchlists: [],
  selectedWatchlist: null,
  error: null,

  portfolios: [],
  portfolioSubscriptions: [],
  portfolioTrades: [],
  selectedPortfolio: null,
};

/* ----------------------------- Store Implementation ----------------------------- */
export const useTradingStore = create<TradingState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        /* -------------------- Symbol and Timeframe -------------------- */
        setSelectedSymbol: (symbol) => {
          console.log("🎯 Setting selected symbol:", symbol);
          set({ selectedSymbol: symbol });
        },

        setTimeframe: (timeframe) => {
          console.log("🕒 Setting timeframe:", timeframe);
          set({ timeframe });
        },

        /* -------------------- Position and Order Management -------------------- */
        updatePositions: (positions) => {
          console.log("📊 Updating positions:", positions.length);
          set({ positions });
        },

        updateOrders: (orders) => {
          console.log("📋 Updating orders:", orders.length);
          set({ orders });
        },

        updateOrder: (id, changes) =>
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === id ? { ...o, ...changes } : o
            ),
          })),

        removeOrder: (id) =>
          set((state) => ({
            orders: state.orders.filter((o) => o.id !== id),
          })),

        /* -------------------- Account Management -------------------- */
        updateAccount: (account) => {
          console.log("💳 Updating account snapshot");
          set({ account });
        },

        updateAssets: (assets) => {
          console.log("🏦 Updating assets:", assets.length);
          set({ assets });
        },

        updatePortfolioHistory: (history) => {
          console.log("📈 Updating portfolio history");
          set({ portfolioHistory: history });
        },

        /* -------------------- Market Data Management -------------------- */
        updateMarketData: (symbol, data, options = {}) =>
          set((state) => {
            const currentState = state.marketData[symbol] || { ...initialHistoricalDataState };
            
            console.log("🔄 Updating market data:", {
              symbol,
              newBars: data.length,
              options,
              currentBars: currentState.bars.length
            });

            let newBars: CandleWithVolume[];
            
            if (options.reset) {
              newBars = data;
            } else if (options.prepend) {
              newBars = [...data, ...currentState.bars];
            } else if (options.append) {
              newBars = [...currentState.bars, ...data];
            } else {
              newBars = data;
            }

            const uniqueBars = newBars
              .reduce((acc, bar) => {
                const existingIndex = acc.findIndex(b => b.time === bar.time);
                if (existingIndex === -1) {
                  acc.push(bar);
                } else {
                  acc[existingIndex] = bar;
                }
                return acc;
              }, [] as CandleWithVolume[])
              .sort((a, b) => a.time - b.time);

            const limitedBars = uniqueBars.slice(-5000);

            const updatedState: HistoricalDataState = {
              ...currentState,
              bars: limitedBars,
              isLoading: false,
              isLoadingMore: false,
              error: null,
              hasMore: options.hasMore ?? currentState.hasMore,
              lastFetchTime: Date.now(),
              timeframe: options.timeframe || currentState.timeframe,
            };

            const updatedMarketData = { 
              ...state.marketData, 
              [symbol]: updatedState 
            };

            // Update aggregated data
            const updatedAggregated = { ...state.aggregatedMarketData };
            if (!updatedAggregated[symbol]) updatedAggregated[symbol] = {};

            const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
            timeframes.forEach((tf) => {
              try {
                updatedAggregated[symbol][tf] = aggregateBars(
                  limitedBars,
                  timeframeToMilliseconds(tf)
                );
                console.log(`✅ Aggregated ${symbol} ${tf}:`, updatedAggregated[symbol][tf].length);
              } catch (error) {
                console.error(`❌ Aggregation error for ${symbol} ${tf}:`, error);
                updatedAggregated[symbol][tf] = updatedAggregated[symbol][tf] || [];
              }
            });

            return { 
              marketData: updatedMarketData, 
              aggregatedMarketData: updatedAggregated 
            };
          }),

        addMarketData: (symbol, data) =>
          set((state) => {
            const currentState = state.marketData[symbol] || { ...initialHistoricalDataState };
            const currentBars = currentState.bars;
            const lastBar = currentBars.at(-1);
            
            let newBars: CandleWithVolume[];
            
            if (lastBar && lastBar.time === data.time) {
              newBars = [...currentBars.slice(0, -1), data];
              console.log(`🔄 Replaced last candle for ${symbol} at timestamp ${data.time}`);
            } else {
              newBars = [...currentBars, data];
              console.log(`📊 Appended new candle for ${symbol} at timestamp ${data.time}`);
            }

            const limitedBars = newBars.slice(-2000);

            const updatedState: HistoricalDataState = {
              ...currentState,
              bars: limitedBars,
            };

            const updatedMarketData = { 
              ...state.marketData, 
              [symbol]: updatedState 
            };

            const updatedAggregated = { ...state.aggregatedMarketData };
            if (!updatedAggregated[symbol]) updatedAggregated[symbol] = {};

            const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
            timeframes.forEach((tf) => {
              try {
                updatedAggregated[symbol][tf] = aggregateBars(
                  limitedBars,
                  timeframeToMilliseconds(tf)
                );
              } catch (error) {
                console.error(`Aggregation error for ${symbol} ${tf}:`, error);
                updatedAggregated[symbol][tf] = updatedAggregated[symbol][tf] || [];
              }
            });

            return { 
              marketData: updatedMarketData, 
              aggregatedMarketData: updatedAggregated 
            };
          }),

        loadHistoricalBars: (symbol, bars, options = {}) => {
          console.log("💾 Loading historical bars:", {
            symbol,
            barsCount: bars.length,
            options
          });
          get().updateMarketData(symbol, bars, { 
            reset: options.reset ?? true, 
            hasMore: options.hasMore,
            timeframe: options.timeframe 
          });
        },

        prependHistoricalBars: (symbol, bars) => {
          console.log("📥 Prepending historical bars:", {
            symbol,
            newBars: bars.length
          });
          get().updateMarketData(symbol, bars, { prepend: true });
        },

        appendHistoricalBars: (symbol, bars) => {
          console.log("📤 Appending historical bars:", {
            symbol,
            newBars: bars.length
          });
          get().updateMarketData(symbol, bars, { append: true });
        },

        clearHistoricalBars: (symbol) => {
          console.log("🗑️ Clearing historical bars for:", symbol);
          set((state) => {
            const updatedMarketData = { ...state.marketData };
            const updatedAggregated = { ...state.aggregatedMarketData };
            
            delete updatedMarketData[symbol];
            delete updatedAggregated[symbol];
            
            return { 
              marketData: updatedMarketData, 
              aggregatedMarketData: updatedAggregated 
            };
          });
        },

        /* -------------------- Loading States -------------------- */
        setMarketDataLoading: (symbol, loading, loadingMore = false) =>
          set((state) => {
            const currentState = state.marketData[symbol] || { ...initialHistoricalDataState };

            const updatedState: HistoricalDataState = {
              ...currentState,
              isLoading: loading && !loadingMore,
              isLoadingMore: loading && loadingMore,
              error: loading ? null : currentState.error,
            };

            return {
              marketData: {
                ...state.marketData,
                [symbol]: updatedState,
              },
            };
          }),

        setMarketDataError: (symbol, error) =>
          set((state) => {
            const currentState = state.marketData[symbol] || { ...initialHistoricalDataState };

            const updatedState: HistoricalDataState = {
              ...currentState,
              isLoading: false,
              isLoadingMore: false,
              error,
            };

            return {
              marketData: {
                ...state.marketData,
                [symbol]: updatedState,
              },
            };
          }),

        /* -------------------- Data Access Methods -------------------- */
        getOldestBarTime: (symbol: string): number | null => {
          const state = get();
          const bars = state.marketData[symbol]?.bars;
          if (!bars || bars.length === 0) return null;
          const oldestBar = bars[0];
          return typeof oldestBar.time === 'number' ? oldestBar.time : 
                 parseInt(oldestBar.time as any) || null;
        },

        getNewestBarTime: (symbol: string): number | null => {
          const state = get();
          const bars = state.marketData[symbol]?.bars;
          if (!bars || bars.length === 0) return null;
          const newestBar = bars[bars.length - 1];
          return typeof newestBar.time === 'number' ? newestBar.time : 
                 parseInt(newestBar.time as any) || null;
        },

        getBarsCount: (symbol: string): number => {
          const state = get();
          return state.marketData[symbol]?.bars.length || 0;
        },

        getMarketDataState: (symbol: string): HistoricalDataState | null => {
          const state = get();
          return state.marketData[symbol] || null;
        },

        hasMarketData: (symbol: string): boolean => {
          const state = get();
          return !!(state.marketData[symbol]?.bars.length);
        },

        /* -------------------- Real-time Data Handlers -------------------- */
        updateQuote: (symbol, quote) => {
          set((state) => ({ 
            quotes: { ...state.quotes, [symbol]: quote } 
          }));
        },

        updateTrades: (symbol, trade) =>
          set((state) => {
            const current = state.marketTrades[symbol] || [];
            const marketTrade: MarketTrade = {
              id: nanoid(),
              symbol: (trade as any).symbol || symbol,
              price: (trade as any).price || 0,
              size: (trade as any).size || 0,
              timestamp: new Date((trade as any).timestamp || Date.now()),
              exchange: (trade as any).exchange || "",
              conditions: (trade as any).conditions || [],
              tape: (trade as any).tape || "",
            };
            return {
              marketTrades: {
                ...state.marketTrades,
                [symbol]: [marketTrade, ...current].slice(-1000),
              },
            };
          }),

        updateBars: (symbol, bar) => {
          const normalized = normalizeBar(bar);
          if (normalized) {
            get().addMarketData(symbol, normalized);
          } else {
            console.warn('❌ Failed to normalize bar:', bar);
          }
        },

        addMarketTrade: (symbol, trade) =>
          set((state) => {
            const current = state.marketTrades[symbol] || [];
            return {
              marketTrades: {
                ...state.marketTrades,
                [symbol]: [trade, ...current].slice(-1000),
              },
            };
          }),

        /* -------------------- SIMPLIFIED: Current Price Updates -------------------- */
        updateCurrentPrice: (symbol, price) => {
          set((state) => ({
            currentPrices: {
              ...state.currentPrices,
              [symbol]: price
            }
          }));
        },

        /* -------------------- Trade Events -------------------- */
        addTradeEvent: (event) =>
          set((state) => ({
            tradeEvents: [{ ...event, id: nanoid() }, ...state.tradeEvents].slice(-1000),
          })),

        clearTradeEvents: () => set({ tradeEvents: [] }),

        /* -------------------- Market Information -------------------- */
        updateMarketClock: (marketClock) => {
          console.log("⏰ Updating market clock:", marketClock);
          set({ marketClock });
        },

        updateMarketCalendar: (marketCalendar) => {
          console.log("📅 Updating market calendar:", marketCalendar.length);
          set({ marketCalendar });
        },

        /* -------------------- Watchlist Management -------------------- */
        updateWatchlists: (watchlists) => {
          console.log("📋 Updating watchlists:", watchlists.length);
          set({ watchlists });
        },

        setSelectedWatchlist: (watchlist) => {
          console.log("🎯 Setting selected watchlist:", watchlist?.name);
          set({ selectedWatchlist: watchlist });
        },

        addToWatchlist: (id, symbol) =>
          set((state) => ({
            watchlists: state.watchlists.map((wl) =>
              wl.id === id && !wl.symbols.includes(symbol)
                ? { ...wl, symbols: [...wl.symbols, symbol] }
                : wl
            ),
          })),

        removeFromWatchlist: (id, symbol) =>
          set((state) => ({
            watchlists: state.watchlists.map((wl) =>
              wl.id === id
                ? { ...wl, symbols: wl.symbols.filter((s) => s !== symbol) }
                : wl
            ),
          })),

        /* -------------------- System Operations -------------------- */
        setLoading: (loading) => {
          console.log("⚙️ Setting global loading:", loading);
          set({ isLoading: loading });
        },

        setError: (error) => {
          console.log("🚨 Setting error:", error);
          set({ error });
        },

        setConnectionStatus: (market, trading) => {
          console.log("🔗 Setting connection status:", { market, trading });
          set({ 
            isMarketDataConnected: market, 
            isTradingConnected: trading 
          });
        },

        clearStore: () => {
          console.log("🧹 Clearing entire store");
          set(initialState);
        },

        /* -------------------- Data Aggregation -------------------- */
        aggregateMarketData: (symbol, timeframe) => {
          const state = get();
          return state.aggregatedMarketData[symbol]?.[timeframe] || [];
        },

        getAggregatedData: (symbol, timeframe) => {
          const state = get();
          return state.aggregatedMarketData[symbol]?.[timeframe] || [];
        },

        
        /* -------------------- Portfolio Management -------------------- */
        updatePortfolios: (portfolios) => {
          console.log("📊 Updating portfolios:", portfolios.length);
          set({ portfolios });
        },

        updatePortfolioSubscriptions: (subscriptions) => {
          console.log("📋 Updating portfolio subscriptions:", subscriptions.length);
          set({ portfolioSubscriptions: subscriptions });
        },

        updatePortfolioTrades: (trades) => {
          console.log("📈 Updating portfolio trades:", trades.length);
          set({ portfolioTrades: trades });
        },

        setSelectedPortfolio: (portfolio) => {
          console.log("🎯 Setting selected portfolio:", portfolio?.name);
          set({ selectedPortfolio: portfolio });
        },

        addPortfolioSubscription: (subscription) => {
          set((state) => ({
            portfolioSubscriptions: [...state.portfolioSubscriptions, subscription]
          }));
        },

        updatePortfolioSubscription: (id, changes) => {
          set((state) => ({
            portfolioSubscriptions: state.portfolioSubscriptions.map((sub) =>
              sub.id === id ? { ...sub, ...changes } : sub
            )
          }));
        },

        removePortfolioSubscription: (id) => {
          set((state) => ({
            portfolioSubscriptions: state.portfolioSubscriptions.filter((sub) => sub.id !== id)
          }));
        },


      }),
      {
        name: "trading-storage",
        partialize: (state) => ({
          positions: state.positions,
          orders: state.orders,
          assets: state.assets,
          portfolioHistory: state.portfolioHistory,
          account: state.account,
          selectedSymbol: state.selectedSymbol,
          timeframe: state.timeframe,
          marketClock: state.marketClock,
          marketCalendar: state.marketCalendar,
          watchlists: state.watchlists,
          selectedWatchlist: state.selectedWatchlist,
          portfolios: state.portfolios,
          portfolioSubscriptions: state.portfolioSubscriptions,
          portfolioTrades: state.portfolioTrades,
          selectedPortfolio: state.selectedPortfolio,

        }),
        version: 3,
      }
    ),
    {
      name: "TradingStore",
      trace: process.env.NODE_ENV === "development",
    }
  )
);

// KEEP ALL THE UTILITY HOOKS
export const useSymbolData = (symbol: string | null) => {
  return useTradingStore((state) => 
    symbol ? state.marketData[symbol] : null
  );
};

export const useAggregatedData = (symbol: string | null, timeframe: string) => {
  return useTradingStore((state) => 
    symbol ? state.aggregatedMarketData[symbol]?.[timeframe] : []
  );
};

export const useTradingState = () => {
  return useTradingStore((state) => ({
    selectedSymbol: state.selectedSymbol,
    timeframe: state.timeframe,
    isLoading: state.isLoading,
    error: state.error,
    isMarketDataConnected: state.isMarketDataConnected,
    isTradingConnected: state.isTradingConnected,
  }));
};

export const usePositions = () => {
  return useTradingStore((state) => ({
    positions: state.positions,
    updatePositions: state.updatePositions,
  }));
};

export const useOrders = () => {
  return useTradingStore((state) => ({
    orders: state.orders,
    updateOrders: state.updateOrders,
    updateOrder: state.updateOrder,
    removeOrder: state.removeOrder,
  }));
};

export const useAccount = () => {
  return useTradingStore((state) => ({
    account: state.account,
    portfolioHistory: state.portfolioHistory,
    updateAccount: state.updateAccount,
    updatePortfolioHistory: state.updatePortfolioHistory,
  }));
};

export const useWatchlists = () => {
  return useTradingStore((state) => ({
    watchlists: state.watchlists,
    selectedWatchlist: state.selectedWatchlist,
    setSelectedWatchlist: state.setSelectedWatchlist,
    addToWatchlist: state.addToWatchlist,
    removeFromWatchlist: state.removeFromWatchlist,
  }));
};

export const useMarketData = () => {
  return useTradingStore((state) => ({
    quotes: state.quotes,
    marketTrades: state.marketTrades,
    currentPrices: state.currentPrices, // ADDED
    updateQuote: state.updateQuote,
    updateTrades: state.updateTrades,
    updateBars: state.updateBars,
    updateCurrentPrice: state.updateCurrentPrice, // ADDED
  }));
};

export const useChartData = (symbol: string | null, timeframe: string) => {
  return useTradingStore((state) => {
    if (!symbol) return { historical: [], currentPrice: null, isLoading: false };
    
    return {
      historical: state.aggregatedMarketData[symbol]?.[timeframe] || [],
      currentPrice: state.currentPrices[symbol] || null, // CHANGED
      isLoading: state.marketData[symbol]?.isLoading || false
    };
  });
};

export const useConnectionStatus = () => {
  return useTradingStore((state) => ({
    isMarketDataConnected: state.isMarketDataConnected,
    isTradingConnected: state.isTradingConnected,
    setConnectionStatus: state.setConnectionStatus,
  }));
};

export const useAssets = () => {
  return useTradingStore((state) => ({
    assets: state.assets,
    updateAssets: state.updateAssets,
  }));
};

export const usePortfolios = () => {
  return useTradingStore((state) => ({
    portfolios: state.portfolios,
    portfolioSubscriptions: state.portfolioSubscriptions,
    portfolioTrades: state.portfolioTrades,
    selectedPortfolio: state.selectedPortfolio,
    updatePortfolios: state.updatePortfolios,
    updatePortfolioSubscriptions: state.updatePortfolioSubscriptions,
    updatePortfolioTrades: state.updatePortfolioTrades,
    setSelectedPortfolio: state.setSelectedPortfolio,
    addPortfolioSubscription: state.addPortfolioSubscription,
    updatePortfolioSubscription: state.updatePortfolioSubscription,
    removePortfolioSubscription: state.removePortfolioSubscription,
  }));
};

export default useTradingStore;






// // src/store/tradingStore.ts
// import { create } from "zustand";
// import { devtools, persist } from "zustand/middleware";
// import type { TradeEvent, Bar, Trade } from "./types/trading";
// import { nanoid } from "nanoid";
// import { aggregateBars, timeframeToMilliseconds } from "@/utils/dataAggregation";
// import { normalizeBar, toUTCTimestamp, type CandleWithVolume } from "@/utils/normalizerBars";
// import type { UTCTimestamp } from "lightweight-charts";

// // Import only the types we need
// import type { 
//   Position, Order, OrderRequest, OrderReplaceRequest, 
//   Quote, AccountSnapshot, PortfolioHistory, MarketTrade,
//   Asset, MarketClock, MarketCalendarDay, Watchlist 
// } from "./types/trading";

// /* ----------------------------- Real-time Candle Types ----------------------------- */
// export interface RealTimeCandle {
//   symbol: string;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
//   timestamp: number;
//   isForming: boolean;
//   tradeCount: number;
//   startTime: number;
// }

// export interface HistoricalDataState {
//   bars: CandleWithVolume[];
//   isLoading: boolean;
//   isLoadingMore: boolean;
//   error: string | null;
//   hasMore: boolean;
//   lastFetchTime: number | null;
//   timeframe?: string;
// }

// export interface MarketDataUpdateOptions {
//   append?: boolean;
//   prepend?: boolean;
//   reset?: boolean;
//   hasMore?: boolean;
//   timeframe?: string;
// }

// /* ----------------------------- Trading State Interface ----------------------------- */
// interface TradingState {
//   // Core trading data
//   positions: Position[];
//   orders: Order[];
//   assets: Asset[];
//   account: AccountSnapshot | null;
//   selectedSymbol: string | null;
//   timeframe: string;
//   portfolioHistory: PortfolioHistory | null;

//   // Market data structure
//   marketData: Record<string, HistoricalDataState>;
//   aggregatedMarketData: Record<string, Record<string, CandleWithVolume[]>>;

//   // Real-time data
//   quotes: Record<string, Quote>;
//   tradeEvents: TradeEvent[];
//   marketTrades: Record<string, MarketTrade[]>;

//   // Real-time candle tracking
//   realTimeCandles: Record<string, RealTimeCandle>;
//   candleTimeframes: Record<string, string>;

//   // Connection and system state
//   isMarketDataConnected: boolean;
//   isTradingConnected: boolean;
//   isLoading: boolean;
//   marketClock: MarketClock | null;
//   marketCalendar: MarketCalendarDay[];
//   watchlists: Watchlist[];
//   selectedWatchlist: Watchlist | null;
//   error: string | null;

//   // Symbol and Timeframe
//   setSelectedSymbol: (symbol: string) => void;
//   setTimeframe: (timeframe: string) => void;

//   // Position and Order management
//   updatePositions: (positions: Position[]) => void;
//   updateOrders: (orders: Order[]) => void;
//   updateOrder: (id: string, changes: Partial<Order>) => void;
//   removeOrder: (id: string) => void;

//   // Account management
//   updateAccount: (account: AccountSnapshot) => void;
//   updateAssets: (assets: Asset[]) => void;
//   updatePortfolioHistory: (history: PortfolioHistory) => void;

//   // Market Data Management
//   updateMarketData: (symbol: string, data: CandleWithVolume[], options?: MarketDataUpdateOptions) => void;
//   addMarketData: (symbol: string, data: CandleWithVolume) => void;
//   loadHistoricalBars: (symbol: string, bars: CandleWithVolume[], options?: { hasMore?: boolean; reset?: boolean; timeframe?: string }) => void;
//   prependHistoricalBars: (symbol: string, bars: CandleWithVolume[]) => void;
//   appendHistoricalBars: (symbol: string, bars: CandleWithVolume[]) => void;
//   clearHistoricalBars: (symbol: string) => void;
  
//   // Loading States
//   setMarketDataLoading: (symbol: string, loading: boolean, loadingMore?: boolean) => void;
//   setMarketDataError: (symbol: string, error: string | null) => void;

//   // Data Access
//   getOldestBarTime: (symbol: string) => number | null;
//   getNewestBarTime: (symbol: string) => number | null;
//   getBarsCount: (symbol: string) => number;
//   getMarketDataState: (symbol: string) => HistoricalDataState | null;
//   hasMarketData: (symbol: string) => boolean;

//   // Real-time Data Handlers
//   updateQuote: (symbol: string, quote: Quote) => void;
//   updateTrades: (symbol: string, trade: Trade) => void;
//   updateBars: (symbol: string, bar: Bar) => void;
//   addMarketTrade: (symbol: string, trade: MarketTrade) => void;

//   // Real-time Candle Formation
//   startRealTimeCandle: (symbol: string, timeframe: string, initialPrice: number) => void;
//   updateRealTimeCandle: (symbol: string, price: number, volume: number) => void;
//   finalizeCandle: (symbol: string) => void;
//   getRealTimeCandle: (symbol: string) => RealTimeCandle | null;
//   processTick: (symbol: string, price: number, volume: number, timestamp: number) => void;
//   getCurrentCandle: (symbol: string) => RealTimeCandle | null;
//   resetCandleForNewTimeframe: (symbol: string, timeframe: string) => void;

//   // Trade Events
//   addTradeEvent: (event: Omit<TradeEvent, "id">) => void;
//   clearTradeEvents: () => void;

//   // Market Information
//   updateMarketClock: (clock: MarketClock) => void;
//   updateMarketCalendar: (calendar: MarketCalendarDay[]) => void;

//   // Watchlist Management
//   updateWatchlists: (watchlists: Watchlist[]) => void;
//   setSelectedWatchlist: (watchlist: Watchlist | null) => void;
//   addToWatchlist: (watchlistId: string, symbol: string) => void;
//   removeFromWatchlist: (watchlistId: string, symbol: string) => void;

//   // System Operations
//   setLoading: (loading: boolean) => void;
//   setError: (error: string | null) => void;
//   setConnectionStatus: (market: boolean, trading: boolean) => void;
//   clearStore: () => void;
  
//   // Data Aggregation
//   aggregateMarketData: (symbol: string, timeframe: string) => CandleWithVolume[];
//   getAggregatedData: (symbol: string, timeframe: string) => CandleWithVolume[];
// }

// /* ----------------------------- Initial State ----------------------------- */
// const initialHistoricalDataState: HistoricalDataState = {
//   bars: [],
//   isLoading: false,
//   isLoadingMore: false,
//   error: null,
//   hasMore: true,
//   lastFetchTime: null,
// };

// const initialState = {
//   positions: [],
//   orders: [],
//   assets: [],
//   account: null,
//   selectedSymbol: null,
//   timeframe: "1m",
//   portfolioHistory: null,
//   marketData: {},
//   aggregatedMarketData: {},
//   quotes: {},
//   tradeEvents: [],
//   marketTrades: {},
//   realTimeCandles: {},
//   candleTimeframes: {},
//   isMarketDataConnected: false,
//   isTradingConnected: false,
//   isLoading: false,
//   marketClock: null,
//   marketCalendar: [],
//   watchlists: [],
//   selectedWatchlist: null,
//   error: null,
// };

// /* ----------------------------- Store Implementation ----------------------------- */
// export const useTradingStore = create<TradingState>()(
//   devtools(
//     persist(
//       (set, get) => ({
//         ...initialState,

//         /* -------------------- Symbol and Timeframe -------------------- */
//         setSelectedSymbol: (symbol) => {
//           console.log("🎯 Setting selected symbol:", symbol);
//           set({ selectedSymbol: symbol });
//         },

//         setTimeframe: (timeframe) => {
//           console.log("🕒 Setting timeframe:", timeframe);
//           set({ timeframe });
//         },

//         /* -------------------- Position and Order Management -------------------- */
//         updatePositions: (positions) => {
//           console.log("📊 Updating positions:", positions.length);
//           set({ positions });
//         },

//         updateOrders: (orders) => {
//           console.log("📋 Updating orders:", orders.length);
//           set({ orders });
//         },

//         updateOrder: (id, changes) =>
//           set((state) => ({
//             orders: state.orders.map((o) =>
//               o.id === id ? { ...o, ...changes } : o
//             ),
//           })),

//         removeOrder: (id) =>
//           set((state) => ({
//             orders: state.orders.filter((o) => o.id !== id),
//           })),

//         /* -------------------- Account Management -------------------- */
//         updateAccount: (account) => {
//           console.log("💳 Updating account snapshot");
//           set({ account });
//         },

//         updateAssets: (assets) => {
//           console.log("🏦 Updating assets:", assets.length);
//           set({ assets });
//         },

//         updatePortfolioHistory: (history) => {
//           console.log("📈 Updating portfolio history");
//           set({ portfolioHistory: history });
//         },

//         /* -------------------- Market Data Management -------------------- */
//         updateMarketData: (symbol, data, options = {}) =>
//           set((state) => {
//             const currentState = state.marketData[symbol] || { ...initialHistoricalDataState };
            
//             console.log("🔄 Updating market data:", {
//               symbol,
//               newBars: data.length,
//               options,
//               currentBars: currentState.bars.length
//             });

//             let newBars: CandleWithVolume[];
            
//             if (options.reset) {
//               newBars = data;
//             } else if (options.prepend) {
//               newBars = [...data, ...currentState.bars];
//             } else if (options.append) {
//               newBars = [...currentState.bars, ...data];
//             } else {
//               newBars = data;
//             }

//             const uniqueBars = newBars
//               .reduce((acc, bar) => {
//                 const existingIndex = acc.findIndex(b => b.time === bar.time);
//                 if (existingIndex === -1) {
//                   acc.push(bar);
//                 } else {
//                   acc[existingIndex] = bar;
//                 }
//                 return acc;
//               }, [] as CandleWithVolume[])
//               .sort((a, b) => a.time - b.time);

//             const limitedBars = uniqueBars.slice(-5000);

//             const updatedState: HistoricalDataState = {
//               ...currentState,
//               bars: limitedBars,
//               isLoading: false,
//               isLoadingMore: false,
//               error: null,
//               hasMore: options.hasMore ?? currentState.hasMore,
//               lastFetchTime: Date.now(),
//               timeframe: options.timeframe || currentState.timeframe,
//             };

//             const updatedMarketData = { 
//               ...state.marketData, 
//               [symbol]: updatedState 
//             };

//             // Update aggregated data
//             const updatedAggregated = { ...state.aggregatedMarketData };
//             if (!updatedAggregated[symbol]) updatedAggregated[symbol] = {};

//             const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
//             timeframes.forEach((tf) => {
//               try {
//                 updatedAggregated[symbol][tf] = aggregateBars(
//                   limitedBars,
//                   timeframeToMilliseconds(tf)
//                 );
//                 console.log(`✅ Aggregated ${symbol} ${tf}:`, updatedAggregated[symbol][tf].length);
//               } catch (error) {
//                 console.error(`❌ Aggregation error for ${symbol} ${tf}:`, error);
//                 updatedAggregated[symbol][tf] = updatedAggregated[symbol][tf] || [];
//               }
//             });

//             return { 
//               marketData: updatedMarketData, 
//               aggregatedMarketData: updatedAggregated 
//             };
//           }),

//         addMarketData: (symbol, data) =>
//           set((state) => {
//             const currentState = state.marketData[symbol] || { ...initialHistoricalDataState };
//             const currentBars = currentState.bars;
//             const lastBar = currentBars.at(-1);
            
//             let newBars: CandleWithVolume[];
            
//             if (lastBar && lastBar.time === data.time) {
//               newBars = [...currentBars.slice(0, -1), data];
//               console.log(`🔄 Replaced last candle for ${symbol} at timestamp ${data.time}`);
//             } else {
//               newBars = [...currentBars, data];
//               console.log(`📊 Appended new candle for ${symbol} at timestamp ${data.time}`);
//             }

//             const limitedBars = newBars.slice(-2000);

//             const updatedState: HistoricalDataState = {
//               ...currentState,
//               bars: limitedBars,
//             };

//             const updatedMarketData = { 
//               ...state.marketData, 
//               [symbol]: updatedState 
//             };

//             const updatedAggregated = { ...state.aggregatedMarketData };
//             if (!updatedAggregated[symbol]) updatedAggregated[symbol] = {};

//             const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
//             timeframes.forEach((tf) => {
//               try {
//                 updatedAggregated[symbol][tf] = aggregateBars(
//                   limitedBars,
//                   timeframeToMilliseconds(tf)
//                 );
//               } catch (error) {
//                 console.error(`Aggregation error for ${symbol} ${tf}:`, error);
//                 updatedAggregated[symbol][tf] = updatedAggregated[symbol][tf] || [];
//               }
//             });

//             return { 
//               marketData: updatedMarketData, 
//               aggregatedMarketData: updatedAggregated 
//             };
//           }),

//         loadHistoricalBars: (symbol, bars, options = {}) => {
//           console.log("💾 Loading historical bars:", {
//             symbol,
//             barsCount: bars.length,
//             options
//           });
//           get().updateMarketData(symbol, bars, { 
//             reset: options.reset ?? true, 
//             hasMore: options.hasMore,
//             timeframe: options.timeframe 
//           });
//         },

//         prependHistoricalBars: (symbol, bars) => {
//           console.log("📥 Prepending historical bars:", {
//             symbol,
//             newBars: bars.length
//           });
//           get().updateMarketData(symbol, bars, { prepend: true });
//         },

//         appendHistoricalBars: (symbol, bars) => {
//           console.log("📤 Appending historical bars:", {
//             symbol,
//             newBars: bars.length
//           });
//           get().updateMarketData(symbol, bars, { append: true });
//         },

//         clearHistoricalBars: (symbol) => {
//           console.log("🗑️ Clearing historical bars for:", symbol);
//           set((state) => {
//             const updatedMarketData = { ...state.marketData };
//             const updatedAggregated = { ...state.aggregatedMarketData };
            
//             delete updatedMarketData[symbol];
//             delete updatedAggregated[symbol];
            
//             return { 
//               marketData: updatedMarketData, 
//               aggregatedMarketData: updatedAggregated 
//             };
//           });
//         },

//         /* -------------------- Loading States -------------------- */
//         setMarketDataLoading: (symbol, loading, loadingMore = false) =>
//           set((state) => {
//             const currentState = state.marketData[symbol] || { ...initialHistoricalDataState };

//             const updatedState: HistoricalDataState = {
//               ...currentState,
//               isLoading: loading && !loadingMore,
//               isLoadingMore: loading && loadingMore,
//               error: loading ? null : currentState.error,
//             };

//             return {
//               marketData: {
//                 ...state.marketData,
//                 [symbol]: updatedState,
//               },
//             };
//           }),

//         setMarketDataError: (symbol, error) =>
//           set((state) => {
//             const currentState = state.marketData[symbol] || { ...initialHistoricalDataState };

//             const updatedState: HistoricalDataState = {
//               ...currentState,
//               isLoading: false,
//               isLoadingMore: false,
//               error,
//             };

//             return {
//               marketData: {
//                 ...state.marketData,
//                 [symbol]: updatedState,
//               },
//             };
//           }),

//         /* -------------------- Data Access Methods -------------------- */
//         getOldestBarTime: (symbol: string): number | null => {
//           const state = get();
//           const bars = state.marketData[symbol]?.bars;
//           if (!bars || bars.length === 0) return null;
//           const oldestBar = bars[0];
//           return typeof oldestBar.time === 'number' ? oldestBar.time : 
//                  parseInt(oldestBar.time as any) || null;
//         },

//         getNewestBarTime: (symbol: string): number | null => {
//           const state = get();
//           const bars = state.marketData[symbol]?.bars;
//           if (!bars || bars.length === 0) return null;
//           const newestBar = bars[bars.length - 1];
//           return typeof newestBar.time === 'number' ? newestBar.time : 
//                  parseInt(newestBar.time as any) || null;
//         },

//         getBarsCount: (symbol: string): number => {
//           const state = get();
//           return state.marketData[symbol]?.bars.length || 0;
//         },

//         getMarketDataState: (symbol: string): HistoricalDataState | null => {
//           const state = get();
//           return state.marketData[symbol] || null;
//         },

//         hasMarketData: (symbol: string): boolean => {
//           const state = get();
//           return !!(state.marketData[symbol]?.bars.length);
//         },

//         /* -------------------- Real-time Data Handlers -------------------- */
//         updateQuote: (symbol, quote) => {
//           set((state) => ({ 
//             quotes: { ...state.quotes, [symbol]: quote } 
//           }));
//         },

//         updateTrades: (symbol, trade) =>
//           set((state) => {
//             const current = state.marketTrades[symbol] || [];
//             const marketTrade: MarketTrade = {
//               id: nanoid(),
//               symbol: (trade as any).symbol || symbol,
//               price: (trade as any).price || 0,
//               size: (trade as any).size || 0,
//               timestamp: new Date((trade as any).timestamp || Date.now()),
//               exchange: (trade as any).exchange || "",
//               conditions: (trade as any).conditions || [],
//               tape: (trade as any).tape || "",
//             };
//             return {
//               marketTrades: {
//                 ...state.marketTrades,
//                 [symbol]: [marketTrade, ...current].slice(-1000),
//               },
//             };
//           }),

//         updateBars: (symbol, bar) => {
//           const normalized = normalizeBar(bar);
//           if (normalized) {
//             const state = get();
            
//             const currentTime = Date.now();
//             const barTime = normalized.time * 1000;
//             const timeDiff = currentTime - barTime;

//             if (timeDiff < 120000) {
//               const realTimeCandle = state.realTimeCandles[symbol];
              
//               if (!realTimeCandle || !realTimeCandle.isForming) {
//                 console.log(`🕯️ Starting new real-time candle for ${symbol} at ${normalized.open}`);
//                 state.startRealTimeCandle(symbol, state.timeframe || '1m', normalized.open);
//               } else {
//                 console.log(`📈 Updating real-time candle for ${symbol}: ${normalized.close}`);
//                 state.updateRealTimeCandle(symbol, normalized.close, normalized.volume);
                
//                 const updatedCandle = {
//                   ...realTimeCandle,
//                   high: Math.max(realTimeCandle.high, normalized.high),
//                   low: Math.min(realTimeCandle.low, normalized.low),
//                   close: normalized.close,
//                   volume: realTimeCandle.volume + normalized.volume
//                 };
                
//                 set((state) => ({
//                   realTimeCandles: {
//                     ...state.realTimeCandles,
//                     [symbol]: updatedCandle
//                   }
//                 }));
//               }
              
//               const timeframeMs = timeframeToMilliseconds(state.timeframe || '1m');
//               const candleAge = currentTime - (state.realTimeCandles[symbol]?.startTime || currentTime);
              
//               if (state.realTimeCandles[symbol] && candleAge >= timeframeMs) {
//                 console.log(`⏰ Timeframe reached, finalizing candle for ${symbol}`);
//                 state.finalizeCandle(symbol);
//               }
//             } else {
//               console.log(`📚 Adding historical bar for ${symbol}`);
//               state.addMarketData(symbol, normalized);
//             }
//           } else {
//             console.warn('❌ Failed to normalize bar:', bar);
//           }
//         },

//         addMarketTrade: (symbol, trade) =>
//           set((state) => {
//             const current = state.marketTrades[symbol] || [];
//             return {
//               marketTrades: {
//                 ...state.marketTrades,
//                 [symbol]: [trade, ...current].slice(-1000),
//               },
//             };
//           }),

//         /* -------------------- Real-time Candle Formation -------------------- */
//         startRealTimeCandle: (symbol, timeframe, initialPrice) =>
//           set((state) => {
//             const now = Date.now();
//             const timeframeMs = timeframeToMilliseconds(timeframe);
//             const candleStartTime = Math.floor(now / timeframeMs) * timeframeMs;
            
//             const realTimeCandle: RealTimeCandle = {
//               symbol,
//               open: initialPrice,
//               high: initialPrice,
//               low: initialPrice,
//               close: initialPrice,
//               volume: 0,
//               timestamp: candleStartTime,
//               isForming: true,
//               tradeCount: 0,
//               startTime: now
//             };
            
//             console.log(`🕯️ Starting real-time candle for ${symbol} at ${initialPrice}`);
            
//             return {
//               realTimeCandles: {
//                 ...state.realTimeCandles,
//                 [symbol]: realTimeCandle
//               },
//               candleTimeframes: {
//                 ...state.candleTimeframes,
//                 [symbol]: timeframe
//               }
//             };
//           }),

//         updateRealTimeCandle: (symbol, price, volume) =>
//           set((state) => {
//             const currentCandle = state.realTimeCandles[symbol];
//             if (!currentCandle || !currentCandle.isForming) {
//               console.log(`⚠️ No active real-time candle for ${symbol}`);
//               return state;
//             }

//             const updatedCandle: RealTimeCandle = {
//               ...currentCandle,
//               high: Math.max(currentCandle.high, price),
//               low: Math.min(currentCandle.low, price),
//               close: price,
//               volume: currentCandle.volume + volume,
//               tradeCount: currentCandle.tradeCount + 1
//             };

//             console.log(`📈 Updating real-time candle for ${symbol}: ${price} (H:${updatedCandle.high} L:${updatedCandle.low} V:${updatedCandle.volume})`);

//             return {
//               realTimeCandles: {
//                 ...state.realTimeCandles,
//                 [symbol]: updatedCandle
//               }
//             };
//           }),

//         finalizeCandle: (symbol) =>
//           set((state) => {
//             const currentCandle = state.realTimeCandles[symbol];
//             if (!currentCandle || !currentCandle.isForming) {
//               console.log(`⚠️ No active real-time candle to finalize for ${symbol}`);
//               return state;
//             }

//             const finalizedCandle: CandleWithVolume = {
//               time: toUTCTimestamp(Math.floor(currentCandle.timestamp / 1000)),
//               open: currentCandle.open,
//               high: currentCandle.high,
//               low: currentCandle.low,
//               close: currentCandle.close,
//               volume: currentCandle.volume
//             };

//             console.log(`✅ Finalizing candle for ${symbol}:`, finalizedCandle);

//             state.addMarketData(symbol, finalizedCandle);

//             // Start new candle with the close price
//             const newCandle: RealTimeCandle = {
//               symbol,
//               open: currentCandle.close,
//               high: currentCandle.close,
//               low: currentCandle.close,
//               close: currentCandle.close,
//               volume: 0,
//               timestamp: currentCandle.timestamp + timeframeToMilliseconds(state.timeframe || '1m'),
//               isForming: true,
//               tradeCount: 0,
//               startTime: Date.now()
//             };

//             return {
//               realTimeCandles: {
//                 ...state.realTimeCandles,
//                 [symbol]: newCandle
//               }
//             };
//           }),

//         processTick: (symbol, price, volume, timestamp) =>
//           set((state) => {
//             const currentTimeframe = state.timeframe || '1m';
//             const timeframeMs = timeframeToMilliseconds(currentTimeframe);
//             const now = timestamp || Date.now();
            
//             const candleStartTime = Math.floor(now / timeframeMs) * timeframeMs;
            
//             let realTimeCandle = state.realTimeCandles[symbol];

//             if (!realTimeCandle || !realTimeCandle.isForming) {
//               realTimeCandle = {
//                 symbol,
//                 open: price,
//                 high: price,
//                 low: price,
//                 close: price,
//                 volume: volume,
//                 timestamp: candleStartTime,
//                 isForming: true,
//                 tradeCount: 1,
//                 startTime: now
//               };
//               console.log(`🕯️ Started new real-time candle for ${symbol} at ${price}`);
//             } else {
//               const currentCandleStart = Math.floor(now / timeframeMs) * timeframeMs;
//               if (currentCandleStart > realTimeCandle.timestamp) {
//                 // Timeframe boundary crossed - finalize current candle and start new one
//                 const finalizedCandle: CandleWithVolume = {
//                   time: toUTCTimestamp(Math.floor(realTimeCandle.timestamp / 1000)),
//                   open: realTimeCandle.open,
//                   high: realTimeCandle.high,
//                   low: realTimeCandle.low,
//                   close: realTimeCandle.close,
//                   volume: realTimeCandle.volume
//                 };
                
//                 console.log(`⏰ Timeframe boundary crossed, finalizing candle for ${symbol}`);
//                 state.addMarketData(symbol, finalizedCandle);
                
//                 realTimeCandle = {
//                   symbol,
//                   open: price,
//                   high: price,
//                   low: price,
//                   close: price,
//                   volume: volume,
//                   timestamp: currentCandleStart,
//                   isForming: true,
//                   tradeCount: 1,
//                   startTime: now
//                 };
//                 console.log(`🕯️ Started new real-time candle for ${symbol} at ${price}`);
//               } else {
//                 realTimeCandle = {
//                   ...realTimeCandle,
//                   high: Math.max(realTimeCandle.high, price),
//                   low: Math.min(realTimeCandle.low, price),
//                   close: price,
//                   volume: realTimeCandle.volume + volume,
//                   tradeCount: realTimeCandle.tradeCount + 1
//                 };
                
//                 // Debug log every 10 ticks to avoid console spam
//                 if (realTimeCandle.tradeCount % 10 === 0) {
//                   console.log(`📈 Tick update for ${symbol}: ${price} (H:${realTimeCandle.high} L:${realTimeCandle.low})`);
//                 }
//               }
//             }

//             return {
//               realTimeCandles: {
//                 ...state.realTimeCandles,
//                 [symbol]: realTimeCandle
//               }
//             };
//           }),

//         getCurrentCandle: (symbol) => {
//           const state = get();
//           return state.realTimeCandles[symbol] || null;
//         },

//         resetCandleForNewTimeframe: (symbol, timeframe) =>
//           set((state) => {
//             console.log(`🔄 Resetting candle for ${symbol} with new timeframe: ${timeframe}`);
//             const updatedCandles = { ...state.realTimeCandles };
//             delete updatedCandles[symbol];

//             return {
//               realTimeCandles: updatedCandles,
//               candleTimeframes: {
//                 ...state.candleTimeframes,
//                 [symbol]: timeframe
//               }
//             };
//           }),

//         getRealTimeCandle: (symbol: string): RealTimeCandle | null => {
//           const state = get();
//           return state.realTimeCandles[symbol] || null;
//         },

//         /* -------------------- Trade Events -------------------- */
//         addTradeEvent: (event) =>
//           set((state) => ({
//             tradeEvents: [{ ...event, id: nanoid() }, ...state.tradeEvents].slice(-1000),
//           })),

//         clearTradeEvents: () => set({ tradeEvents: [] }),

//         /* -------------------- Market Information -------------------- */
//         updateMarketClock: (marketClock) => {
//           console.log("⏰ Updating market clock:", marketClock);
//           set({ marketClock });
//         },

//         updateMarketCalendar: (marketCalendar) => {
//           console.log("📅 Updating market calendar:", marketCalendar.length);
//           set({ marketCalendar });
//         },

//         /* -------------------- Watchlist Management -------------------- */
//         updateWatchlists: (watchlists) => {
//           console.log("📋 Updating watchlists:", watchlists.length);
//           set({ watchlists });
//         },

//         setSelectedWatchlist: (watchlist) => {
//           console.log("🎯 Setting selected watchlist:", watchlist?.name);
//           set({ selectedWatchlist: watchlist });
//         },

//         addToWatchlist: (id, symbol) =>
//           set((state) => ({
//             watchlists: state.watchlists.map((wl) =>
//               wl.id === id && !wl.symbols.includes(symbol)
//                 ? { ...wl, symbols: [...wl.symbols, symbol] }
//                 : wl
//             ),
//           })),

//         removeFromWatchlist: (id, symbol) =>
//           set((state) => ({
//             watchlists: state.watchlists.map((wl) =>
//               wl.id === id
//                 ? { ...wl, symbols: wl.symbols.filter((s) => s !== symbol) }
//                 : wl
//             ),
//           })),

//         /* -------------------- System Operations -------------------- */
//         setLoading: (loading) => {
//           console.log("⚙️ Setting global loading:", loading);
//           set({ isLoading: loading });
//         },

//         setError: (error) => {
//           console.log("🚨 Setting error:", error);
//           set({ error });
//         },

//         setConnectionStatus: (market, trading) => {
//           console.log("🔗 Setting connection status:", { market, trading });
//           set({ 
//             isMarketDataConnected: market, 
//             isTradingConnected: trading 
//           });
//         },

//         clearStore: () => {
//           console.log("🧹 Clearing entire store");
//           set(initialState);
//         },

//         /* -------------------- Data Aggregation -------------------- */
//         aggregateMarketData: (symbol, timeframe) => {
//           const state = get();
//           return state.aggregatedMarketData[symbol]?.[timeframe] || [];
//         },

//         getAggregatedData: (symbol, timeframe) => {
//           const state = get();
//           return state.aggregatedMarketData[symbol]?.[timeframe] || [];
//         },
//       }),
//       {
//         name: "trading-storage",
//         partialize: (state) => ({
//           positions: state.positions,
//           orders: state.orders,
//           assets: state.assets,
//           portfolioHistory: state.portfolioHistory,
//           account: state.account,
//           selectedSymbol: state.selectedSymbol,
//           timeframe: state.timeframe,
//           marketClock: state.marketClock,
//           marketCalendar: state.marketCalendar,
//           watchlists: state.watchlists,
//           selectedWatchlist: state.selectedWatchlist,
//         }),
//         version: 3,
//         migrate: (persistedState: any, version: number) => {
//           if (version === 0) {
//             return {
//               ...persistedState,
//               marketData: {},
//               aggregatedMarketData: {},
//             };
//           }
//           if (version === 1) {
//             return { ...persistedState };
//           }
//           if (version === 2) {
//             return {
//               ...persistedState,
//               realTimeCandles: {},
//               candleTimeframes: {},
//             };
//           }
//           return persistedState;
//         },
//       }
//     ),
//     {
//       name: "TradingStore",
//       trace: process.env.NODE_ENV === "development",
//     }
//   )
// );

// /* ----------------------------- Utility Hooks ----------------------------- */



// export const useSymbolData = (symbol: string | null) => {
//   return useTradingStore((state) => 
//     symbol ? state.marketData[symbol] : null
//   );
// };

// export const useAggregatedData = (symbol: string | null, timeframe: string) => {
//   return useTradingStore((state) => 
//     symbol ? state.aggregatedMarketData[symbol]?.[timeframe] : []
//   );
// };

// export const useRealTimeCandle = (symbol: string | null) => {
//   return useTradingStore((state) => 
//     symbol ? state.realTimeCandles[symbol] : null
//   );
// };

// export const useTradingState = () => {
//   return useTradingStore((state) => ({
//     selectedSymbol: state.selectedSymbol,
//     timeframe: state.timeframe,
//     isLoading: state.isLoading,
//     error: state.error,
//     isMarketDataConnected: state.isMarketDataConnected,
//     isTradingConnected: state.isTradingConnected,
//   }));
// };


// // NEW: Domain-specific selectors
// export const usePositions = () => {
//   return useTradingStore((state) => ({
//     positions: state.positions,
//     updatePositions: state.updatePositions,
//   }));
// };

// export const useOrders = () => {
//   return useTradingStore((state) => ({
//     orders: state.orders,
//     updateOrders: state.updateOrders,
//     updateOrder: state.updateOrder,
//     removeOrder: state.removeOrder,
//   }));
// };

// export const useAccount = () => {
//   return useTradingStore((state) => ({
//     account: state.account,
//     portfolioHistory: state.portfolioHistory,
//     updateAccount: state.updateAccount,
//     updatePortfolioHistory: state.updatePortfolioHistory,
//   }));
// };

// export const useWatchlists = () => {
//   return useTradingStore((state) => ({
//     watchlists: state.watchlists,
//     selectedWatchlist: state.selectedWatchlist,
//     setSelectedWatchlist: state.setSelectedWatchlist,
//     addToWatchlist: state.addToWatchlist,
//     removeFromWatchlist: state.removeFromWatchlist,
//   }));
// };

// export const useMarketData = () => {
//   return useTradingStore((state) => ({
//     quotes: state.quotes,
//     marketTrades: state.marketTrades,
//     updateQuote: state.updateQuote,
//     updateTrades: state.updateTrades,
//     updateBars: state.updateBars,
//   }));
// };

// // High-performance selector for chart components
// export const useChartData = (symbol: string | null, timeframe: string) => {
//   return useTradingStore((state) => {
//     if (!symbol) return { historical: [], realTime: null, isLoading: false };
    
//     return {
//       historical: state.aggregatedMarketData[symbol]?.[timeframe] || [],
//       realTime: state.realTimeCandles[symbol] || null,
//       isLoading: state.marketData[symbol]?.isLoading || false
//     };
//   });
// };

// // Additional useful selectors
// export const useConnectionStatus = () => {
//   return useTradingStore((state) => ({
//     isMarketDataConnected: state.isMarketDataConnected,
//     isTradingConnected: state.isTradingConnected,
//     setConnectionStatus: state.setConnectionStatus,
//   }));
// };

// export const useAssets = () => {
//   return useTradingStore((state) => ({
//     assets: state.assets,
//     updateAssets: state.updateAssets,
//   }));
// };


// export default useTradingStore;
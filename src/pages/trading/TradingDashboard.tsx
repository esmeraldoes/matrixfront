import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MarketClock } from "../MarketClock";
import AdvancedTradingChart from "../AdvancedChart";
import { SymbolSearch } from "./SymbolSearch";
import { MarketCalendar } from "../MarketCalendar";
import { PlaceOrderForm } from "./PlaceOrderForm";
import { OrdersTable } from "./OrdersTable";
import { PositionsPanel } from "@/pages/trading/PositionsPanel";

import {
  Calendar as CalendarIcon,
  X,
  ShoppingCart,
  Menu,
  BarChart3,
  Wallet,
  TrendingUp,
  Clock,
  User,
  PieChart,
  DollarSign,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { usePositions, useAssets, useAccount, usePortfolioHistory } from "@/hooks/useTrading";

export const TradingDashboard: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const [activeSymbol, setActiveSymbol] = useState<string>("BTC/USD");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"chart" | "orders" | "positions" | "account">("chart");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // NEW: control whether to show all positions on desktop
  const [showAllPositions, setShowAllPositions] = useState(false);

  // Store data and actions
  const assets = useTradingStore((s) => s.assets) || [];
  const positions = useTradingStore((s) => s.positions) || [];
  const updatePositions = useTradingStore((s) => s.updatePositions);
  const updateAssets = useTradingStore((s) => s.updateAssets);

  // Fetch data
  const {
    data: positionsData,
    isLoading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions
  } = usePositions(accountId!);

  const {
    data: assetsData,
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets
  } = useAssets(accountId!, {});

  const { data: accountData, refetch: refetchAccount } = useAccount(accountId!);
  const { data: portfolioHistory } = usePortfolioHistory(accountId!);

  console.log("ACTIVE SYMBOL: ", activeSymbol)

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchPositions(),
      refetchAssets(),
      refetchAccount()
    ]);
    setTimeout(() => setIsRefreshing(false), 900);
  };

  // Update store when API data changes
  useEffect(() => {
    if (positionsData) {
      const positionsArray = positionsData.results || positionsData;
      updatePositions(positionsArray);
    }
  }, [positionsData, updatePositions]);

  useEffect(() => {
    if (assetsData?.results) updateAssets(assetsData.results);
  }, [assetsData, updateAssets]);


  useEffect(() => {
    if (showOrderModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showOrderModal]);
  const totalPnl = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl || "0"), 0);
  const totalPnlPercent = accountData ? parseFloat(accountData.day_profit_loss_pct || "0") : 0;
  const portfolioValue = accountData ? parseFloat(accountData.portfolio_value || "0") : 0;
  const buyingPower = accountData ? parseFloat(accountData.buying_power || "0") : 0;
  const cashBalance = accountData ? parseFloat(accountData.cash || "0") : 0;

  // Available symbols for trading
  const availableSymbols = assets.length ? assets.map((a) => a.symbol) : ["BTC/USD", "ETH/USD", "AAPL", "TSLA"];

  if (!accountId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
        <div className="text-center p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg dark:border dark:border-gray-700/50 ">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">No account ID provided</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please check the URL and try again</p>
        </div>
      </div>
    );
  }

  if (positionsLoading || assetsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading Trading Dashboard</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Fetching market data and positions...</p>
        </div>
      </div>
    );
  }

  if (positionsError || assetsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg dark:border dark:border-gray-700/50 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load trading data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{positionsError?.message || assetsError?.message}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="w-full relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* TOP ROW (logo + account) */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg" />
              <div className="flex flex-col">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <User size={12} /> Account #{accountId}
                </p>
              </div>
            </div>

            {/* mobile top icons */}
            <div className="flex items-center gap-2 lg:hidden">
              <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 rounded-xl hover:bg-gray-100/10">
                <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => setShowCalendar(true)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <CalendarIcon size={18} />
              </button>
              <button onClick={() => setShowMenu(true)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* SECOND ROW: SEARCH (left) — CENTERED MARKET (centered & bounded) — icons pinned to absolute right */}
          <div className="relative pb-3">
            <div className="flex items-center lg:gap-10">
              {/* left search area (flexible) */}
              <div className="flex-1 lg:max-w-md">
                <SymbolSearch accountId={accountId} onSymbolSelect={(s) => setActiveSymbol(s)} />
              </div>

              {/* center: bounded to same width as chart container */}
              <div
                className="hidden lg:flex items-center gap-8 justify-center
                     flex-shrink-0 ps-44"
                /* IMPORTANT: match this max-w with your chart's max-width (example: 1100px) */
                style={{ maxWidth: "1100px" }}
              >
                <MarketClock accountId={accountId} />
                {accountData && (
                  <div className="text-right">
                    <div className="text-sm font-semibold dark:text-white">
                      ${portfolioValue.toLocaleString()}
                    </div>
                    <div className={`text-xs ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toFixed(2)} (
                      {totalPnlPercent >= 0 ? "+" : ""}{totalPnlPercent.toFixed(2)}%)
                    </div>
                  </div>
                )}
              </div>

              {/* spacer to allow left area + centered block to behave nicely on wide screens */}
              <div className="flex-1" />
            </div>

            {/* RIGHT: icons pinned to absolute right of the HEADER (extreme end) */}
            <div className="hidden lg:flex items-center gap-2 absolute right-0 top-1/2 transform -translate-y-1/2 ">
              <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 rounded-xl hover:bg-gray-100/10">
                <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => setShowCalendar(true)} className="p-2 rounded-xl hover:bg-gray-100/10">
                <CalendarIcon size={18} />
              </button>
              {/* Add other icons here */}
            </div>

            {/* compact center for small screens */}
            <div className="lg:hidden mt-3 flex items-center gap-3">
              <MarketClock accountId={accountId} compact />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="lg:hidden dark:border-b dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg top-[88px] z-40 rounded-xl shadow-lg">
        <div className="flex">
          {[
            { id: "chart", label: "Chart", icon: BarChart3 },
            { id: "orders", label: "Orders", icon: Wallet },
            { id: "positions", label: "Positions", icon: TrendingUp },
            { id: "account", label: "Account", icon: PieChart },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveMobileTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeMobileTab === id 
                  ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-gradient-to-t from-purple-50/80 to-transparent dark:from-purple-900/20 rounded-t-xl" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[95%] max-w-md">
            <div className="flex items-center justify-between p-6 dark:border-b dark:border-gray-700/50">
              <h3 className="text-lg font-semibold flex items-center gap-2"><CalendarIcon size={20} /> Market Calendar</h3>
              <button onClick={() => setShowCalendar(false)} className="p-2 rounded-xl"><X size={18} /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto"><MarketCalendar accountId={accountId} /></div>
          </div>
        </div>
      )}

      {/* Main layout: left = chart + positions; right = aside (quick trade, account summary, orders) */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-3 sm:p-4 ">
        {/* LEFT: Chart + Positions (positions underneath chart) */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Chart - Conditionally shown on mobile based on active tab */}
          <section className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:border dark:border-gray-700/50 overflow-hidden ${
            activeMobileTab === "chart" ? "block" : "hidden lg:block"
          }`}>
            <div className="p-4 dark:border-b dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><Clock size={14} /> <span>Real-time</span></div>
              </div>
            </div>

            <div className="h-[500px] lg:h-[600px] "><AdvancedTradingChart symbol={activeSymbol} /></div>
          </section>

          {/* Positions under chart - Conditionally shown on mobile based on active tab */}
          <div className={`${activeMobileTab === "positions" ? "block" : "hidden lg:block"}`}>
            {/* Desktop title for positions */}
            <div className="hidden lg:flex items-center justify-between mb-2 lg:mt-3 ">
              <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp size={18} /> Positions</h3>
            </div>

            {/* Desktop grid (lg+) */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4">
              {positions.length === 0 ? (
                <div className="col-span-3 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md dark:border dark:border-gray-700/50 text-center text-sm text-gray-500">No open positions</div>
              ) : (
                (positions.slice(0, showAllPositions ? positions.length : 6)).map((pos: any, i: number) => {
                  const qty = pos.qty ?? pos.quantity ?? pos.shares ?? 0;
                  const avg = parseFloat(pos.avg_entry_price ?? pos.avg_price ?? pos.avg ?? "0");
                  const current = parseFloat(pos.current_price ?? pos.last_price ?? pos.mark_price ?? "0");
                  const pl = parseFloat(pos.unrealized_pl ?? "0");
                  const plPct = avg ? ((current - avg) / avg) * 100 : 0;
                  return (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md dark:border dark:border-gray-700/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm font-semibold">{pos.symbol ?? pos.ticker ?? "—"}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{pos.side ? pos.side.toUpperCase() : ''}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Qty</div>
                          <div className="font-medium">{qty}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div>
                          <div className="text-xs">Avg</div>
                          <div className="font-medium text-sm">${avg ? avg.toFixed(2) : "0.00"}</div>
                        </div>
                        <div>
                          <div className="text-xs">Current</div>
                          <div className="font-medium text-sm">${current ? current.toFixed(2) : "0.00"}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className={`text-sm font-semibold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pl >= 0 ? '+' : ''}${Math.abs(pl).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {positions.length > 6 && (
              <div className="hidden lg:flex col-span-3 justify-center mt-4">
                <button
                  onClick={() => setShowAllPositions(!showAllPositions)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg  hover:shadow"
                >
                  {showAllPositions ? "Show less" : `Load more...`}
                </button>
              </div>
            )}

            <div className="lg:hidden mt-0">
              <PositionsPanel positions={positions} accountId={accountId} />
            </div>
          </div>

          <div className={`lg:hidden ${activeMobileTab === "orders" ? "block" : "hidden"}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md dark:border dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet size={20} className="text-purple-600" /> Orders</h2>
              </div>
              <div className="max-h-96 overflow-y-auto"><OrdersTable accountId={accountId} /></div>
            </div>
          </div>

<div className={`lg:hidden ${activeMobileTab === "account" ? "block" : "hidden"}`}>
  <section className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 shadow-md border border-gray-200 dark:border-gray-800 transition-colors">
    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-gray-100">
      <PieChart size={20} className="text-indigo-500" />
      Account Overview
    </h2>

    {accountData && (
      <div className="grid grid-cols-2 gap-4">
        {/* Portfolio Value */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-200 to-indigo-400 dark:from-indigo-900 dark:to-indigo-700 border border-indigo-300 dark:border-indigo-800 shadow-sm">
          <div className="text-sm text-indigo-900/90 dark:text-indigo-300 mb-1">Portfolio Value</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">${portfolioValue.toLocaleString()}</div>
        </div>

        {/* Buying Power */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-900 dark:to-amber-700 border border-amber-300 dark:border-amber-800 shadow-sm">
          <div className="text-sm text-amber-900/90 dark:text-amber-300 mb-1">Buying Power</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">${buyingPower.toLocaleString()}</div>
        </div>

        {/* P&L */}
        <div
          className={`p-4 rounded-xl border shadow-sm transition-all duration-300 ${
            totalPnl >= 0
              ? 'bg-gradient-to-br from-emerald-200 to-emerald-400 dark:from-emerald-900 dark:to-emerald-700 border-emerald-300 dark:border-emerald-800'
              : 'bg-gradient-to-br from-rose-200 to-rose-400 dark:from-rose-900 dark:to-rose-700 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div
            className={`text-sm mb-1 ${
              totalPnl >= 0
                ? 'text-emerald-900 dark:text-emerald-300'
                : 'text-rose-900 dark:text-rose-300'
            }`}
          >
            Today's P&L
          </div>
          <div
            className={`text-xl font-semibold ${
              totalPnl >= 0
                ? 'text-emerald-900 dark:text-emerald-200'
                : 'text-rose-900 dark:text-rose-200'
            }`}
          >
            {totalPnl >= 0 ? '+' : '-'}${Math.abs(totalPnl).toFixed(2)}
          </div>
          <div
            className={`text-sm ${
              totalPnl >= 0
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-rose-800 dark:text-rose-300'
            }`}
          >
            {totalPnlPercent >= 0 ? '+' : '-'}{Math.abs(totalPnlPercent).toFixed(2)}%
          </div>
        </div>

        {/* Open Positions */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-sky-200 to-sky-400 dark:from-sky-900 dark:to-sky-700 border border-sky-300 dark:border-sky-800 shadow-sm">
          <div className="text-sm text-sky-900/90 dark:text-sky-300 mb-1">Open Positions</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">{positions.length}</div>
        </div>
      </div>
    )}
  </section>
</div>









        </div>

        {/* RIGHT: Aside (Quick Trade, Account Summary, Orders underneath aside) */}
        <aside className="hidden lg:flex flex-col w-96 gap-4">
          {/* Quick Trade */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:border dark:border-gray-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 text-sm text-gray-500"><Clock size={14} /><MarketClock accountId={accountId} compact /></div>
            </div>
            <PlaceOrderForm accountId={accountId} symbol={activeSymbol} availableSymbols={availableSymbols} onSymbolChange={(s) => setActiveSymbol(s)} />
          </div>

          {/* Account Summary - UPDATED WITH BETTER COLORS */}
          {accountData && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-4 text-white shadow-lg lg:mb-4 border border-slate-700/50">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><PieChart size={18} className="text-purple-300" /> Account Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Portfolio Value</span>
                  <span className="font-semibold text-slate-100">${portfolioValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Buying Power</span>
                  <span className="font-semibold text-slate-100">${buyingPower.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Today's P&L</span>
                  <span className={`font-semibold ${totalPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Cash Balance</span>
                    <span className="text-slate-200">${cashBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:border dark:border-gray-700/50 p-4 lg:mt-12">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Wallet size={18} className="text-green-600" /> Orders</h3>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <OrdersTable accountId={accountId} />
            </div>
          </div>
        </aside>
      </main>

      {/* Floating action / modal logic unchanged */}
      <button onClick={() => setShowOrderModal(true)} className="fixed lg:hidden bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-xl">
        <ShoppingCart size={24} />
      </button>

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60">
          <div className="w-full lg:w-[440px] max-w-md bg-white dark:bg-gray-800 rounded-t-3xl lg:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 dark:border-b dark:border-gray-700/50">
              <h3 className="text-lg font-semibold">Place Order</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-2 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <PlaceOrderForm
                accountId={accountId}
                symbol={activeSymbol}
                availableSymbols={availableSymbols}
                onSymbolChange={(s) => setActiveSymbol(s)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Mobile Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="w-80 bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-in-right">
            {/* Menu Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TradePro</h3>
                <button onClick={() => setShowMenu(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Account #{accountId}</p>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Stats - UPDATED WITH BETTER COLORS */}
              {accountData && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white border border-slate-700/50">
                  <div className="text-sm text-slate-300 mb-2">Portfolio Value</div>
                  <div className="text-2xl font-bold mb-1 text-slate-100">${portfolioValue.toLocaleString()}</div>
                  <div className={`text-sm ${totalPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)} ({totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">Navigation</h4>
                <div className="space-y-2">
                  {[
                    { id: "chart", label: "Trading Chart", icon: BarChart3 },
                    { id: "orders", label: "Order History", icon: Wallet },
                    { id: "positions", label: "My Positions", icon: TrendingUp },
                    { id: "account", label: "Account", icon: PieChart },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveMobileTab(id as any);
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        activeMobileTab === id
                          ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watchlist */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">Watchlist</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableSymbols.slice(0, 8).map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => {
                        setActiveSymbol(symbol);
                        setActiveMobileTab("chart");
                        setShowMenu(false);
                      }}
                      className={`p-3 text-sm font-medium rounded-xl transition-all text-center truncate ${
                        activeSymbol === symbol
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowOrderModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                  >
                    <Zap size={18} />
                    Place New Order
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium">
                    <DollarSign size={18} />
                    Deposit Funds
                  </button>
                </div>
              </div>

              {/* Market Tools */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">Market Tools</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowCalendar(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                  >
                    <CalendarIcon size={16} />
                    <div>
                      <div className="font-medium text-sm">Market Calendar</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">View trading hours</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Market Status</span>
                <MarketClock accountId={accountId} compact />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingDashboard;







































































































// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import { MarketClock } from "../MarketClock";
// import AdvancedTradingChart from "../AdvancedChart";
// import { SymbolSearch } from "./SymbolSearch";
// import { MarketCalendar } from "../MarketCalendar";
// import { PlaceOrderForm } from "./PlaceOrderForm";
// import { OrdersTable } from "./OrdersTable";
// import { PositionsPanel } from "@/pages/trading/PositionsPanel";

// import {
//   Calendar as CalendarIcon,
//   X,
//   ShoppingCart,
//   Menu,
//   BarChart3,
//   Wallet,
//   TrendingUp,
//   Clock,
//   Bell,
//   Settings,
//   User,
//   PieChart,
//   DollarSign,
//   Zap,
//   RefreshCw,
// } from "lucide-react";
// import { useTradingStore } from "@/store/tradingStore";
// import { usePositions, useAssets, useAccount, usePortfolioHistory } from "@/hooks/useTrading";

// export const TradingDashboard: React.FC = () => {
//   const { accountId } = useParams<{ accountId: string }>();
//   const [activeSymbol, setActiveSymbol] = useState<string>("BTC/USD");
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [showOrderModal, setShowOrderModal] = useState(false);
//   const [showMenu, setShowMenu] = useState(false);
//   const [activeMobileTab, setActiveMobileTab] = useState<"chart" | "orders" | "positions" | "account">("chart");
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // NEW: control whether to show all positions on desktop
//   const [showAllPositions, setShowAllPositions] = useState(false);

//   // Store data and actions
//   const assets = useTradingStore((s) => s.assets) || [];
//   const positions = useTradingStore((s) => s.positions) || [];
//   const updatePositions = useTradingStore((s) => s.updatePositions);
//   const updateAssets = useTradingStore((s) => s.updateAssets);

//   // Fetch data
//   const {
//     data: positionsData,
//     isLoading: positionsLoading,
//     error: positionsError,
//     refetch: refetchPositions
//   } = usePositions(accountId!);

//   const {
//     data: assetsData,
//     isLoading: assetsLoading,
//     error: assetsError,
//     refetch: refetchAssets
//   } = useAssets(accountId!, {});

//   const { data: accountData, refetch: refetchAccount } = useAccount(accountId!);
//   const { data: portfolioHistory } = usePortfolioHistory(accountId!);

//   console.log("ACTIVE SYMBOL: ", activeSymbol)

//   // Handle refresh
//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     await Promise.all([
//       refetchPositions(),
//       refetchAssets(),
//       refetchAccount()
//     ]);
//     setTimeout(() => setIsRefreshing(false), 900);
//   };

//   // Update store when API data changes
//   useEffect(() => {
//     if (positionsData) {
//       const positionsArray = positionsData.results || positionsData;
//       updatePositions(positionsArray);
//     }
//   }, [positionsData, updatePositions]);

//   useEffect(() => {
//     if (assetsData?.results) updateAssets(assetsData.results);
//   }, [assetsData, updateAssets]);


//   useEffect(() => {
//     if (showOrderModal) {
//       // Prevent background scroll
//       document.body.style.overflow = "hidden";
//     } else {
//       // Restore scroll when modal closes
//       document.body.style.overflow = "";
//     }

//     // Cleanup on unmount
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [showOrderModal]);
//   // Calculate account metrics
//   const totalPnl = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl || "0"), 0);
//   const totalPnlPercent = accountData ? parseFloat(accountData.day_profit_loss_pct || "0") : 0;
//   const portfolioValue = accountData ? parseFloat(accountData.portfolio_value || "0") : 0;
//   const buyingPower = accountData ? parseFloat(accountData.buying_power || "0") : 0;
//   const cashBalance = accountData ? parseFloat(accountData.cash || "0") : 0;

//   // Available symbols for trading
//   const availableSymbols = assets.length ? assets.map((a) => a.symbol) : ["BTC/USD", "ETH/USD", "AAPL", "TSLA"];

//   if (!accountId) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
//         <div className="text-center p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg dark:border dark:border-gray-700/50 ">
//           <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
//             <X className="text-red-600 dark:text-red-400" size={24} />
//           </div>
//           <p className="text-red-600 dark:text-red-400 font-medium">No account ID provided</p>
//           <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please check the URL and try again</p>
//         </div>
//       </div>
//     );
//   }

//   if (positionsLoading || assetsLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="relative">
//             <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
//             <div className="w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin absolute top-0 left-0"></div>
//           </div>
//           <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading Trading Dashboard</p>
//           <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Fetching market data and positions...</p>
//         </div>
//       </div>
//     );
//   }

//   if (positionsError || assetsError) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center p-8 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-lg dark:border dark:border-gray-700/50 max-w-md">
//           <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
//             <X className="text-red-600 dark:text-red-400" size={24} />
//           </div>
//           <p className="text-red-600 dark:text-red-400 font-medium">Failed to load trading data</p>
//           <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{positionsError?.message || assetsError?.message}</p>
//           <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col">
//       {/* Header */}
//       <header className="w-full relative">
//         <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
//           {/* TOP ROW (logo + account) */}
//           <div className="flex items-center justify-between py-3">
//             <div className="flex items-center gap-3">
//               <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg" />
//               <div className="flex flex-col">
//                 <p className="text-xs text-gray-400 flex items-center gap-1">
//                   <User size={12} /> Account #{accountId}
//                 </p>
//               </div>
//             </div>

//             {/* mobile top icons */}
//             <div className="flex items-center gap-2 lg:hidden">
//               <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 rounded-xl hover:bg-gray-100/10">
//                 <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
//               </button>
//               <button onClick={() => setShowCalendar(true)} className="p-2 rounded-xl hover:bg-gray-100/10">
//                 <CalendarIcon size={18} />
//               </button>
//               <button onClick={() => setShowMenu(true)} className="p-2 rounded-xl hover:bg-gray-100/10">
//                 <Menu size={20} />
//               </button>
//             </div>
//           </div>

//           {/* SECOND ROW: SEARCH (left) — CENTERED MARKET (centered & bounded) — icons pinned to absolute right */}
//           <div className="relative pb-3">
//             <div className="flex items-center lg:gap-10">
//               {/* left search area (flexible) */}
//               <div className="flex-1 lg:max-w-md">
//                 <SymbolSearch accountId={accountId} onSymbolSelect={(s) => setActiveSymbol(s)} />
//               </div>

//               {/* center: bounded to same width as chart container */}
//               <div
//                 className="hidden lg:flex items-center gap-8 justify-center
//                      flex-shrink-0 ps-44"
//                 /* IMPORTANT: match this max-w with your chart's max-width (example: 1100px) */
//                 style={{ maxWidth: "1100px" }}
//               >
//                 <MarketClock accountId={accountId} />
//                 {accountData && (
//                   <div className="text-right">
//                     <div className="text-sm font-semibold dark:text-white">
//                       ${portfolioValue.toLocaleString()}
//                     </div>
//                     <div className={`text-xs ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
//                       {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toFixed(2)} (
//                       {totalPnlPercent >= 0 ? "+" : ""}{totalPnlPercent.toFixed(2)}%)
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* spacer to allow left area + centered block to behave nicely on wide screens */}
//               <div className="flex-1" />
//             </div>

//             {/* RIGHT: icons pinned to absolute right of the HEADER (extreme end) */}
//             <div className="hidden lg:flex items-center gap-2 absolute right-0 top-1/2 transform -translate-y-1/2 ">
//               <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 rounded-xl hover:bg-gray-100/10">
//                 <RefreshCw size={18} className={`${isRefreshing ? "animate-spin" : ""}`} />
//               </button>
//               <button onClick={() => setShowCalendar(true)} className="p-2 rounded-xl hover:bg-gray-100/10">
//                 <CalendarIcon size={18} />
//               </button>
//               {/* Add other icons here */}
//             </div>

//             {/* compact center for small screens */}
//             <div className="lg:hidden mt-3 flex items-center gap-3">
//               <MarketClock accountId={accountId} compact />
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Mobile Tabs */}
//       <div className="lg:hidden dark:border-b dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg top-[88px] z-40 rounded-xl shadow-lg">
//         <div className="flex">
//           {[
//             { id: "chart", label: "Chart", icon: BarChart3 },
//             { id: "orders", label: "Orders", icon: Wallet },
//             { id: "positions", label: "Positions", icon: TrendingUp },
//             { id: "account", label: "Account", icon: PieChart },
//           ].map(({ id, label, icon: Icon }) => (
//             <button
//               key={id}
//               onClick={() => setActiveMobileTab(id as any)}
//               className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
//                 activeMobileTab === id 
//                   ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-gradient-to-t from-purple-50/80 to-transparent dark:from-purple-900/20 rounded-t-xl" 
//                   : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
//               }`}
//             >
//               <Icon size={16} />
//               {label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Calendar Modal */}
//       {showCalendar && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[95%] max-w-md">
//             <div className="flex items-center justify-between p-6 dark:border-b dark:border-gray-700/50">
//               <h3 className="text-lg font-semibold flex items-center gap-2"><CalendarIcon size={20} /> Market Calendar</h3>
//               <button onClick={() => setShowCalendar(false)} className="p-2 rounded-xl"><X size={18} /></button>
//             </div>
//             <div className="p-6 max-h-[70vh] overflow-y-auto"><MarketCalendar accountId={accountId} /></div>
//           </div>
//         </div>
//       )}

//       {/* Main layout: left = chart + positions; right = aside (quick trade, account summary, orders) */}
//       <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-3 sm:p-4 ">
//         {/* LEFT: Chart + Positions (positions underneath chart) */}
//         <div className="flex-1 flex flex-col gap-4">
//           {/* Chart - Conditionally shown on mobile based on active tab */}
//           <section className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:border dark:border-gray-700/50 overflow-hidden ${
//             activeMobileTab === "chart" ? "block" : "hidden lg:block"
//           }`}>
//             <div className="p-4 dark:border-b dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700/50">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><Clock size={14} /> <span>Real-time</span></div>
//               </div>
//             </div>

//             <div className="h-[500px] lg:h-[600px] "><AdvancedTradingChart symbol={activeSymbol} /></div>
//           </section>

//           {/* Positions under chart - Conditionally shown on mobile based on active tab */}
//           <div className={`${activeMobileTab === "positions" ? "block" : "hidden lg:block"}`}>
//             {/* Desktop title for positions */}
//             <div className="hidden lg:flex items-center justify-between mb-2 lg:mt-3 ">
//               <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp size={18} /> Positions</h3>
//             </div>

//             {/* Desktop grid (lg+) */}
//             <div className="hidden lg:grid lg:grid-cols-3 gap-4">
//               {positions.length === 0 ? (
//                 <div className="col-span-3 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md dark:border dark:border-gray-700/50 text-center text-sm text-gray-500">No open positions</div>
//               ) : (
//                 (positions.slice(0, showAllPositions ? positions.length : 6)).map((pos: any, i: number) => {
//                   const qty = pos.qty ?? pos.quantity ?? pos.shares ?? 0;
//                   const avg = parseFloat(pos.avg_entry_price ?? pos.avg_price ?? pos.avg ?? "0");
//                   const current = parseFloat(pos.current_price ?? pos.last_price ?? pos.mark_price ?? "0");
//                   const pl = parseFloat(pos.unrealized_pl ?? "0");
//                   const plPct = avg ? ((current - avg) / avg) * 100 : 0;
//                   return (
//                     <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md dark:border dark:border-gray-700/50 flex flex-col justify-between">
//                       <div className="flex items-center justify-between mb-3">
//                         <div>
//                           <div className="text-sm font-semibold">{pos.symbol ?? pos.ticker ?? "—"}</div>
//                           <div className="text-xs text-gray-500 dark:text-gray-400">{pos.side ? pos.side.toUpperCase() : ''}</div>
//                         </div>
//                         <div className="text-right">
//                           <div className="text-sm">Qty</div>
//                           <div className="font-medium">{qty}</div>
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
//                         <div>
//                           <div className="text-xs">Avg</div>
//                           <div className="font-medium text-sm">${avg ? avg.toFixed(2) : "0.00"}</div>
//                         </div>
//                         <div>
//                           <div className="text-xs">Current</div>
//                           <div className="font-medium text-sm">${current ? current.toFixed(2) : "0.00"}</div>
//                         </div>
//                       </div>

//                       <div className="flex items-center justify-between">
//                         <div className={`text-sm font-semibold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                           {pl >= 0 ? '+' : ''}${Math.abs(pl).toFixed(2)}
//                         </div>
//                         <div className="text-xs text-gray-500 dark:text-gray-400">{plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%</div>
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>

//             {/* Load more button for desktop when there are more than 6 positions */}
//             {positions.length > 6 && (
//               <div className="hidden lg:flex col-span-3 justify-center mt-4">
//                 <button
//                   onClick={() => setShowAllPositions(!showAllPositions)}
//                   className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-lg  hover:shadow"
//                 >
//                   {showAllPositions ? "Show less" : `Load more...`}
//                 </button>
//               </div>
//             )}

//             {/* Mobile / fallback: render full PositionsPanel for smaller screens */}
//             <div className="lg:hidden mt-0">
//               <PositionsPanel positions={positions} accountId={accountId} />
//             </div>
//           </div>

//           {/* Mobile content for Orders tab */}
//           <div className={`lg:hidden ${activeMobileTab === "orders" ? "block" : "hidden"}`}>
//             <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md dark:border dark:border-gray-700/50">
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet size={20} className="text-purple-600" /> Orders</h2>
//               </div>
//               <div className="max-h-96 overflow-y-auto"><OrdersTable accountId={accountId} /></div>
//             </div>
//           </div>

//           {/* Mobile content for Account tab */}
//           <div className={`lg:hidden ${activeMobileTab === "account" ? "block" : "hidden"}`}>
//             <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md dark:border dark:border-gray-700/50">
//               <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><PieChart size={20} className="text-purple-600" /> Account Overview</h2>
//               {accountData && (
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/30">
//                     <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Portfolio Value</div>
//                     <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">${portfolioValue.toLocaleString()}</div>
//                   </div>
//                   <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/30">
//                     <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Buying Power</div>
//                     <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">${buyingPower.toLocaleString()}</div>
//                   </div>
//                   <div className={`p-4 rounded-xl border ${
//                     totalPnl >= 0
//                       ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/50 dark:border-green-700/30'
//                       : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200/50 dark:border-red-700/30'
//                     }`}>
//                     <div className={`text-sm ${totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mb-1`}>Today's P&L</div>
//                     <div className={`text-xl font-bold ${totalPnl >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}</div>
//                     <div className={`text-sm ${totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%</div>
//                   </div>
//                   <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/30">
//                     <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Open Positions</div>
//                     <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{positions.length}</div>
//                   </div>
//                 </div>
//               )}
//             </section>
//           </div>
//         </div>

//         {/* RIGHT: Aside (Quick Trade, Account Summary, Orders underneath aside) */}
//         <aside className="hidden lg:flex flex-col w-96 gap-4">
//           {/* Quick Trade */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:border dark:border-gray-700/50 p-4">
//             <div className="flex items-center justify-between mb-4">
//               <div className="flex items-center gap-1 text-sm text-gray-500"><Clock size={14} /><MarketClock accountId={accountId} compact /></div>
//             </div>
//             <PlaceOrderForm accountId={accountId} symbol={activeSymbol} availableSymbols={availableSymbols} onSymbolChange={(s) => setActiveSymbol(s)} />
//           </div>

//           {/* Account Summary */}
//           {accountData && (
//             <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg lg:mb-4">
//               <h3 className="font-semibold mb-3 flex items-center gap-2"><PieChart size={18} /> Account Summary</h3>
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center"><span className="text-blue-100">Portfolio Value</span><span className="font-semibold">${portfolioValue.toLocaleString()}</span></div>
//                 <div className="flex justify-between items-center"><span className="text-blue-100">Buying Power</span><span className="font-semibold">${buyingPower.toLocaleString()}</span></div>
//                 <div className="flex justify-between items-center"><span className="text-blue-100">Today's P&L</span><span className={`font-semibold ${totalPnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>{totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}</span></div>
//                 <div className="pt-2 border-t border-blue-400/30"><div className="flex justify-between text-sm"><span className="text-blue-200">Cash Balance</span><span>${cashBalance.toLocaleString()}</span></div></div>
//               </div>
//             </div>
//           )}

//           {/* ORDERS (moved under the aside section per your request) */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:border dark:border-gray-700/50 p-4 lg:mt-12">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="font-semibold text-lg flex items-center gap-2"><Wallet size={18} className="text-green-600" /> Orders</h3>
//               <div className="text-sm text-gray-500">Active</div>
//             </div>
//             <div className="max-h-80 overflow-y-auto">
//               <OrdersTable accountId={accountId} />
//             </div>
//           </div>
//         </aside>
//       </main>

//       {/* Floating action / modal logic unchanged */}
//       <button onClick={() => setShowOrderModal(true)} className="fixed lg:hidden bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-xl">
//         <ShoppingCart size={24} />
//       </button>

//       {showOrderModal && (
//         <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60">
//           <div className="w-full lg:w-[440px] max-w-md bg-white dark:bg-gray-800 rounded-t-3xl lg:rounded-2xl shadow-2xl">
//             <div className="flex items-center justify-between p-6 dark:border-b dark:border-gray-700/50">
//               <h3 className="text-lg font-semibold">Place Order</h3>
//               <button
//                 onClick={() => setShowOrderModal(false)}
//                 className="p-2 rounded-xl"
//               >
//                 <X size={18} />
//               </button>
//             </div>
//             <div className="p-6 max-h-[80vh] overflow-y-auto">
//               <PlaceOrderForm
//                 accountId={accountId}
//                 symbol={activeSymbol}
//                 availableSymbols={availableSymbols}
//                 onSymbolChange={(s) => setActiveSymbol(s)}
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Mobile Menu */}
//       {showMenu && (
//         <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm lg:hidden">
//           <div className="w-80 bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-in-right">
//             {/* Menu Header */}
//             <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700/50">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TradePro</h3>
//                 <button onClick={() => setShowMenu(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><X size={20} /></button>
//               </div>
//               <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Account #{accountId}</p>
//             </div>

//             {/* Menu Content */}
//             <div className="flex-1 overflow-y-auto p-6 space-y-6">
//               {/* Quick Stats */}
//               {accountData && (
//                 <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white">
//                   <div className="text-sm opacity-90 mb-2">Portfolio Value</div>
//                   <div className="text-2xl font-bold mb-1">${portfolioValue.toLocaleString()}</div>
//                   <div className={`text-sm ${totalPnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>{totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)} ({totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)</div>
//                 </div>
//               )}

//               {/* Navigation */}
//               <div>
//                 <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">Navigation</h4>
//                 <div className="space-y-2">
//                   {[
//                     { id: "chart", label: "Trading Chart", icon: BarChart3 },
//                     { id: "orders", label: "Order History", icon: Wallet },
//                     { id: "positions", label: "My Positions", icon: TrendingUp },
//                     { id: "account", label: "Account", icon: PieChart },
//                   ].map(({ id, label, icon: Icon }) => (
//                     <button
//                       key={id}
//                       onClick={() => {
//                         setActiveMobileTab(id as any);
//                         setShowMenu(false);
//                       }}
//                       className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
//                         activeMobileTab === id
//                           ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
//                           : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
//                       }`}
//                     >
//                       <Icon size={18} />
//                       <span className="font-medium">{label}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Watchlist */}
//               <div>
//                 <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">Watchlist</h4>
//                 <div className="grid grid-cols-2 gap-2">
//                   {availableSymbols.slice(0, 8).map((symbol) => (
//                     <button
//                       key={symbol}
//                       onClick={() => {
//                         setActiveSymbol(symbol);
//                         setActiveMobileTab("chart");
//                         setShowMenu(false);
//                       }}
//                       className={`p-3 text-sm font-medium rounded-xl transition-all text-center truncate ${
//                         activeSymbol === symbol
//                           ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
//                           : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
//                       }`}
//                     >
//                       {symbol}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Quick Actions */}
//               <div>
//                 <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">Quick Actions</h4>
//                 <div className="space-y-2">
//                   <button
//                     onClick={() => {
//                       setShowOrderModal(true);
//                       setShowMenu(false);
//                     }}
//                     className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
//                   >
//                     <Zap size={18} />
//                     Place New Order
//                   </button>
//                   <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium">
//                     <DollarSign size={18} />
//                     Deposit Funds
//                   </button>
//                 </div>
//               </div>

//               {/* Market Tools */}
//               <div>
//                 <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm uppercase tracking-wide">Market Tools</h4>
//                 <div className="space-y-2">
//                   <button
//                     onClick={() => {
//                       setShowCalendar(true);
//                       setShowMenu(false);
//                     }}
//                     className="w-full flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
//                   >
//                     <CalendarIcon size={16} />
//                     <div>
//                       <div className="font-medium text-sm">Market Calendar</div>
//                       <div className="text-xs text-gray-500 dark:text-gray-400">View trading hours</div>
//                     </div>
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Menu Footer */}
//             <div className="p-6 border-t border-gray-200 dark:border-gray-700">
//               <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
//                 <span>Market Status</span>
//                 <MarketClock accountId={accountId} compact />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TradingDashboard;



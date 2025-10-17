import React, { useEffect, useRef, useMemo, useCallback, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  CandlestickSeries,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";
import { useHistoricalBars, useLazyHistoricalBars } from "@/hooks/useTrading";
import useTradingStore from "@/store/tradingStore";
import { type CandleWithVolume } from "@/utils/normalizerBars";
import { MarketDataWebSocketService } from "@/services/websocket";
import { timeframeToMilliseconds } from "@/utils/dataAggregation";

// --- Constants ---
interface TradingChartProps {
  symbol: string;
  height?: number;
  onTimeframeChange?: (timeframe: string) => void;
}

const DEFAULT_HEIGHT = 500;
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'] as const;

export const AdvancedTradingChart: React.FC<TradingChartProps> = ({
  symbol,
  height = DEFAULT_HEIGHT,
  onTimeframeChange,
}) => {
  // --- Refs ---
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsServiceRef = useRef<MarketDataWebSocketService | null>(null);
  
  const currentCandleDataRef = useRef<CandlestickData | null>(null);

  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const lastPriceRef = useRef<number | null>(null);

  const [chartInitialized, setChartInitialized] = useState(false);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<{ direction: 'up' | 'down' | 'neutral'; value: number }>({ direction: 'neutral', value: 0 });

  const { 
    timeframe, 
    setTimeframe,
    currentPrices,
    updateCurrentPrice,
    updateQuote
  } = useTradingStore();

  const {
    data: candles = [],
    isLoading,
    error: dataHookError, 
    refetch,
  } = useHistoricalBars(symbol, {
    timeframe: timeframe || '1m',
    limit: 1000,
  });


  // --- Utility Callbacks ---
  const getCandleStartTime = useCallback((timestamp: number): UTCTimestamp => {
    const timeframeMs = timeframeToMilliseconds(timeframe || '1m');
    const candleStartTime = Math.floor(timestamp / timeframeMs) * timeframeMs;
    // Lightweight-charts expects time in seconds (UTCTimestamp is number/Time)
    return Math.floor(candleStartTime / 1000) as UTCTimestamp;
  }, [timeframe]);

  const checkContainerDimensions = useCallback(() => {
    if (!chartContainerRef.current) return false;
    const { clientWidth, clientHeight } = chartContainerRef.current;
    return clientWidth > 100 && clientHeight > 100;
  }, []);

  const safeChartCleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        console.warn("⚠️ Error during chart cleanup:", error);
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      currentCandleDataRef.current = null; // Reset local candle state
    }
    setChartInitialized(false);
  }, []);

  // --- Data Processing (useMemo) ---
  const chartData = useMemo((): CandlestickData[] => {
    if (!candles.length) return [];

    try {
      // 💡 Retain original data filtering and sorting logic
      const validCandles = candles
        .filter((candle): candle is CandleWithVolume => 
          candle && 
          typeof candle.open === 'number' && 
          typeof candle.high === 'number' && 
          typeof candle.low === 'number' && 
          typeof candle.close === 'number' &&
          candle.time != null
        )
        .slice(-1000); // Changed to 1000 to match data limit

      return validCandles.sort((a, b) => a.time - b.time).map((candle: CandleWithVolume) => ({
        // Ensure time is converted to seconds for Lightweight Charts
        time: candle.time as UTCTimestamp, 
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
    } catch (error) {
      console.error("❌ Error processing chart data:", error);
      setDataFetchError("Failed to process historical data.");
      return [];
    }
  }, [candles]);

  // --- Core Function: Chart Initialization ---
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || chartRef.current) return false;

    try {
      const container = chartContainerRef.current;
      const currentTimeframe = timeframe || '1m';

      safeChartCleanup();

      chartRef.current = createChart(container, {
       
        layout: {
          background: { type: ColorType.Solid, color: "#0A0E17" },
          textColor: "#94A3B8",
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(148, 163, 184, 0.1)", visible: true, style: 1 },
          horzLines: { color: "rgba(148, 163, 184, 0.1)", visible: true, style: 1 },
        },
        width: container.clientWidth,
        height: container.clientHeight,
        timeScale: {
          borderColor: "rgba(148, 163, 184, 0.2)",
          timeVisible: true,
          secondsVisible: ['1m', '5m'].includes(currentTimeframe),
          barSpacing: 8,
          minBarSpacing: 4,
          fixLeftEdge: false,
          fixRightEdge: false,
          rightOffset: 12,
          shiftVisibleRangeOnNewBar: true,
          
          tickMarkFormatter: (time: Time, tickMarkType: any) => {
            const date = new Date(Number(time) * 1000);
            if (currentTimeframe === '1D' || currentTimeframe === '1W') {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: "rgba(148, 163, 184, 0.3)", width: 1, style: 2, labelBackgroundColor: "#1E293B" },
          horzLine: { color: "rgba(148, 163, 184, 0.3)", width: 1, style: 2, labelBackgroundColor: "#1E293B" },
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
        kineticScroll: { mouse: true, touch: true },
        localization: {
          priceFormatter: (price: number) => `$${price.toFixed(2)}`,
        },
      });

      candleSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: "#10B981", downColor: "#EF4444", borderUpColor: "#10B981", borderDownColor: "#EF4444",
        wickUpColor: "rgba(16, 185, 129, 0.7)", wickDownColor: "rgba(239, 68, 68, 0.7)",
        borderVisible: true, priceScaleId: 'right',
      });

      chartRef.current.priceScale('right').applyOptions({
        borderColor: "rgba(148, 163, 184, 0.2)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
        autoScale: true, entireTextOnly: false,
      });

      setChartInitialized(true);
      setInitializationAttempted(true);
      setDataFetchError(null); 
      
      console.log("✅ Professional chart initialized for timeframe:", currentTimeframe);
      return true;

    } catch (error) {
      console.error("❌ Chart initialization failed:", error);
      setInitializationAttempted(true);
      return false;
    }
  }, [timeframe, safeChartCleanup]);

  const updateChartWithCurrentPrice = useCallback(() => {
    if (!candleSeriesRef.current || !chartRef.current) return;

    const currentPrice = currentPrices[symbol];
    if (!currentPrice) return;

    const now = Date.now();
    
    
    if (now - lastUpdateRef.current < 16) return; 

    try {
      const currentCandleTime = getCandleStartTime(now);
      let lastCandle = currentCandleDataRef.current; 

      let updatedCandle: CandlestickData;

      if (lastCandle && lastCandle.time === currentCandleTime) {
        updatedCandle = {
          time: currentCandleTime,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, currentPrice),
          low: Math.min(lastCandle.low, currentPrice),
          close: currentPrice,
        };
      } else {
        const previousClose = lastCandle ? lastCandle.close : currentPrice;
        updatedCandle = {
          time: currentCandleTime,
          open: previousClose,
          high: Math.max(previousClose, currentPrice),
          low: Math.min(previousClose, currentPrice),
          close: currentPrice,
        };
      }

      candleSeriesRef.current.update(updatedCandle);
      currentCandleDataRef.current = updatedCandle; 
      
      lastUpdateRef.current = now;

    } catch (error) {
      console.error("❌ Error updating chart data:", error);
    }
  }, [symbol, currentPrices, getCandleStartTime]);

  // --- Effect: WebSocket Initialization ---
  useEffect(() => {
    let isMounted = true;

    const initializeRealTimeData = async () => {
      if (!isMounted) return;

      try {
        if (wsServiceRef.current) {
          wsServiceRef.current.disconnect();
          wsServiceRef.current = null;
        }

        const wsService = new MarketDataWebSocketService(
          (status) => {
            if (!isMounted) return;
            console.log(`📡 WebSocket status: ${status}`);
            setIsRealTimeActive(status === 'connected');
          }
        );
        
        await wsService.connect();
        if (!isMounted) { wsService.disconnect(); return; }

        wsServiceRef.current = wsService;
        wsService.switchSymbol(symbol);
        
        const quoteOrTradeHandler = (price: number, timestamp: number) => {
          if (!isMounted) return;
          
          if (lastPriceRef.current !== null) {
            const change = price - lastPriceRef.current;
            setPriceChange({
              direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
              value: Math.abs(change)
            });
          }
          lastPriceRef.current = price;

          updateCurrentPrice(symbol, price);
          lastUpdateRef.current = timestamp || Date.now();
        }

        wsService.onMessage('quotes', (quoteData) => {
          if (quoteData.symbol === symbol && quoteData.bid_price !== undefined) {
            quoteOrTradeHandler(quoteData.bid_price, quoteData.timestamp || Date.now());
            updateQuote(symbol, quoteData); // Store full quote data
          }
        });

        wsService.onMessage('trades', (tradeData) => {
          if (tradeData.symbol === symbol && tradeData.price !== undefined) {
            quoteOrTradeHandler(tradeData.price, tradeData.timestamp || Date.now());
          }
        });

      } catch (error) {
        console.error('Failed to initialize real-time data:', error);
      }
    };

    initializeRealTimeData();

    return () => {
      isMounted = false;
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [symbol, updateCurrentPrice, updateQuote]);

  // --- Effect: Real-time Update Loop (Animation Frame) ---
  useEffect(() => {
    if (!chartInitialized) return;

    const updateLoop = () => {
      updateChartWithCurrentPrice();
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
    };
  }, [chartInitialized, updateChartWithCurrentPrice]);

  // --- Effect: Set Historical Data ---
  useEffect(() => {
    if (chartInitialized && candleSeriesRef.current && chartData.length > 0) {
      console.log("📊 Setting historical data:", chartData.length);
      
      candleSeriesRef.current.setData(chartData);
      
      // Initialize current candle data from the last historical candle
      const lastCandle = chartData[chartData.length - 1];
      currentCandleDataRef.current = lastCandle; // 💡 Update the new ref
      
      // Smooth fit content/scroll (Timing remains for good UX)
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
          setTimeout(() => {
            if (chartRef.current) {
              chartRef.current.timeScale().scrollToPosition(-8, false);
            }
          }, 100);
        }
      }, 150);
    }
    
    // 💡 Error handling for historical data
    if (dataHookError) {
        setDataFetchError("Error fetching historical data. Please refresh.");
        console.error("Historical data fetch error:", dataHookError);
    } else {
        setDataFetchError(null);
    }
  }, [chartInitialized, chartData, dataHookError]);

  // --- Effect: Container Ready Check ---
  useEffect(() => {
    if (chartContainerRef.current) {
        const check = () => {
            if (checkContainerDimensions()) {
                setContainerReady(true);
            } else {
                // If container isn't ready, try again shortly
                setTimeout(check, 100);
            }
        };
        check();
    }
  }, [checkContainerDimensions]);

  // --- Effect: Initialize Chart when Ready ---
  useEffect(() => {
    if (containerReady && !chartInitialized && !initializationAttempted) {
      const initializeWithData = () => {
        const success = initializeChart();
        if (success) {
          // Trigger a price update shortly after init to set the latest price on the chart
          setTimeout(updateChartWithCurrentPrice, 100);
        }
      };

      requestAnimationFrame(initializeWithData);
    }
  }, [containerReady, chartInitialized, initializeChart, updateChartWithCurrentPrice, initializationAttempted]);

  // --- Effect: Smooth Resize Handling (Unchanged, good implementation) ---
  useEffect(() => {
    if (!chartContainerRef.current || !chartRef.current || !chartInitialized) return;

    let resizeTimeout: NodeJS.Timeout;
    
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const entry = entries[0];
        if (entry && chartRef.current) {
          const { width, height } = entry.contentRect;
          chartRef.current.applyOptions({ width, height });
          
          setTimeout(() => {
            if (chartRef.current && chartData.length > 0) {
              try {
                // Re-fit content after a resize
                chartRef.current.timeScale().fitContent();
              } catch (error) {
                console.warn("⚠️ Could not fit content after resize:", error);
              }
            }
          }, 50);
        }
      }, 50); // Debounce resize
    });

    resizeObserver.observe(chartContainerRef.current);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, [chartInitialized, chartData.length]);

  // --- Effect: Timeframe Change Reset ---
  useEffect(() => {
    currentCandleDataRef.current = null; // Reset local candle data on timeframe change
  }, [timeframe]);

  // --- Effect: Cleanup on unmount ---
  useEffect(() => {
    return () => {
      safeChartCleanup();
    };
  }, [safeChartCleanup]);

  // --- UI Handlers (Callbacks) ---
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    console.log("⚡ Switching timeframe:", { from: timeframe, to: newTimeframe });
    
    setTimeframe(newTimeframe);
    onTimeframeChange?.(newTimeframe);
    
    // Force complete re-initialization
    setTimeout(() => {
      safeChartCleanup();
      setContainerReady(false); // Force container check again
      setInitializationAttempted(false);
    }, 50);
  }, [timeframe, setTimeframe, onTimeframeChange, safeChartCleanup]);

  const handleRefreshData = useCallback(() => {
    // Clear chart before fetching new data
    safeChartCleanup();
    setContainerReady(false);
    setInitializationAttempted(false);
    
    refetch();
  }, [refetch, safeChartCleanup]);

  // --- Effect: Price Change Animation Reset ---
  useEffect(() => {
    if (priceChange.value > 0) {
      const timer = setTimeout(() => {
        setPriceChange({ direction: 'neutral', value: 0 });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [priceChange]);

  // --- Render Logic ---
  const currentTimeframe = timeframe || '1m';
  const currentPrice = currentPrices[symbol];
  const priceChangeClass = priceChange.direction === 'up' 
    ? 'text-green-400' 
    : priceChange.direction === 'down' 
    ? 'text-red-400' 
    : 'text-white';
  
  const showLoadingOverlay = isLoading || !chartInitialized;
  
  return (
    <div className="w-full relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
      {/* Professional Chart Header - now responsive: stacks on small screens */}
      <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 overflow-x-auto flex-nowrap">
        <div className="flex items-center space-x-4 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-white font-bold text-lg sm:text-xl tracking-tight">{symbol}</h3>
            {/* Real-time Status Indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
              isRealTimeActive 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isRealTimeActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}></div>
              {isRealTimeActive ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          
          {/* Price and Change Display */}
          {currentPrice && (
            <div className="flex items-center space-x-2">
              <span className={`text-lg sm:text-2xl font-bold transition-all duration-300 ${priceChangeClass}`}>
                ${currentPrice.toFixed(2)}
              </span>
              {priceChange.value > 0 && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300 ${
                  priceChange.direction === 'up' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {priceChange.direction === 'up' ? '↗' : '↘'} ${priceChange.value.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Professional Refresh Button */}
          <button
            onClick={handleRefreshData}
            disabled={isLoading || !isRealTimeActive}
            className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 group"
            title="Refresh data"
          >
            <svg 
              className={`w-4 h-4 text-gray-300 group-hover:text-white transition-colors ${isLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Responsive Timeframe Selector: buttons on sm+, native select on xs */}
          <div className="hidden sm:flex sm:items-center sm:space-x-1 bg-gray-700/50 rounded-xl p-1.5 border border-gray-600/50 flex-shrink-0">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                disabled={isLoading}
                className={`px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all duration-200 ${
                  currentTimeframe === tf
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Mobile-friendly select for very small screens */}
          <div className="flex sm:hidden items-center">
            <select
              aria-label="Select timeframe"
              value={currentTimeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="bg-gray-700/50 rounded-lg p-2 text-xs font-semibold border border-gray-600/50"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 relative"
        style={{ 
          height: `${height}px`,
          minHeight: `${Math.max(200, height)}px`
        }}
      />

      {/* Professional Status Bar (Bottom) */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs pointer-events-none">
        <div className="flex items-center space-x-3">
          {/* Chart Initialization Status */}
          <span className={`px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm border transition-all duration-300 ${
            chartInitialized 
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : dataFetchError || dataHookError 
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          }`}>
            {chartInitialized ? '✅ Chart Ready' : 
             dataFetchError ? '❌ Data Error' :
             isLoading ? '🔄 Fetching Data...' :
             containerReady ? '⚙️ Initializing...' : 
             '⏳ Loading...'}
          </span>
          
          {/* Data Count */}
          <span className="text-gray-400 font-medium bg-black/20 px-2 py-1.5 rounded-full border border-gray-700/50">
            {candles.length} bars ({currentTimeframe})
          </span>
        </div>
        
        {/* Current Time/Info */}
        <div className="text-gray-400 text-sm font-medium backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full border border-gray-700/50">
          {symbol} • {new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false 
          })}
        </div>
      </div>

      {/* Professional Initializing/Error Overlay */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
          <div className="text-center p-8 bg-gray-800/90 rounded-2xl border border-gray-700/50 shadow-2xl max-w-sm">
            {/* Conditional Display: Error vs. Loading */}
            {dataFetchError ? (
                <div className="text-red-500">
                    <svg className="w-16 h-16 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <p className="text-xl font-bold mb-3 text-red-400">Data Load Error</p>
                    <p className="text-gray-400 text-sm">{dataFetchError}</p>
                </div>
            ) : (
                <>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
                    <p className="text-white text-xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {isLoading ? 'Fetching Historical Data' : 'Initializing Chart Engine'}
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                        {candles.length > 0 ? `Processing ${candles.length} bars...` : `Preparing ${symbol} visualization`}
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full animate-pulse"></div>
                    </div>
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTradingChart;

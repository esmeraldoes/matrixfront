// components/portfolio/BacktestPerformanceChart.tsx
import React, { useEffect, useRef, useMemo, useCallback, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type AreaData,
  LineSeries,
  AreaSeries,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";

interface ChartDataPoint {
  date: string;
  timestamp: Date;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

interface PerformanceMetrics {
  totalReturn: number;
  avgDailyReturn: number;
  winRate: number;
  maxDrawdown: number;
  volatility: number;
  bestDay: number;
  worstDay: number;
}

interface BacktestPerformanceChartProps {
  data: ChartDataPoint[];
  height?: number;
  onChartTypeChange?: (chartType: string) => void;
}

const DEFAULT_HEIGHT = 500;
const CHART_TYPES = ['portfolio', 'returns', 'drawdown', 'comparison'] as const;

export const BacktestPerformanceChart: React.FC<BacktestPerformanceChartProps> = ({
  data,
  height = DEFAULT_HEIGHT,
  onChartTypeChange,
}) => {
  // --- Refs ---
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const portfolioSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const returnsSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const drawdownSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const [chartInitialized, setChartInitialized] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);
  const [activeChartType, setActiveChartType] = useState<'portfolio' | 'returns' | 'drawdown' | 'comparison'>('portfolio');

  // --- Data Processing (useMemo) ---
  const processedChartData = useMemo((): ChartDataPoint[] => {
    console.log("📊 Received chart data:", data?.length);
    
    if (!data || data.length === 0) {
      console.log("❌ No data provided to chart");
      return [];
    }

    try {
      // Ensure data is properly sorted by timestamp
      const sortedData = [...data].sort((a: ChartDataPoint, b: ChartDataPoint) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );

      console.log("✅ Data processed for chart:", sortedData.length);
      if (sortedData.length > 0) {
        console.log("📈 Sample data point:", sortedData[0]);
      }
      
      return sortedData;
    } catch (error) {
      console.error("❌ Error processing chart data:", error);
      setDataFetchError("Failed to process chart data.");
      return [];
    }
  }, [data]);

  // Prepare data for different chart types
  const portfolioData = useMemo((): AreaData[] => {
    console.log("📦 Preparing portfolio data:", processedChartData.length);
    return processedChartData.map((item: ChartDataPoint) => ({
      time: Math.floor(item.timestamp.getTime() / 1000) as UTCTimestamp,
      value: item.portfolioValue,
    }));
  }, [processedChartData]);

  const cumulativeReturnsData = useMemo((): LineData[] => {
    console.log("📦 Preparing cumulative returns data:", processedChartData.length);
    return processedChartData.map((item: ChartDataPoint) => ({
      time: Math.floor(item.timestamp.getTime() / 1000) as UTCTimestamp,
      value: item.cumulativeReturn,
    }));
  }, [processedChartData]);

  const drawdownData = useMemo((): AreaData[] => {
    console.log("📦 Preparing drawdown data:", processedChartData.length);
    return processedChartData.map((item: ChartDataPoint) => ({
      time: Math.floor(item.timestamp.getTime() / 1000) as UTCTimestamp,
      value: item.drawdown,
    }));
  }, [processedChartData]);

  // --- Safe Chart Cleanup ---
  const safeChartCleanup = useCallback(() => {
    console.log("🧹 Performing safe chart cleanup");
    
    if (chartRef.current) {
      try {
        chartRef.current.remove();
        console.log("✅ Chart removed successfully");
      } catch (error) {
        console.warn("⚠️ Error during chart removal:", error);
      }
      chartRef.current = null;
    }
    
    portfolioSeriesRef.current = null;
    returnsSeriesRef.current = null;
    drawdownSeriesRef.current = null;
    
    setChartInitialized(false);
  }, []);

  // --- Core Function: Chart Initialization ---
  const initializeChart = useCallback((): boolean => {
    if (!chartContainerRef.current) {
      console.log("❌ Chart container not ready");
      return false;
    }

    try {
      const container = chartContainerRef.current;
      console.log("🚀 Initializing chart with container:", container.clientWidth, "x", container.clientHeight);

      // Clean up any existing chart using the safe cleanup function
      safeChartCleanup();

      // Create new chart
      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#94A3B8",
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: 12,
        },
        grid: {
          vertLines: { color: "rgba(148, 163, 184, 0.1)", visible: true },
          horzLines: { color: "rgba(148, 163, 184, 0.1)", visible: true },
        },
        width: container.clientWidth,
        height: container.clientHeight,
        timeScale: {
          borderColor: "rgba(148, 163, 184, 0.2)",
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 6,
          minBarSpacing: 2,
          fixLeftEdge: false,
          fixRightEdge: false,
          rightOffset: 5,
          shiftVisibleRangeOnNewBar: false,
        },
        crosshair: {
          mode: 1,
          vertLine: { 
            color: "rgba(148, 163, 184, 0.3)", 
            width: 1, 
            style: 2, 
            labelBackgroundColor: "#1E293B" 
          },
          horzLine: { 
            color: "rgba(148, 163, 184, 0.3)", 
            width: 1, 
            style: 2, 
            labelBackgroundColor: "#1E293B" 
          },
        },
        handleScroll: { 
          mouseWheel: true, 
          pressedMouseMove: true, 
          horzTouchDrag: true, 
          vertTouchDrag: true 
        },
        handleScale: { 
          axisPressedMouseMove: true, 
          mouseWheel: true, 
          pinch: true 
        },
        kineticScroll: { mouse: true, touch: true },
      });

      // Assign to ref
      chartRef.current = chart;

      console.log("✅ Chart instance created");

      // Create series
      const portfolioSeries = chart.addSeries(AreaSeries, {
        lineColor: "#10B981",
        topColor: "rgba(16, 185, 129, 0.4)",
        bottomColor: "rgba(16, 185, 129, 0.1)",
        lineWidth: 2,
        priceScaleId: 'right',
        title: 'Portfolio Value',
      });
      portfolioSeriesRef.current = portfolioSeries;

      const returnsSeries = chart.addSeries(LineSeries, {
        color: "#3B82F6",
        lineWidth: 2,
        priceScaleId: 'left',
        title: 'Cumulative Return',
      });
      returnsSeriesRef.current = returnsSeries;

      const drawdownSeries = chart.addSeries(AreaSeries, {
        lineColor: "#EF4444",
        topColor: "rgba(239, 68, 68, 0.4)",
        bottomColor: "rgba(239, 68, 68, 0.1)",
        lineWidth: 2,
        priceScaleId: 'left',
        title: 'Drawdown',
      });
      drawdownSeriesRef.current = drawdownSeries;

      console.log("✅ All series created");

      // Configure price scales
      chart.priceScale('right').applyOptions({
        borderColor: "rgba(148, 163, 184, 0.2)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
        autoScale: true,
        entireTextOnly: false,
      });

      chart.priceScale('left').applyOptions({
        borderColor: "rgba(148, 163, 184, 0.2)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
        autoScale: true,
        entireTextOnly: false,
      });

      setChartInitialized(true);
      setInitializationAttempted(true);
      setDataFetchError(null);
      
      console.log("✅ Backtest performance chart fully initialized");
      return true;

    } catch (error) {
      console.error("❌ Chart initialization failed:", error);
      setDataFetchError("Chart initialization failed");
      setInitializationAttempted(true);
      return false;
    }
  }, [safeChartCleanup]);

  // --- Function to update visible series ---
  const updateVisibleSeries = useCallback((chartType: string) => {
    const chart = chartRef.current;
    const portfolioSeries = portfolioSeriesRef.current;
    const returnsSeries = returnsSeriesRef.current;
    const drawdownSeries = drawdownSeriesRef.current;

    if (!chart) {
      console.log("❌ Chart not ready for series update");
      return;
    }

    console.log("🔄 Updating visible series to:", chartType);

    // Hide all series first
    portfolioSeries?.applyOptions({ visible: false });
    returnsSeries?.applyOptions({ visible: false });
    drawdownSeries?.applyOptions({ visible: false });

    // Configure price scales and show active series
    switch (chartType) {
      case 'portfolio':
        portfolioSeries?.applyOptions({ visible: true });
        chart.priceScale('right').applyOptions({ visible: true });
        chart.priceScale('left').applyOptions({ visible: false });
        break;
      case 'returns':
        returnsSeries?.applyOptions({ visible: true });
        chart.priceScale('right').applyOptions({ visible: false });
        chart.priceScale('left').applyOptions({ visible: true });
        break;
      case 'drawdown':
        drawdownSeries?.applyOptions({ visible: true });
        chart.priceScale('right').applyOptions({ visible: false });
        chart.priceScale('left').applyOptions({ visible: true });
        break;
      case 'comparison':
        portfolioSeries?.applyOptions({ visible: true });
        returnsSeries?.applyOptions({ visible: true });
        chart.priceScale('right').applyOptions({ visible: true });
        chart.priceScale('left').applyOptions({ visible: true });
        break;
    }

    // Fit content after changing series
    setTimeout(() => {
      if (chart) {
        try {
          chart.timeScale().fitContent();
          console.log("✅ Content fitted for:", chartType);
        } catch (error) {
          console.error("❌ Error fitting content:", error);
        }
      }
    }, 100);
  }, []);

  // --- Effect: Set Historical Data ---
  useEffect(() => {
    const chart = chartRef.current;
    const portfolioSeries = portfolioSeriesRef.current;
    const returnsSeries = returnsSeriesRef.current;
    const drawdownSeries = drawdownSeriesRef.current;

    if (chartInitialized && processedChartData.length > 0 && chart) {
      console.log("📊 Setting chart data:", {
        portfolioData: portfolioData.length,
        cumulativeReturnsData: cumulativeReturnsData.length,
        drawdownData: drawdownData.length,
        activeChartType
      });
      
      // Set data for all series
      try {
        if (portfolioSeries && portfolioData.length > 0) {
          portfolioSeries.setData(portfolioData);
          console.log("✅ Portfolio data set:", portfolioData.length, "points");
        }
        
        if (returnsSeries && cumulativeReturnsData.length > 0) {
          returnsSeries.setData(cumulativeReturnsData);
          console.log("✅ Returns data set:", cumulativeReturnsData.length, "points");
        }
        
        if (drawdownSeries && drawdownData.length > 0) {
          drawdownSeries.setData(drawdownData);
          console.log("✅ Drawdown data set:", drawdownData.length, "points");
        }

        // Update visible series based on current chart type
        updateVisibleSeries(activeChartType);

        // Fit content after a brief delay to ensure data is rendered
        setTimeout(() => {
          if (chart) {
            try {
              chart.timeScale().fitContent();
              console.log("✅ Initial content fitted");
            } catch (error) {
              console.error("❌ Error in initial fitContent:", error);
            }
          }
        }, 200);

      } catch (error) {
        console.error("❌ Error setting chart data:", error);
        setDataFetchError("Error displaying chart data");
      }
    } else if (chartInitialized && processedChartData.length === 0) {
      console.log("⚠️ Chart initialized but no data available");
    }
  }, [
    chartInitialized, 
    processedChartData, 
    portfolioData,
    cumulativeReturnsData,
    drawdownData,
    activeChartType,
    updateVisibleSeries
  ]);

  // --- Effect: Container Ready Check ---
  useEffect(() => {
    if (chartContainerRef.current) {
      const check = () => {
        const container = chartContainerRef.current;
        const isReady = container && 
          container.clientWidth > 100 && 
          container.clientHeight > 100;
        
        if (isReady) {
          console.log("✅ Container ready");
          setContainerReady(true);
        } else {
          console.log("⏳ Waiting for container to be ready...");
          setTimeout(check, 100);
        }
      };
      check();
    }
  }, []);

  // --- Effect: Initialize Chart when Ready ---
  useEffect(() => {
    if (containerReady && !chartInitialized && !initializationAttempted) {
      console.log("🚀 Initializing chart...");
      const success = initializeChart();
      console.log("📊 Chart initialization result:", success);
    }
  }, [containerReady, chartInitialized, initializeChart, initializationAttempted]);

  // --- Effect: Smooth Resize Handling ---
  useEffect(() => {
    const container = chartContainerRef.current;
    const chart = chartRef.current;

    if (!container || !chart || !chartInitialized) return;

    let resizeTimeout: NodeJS.Timeout;
    
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const entry = entries[0];
        if (entry && chart) {
          const { width, height } = entry.contentRect;
          console.log("📏 Resizing chart to:", width, "x", height);
          chart.applyOptions({ width, height });
          
          // Re-fit content after resize
          setTimeout(() => {
            if (chart && processedChartData.length > 0) {
              try {
                chart.timeScale().fitContent();
              } catch (error) {
                console.warn("⚠️ Could not fit content after resize:", error);
              }
            }
          }, 50);
        }
      }, 50);
    });

    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, [chartInitialized, processedChartData.length]);

  // --- Effect: Cleanup on unmount ---
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up chart on unmount");
      safeChartCleanup();
    };
  }, [safeChartCleanup]);

  // --- UI Handlers ---
  const handleChartTypeChange = useCallback((newChartType: 'portfolio' | 'returns' | 'drawdown' | 'comparison') => {
    console.log("🎛️ Changing chart type to:", newChartType);
    setActiveChartType(newChartType);
    updateVisibleSeries(newChartType);
    onChartTypeChange?.(newChartType);
  }, [onChartTypeChange, updateVisibleSeries]);

  const handleRefreshData = useCallback(() => {
    console.log("🔄 Refreshing chart data");
    safeChartCleanup();
    setContainerReady(false);
    setInitializationAttempted(false);
    setDataFetchError(null);
  }, [safeChartCleanup]);

  // --- Performance Metrics Calculation ---
  const performanceMetrics = useMemo((): PerformanceMetrics | null => {
    if (processedChartData.length === 0) return null;

    const returns: number[] = processedChartData.map((d: ChartDataPoint) => d.dailyReturn);
    const positiveReturns: number[] = returns.filter((r: number) => r > 0);
    const negativeReturns: number[] = returns.filter((r: number) => r < 0);
    
    // Calculate average daily return with proper typing
    const totalReturnSum: number = returns.reduce((a: number, b: number) => a + b, 0);
    const avgDailyReturn: number = totalReturnSum / returns.length;
    
    // Calculate volatility with proper typing
    const meanReturn: number = totalReturnSum / returns.length;
    const variance: number = returns.reduce((a: number, b: number) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
    const volatility: number = Math.sqrt(variance);
    
    return {
      totalReturn: processedChartData[processedChartData.length - 1]?.cumulativeReturn || 0,
      avgDailyReturn,
      winRate: (positiveReturns.length / returns.length) * 100,
      maxDrawdown: Math.min(...processedChartData.map((d: ChartDataPoint) => d.drawdown)),
      volatility,
      bestDay: Math.max(...returns),
      worstDay: Math.min(...returns),
    };
  }, [processedChartData]);

  // --- Render Logic ---
  const showLoadingOverlay: boolean = !chartInitialized || processedChartData.length === 0;
  
  console.log("🎨 Rendering chart:", {
    chartInitialized,
    dataLength: processedChartData.length,
    showLoadingOverlay,
    containerReady,
    dataFetchError
  });

  return (
    <div className="w-full relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
      {/* Professional Chart Header */}
      <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 overflow-x-auto flex-nowrap">
        <div className="flex items-center space-x-4 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-white font-bold text-lg sm:text-xl tracking-tight">Backtest Performance</h3>
            {/* Performance Status */}
            {performanceMetrics && (
              <div className="flex items-center space-x-2">
                <span className={`text-lg sm:text-xl font-bold ${
                  performanceMetrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {performanceMetrics.totalReturn >= 0 ? '+' : ''}{performanceMetrics.totalReturn.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                  Win Rate: {performanceMetrics.winRate.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefreshData}
            className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-200 hover:scale-105 active:scale-95 group"
            title="Refresh chart"
          >
            <svg 
              className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-gray-700/50 rounded-xl p-1.5 border border-gray-600/50 flex-shrink-0">
            {CHART_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleChartTypeChange(type)}
                disabled={!chartInitialized}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 capitalize ${
                  activeChartType === type
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
              >
                {type}
              </button>
            ))}
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

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/70 text-xs text-white p-2 rounded-lg font-mono z-10">
          <div>Data: {processedChartData.length} points</div>
          <div>Initialized: {chartInitialized ? '✅' : '❌'}</div>
          <div>Type: {activeChartType}</div>
        </div>
      )}

      {/* Professional Status Bar (Bottom) */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs pointer-events-none">
        <div className="flex items-center space-x-3">
          {/* Chart Status */}
          <span className={`px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm border transition-all duration-300 ${
            chartInitialized && processedChartData.length > 0
              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
              : dataFetchError 
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          }`}>
            {chartInitialized && processedChartData.length > 0 ? '✅ Chart Ready' : 
             dataFetchError ? '❌ Data Error' :
             !chartInitialized ? '⚙️ Initializing...' : 
             '⏳ Loading Data...'}
          </span>
          
          {/* Data Count */}
          {processedChartData.length > 0 && (
            <span className="text-gray-400 font-medium bg-black/20 px-2 py-1.5 rounded-full border border-gray-700/50">
              {processedChartData.length} days
            </span>
          )}
        </div>
        
        {/* Current Chart Type Info */}
        <div className="text-gray-400 text-sm font-medium backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full border border-gray-700/50 capitalize">
          {activeChartType} view
        </div>
      </div>

      {/* Legend Overlay */}
      {chartInitialized && processedChartData.length > 0 && (
        <div className="absolute top-20 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 pointer-events-none z-10">
          <div className="space-y-2 text-xs">
            {(activeChartType === 'portfolio' || activeChartType === 'comparison') && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span className="text-gray-300">Portfolio Value</span>
              </div>
            )}
            {(activeChartType === 'returns' || activeChartType === 'comparison') && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-gray-300">Cumulative Return</span>
              </div>
            )}
            {activeChartType === 'drawdown' && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-gray-300">Drawdown</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Loading/Error Overlay */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
          <div className="text-center p-8 bg-gray-800/90 rounded-2xl border border-gray-700/50 shadow-2xl max-w-sm">
            {dataFetchError ? (
              <div className="text-red-500">
                <svg className="w-16 h-16 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xl font-bold mb-3 text-red-400">Chart Error</p>
                <p className="text-gray-400 text-sm">{dataFetchError}</p>
                <button 
                  onClick={handleRefreshData}
                  className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
                <p className="text-white text-xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {!chartInitialized ? 'Initializing Chart Engine' : 'Processing Data...'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {processedChartData.length > 0 ? 
                    `Processing ${processedChartData.length} data points...` : 
                    'Waiting for chart data...'}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestPerformanceChart;

















// // components/portfolio/BacktestPerformanceChart.tsx
// import React, { useEffect, useRef, useMemo, useCallback, useState } from "react";
// import {
//   createChart,
//   ColorType,
//   type IChartApi,
//   type ISeriesApi,
//   type LineData,
//   type AreaData,
// //   type HistogramData,
//   LineSeries,
//   AreaSeries,
// //   HistogramSeries,
//   type UTCTimestamp,
// //   type Time,
// } from "lightweight-charts";
// import { useBacktestChartData } from '@/hooks/usePortfolios';

// interface BacktestPerformanceChartProps {
//   backtestId: number;
//   height?: number;
//   onChartTypeChange?: (chartType: string) => void;
// }

// interface ChartDataPoint {
//   date: string;
//   timestamp: Date;
//   portfolioValue: number;
//   dailyReturn: number;
//   cumulativeReturn: number;
//   drawdown: number;
// }

// interface PerformanceMetrics {
//   totalReturn: number;
//   avgDailyReturn: number;
//   winRate: number;
//   maxDrawdown: number;
//   volatility: number;
//   bestDay: number;
//   worstDay: number;
// }

// const DEFAULT_HEIGHT = 500;
// const CHART_TYPES = ['portfolio', 'returns', 'drawdown', 'comparison'] as const;

// export const BacktestPerformanceChart: React.FC<BacktestPerformanceChartProps> = ({
//   backtestId,
//   height = DEFAULT_HEIGHT,
//   onChartTypeChange,
// }) => {
//   // --- Refs ---
//   const chartContainerRef = useRef<HTMLDivElement>(null);
//   const chartRef = useRef<IChartApi | null>(null);
//   const portfolioSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
//   const returnsSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
//   const drawdownSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
// //   const histogramSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

//   const [chartInitialized, setChartInitialized] = useState(false);
//   const [containerReady, setContainerReady] = useState(false);
//   const [initializationAttempted, setInitializationAttempted] = useState(false);
//   const [dataFetchError, setDataFetchError] = useState<string | null>(null);
//   const [activeChartType, setActiveChartType] = useState<'portfolio' | 'returns' | 'drawdown' | 'comparison'>('portfolio');

//   const { 
//     data: chartDataResponse, 
//     isLoading, 
//     error: dataHookError 
//   } = useBacktestChartData(backtestId);

//   // --- Data Processing (useMemo) ---
//   const processedChartData = useMemo((): ChartDataPoint[] => {
//     console.log("📊 Processing chart data:", chartDataResponse);
    
//     if (!chartDataResponse?.daily_results) {
//       console.log("❌ No daily_results found in response");
//       return [];
//     }

//     try {
//       const data = chartDataResponse.daily_results
//         .filter((result: any) => {
//           const isValid = result && 
//             typeof result.portfolio_value === 'number' && 
//             typeof result.daily_return === 'number' && 
//             typeof result.cumulative_return === 'number' &&
//             result.date != null;
          
//           if (!isValid) {
//             console.warn("⚠️ Invalid data point:", result);
//           }
//           return isValid;
//         })
//         .map((result: any) => {
//           const dataPoint: ChartDataPoint = {
//             date: result.date,
//             timestamp: new Date(result.date),
//             portfolioValue: Number(result.portfolio_value),
//             dailyReturn: Number(result.daily_return) * 100, // Convert to percentage
//             cumulativeReturn: Number(result.cumulative_return) * 100, // Convert to percentage
//             drawdown: Number(result.drawdown) * 100, // Convert to percentage
//           };
//           return dataPoint;
//         })
//         .sort((a: ChartDataPoint, b: ChartDataPoint) => a.timestamp.getTime() - b.timestamp.getTime());

//       console.log("✅ Processed data points:", data.length);
//       if (data.length > 0) {
//         console.log("📈 Sample data:", data[0]);
//       }
      
//       return data;
//     } catch (error) {
//       console.error("❌ Error processing chart data:", error);
//       setDataFetchError("Failed to process backtest data.");
//       return [];
//     }
//   }, [chartDataResponse]);

//   // Prepare data for different chart types
//   const portfolioData = useMemo((): AreaData[] => {
//     console.log("📦 Preparing portfolio data:", processedChartData.length);
//     return processedChartData.map((item: ChartDataPoint) => ({
//       time: Math.floor(item.timestamp.getTime() / 1000) as UTCTimestamp,
//       value: item.portfolioValue,
//     }));
//   }, [processedChartData]);

//   const cumulativeReturnsData = useMemo((): LineData[] => {
//     console.log("📦 Preparing cumulative returns data:", processedChartData.length);
//     return processedChartData.map((item: ChartDataPoint) => ({
//       time: Math.floor(item.timestamp.getTime() / 1000) as UTCTimestamp,
//       value: item.cumulativeReturn,
//     }));
//   }, [processedChartData]);

//   const drawdownData = useMemo((): AreaData[] => {
//     console.log("📦 Preparing drawdown data:", processedChartData.length);
//     return processedChartData.map((item: ChartDataPoint) => ({
//       time: Math.floor(item.timestamp.getTime() / 1000) as UTCTimestamp,
//       value: item.drawdown,
//     }));
//   }, [processedChartData]);

//   // --- Core Function: Chart Initialization ---
//   const initializeChart = useCallback((): boolean => {
//     if (!chartContainerRef.current) {
//       console.log("❌ Chart container not ready");
//       return false;
//     }
    
//     if (chartRef.current) {
//       console.log("ℹ️ Chart already initialized");
//       return true;
//     }

//     try {
//       const container = chartContainerRef.current;
//       console.log("🚀 Initializing chart with container:", container.clientWidth, "x", container.clientHeight);

//     //   // Clean up any existing chart
//     //   if (chartRef.current) {
//     //     chartRef.current.remove();
//     //   }

//       chartRef.current = createChart(container, {
//         layout: {
//           background: { type: ColorType.Solid, color: "transparent" },
//           textColor: "#94A3B8",
//           fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//           fontSize: 12,
//         },
//         grid: {
//           vertLines: { color: "rgba(148, 163, 184, 0.1)", visible: true },
//           horzLines: { color: "rgba(148, 163, 184, 0.1)", visible: true },
//         },
//         width: container.clientWidth,
//         height: container.clientHeight,
//         timeScale: {
//           borderColor: "rgba(148, 163, 184, 0.2)",
//           timeVisible: true,
//           secondsVisible: false,
//           barSpacing: 6,
//           minBarSpacing: 2,
//           fixLeftEdge: false,
//           fixRightEdge: false,
//           rightOffset: 5,
//           shiftVisibleRangeOnNewBar: false,
//         },
//         crosshair: {
//           mode: 1,
//           vertLine: { 
//             color: "rgba(148, 163, 184, 0.3)", 
//             width: 1, 
//             style: 2, 
//             labelBackgroundColor: "#1E293B" 
//           },
//           horzLine: { 
//             color: "rgba(148, 163, 184, 0.3)", 
//             width: 1, 
//             style: 2, 
//             labelBackgroundColor: "#1E293B" 
//           },
//         },
//         handleScroll: { 
//           mouseWheel: true, 
//           pressedMouseMove: true, 
//           horzTouchDrag: true, 
//           vertTouchDrag: true 
//         },
//         handleScale: { 
//           axisPressedMouseMove: true, 
//           mouseWheel: true, 
//           pinch: true 
//         },
//         kineticScroll: { mouse: true, touch: true },
//       });

//       console.log("✅ Chart instance created");

//       // Create series
//       portfolioSeriesRef.current = chartRef.current.addSeries(AreaSeries, {
//         lineColor: "#10B981",
//         topColor: "rgba(16, 185, 129, 0.4)",
//         bottomColor: "rgba(16, 185, 129, 0.1)",
//         lineWidth: 2,
//         priceScaleId: 'right',
//         title: 'Portfolio Value',
//       });

//       returnsSeriesRef.current = chartRef.current.addSeries(LineSeries, {
//         color: "#3B82F6",
//         lineWidth: 2,
//         priceScaleId: 'left',
//         title: 'Cumulative Return',
//       });

//       drawdownSeriesRef.current = chartRef.current.addSeries(AreaSeries, {
//         lineColor: "#EF4444",
//         topColor: "rgba(239, 68, 68, 0.4)",
//         bottomColor: "rgba(239, 68, 68, 0.1)",
//         lineWidth: 2,
//         priceScaleId: 'left',
//         title: 'Drawdown',
//       });

//       console.log("✅ All series created");

//       // Configure price scales
//       chartRef.current.priceScale('right').applyOptions({
//         borderColor: "rgba(148, 163, 184, 0.2)",
//         scaleMargins: { top: 0.1, bottom: 0.2 },
//         autoScale: true,
//         entireTextOnly: false,
//       });

//       chartRef.current.priceScale('left').applyOptions({
//         borderColor: "rgba(148, 163, 184, 0.2)",
//         scaleMargins: { top: 0.1, bottom: 0.2 },
//         autoScale: true,
//         entireTextOnly: false,
//       });

//       setChartInitialized(true);
//       setInitializationAttempted(true);
//       setDataFetchError(null);
      
//       console.log("✅ Backtest performance chart fully initialized");
//       return true;

//     } catch (error) {
//       console.error("❌ Chart initialization failed:", error);
//       setDataFetchError("Chart initialization failed");
//       setInitializationAttempted(true);
//       return false;
//     }
//   }, []);

//   // --- Function to update visible series ---
//   const updateVisibleSeries = useCallback((chartType: string) => {
//     if (!chartRef.current) {
//       console.log("❌ Chart not ready for series update");
//       return;
//     }

//     console.log("🔄 Updating visible series to:", chartType);

//     // Hide all series first
//     portfolioSeriesRef.current?.applyOptions({ visible: false });
//     returnsSeriesRef.current?.applyOptions({ visible: false });
//     drawdownSeriesRef.current?.applyOptions({ visible: false });

//     // Configure price scales and show active series
//     switch (chartType) {
//       case 'portfolio':
//         portfolioSeriesRef.current?.applyOptions({ visible: true });
//         chartRef.current.priceScale('right').applyOptions({ visible: true });
//         chartRef.current.priceScale('left').applyOptions({ visible: false });
//         break;
//       case 'returns':
//         returnsSeriesRef.current?.applyOptions({ visible: true });
//         chartRef.current.priceScale('right').applyOptions({ visible: false });
//         chartRef.current.priceScale('left').applyOptions({ visible: true });
//         break;
//       case 'drawdown':
//         drawdownSeriesRef.current?.applyOptions({ visible: true });
//         chartRef.current.priceScale('right').applyOptions({ visible: false });
//         chartRef.current.priceScale('left').applyOptions({ visible: true });
//         break;
//       case 'comparison':
//         portfolioSeriesRef.current?.applyOptions({ visible: true });
//         returnsSeriesRef.current?.applyOptions({ visible: true });
//         chartRef.current.priceScale('right').applyOptions({ visible: true });
//         chartRef.current.priceScale('left').applyOptions({ visible: true });
//         break;
//     }

//     // Fit content after changing series
//     setTimeout(() => {
//       if (chartRef.current) {
//         try {
//           chartRef.current.timeScale().fitContent();
//           console.log("✅ Content fitted for:", chartType);
//         } catch (error) {
//           console.error("❌ Error fitting content:", error);
//         }
//       }
//     }, 100);
//   }, []);

//   // --- Effect: Set Historical Data ---
//   useEffect(() => {
//     if (chartInitialized && processedChartData.length > 0) {
//       console.log("📊 Setting chart data:", {
//         portfolioData: portfolioData.length,
//         cumulativeReturnsData: cumulativeReturnsData.length,
//         drawdownData: drawdownData.length,
//         activeChartType
//       });
      
//       // Set data for all series
//       try {
//         if (portfolioSeriesRef.current && portfolioData.length > 0) {
//           portfolioSeriesRef.current.setData(portfolioData);
//           console.log("✅ Portfolio data set:", portfolioData.length, "points");
//         }
        
//         if (returnsSeriesRef.current && cumulativeReturnsData.length > 0) {
//           returnsSeriesRef.current.setData(cumulativeReturnsData);
//           console.log("✅ Returns data set:", cumulativeReturnsData.length, "points");
//         }
        
//         if (drawdownSeriesRef.current && drawdownData.length > 0) {
//           drawdownSeriesRef.current.setData(drawdownData);
//           console.log("✅ Drawdown data set:", drawdownData.length, "points");
//         }

//         // Update visible series based on current chart type
//         updateVisibleSeries(activeChartType);

//         // Fit content after a brief delay to ensure data is rendered
//         setTimeout(() => {
//           if (chartRef.current) {
//             try {
//               chartRef.current.timeScale().fitContent();
//               console.log("✅ Initial content fitted");
//             } catch (error) {
//               console.error("❌ Error in initial fitContent:", error);
//             }
//           }
//         }, 200);

//       } catch (error) {
//         console.error("❌ Error setting chart data:", error);
//         setDataFetchError("Error displaying chart data");
//       }
//     } else if (chartInitialized && processedChartData.length === 0) {
//       console.log("⚠️ Chart initialized but no data available");
//     }
    
//     if (dataHookError) {
//       console.error("❌ Data fetch error:", dataHookError);
//       setDataFetchError("Error fetching backtest data. Please refresh.");
//     } else {
//       setDataFetchError(null);
//     }
//   }, [
//     chartInitialized, 
//     processedChartData, 
//     portfolioData,
//     cumulativeReturnsData,
//     drawdownData,
//     dataHookError,
//     activeChartType,
//     updateVisibleSeries
//   ]);

//   // --- Effect: Container Ready Check ---
//   useEffect(() => {
//     if (chartContainerRef.current) {
//       const check = () => {
//         const isReady = chartContainerRef.current && 
//           chartContainerRef.current.clientWidth > 100 && 
//           chartContainerRef.current.clientHeight > 100;
        
//         if (isReady) {
//           console.log("✅ Container ready");
//           setContainerReady(true);
//         } else {
//           console.log("⏳ Waiting for container to be ready...");
//           setTimeout(check, 100);
//         }
//       };
//       check();
//     }
//   }, []);

//   // --- Effect: Initialize Chart when Ready ---
//   useEffect(() => {
//     if (containerReady && !chartInitialized && !initializationAttempted) {
//       console.log("🚀 Initializing chart...");
//       const success = initializeChart();
//       console.log("📊 Chart initialization result:", success);
//     }
//   }, [containerReady, chartInitialized, initializeChart, initializationAttempted]);

//   // --- Effect: Smooth Resize Handling ---
//   useEffect(() => {
//     if (!chartContainerRef.current || !chartRef.current || !chartInitialized) return;

//     let resizeTimeout: NodeJS.Timeout;
    
//     const resizeObserver = new ResizeObserver((entries) => {
//       clearTimeout(resizeTimeout);
//       resizeTimeout = setTimeout(() => {
//         const entry = entries[0];
//         if (entry && chartRef.current) {
//           const { width, height } = entry.contentRect;
//           console.log("📏 Resizing chart to:", width, "x", height);
//           chartRef.current.applyOptions({ width, height });
          
//           // Re-fit content after resize
//           setTimeout(() => {
//             if (chartRef.current && processedChartData.length > 0) {
//               try {
//                 chartRef.current.timeScale().fitContent();
//               } catch (error) {
//                 console.warn("⚠️ Could not fit content after resize:", error);
//               }
//             }
//           }, 50);
//         }
//       }, 50);
//     });

//     resizeObserver.observe(chartContainerRef.current);
    
//     return () => {
//       resizeObserver.disconnect();
//       clearTimeout(resizeTimeout);
//     };
//   }, [chartInitialized, processedChartData.length]);

//   // --- Effect: Cleanup on unmount ---
//   useEffect(() => {
//     return () => {
//       console.log("🧹 Cleaning up chart");
//       if (chartRef.current) {
//         chartRef.current.remove();
//         chartRef.current = null;
//       }
//     };
//   }, []);

//   // --- UI Handlers ---
//   const handleChartTypeChange = useCallback((newChartType: 'portfolio' | 'returns' | 'drawdown' | 'comparison') => {
//     console.log("🎛️ Changing chart type to:", newChartType);
//     setActiveChartType(newChartType);
//     updateVisibleSeries(newChartType);
//     onChartTypeChange?.(newChartType);
//   }, [onChartTypeChange, updateVisibleSeries]);

//   const handleRefreshData = useCallback(() => {
//     console.log("🔄 Refreshing chart data");
//     if (chartRef.current) {
//       chartRef.current.remove();
//       chartRef.current = null;
//     }
//     setChartInitialized(false);
//     setContainerReady(false);
//     setInitializationAttempted(false);
//     setDataFetchError(null);
//   }, []);

//   // --- Performance Metrics Calculation ---
//   const performanceMetrics = useMemo((): PerformanceMetrics | null => {
//     if (processedChartData.length === 0) return null;

//     const returns: number[] = processedChartData.map((d: ChartDataPoint) => d.dailyReturn);
//     const positiveReturns: number[] = returns.filter((r: number) => r > 0);
//     // const negativeReturns: number[] = returns.filter((r: number) => r < 0);
    
//     // Calculate average daily return with proper typing
//     const totalReturnSum: number = returns.reduce((a: number, b: number) => a + b, 0);
//     const avgDailyReturn: number = totalReturnSum / returns.length;
    
//     // Calculate volatility with proper typing
//     const meanReturn: number = totalReturnSum / returns.length;
//     const variance: number = returns.reduce((a: number, b: number) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
//     const volatility: number = Math.sqrt(variance);
    
//     return {
//       totalReturn: processedChartData[processedChartData.length - 1]?.cumulativeReturn || 0,
//       avgDailyReturn,
//       winRate: (positiveReturns.length / returns.length) * 100,
//       maxDrawdown: Math.min(...processedChartData.map((d: ChartDataPoint) => d.drawdown)),
//       volatility,
//       bestDay: Math.max(...returns),
//       worstDay: Math.min(...returns),
//     };
//   }, [processedChartData]);

//   // --- Render Logic ---
//   const showLoadingOverlay: boolean = isLoading || !chartInitialized || processedChartData.length === 0;
  
//   console.log("🎨 Rendering chart:", {
//     isLoading,
//     chartInitialized,
//     dataLength: processedChartData.length,
//     showLoadingOverlay,
//     containerReady,
//     dataFetchError
//   });

//   return (
//     <div className="w-full relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
//       {/* Professional Chart Header */}
//       <div className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 overflow-x-auto flex-nowrap">
//         <div className="flex items-center space-x-4 min-w-0">
//           <div className="flex items-center space-x-3">
//             <h3 className="text-white font-bold text-lg sm:text-xl tracking-tight">Backtest Performance</h3>
//             {/* Performance Status */}
//             {performanceMetrics && (
//               <div className="flex items-center space-x-2">
//                 <span className={`text-lg sm:text-xl font-bold ${
//                   performanceMetrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
//                 }`}>
//                   {performanceMetrics.totalReturn >= 0 ? '+' : ''}{performanceMetrics.totalReturn.toFixed(2)}%
//                 </span>
//                 <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
//                   Win Rate: {performanceMetrics.winRate.toFixed(1)}%
//                 </span>
//               </div>
//             )}
//           </div>
//         </div>
        
//         <div className="flex items-center space-x-3">
//           {/* Refresh Button */}
//           <button
//             onClick={handleRefreshData}
//             disabled={isLoading}
//             className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 group"
//             title="Refresh chart"
//           >
//             <svg 
//               className={`w-4 h-4 text-gray-300 group-hover:text-white transition-colors ${isLoading ? 'animate-spin' : ''}`} 
//               fill="none" 
//               viewBox="0 0 24 24" 
//               stroke="currentColor"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//           </button>

//           {/* Chart Type Selector */}
//           <div className="flex items-center space-x-1 bg-gray-700/50 rounded-xl p-1.5 border border-gray-600/50 flex-shrink-0">
//             {CHART_TYPES.map((type) => (
//               <button
//                 key={type}
//                 onClick={() => handleChartTypeChange(type)}
//                 disabled={isLoading || !chartInitialized}
//                 className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 capitalize ${
//                   activeChartType === type
//                     ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
//                     : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
//                 } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95`}
//               >
//                 {type}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Chart Container */}
//       <div
//         ref={chartContainerRef}
//         className="w-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 relative"
//         style={{ 
//           height: `${height}px`,
//           minHeight: `${Math.max(200, height)}px`
//         }}
//       />

//       {/* Debug Information */}
//       {process.env.NODE_ENV === 'development' && (
//         <div className="absolute top-4 right-4 bg-black/70 text-xs text-white p-2 rounded-lg font-mono z-10">
//           <div>Data: {processedChartData.length} points</div>
//           <div>Initialized: {chartInitialized ? '✅' : '❌'}</div>
//           <div>Type: {activeChartType}</div>
//         </div>
//       )}

//       {/* Professional Status Bar (Bottom) */}
//       <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs pointer-events-none">
//         <div className="flex items-center space-x-3">
//           {/* Chart Status */}
//           <span className={`px-3 py-1.5 rounded-full font-semibold backdrop-blur-sm border transition-all duration-300 ${
//             chartInitialized && processedChartData.length > 0
//               ? 'bg-green-500/10 text-green-400 border-green-500/20' 
//               : dataFetchError || dataHookError 
//                 ? 'bg-red-500/10 text-red-400 border-red-500/20'
//                 : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
//           }`}>
//             {chartInitialized && processedChartData.length > 0 ? '✅ Chart Ready' : 
//              dataFetchError ? '❌ Data Error' :
//              isLoading ? '🔄 Fetching Data...' :
//              !chartInitialized ? '⚙️ Initializing...' : 
//              '⏳ Loading Data...'}
//           </span>
          
//           {/* Data Count */}
//           {processedChartData.length > 0 && (
//             <span className="text-gray-400 font-medium bg-black/20 px-2 py-1.5 rounded-full border border-gray-700/50">
//               {processedChartData.length} days
//             </span>
//           )}
//         </div>
        
//         {/* Current Chart Type Info */}
//         <div className="text-gray-400 text-sm font-medium backdrop-blur-sm bg-black/20 px-3 py-1.5 rounded-full border border-gray-700/50 capitalize">
//           {activeChartType} view
//         </div>
//       </div>

//       {/* Legend Overlay */}
//       {chartInitialized && processedChartData.length > 0 && (
//         <div className="absolute top-20 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 pointer-events-none z-10">
//           <div className="space-y-2 text-xs">
//             {(activeChartType === 'portfolio' || activeChartType === 'comparison') && (
//               <div className="flex items-center space-x-2">
//                 <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
//                 <span className="text-gray-300">Portfolio Value</span>
//               </div>
//             )}
//             {(activeChartType === 'returns' || activeChartType === 'comparison') && (
//               <div className="flex items-center space-x-2">
//                 <div className="w-3 h-0.5 bg-blue-500"></div>
//                 <span className="text-gray-300">Cumulative Return</span>
//               </div>
//             )}
//             {activeChartType === 'drawdown' && (
//               <div className="flex items-center space-x-2">
//                 <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
//                 <span className="text-gray-300">Drawdown</span>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Professional Loading/Error Overlay */}
//       {showLoadingOverlay && (
//         <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
//           <div className="text-center p-8 bg-gray-800/90 rounded-2xl border border-gray-700/50 shadow-2xl max-w-sm">
//             {dataFetchError ? (
//               <div className="text-red-500">
//                 <svg className="w-16 h-16 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//                 </svg>
//                 <p className="text-xl font-bold mb-3 text-red-400">Data Load Error</p>
//                 <p className="text-gray-400 text-sm">{dataFetchError}</p>
//                 <button 
//                   onClick={handleRefreshData}
//                   className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
//                 >
//                   Try Again
//                 </button>
//               </div>
//             ) : (
//               <>
//                 <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
//                 <p className="text-white text-xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
//                   {isLoading ? 'Loading Backtest Data' : 
//                    !chartInitialized ? 'Initializing Chart Engine' : 
//                    'Processing Data...'}
//                 </p>
//                 <p className="text-gray-400 text-sm mb-4">
//                   {processedChartData.length > 0 ? 
//                     `Processing ${processedChartData.length} data points...` : 
//                     'Preparing performance visualization'}
//                 </p>
//                 <div className="w-full bg-gray-700 rounded-full h-2">
//                   <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"></div>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BacktestPerformanceChart;
// components/PortfolioHistory.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import {
  createChart,
  CrosshairMode,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from 'lightweight-charts';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useTradingStore } from '@/store/tradingStore';

interface PortfolioHistoryShape {
  timestamp: number[];
  equity: number[];
  profit_loss: number[];
  profit_loss_pct: number[];
  base_value: number;
  timeframe: string;
}

export const PortfolioHistory: React.FC = () => {
  const portfolioHistory = useTradingStore(
    (s) => s.portfolioHistory as PortfolioHistoryShape | null
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  if (!portfolioHistory || !portfolioHistory.timestamp?.length) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        Loading portfolio history...
      </div>
    );
  }

  const chartData: LineData[] = useMemo(() => {
    return portfolioHistory.timestamp.map((ts, i) => ({
      time: (ts > 1e12 ? Math.floor(ts / 1000) : ts) as UTCTimestamp,
      value: portfolioHistory.equity[i],
    }));
  }, [portfolioHistory.timestamp, portfolioHistory.equity]);

  const pnlMap = useMemo(() => {
    const m: Record<number, number> = {};
    portfolioHistory.timestamp.forEach((ts, i) => {
      const seconds = ts > 1e12 ? Math.floor(ts / 1000) : ts;
      m[seconds] = portfolioHistory.profit_loss[i];
    });
    return m;
  }, [portfolioHistory.timestamp, portfolioHistory.profit_loss]);

  const initialEquity = portfolioHistory.equity[0];
  const currentEquity = portfolioHistory.equity[portfolioHistory.equity.length - 1];
  const totalReturn = currentEquity - initialEquity;
  const totalReturnPct = (totalReturn / Math.max(initialEquity, 1e-9)) * 100;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: {
          color: 'transparent'
        },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 2,
        borderVisible: false,
      },
      rightPriceScale: { 
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      crosshair: { 
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#6B7280',
          style: 2,
        },
        horzLine: {
          color: '#6B7280',
        },
      },
      width: el.clientWidth,
      height: 300,
    });
    chartRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#8884d8',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    }) as ISeriesApi<'Line'>;
    
    lineRef.current = lineSeries;
    lineSeries.setData(chartData);
    chart.timeScale().fitContent();

    el.style.position = 'relative';
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute pointer-events-none px-2 py-1 rounded text-xs shadow bg-white text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700';
    tooltip.style.display = 'none';
    tooltipRef.current = tooltip;
    el.appendChild(tooltip);

    const onMove = (param: any) => {
      if (!tooltipRef.current) return;

      if (!param || !param.point || !param.time) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const sd = param.seriesData?.get(lineSeries) as { value?: number } | undefined;
      if (!sd) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const ts = param.time as number;
      const dateStr = new Date(ts * 1000).toLocaleDateString();
      const equity = sd.value ?? 0;
      const pnl = pnlMap[ts] ?? 0;

      tooltipRef.current.innerHTML = `
        <div class="font-medium mb-1">Date: ${dateStr}</div>
        <div>Equity: $${equity.toFixed(2)}</div>
        <div class="${pnl >= 0 ? 'text-green-500' : 'text-red-500'}">
          PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
        </div>
      `;

      tooltipRef.current.style.display = 'block';

      const padding = 8;
      const x = param.point.x + 12;
      const y = param.point.y + 8;
      const { clientWidth: w, clientHeight: h } = el;
      const tw = tooltipRef.current.offsetWidth || 140;
      const th = tooltipRef.current.offsetHeight || 60;
      const left = Math.min(Math.max(x, padding), w - tw - padding);
      const top = Math.min(Math.max(y, padding), h - th - padding);
      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `${top}px`;
    };

    chart.subscribeCrosshairMove(onMove);

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      try {
        chart.unsubscribeCrosshairMove(onMove);
      } catch {}
      chart.remove();
      if (tooltipRef.current && tooltipRef.current.parentElement) {
        tooltipRef.current.parentElement.removeChild(tooltipRef.current);
      }
      chartRef.current = null;
      lineRef.current = null;
      tooltipRef.current = null;
    };
  }, [chartData, pnlMap]);

  return (
    <div className="relative">
      <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
        <TrendingUp size={16} className="mr-2" />
        Portfolio Performance
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Return</div>
          <div
            className={`text-sm font-medium ${
              totalReturn >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Return %</div>
          <div
            className={`text-sm font-medium ${
              totalReturnPct >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div ref={containerRef} className="h-64 w-full" />

      <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <Calendar size={12} className="mr-1" />
          {portfolioHistory.timeframe}
        </div>
        <div className="flex items-center">
          <BarChart3 size={12} className="mr-1" />
          {chartData.length} data points
        </div>
      </div>
    </div>
  );
};









































































// // components/PortfolioHistory.tsx
// import React, { useEffect, useMemo, useRef } from 'react';

// import {
//   createChart,
//   CrosshairMode,
// } from 'lightweight-charts';

// import type{
//   IChartApi,
//   ISeriesApi,
//   LineData,
//   UTCTimestamp,
//   MouseEventParams,
  
// } from 'lightweight-charts';
// import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
// import { useTradingStore } from '@/store/tradingStore';


// type PortfolioHistoryShape = {
//   timestamp: number[];
//   equity: number[];
//   profit_loss: number[];
//   profit_loss_pct: number[];
//   base_value: number;
//   timeframe: string;
// };

// export const PortfolioHistory: React.FC = () => {
//   const portfolioHistory = useTradingStore(
//     (s) => s.portfolioHistory as PortfolioHistoryShape | null
//   );
//   console.log("PORTFOLIO HIST: ", portfolioHistory);


//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const chartRef = useRef<IChartApi | null>(null);
//   const lineRef = useRef<ISeriesApi<'Line'> | null>(null);
//   const tooltipRef = useRef<HTMLDivElement | null>(null);
//   const crosshairHandlerRef = useRef<((p: any) => void) | null>(null);
//   const [isChartReady, setIsChartReady] = useState(false);
  

//   if (!portfolioHistory || !portfolioHistory.timestamp?.length) {
//     return (
//       <div className="text-center py-4 text-gray-500 dark:text-gray-400">
//         Loading portfolio history...
//       </div>
//     );
//   }

//   // Build typed chart data (UTCTimestamp = number (seconds))
//   const chartData: LineData<UTCTimestamp>[] = useMemo(() => {
//     return portfolioHistory.timestamp.map((ts, i) => {
//       const seconds = ts > 1e12 ? Math.floor(ts / 1000) : ts; // convert ms -> s if needed
//       return {
//         time: seconds as UTCTimestamp,
//         value: portfolioHistory.equity[i],
//       };
//     });
//   }, [portfolioHistory.timestamp, portfolioHistory.equity]);

//   // PnL lookup by seconds
//   const pnlMap = useMemo(() => {
//     const m: Record<number, number> = {};
//     portfolioHistory.timestamp.forEach((ts, i) => {
//       const seconds = ts > 1e12 ? Math.floor(ts / 1000) : ts;
//       m[seconds] = portfolioHistory.profit_loss[i];
//     });
//     return m;
//   }, [portfolioHistory.timestamp, portfolioHistory.profit_loss]);

//   // Perf metrics
//   const initialEquity = portfolioHistory.equity[0];
//   const currentEquity = portfolioHistory.equity[portfolioHistory.equity.length - 1];
//   const totalReturn = currentEquity - initialEquity;
//   const totalReturnPct = (totalReturn / Math.max(initialEquity, 1e-9)) * 100;

//   useEffect(() => {
//     const el = containerRef.current;
//     if (!el) return;

//     // Create chart
//     const chart = createChart(el, {
//       layout: {
//         background: { color: 'transparent' },
//         textColor: '#9CA3AF',
//       },
//       grid: {
//         vertLines: { color: '#374151' },
//         horzLines: { color: '#374151' },
//       },
//       timeScale: {
//         timeVisible: true,
//         secondsVisible: false,
//         rightOffset: 2,
//         borderVisible: false,
//       },
//       rightPriceScale: { borderVisible: false },
//       crosshair: { mode: CrosshairMode.Magnet },
//     });
//     chartRef.current = chart;

//     // v5: addSeries accepts a SeriesDefinition; styling must be applied via applyOptions.
//     // cast to any for SeriesDefinition creation (typings are strict for the literal)
//     // then we cast the returned series to ISeriesApi<'Line'>
//     const rawSeries = chart.addSeries({ type: 'Line' } as any);
//     const lineSeries = rawSeries as ISeriesApi<'Line'>;
//     lineRef.current = lineSeries;

//     // Apply styling via applyOptions
//     lineSeries.applyOptions({
//       color: '#8884d8',
//       lineWidth: 2,
//       priceLineVisible: false,
//       lastValueVisible: false,
//     });

//     // Set data
//     lineSeries.setData(chartData as unknown as LineData<UTCTimestamp>[]);

//     // Fit content initially
//     chart.timeScale().fitContent();

//     // Create tooltip element (theme aware Tailwind classes)
//     el.style.position = el.style.position || 'relative';
//     const tooltip = document.createElement('div');
//     tooltip.className =
//       'absolute pointer-events-none px-2 py-1 rounded text-xs shadow ' +
//       'bg-white text-gray-800 border border-gray-200 ' +
//       'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700';
//     tooltip.style.display = 'none';
//     tooltipRef.current = tooltip;
//     el.appendChild(tooltip);

//     // Crosshair handler (we keep it typed as any when subscribing to avoid signature mismatch)
//     const onMove = (param: MouseEventParams<UTCTimestamp> | any) => {
//       if (!tooltipRef.current) return;

//       if (!param || !param.point || !param.time) {
//         tooltipRef.current.style.display = 'none';
//         return;
//       }

//       // seriesData.get expects the exact series instance used earlier
//       const sd = param.seriesData?.get(lineSeries) as { value?: number } | undefined;
//       if (!sd) {
//         tooltipRef.current.style.display = 'none';
//         return;
//       }

//       const ts = param.time as number; // seconds
//       const dateStr = new Date(ts * 1000).toLocaleDateString();
//       const equity = sd.value ?? 0;
//       const pnl = pnlMap[ts] ?? 0;

//       tooltipRef.current.innerHTML = `
//         <div class="font-medium mb-1">Date: ${dateStr}</div>
//         <div>Equity: $${equity.toFixed(2)}</div>
//         <div class="${pnl >= 0 ? 'text-green-500' : 'text-red-500'}">
//           PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}
//         </div>
//       `;

//       tooltipRef.current.style.display = 'block';

//       // position clamped to container bounds
//       const padding = 8;
//       const x = param.point.x + 12;
//       const y = param.point.y + 8;
//       const { clientWidth: w, clientHeight: h } = el;
//       const tw = tooltipRef.current.offsetWidth || 140;
//       const th = tooltipRef.current.offsetHeight || 60;
//       const left = Math.min(Math.max(x, padding), w - tw - padding);
//       const top = Math.min(Math.max(y, padding), h - th - padding);
//       tooltipRef.current.style.left = `${left}px`;
//       tooltipRef.current.style.top = `${top}px`;
//     };

//     // store ref for cleanup
//     crosshairHandlerRef.current = onMove as any;
//     chart.subscribeCrosshairMove(onMove as any);

//     // Observe resize for responsiveness
//     const ro = new ResizeObserver((entries) => {
//       for (const entry of entries) {
//         if (entry.target === el) {
//           const cr = entry.contentRect;
//           chart.applyOptions({
//             width: Math.floor(cr.width),
//             height: Math.floor(cr.height),
//           });
//           chart.timeScale().fitContent();
//         }
//       }
//     });
//     ro.observe(el);

//     // cleanup
//     return () => {
//       ro.disconnect();
//       // unsubscribe handler if possible (unsubscribeCrosshairMove exists in typings)
//       try {
//         chart.unsubscribeCrosshairMove(onMove as any);
//       } catch {
//         /* ignore if unavailable */
//       }
//       chart.remove();
//       // remove tooltip node if still present
//       if (tooltipRef.current && tooltipRef.current.parentElement) {
//         tooltipRef.current.parentElement.removeChild(tooltipRef.current);
//       }
//       chartRef.current = null;
//       lineRef.current = null;
//       tooltipRef.current = null;
//       crosshairHandlerRef.current = null;
//     };
//   }, [chartData, pnlMap]);

//   return (
//     <div className="relative">
//       <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
//         <TrendingUp size={16} className="mr-2" />
//         Portfolio Performance
//       </h3>

//       {/* Performance Metrics */}
//       <div className="grid grid-cols-2 gap-3 mb-4">
//         <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
//           <div className="text-xs text-gray-500 dark:text-gray-400">Total Return</div>
//           <div
//             className={`text-sm font-medium ${
//               totalReturn >= 0
//                 ? 'text-green-600 dark:text-green-400'
//                 : 'text-red-600 dark:text-red-400'
//             }`}
//           >
//             {totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}
//           </div>
//         </div>
//         <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
//           <div className="text-xs text-gray-500 dark:text-gray-400">Return %</div>
//           <div
//             className={`text-sm font-medium ${
//               totalReturnPct >= 0
//                 ? 'text-green-600 dark:text-green-400'
//                 : 'text-red-600 dark:text-red-400'
//             }`}
//           >
//             {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
//           </div>
//         </div>
//       </div>

//       {/* Chart container (height controls chart height) */}
//       <div ref={containerRef} className="h-48 w-full relative" />

//       {/* Timeframe Info */}
//       <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
//         <div className="flex items-center">
//           <Calendar size={12} className="mr-1" />
//           {portfolioHistory.timeframe ?? '—'}
//         </div>
//         <div className="flex items-center">
//           <BarChart3 size={12} className="mr-1" />
//           {chartData.length} data points
//         </div>
//       </div>
//     </div>
//   );
// };




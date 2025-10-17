// src/components/ChartToolbar.tsx
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  Maximize,
  Minimize,
  Crosshair,
  SunMoon,
} from "lucide-react";

export type ChartType =
  | "candlestick"
  | "hollow"
  | "heikin"
  | "bar"
  | "line"
  | "area";

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "1d"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

interface Props {
  symbol: string;
  chartType: ChartType;
  setChartType: (t: ChartType) => void;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  crosshairEnabled: boolean;
  toggleCrosshair: () => void;
}

const ITEM_CLASS =
  "px-3 py-2 text-sm rounded-md hover:bg-slate-700 focus:outline-none focus:bg-slate-700 cursor-pointer text-slate-100";

export default function ChartToolbar({
  symbol,
  chartType,
  setChartType,
  timeframe,
  setTimeframe,
  isFullscreen,
  toggleFullscreen,
  crosshairEnabled,
  toggleCrosshair,
}: Props) {
  return (
    <div
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 w-full
                 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-3 py-2 rounded-t-lg"
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm font-semibold text-slate-100">{symbol}</div>

        {/* Chart Type Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 focus:outline-none"
              aria-label="Chart type"
            >
              <span className="capitalize">
                {chartType === "heikin"
                  ? "Heikin-Ashi"
                  : chartType.replace("_", "-")}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={6}
              align="start"
              className="min-w-[180px] bg-slate-800 border border-slate-700 rounded-md p-1 shadow-xl z-[9999]"
            >
              <DropdownMenu.Item
                className={ITEM_CLASS}
                onSelect={() => setChartType("candlestick")}
              >
                Candlestick
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={ITEM_CLASS}
                onSelect={() => setChartType("hollow")}
              >
                Hollow Candlestick
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={ITEM_CLASS}
                onSelect={() => setChartType("heikin")}
              >
                Heikin-Ashi
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={ITEM_CLASS}
                onSelect={() => setChartType("bar")}
              >
                Bar (OHLC)
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={ITEM_CLASS}
                onSelect={() => setChartType("line")}
              >
                Line
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className={ITEM_CLASS}
                onSelect={() => setChartType("area")}
              >
                Area
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Timeframe Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 focus:outline-none">
              <span className="uppercase">{timeframe}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={6}
              className="min-w-[140px] bg-slate-800 border border-slate-700 rounded-md p-1 shadow-xl z-[9999]"
            >
              {TIMEFRAMES.map((tf) => (
                <DropdownMenu.Item
                  key={tf}
                  className={ITEM_CLASS}
                  onSelect={() => setTimeframe(tf)}
                >
                  {tf.toUpperCase()}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleCrosshair}
          title="Toggle crosshair"
          className={`p-2 rounded-md transition ${
            crosshairEnabled
              ? "bg-slate-700 text-white"
              : "bg-slate-800 text-slate-300"
          } hover:bg-slate-700`}
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="p-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>

        <button
          title="Theme"
          className="p-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          <SunMoon className="w-4 h-4" />

         </button>
       </div>
     </div>
  );
}























// // src/components/ChartToolbar.tsx
// import React from "react";
// import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
// import {
//   ChevronDown,
//   Maximize,
//   Minimize,
//   Crosshair,
//   SunMoon,
// } from "lucide-react";

// export type ChartType =
//   | "candlestick"
//   | "hollow"
//   | "heikin"
//   | "bar"
//   | "line"
//   | "area";

// export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "1d"] as const;
// export type Timeframe = (typeof TIMEFRAMES)[number];

// interface Props {
//   symbol: string;
//   chartType: ChartType;
//   setChartType: (t: ChartType) => void;
//   timeframe: Timeframe;
//   setTimeframe: (tf: Timeframe) => void;
//   isFullscreen: boolean;
//   toggleFullscreen: () => void;
//   crosshairEnabled: boolean;
//   toggleCrosshair: () => void;
// }

// const ITEM_CLASS =
//   "px-3 py-2 text-sm rounded-md hover:bg-slate-700 focus:outline-none focus:bg-slate-700 cursor-pointer text-slate-100";

// export default function ChartToolbar({
//   symbol,
//   chartType,
//   setChartType,
//   timeframe,
//   setTimeframe,
//   isFullscreen,
//   toggleFullscreen,
//   crosshairEnabled,
//   toggleCrosshair,
// }: Props) {
//   return (
//     <div className="flex flex-wrap items-center justify-between gap-3 w-full">
//       {/* Left Section */}
//       <div className="flex items-center gap-3 flex-wrap">
//         <div className="text-sm font-semibold text-slate-100">{symbol}</div>

//         {/* Chart Type Dropdown */}
//         <DropdownMenu.Root>
//           <DropdownMenu.Trigger asChild>
//             <button
//               className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 focus:outline-none"
//               aria-label="Chart type"
//             >
//               <span className="capitalize">
//                 {chartType === "heikin"
//                   ? "Heikin-Ashi"
//                   : chartType.replace("_", "-")}
//               </span>
//               <ChevronDown className="w-4 h-4" />
//             </button>
//           </DropdownMenu.Trigger>

//           <DropdownMenu.Portal>
//             <DropdownMenu.Content
//               sideOffset={6}
//               align="start"
//               className="min-w-[180px] bg-slate-800 border border-slate-700 rounded-md p-1 shadow-xl z-[9999]"
//             >
//               <DropdownMenu.Item
//                 className={ITEM_CLASS}
//                 onSelect={() => setChartType("candlestick")}
//               >
//                 Candlestick
//               </DropdownMenu.Item>
//               <DropdownMenu.Item
//                 className={ITEM_CLASS}
//                 onSelect={() => setChartType("hollow")}
//               >
//                 Hollow Candlestick
//               </DropdownMenu.Item>
//               <DropdownMenu.Item
//                 className={ITEM_CLASS}
//                 onSelect={() => setChartType("heikin")}
//               >
//                 Heikin-Ashi
//               </DropdownMenu.Item>
//               <DropdownMenu.Item
//                 className={ITEM_CLASS}
//                 onSelect={() => setChartType("bar")}
//               >
//                 Bar (OHLC)
//               </DropdownMenu.Item>
//               <DropdownMenu.Item
//                 className={ITEM_CLASS}
//                 onSelect={() => setChartType("line")}
//               >
//                 Line
//               </DropdownMenu.Item>
//               <DropdownMenu.Item
//                 className={ITEM_CLASS}
//                 onSelect={() => setChartType("area")}
//               >
//                 Area
//               </DropdownMenu.Item>
//             </DropdownMenu.Content>
//           </DropdownMenu.Portal>
//         </DropdownMenu.Root>

//         {/* Timeframe Dropdown */}
//         <DropdownMenu.Root>
//           <DropdownMenu.Trigger asChild>
//             <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 focus:outline-none">
//               <span className="uppercase">{timeframe}</span>
//               <ChevronDown className="w-4 h-4" />
//             </button>
//           </DropdownMenu.Trigger>

//           <DropdownMenu.Portal>
//             <DropdownMenu.Content
//               sideOffset={6}
//               className="min-w-[140px] bg-slate-800 border border-slate-700 rounded-md p-1 shadow-xl z-[9999]"
//             >
//               {TIMEFRAMES.map((tf) => (
//                 <DropdownMenu.Item
//                   key={tf}
//                   className={ITEM_CLASS}
//                   onSelect={() => setTimeframe(tf)}
//                 >
//                   {tf.toUpperCase()}
//                 </DropdownMenu.Item>
//               ))}
//             </DropdownMenu.Content>
//           </DropdownMenu.Portal>
//         </DropdownMenu.Root>
//       </div>

//       {/* Right Section */}
//       <div className="flex items-center gap-2">
//         <button
//           onClick={toggleCrosshair}
//           title="Toggle crosshair"
//           className={`p-2 rounded-md transition ${
//             crosshairEnabled
//               ? "bg-slate-700 text-white"
//               : "bg-slate-800 text-slate-300"
//           } hover:bg-slate-700`}
//         >
//           <Crosshair className="w-4 h-4" />
//         </button>

//         <button
//           onClick={toggleFullscreen}
//           title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
//           className="p-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
//         >
//           {isFullscreen ? (
//             <Minimize className="w-4 h-4" />
//           ) : (
//             <Maximize className="w-4 h-4" />
//           )}
//         </button>

//         <button
//           title="Theme"
//           className="p-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
//         >
//           <SunMoon className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }



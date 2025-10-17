// src/pages/Homepage.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart2,
  ShieldCheck,
  Zap,
  CircleDollarSign,
  Activity,
  Play,
} from "lucide-react";

type PricePoint = { t: number; o: number; h: number; l: number; c: number };

const CTA_BTN =
  "inline-flex items-center gap-3 rounded-2xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 active:scale-95";

const glassCard =
  "rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg";

// Theme context
const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => {},
});


// YouTube Video Component with Thumbnail Preview
function YouTubeVideo({ videoId }: { videoId?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (isHovered && videoId) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isHovered, videoId]);
  
  if (!videoId) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900 dark:to-cyan-800 p-4">
        <div className="text-center">
          <BarChart2 className="w-12 h-12 mx-auto text-blue-500 dark:text-blue-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Trading Dashboard
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time analytics and portfolio management
          </p>
        </div>
        <div className="mt-6 flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-blue-400 dark:bg-blue-500"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="h-full w-full relative overflow-hidden group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Thumbnail with Play Button Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt="Trading dashboard preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 shadow-lg transform transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" />
          </div>
        </div>
        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Click to play
        </div>
      </div>
      
      {/* Video Player */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${videoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Dashboard demo"
        />
      </div>
    </div>
  );
}

function Hero() {
  
  return (
    <section className="relative min-h-[72vh] flex items-center justify-center overflow-hidden px-6">
      {/* Animated gradient background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 dark:from-blue-950 dark:via-blue-900 dark:to-[#01243a]"
      />
      
      {/* subtle radial glow */}
      <div
        aria-hidden
        className="absolute -right-20 -top-40 w-[60rem] h-[60rem] rounded-full bg-gradient-to-r from-emerald-500/20 via-blue-400/15 to-transparent dark:from-emerald-500/12 dark:via-blue-400/7 dark:to-transparent blur-3xl opacity-40"
      />

      <div className="max-w-7xl w-full flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left: copy */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="text-[2.25rem] sm:text-[3.25rem] leading-tight font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-green-600 to-sky-600 dark:from-emerald-300 dark:via-green-300 dark:to-sky-200"
          >
            Trade smarter. Connect faster. Own your edge.
          </motion.h1>

          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9 }}
            className="mt-5 text-lg text-gray-700 dark:text-slate-200 max-w-xl"
          >
            Matrix Trading unifies live market data, execution, and analytics —
            designed for serious traders who want speed, clarity and reliability.
            Real-time crypto, low-latency stock feeds (IEX or SIP), broker
            connectivity and portfolio intelligence — all in one platform.
          </motion.p>

          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="mt-8 flex items-center justify-center lg:justify-start gap-4"
          >
            <button
              className={`${CTA_BTN} bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg`}
            >
              Get started — 7-day trial
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
            <button
              className={`${CTA_BTN} border border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-300 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20`}
            >
              View plans
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-6 text-sm text-gray-600 dark:text-slate-300"
          >
            <span className="mr-3 inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs border border-gray-200 dark:border-gray-700">
              <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-300" /> Live
              market-ready
            </span>
            <span className="mx-3 text-gray-400">•</span>
            <span className="text-gray-500 dark:text-slate-400">
              SIP & IEX support • Broker integrations: Alpaca, IBKR
            </span>
          </motion.div>
        </div>

        {/* Right: live preview */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className={`${glassCard} w-full max-w-[680px] p-4`}
          >
            <LiveTradingPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Live Trading Mockup ---------- */
function generateMockSeries(count: number): PricePoint[] {
  let data: PricePoint[] = []
  let price = 400
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 10
    const close = price + change
    data.push({ t: i, o: price, h: price + 5, l: price - 5, c: close })
    price = close
  }
  return data
}

function LiveTradingPreview() {
  const { isDark } = React.useContext(ThemeContext);
  const series = generateMockSeries(40)
  const pnl = "+$ 3,457.42"
  const balance = "$ 412,320.10"
  const change = "+1.23%"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-semibold">
            BTCUSD
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">1h</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-300">Balance</div>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">{balance}</div>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <svg
          className="w-full h-56 block"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#00ffb3" stopOpacity={isDark ? "0.12" : "0.08"} />
              <stop offset="60%" stopColor="#00b7ff" stopOpacity={isDark ? "0.06" : "0.04"} />
              <stop offset="100%" stopColor="#001d3d" stopOpacity={isDark ? "0.02" : "0.01"} />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="100" height="50" fill="url(#g1)" />

          {[0, 10, 20, 30, 40, 50].map((y) => (
            <line
              key={y}
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
              strokeWidth={0.2}
            />
          ))}

          <motion.polyline
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            points={series
              .map(
                (p, i) =>
                  `${(i / (series.length - 1)) * 100},${
                    50 - (p.c / 600) * 50
                  }`
              )
              .join(" ")}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={1.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <linearGradient id="lineGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#00ffb3" stopOpacity="1" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="1" />
          </linearGradient>
        </svg>
        
        <div className={`absolute bottom-0 left-0 right-0 px-4 py-3 bg-white/90 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            <div>
              Last: <span className="font-semibold text-gray-800 dark:text-gray-100">₦ 124,320</span>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400">{change}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600 dark:text-gray-300">Unrealized P&L</div>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400">{pnl}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Features() {
  const features = [
    {
      title: "Real-Time Market Data",
      desc: "SIP (optional) and IEX feeds; live crypto aggregated from exchanges.",
      icon: <BarChart2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />,
    },
    {
      title: "Bank-Grade Security",
      desc: "Encrypted keys, role-based access, secure webhooks and audit logs.",
      icon: <ShieldCheck className="w-6 h-6 text-sky-500 dark:text-sky-400" />,
    },
    {
      title: "Execution & Connectivity",
      desc: "Alpaca, Interactive Brokers and more — fast, reliable order routing.",
      icon: <Zap className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />,
    },
    {
      title: "Revenue Tools",
      desc: "Referral commissions, payout scheduling and analytics for creators.",
      icon: <CircleDollarSign className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />,
    },
  ];

  return (
    <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Built for active traders</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl">
          Tools and integrations you need to move quickly — charts, order flow,
          portfolio insights and automated workflows.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className={`${glassCard} p-6`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="px-6 py-20 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="lg:w-1/2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">See your portfolio at a glance</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">An intuitive single-pane view for holdings, performance and active strategies — built for clarity under pressure.</p>
          <div className="mt-6 flex gap-4">
            <button className={`${CTA_BTN} bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg`}>Try dashboard</button>
            <button className={`${CTA_BTN} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800`}>Request demo</button>
          </div>
        </div>

        <div className="lg:w-1/2">
          {/* Dashboard preview with YouTube video */}
          <div className="rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-gray-100 dark:bg-gray-800">
              <div className="w-full h-64">
                <YouTubeVideo videoId="VEUxy54CF_Q" /> 
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">How To Connect To Matrix Trading</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [freq, setFreq] = useState<"month" | "year">("month");
  const price = freq === "month" ? "$29" : "$249";

  return (
    <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pricing built for growth</h2>
        <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Start with a free trial — upgrade when you're ready. Simple pricing, no surprises.</p>

        <div className="mt-8 inline-flex items-center gap-4 rounded-full bg-gray-200 dark:bg-gray-700 p-1">
          <button
            onClick={() => setFreq("month")}
            className={`px-4 py-2 rounded-full ${freq === "month" ? "bg-emerald-500 text-white" : "text-gray-700 dark:text-gray-200"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFreq("year")}
            className={`px-4 py-2 rounded-full ${freq === "year" ? "bg-emerald-500 text-white" : "text-gray-700 dark:text-gray-200"}`}
          >
            Yearly (save 30%)
          </button>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <motion.div whileHover={{ y: -6 }} className={`${glassCard} p-6`}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Starter</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-300 text-sm">For casual traders & builders</p>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{price}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{freq === "month" ? "/month" : "/year"}</div>
              </div>
              <button className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600">Choose</button>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -6 }} className={`${glassCard} p-6 border-2 border-emerald-500`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pro</h3>
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Most popular</div>
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-300 text-sm">Advanced feeds, priority support, and pro tools.</p>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{freq === "month" ? "$59" : "$599"}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{freq === "month" ? "/month" : "/year"}</div>
              </div>
              <button className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600">Get Pro</button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-6 py-16 mt-10">
      <div className="max-w-6xl mx-auto rounded-2xl p-8 flex flex-col lg:flex-row items-center justify-between gap-6 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 border border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ready to get your edge?</h3>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Start your 7-day free trial and connect your broker in minutes.</p>
        </div>
        <div className="flex gap-4">
          <button className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600 shadow-md">Start free trial</button>
          <button className="rounded-2xl border border-gray-300 dark:border-gray-600 px-6 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Contact sales</button>
        </div>
      </div>
    </section>
  );
}


export default function Home() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check system preference or saved theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      setIsDark(prefersDark);
    }
  }, []);
  
  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  
  const toggleTheme = () => setIsDark(!isDark);
  
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className="min-h-screen antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* <ThemeToggle /> */}
        <main>
          <Hero />
          <Features />
          <Showcase />
          <Pricing />
          <FinalCTA />
        </main>
        
      </div>
    </ThemeContext.Provider>
  );
}

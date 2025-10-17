import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return

    let totalMilSecDur = 1500
    let incrementTime = 15
    let step = (end - start) / (totalMilSecDur / incrementTime)

    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        clearInterval(timer)
        start = end
      }
      setCount(Math.floor(start))
    }, incrementTime)

    return () => clearInterval(timer)
  }, [value])

  return <span>{count.toLocaleString()}</span>
}

const mockPortfolio = [
  { time: "09:00", value: 12000 },
  { time: "10:00", value: 12500 },
  { time: "11:00", value: 12200 },
  { time: "12:00", value: 12800 },
  { time: "13:00", value: 13400 },
  { time: "14:00", value: 14000 },
]

export default function Homepage() {
  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-blue-950 dark:via-blue-900 dark:to-green-900 text-gray-900 dark:text-gray-100">
      

      {/* Stats Section with animated counters */}
      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-4xl font-bold text-green-500">
              <AnimatedCounter value={50000} />+
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Active Traders
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <p className="text-4xl font-bold text-green-500">
              <AnimatedCounter value={2500000} />+
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Trades Made</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <p className="text-4xl font-bold text-green-500">
              <AnimatedCounter value={120} />+
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Assets Tracked
            </p>
          </motion.div>
        </div>
      </section>

      {/* Portfolio Mockup Showcase (replacing old Showcase) */}
      <section className="py-20 bg-white dark:bg-blue-950">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Your Portfolio, Visualized
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Track your real-time stock and crypto performance. Matrix keeps
              your assets in one dashboard with insights that matter.
            </p>
            <a
              href="/portfolio"
              className="rounded-xl bg-green-500 px-5 py-3 font-semibold text-white shadow-lg hover:bg-green-600"
            >
              View Demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl shadow-2xl bg-gray-100 dark:bg-gray-900 p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Mock Portfolio</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockPortfolio}>
                <XAxis dataKey="time" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-500">
                  <AnimatedCounter value={14000} />
                </p>
                <p className="text-gray-600 dark:text-gray-400">Portfolio $</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  <AnimatedCounter value={15} />
                </p>
                <p className="text-gray-600 dark:text-gray-400">Holdings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  <AnimatedCounter value={12} />%
                </p>
                <p className="text-gray-600 dark:text-gray-400">Growth</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

   
    </div>
  )
}












// src/components/trading/MarketCalendar.tsx
import React, { useState } from "react";
import { useMarketCalendar } from "@/hooks/useMarketInfo";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface MarketCalendarProps {
  accountId: string;
  compact?: boolean;
}

export const MarketCalendar: React.FC<MarketCalendarProps> = ({ accountId, compact = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const formatDateForAPI = (date: Date) =>
    encodeURIComponent(date.toISOString().split("T")[0]);

  const { data: calendar, isLoading, error } = useMarketCalendar(
    accountId,
    formatDateForAPI(startDate),
    formatDateForAPI(endDate)
  );

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(direction === "prev" ? prev.getMonth() - 1 : prev.getMonth() + 1);
      return newDate;
    });
  };

  // Compact version - shows next market event
  if (compact) {
    if (isLoading) {
      return (
        <div className="text-center p-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading...</p>
        </div>
      );
    }

    if (error || !calendar) {
      return (
        <div className="text-center p-3 text-red-500 dark:text-red-400 text-xs">
          Failed to load calendar
        </div>
      );
    }

    // Find today or next market day
    const todayStr = new Date().toISOString().split("T")[0];
    const today = calendar.find((d: any) => d.date === todayStr);
    const upcomingDays = calendar.filter((d: any) => d.date >= todayStr).slice(0, 3);

    return (
      <div className="p-3">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <CalendarIcon size={14} />
          Market Calendar
        </h4>
        
        {today ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Today</span>
              <span className="text-green-600 dark:text-green-400">● Open</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {today.open} - {today.close}
            </div>
          </div>
        ) : upcomingDays.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium">Next Market Day</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {new Date(upcomingDays[0].date).toLocaleDateString()} • {upcomingDays[0].open} - {upcomingDays[0].close}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            No market data
          </div>
        )}
      </div>
    );
  }

  // Full version - original calendar implementation
  if (isLoading) {
    return <CalendarShell title="Market Calendar">Loading calendar...</CalendarShell>;
  }

  if (error || !calendar) {
    return (
      <CalendarShell title="Market Calendar">
        <span className="text-red-500 dark:text-red-400">Failed to load calendar</span>
      </CalendarShell>
    );
  }

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Market Calendar
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium">{monthName}</span>
          <button
            onClick={() => navigateMonth("next")}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 text-xs text-center mb-2 text-gray-500 dark:text-gray-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-7 gap-2 text-sm">
        {Array.from(
          { length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() },
          (_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          )
        )}

        {Array.from(
          { length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() },
          (_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.getFullYear()}-${String(
              currentMonth.getMonth() + 1
            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const calendarDay = calendar.find((d: any) => d.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split("T")[0];

            return (
              <div
                key={dateStr}
                className={`h-10 flex items-center justify-center rounded relative cursor-pointer group
                  ${
                    isToday
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium"
                      : calendarDay
                      ? "bg-gray-100 dark:bg-gray-700"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                {day}
                {calendarDay && (
                  <div className="absolute bottom-1 flex justify-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}

                {/* Tooltip */}
                {calendarDay && (
                  <div className="absolute z-10 bottom-12 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Open: {calendarDay.open} <br /> Close: {calendarDay.close}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Open day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

const CalendarShell: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 w-full max-w-4xl mx-auto">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">{children}</div>
  </div>
);


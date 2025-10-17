// components/ChartLoading.tsx
export const ChartLoading: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 flex items-center justify-center z-10">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-gray-600 dark:text-gray-400">Loading chart data...</div>
      </div>
    </div>
  );
};
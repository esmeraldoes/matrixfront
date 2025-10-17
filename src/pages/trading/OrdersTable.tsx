// src/components/trading/OrdersTable.tsx
import React, { useMemo, useState } from "react";
import { useOrders, useCancelOrder } from "@/hooks/useTrading";
import { X, Clock, Check, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface OrdersTableProps {
  accountId: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ accountId }) => {
  const { data: orders, isLoading, error, refetch } = useOrders(accountId);
  const cancelOrderMutation = useCancelOrder(accountId);

  const [showAll, setShowAll] = useState(false);

  const handleCancelOrder = (orderId: string) => {
    cancelOrderMutation.mutate(orderId);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "filled":
        return <Check size={14} className="text-green-500" />;
      case "new":
      case "accepted":
        return <Clock size={14} className="text-blue-500" />;
      case "canceled":
        return <X size={14} className="text-gray-500" />;
      case "rejected":
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "filled":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "new":
      case "accepted":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
      case "canceled":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
      case "rejected":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
    }
  };

  const getSideColor = (side: string) => {
    return side.toLowerCase() === "buy"
      ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
      : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
  };

  const displayOrders = useMemo(() => {
    if (!orders) return [];
    const sorted = [...orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return showAll ? sorted : sorted.slice(0, 5);
  }, [orders, showAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-500">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 dark:text-red-400">
        <AlertCircle size={24} className="mx-auto mb-2" />
        <p>Failed to load orders</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p>No orders found</p>
        <p className="text-sm mt-1">Your orders will appear here</p>
      </div>
    );
  }

  const moreThanFive = orders.length > 5;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h3>
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg text-xs">
            {orders.length} total
          </span>
          {!showAll && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              Showing newest {Math.min(5, orders.length)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh orders"
          >
            <RefreshCw size={14} />
          </button>

          {moreThanFive && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-expanded={showAll}
            >
              {showAll ? (
                <>
                  <ChevronUp size={14} />
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  <span>Show more</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayOrders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg p-3 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSideColor(order.side)}`}>
                  {order.side.toUpperCase()}
                </span>
                <span className="font-medium text-sm">{order.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                {order.status === "new" || order.status === "accepted" ? (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelOrderMutation.isPending}
                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                    title="Cancel order"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <div className="w-4">{getStatusIcon(order.status)}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Quantity</span>
                <div className="font-medium">
                  {parseFloat(order.qty).toLocaleString()}
                  {parseFloat(order.filled_qty) > 0 && (
                    <span className="text-gray-500 ml-1">
                      ({parseFloat(order.filled_qty).toLocaleString()} filled)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Type</span>
                <div className="font-medium">
                  {order.order_type?.replace("_", " ") || "Market"}
                  {order.limit_price && ` @ $${parseFloat(order.limit_price).toFixed(2)}`}
                  {order.stop_price && ` stop $${parseFloat(order.stop_price).toFixed(2)}`}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Created</span>
                <div className="font-medium">
                  {new Date(order.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Time in Force</span>
                <div className="font-medium uppercase">{order.time_in_force}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!showAll && moreThanFive && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <ChevronDown size={16} /> Show all {orders.length}
          </button>
        </div>
      )}
    </div>
  );
};

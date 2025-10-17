import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
import { Search, Star } from "lucide-react";
import { createPortal } from "react-dom";
import { useTradingStore } from "@/store/tradingStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useAssetSearch } from "@/hooks/useTrading";
import {
  useWatchlists,
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from "@/hooks/useWatchList";

interface SymbolSearchProps {
  accountId: string;
  onSymbolSelect: (symbol: string) => void;
}

export const SymbolSearch: React.FC<SymbolSearchProps> = ({
  accountId,
  onSymbolSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [assetClassFilter, setAssetClassFilter] = useState<
    "all" | "us_equity" | "crypto"
  >("all");

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);

  const { data: watchlists } = useWatchlists(accountId);

  const selectedSymbol = useTradingStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useTradingStore(
    (state) => state.setSelectedSymbol
  );

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    data: searchResultsData,
    isLoading,
    isFetching,
  } = useAssetSearch(accountId, debouncedSearchQuery, assetClassFilter);

  const searchResults = searchResultsData?.results || [];
  const loading = isLoading || isFetching;

  const firstWatchlistId = watchlists?.[0]?.id;

  const addToWatchlistMutation = useAddToWatchlist();
  const removeFromWatchlistMutation = useRemoveFromWatchlist();

  const handleSelectSymbol = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      onSymbolSelect(symbol);
      setShowResults(false);
    },
    [setSelectedSymbol, onSymbolSelect]
  );

  const handleToggleWatchlist = useCallback(
    (symbol: string) => {
      if (!firstWatchlistId) {
        alert("No watchlist available. Please create one first.");
        return;
      }

      const isInWatchlist = watchlists?.[0]?.symbols.includes(symbol);
      const mutationVariables = { watchlistId: firstWatchlistId, symbol };

      if (isInWatchlist) {
        removeFromWatchlistMutation.mutate(mutationVariables);
      } else {
        addToWatchlistMutation.mutate(mutationVariables);
      }
    },
    [firstWatchlistId, watchlists, addToWatchlistMutation, removeFromWatchlistMutation]
  );

  useLayoutEffect(() => {
    if (showResults && inputRef.current) {
      setAnchorRect(inputRef.current.getBoundingClientRect());
    }
  }, [showResults]);

  return (
    <>
      <div ref={inputRef} className="relative w-full max-w-md">
        {/* Search box */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2 shadow-sm">
          <Search size={16} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="w-full bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-500"
          />
          {loading && (
            <div className="ml-2 w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Results dropdown via portal */}
      {showResults &&
        anchorRect &&
        createPortal(
          <>
            <div
              className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in"
              style={{
                top: anchorRect.bottom + window.scrollY + 4,
                left: anchorRect.left + window.scrollX,
                width: anchorRect.width,
              }}
            >
              {/* Filters */}
              <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex space-x-2 overflow-x-auto">
                  {["all", "us_equity", "crypto"].map((assetClass) => (
                    <button
                      key={assetClass}
                      onClick={() =>
                        setAssetClassFilter(
                          assetClass as "all" | "us_equity" | "crypto"
                        )
                      }
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        assetClassFilter === assetClass
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {assetClass === "us_equity"
                        ? "Stocks"
                        : assetClass.charAt(0).toUpperCase() +
                          assetClass.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="p-2">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                  {loading
                    ? "Searching..."
                    : `Search Results (${searchResults.length})`}
                </h3>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {loading && searchResults.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400">
                      {debouncedSearchQuery || assetClassFilter !== "all"
                        ? "No symbols found for this filter/query."
                        : "Type to search symbols"}
                    </div>
                  ) : (
                    searchResults.map((asset) => {
                      const isInWatchlist =
                        watchlists?.[0]?.symbols.includes(asset.symbol);
                      return (
                        <div
                          key={asset.id}
                          className={`flex items-center justify-between w-full p-2 text-sm rounded-md cursor-pointer transition-colors ${
                            selectedSymbol === asset.symbol
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <button
                            onClick={() => handleSelectSymbol(asset.symbol)}
                            className="flex-1 flex items-center pr-2 text-left"
                          >
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {asset.symbol}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                              {asset.name}
                            </span>
                          </button>
                          <div className="flex items-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mr-2">
                              {asset.asset_class.replace("_", " ")}
                            </div>
                            <button
                              onClick={() => handleToggleWatchlist(asset.symbol)}
                              className="text-yellow-500 hover:text-yellow-600"
                            >
                              {isInWatchlist ? (
                                <Star
                                  size={16}
                                  className="fill-current text-yellow-400"
                                />
                              ) : (
                                <Star size={16} className="text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowResults(false)}
            />
          </>,
          document.body
        )}
    </>
  );
};



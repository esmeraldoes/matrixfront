// src/pages/AssetsPage.tsx
import { useState, useEffect } from "react";
import { useAssets, useAssetSearch } from "@/hooks/useTrading";
import { useTradingStore } from "@/store/tradingStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AssetsPageProps {
  accountId: string;
}

export default function AssetsPage({ accountId }: AssetsPageProps) {
  const { updateAssets } = useTradingStore();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Hooks
  const { data: assetsData, isLoading: isAssetsLoading } = useAssets(accountId, {
    limit: 20,
  });

  const {
    data: searchResults,
    isLoading: isSearchLoading,
  } = useAssetSearch(accountId, debouncedQuery, "all");

  // Choose which dataset to show
  const showingSearch = debouncedQuery.length > 0;
  const assets = showingSearch
    ? searchResults?.results || []
    : assetsData?.results || [];

  // Sync with store
  useEffect(() => {
    if (assets.length > 0) {
      updateAssets(assets);
    }
  }, [assets, updateAssets]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Input
          placeholder="Search assets by symbol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        {isSearchLoading && <Loader2 className="animate-spin w-5 h-5 text-muted-foreground" />}
      </div>

      {(isAssetsLoading || isSearchLoading) && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-6 h-6 text-primary" />
        </div>
      )}

      {!isAssetsLoading && assets.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          {showingSearch ? "No assets found for your search." : "No assets available."}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{asset.symbol}</h2>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                {asset.asset_class}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{asset.name}</p>
            <p className="mt-2 text-sm">
              Status:{" "}
              <span
                className={
                  asset.status === "active"
                    ? "text-green-600"
                    : "text-muted-foreground"
                }
              >
                {asset.status}
              </span>
            </p>
            <p className="text-sm">
              Tradable: {asset.tradable ? "✅" : "❌"}
            </p>
          </div>
        ))}
      </div>

      {!showingSearch && assetsData?.next && (
        <div className="flex justify-center mt-8">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </div>
  );
}

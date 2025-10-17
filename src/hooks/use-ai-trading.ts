import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MarketAnalysis {
  recommendation: string;
  confidence: number;
  riskLevel: string;
  strategy: string;
  supportPrice?: number;
  resistancePrice?: number;
}

export function useAITrading() {
  const { toast } = useToast();

  const analyzeMarket = useMutation({
    mutationFn: async (symbol: string): Promise<MarketAnalysis> => {
      const response = await fetch(`/api/market-analysis/${symbol}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to analyze market");
      }

      return response.json();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze market",
      });
    },
  });

  const analyzeBatch = useMutation({
    mutationFn: async (symbols: string[]) => {
      const response = await fetch("/api/market-analysis/batch", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze markets");
      }

      return response.json();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Batch Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze markets",
      });
    },
  });

  return {
    analyzeMarket: analyzeMarket.mutateAsync,
    analyzeBatch: analyzeBatch.mutateAsync,
    isAnalyzing: analyzeMarket.isPending || analyzeBatch.isPending,
  };
}

import { useState } from 'react';
import { useToast } from './use-toast';

type Analysis = {
  recommendation: string;
  confidence: number;
  reasoning: string;
};

export function useAiAssistant() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeMarket = async (symbol: string): Promise<Analysis> => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    } catch (error) {
      toast({
        title: 'Analysis Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeMarket,
    isAnalyzing,
  };
}

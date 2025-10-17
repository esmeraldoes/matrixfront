import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';

type Position = {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pl: number;
};

type OrderType = 'market' | 'limit';

type Order = {
  symbol: string;
  type: OrderType;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
};

export function useTrading() {
  const { toast } = useToast();

  const { data: positions = [], refetch: refetchPositions } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Order placed successfully',
      });
      refetchPositions();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    positions,
    placeOrder: placeOrderMutation.mutateAsync,
    isPlacingOrder: placeOrderMutation.isPending,
  };
}

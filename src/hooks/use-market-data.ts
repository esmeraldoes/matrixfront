import { useEffect, useState } from 'react';

type MarketData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

type WebSocketMessage = {
  type: string;
  data: MarketData;
};

export function useMarketData() {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    // Determine the WebSocket protocol based on the page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setStatus('connected');
      ws.send(JSON.stringify({ type: 'subscribe', symbols: ['DIA', 'QQQ', 'SPY'] }));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type === 'marketData') {
          setMarketData(prev => ({
            ...prev,
            [message.data.symbol]: message.data
          }));
        }
      } catch (error) {
        console.error('Failed to parse market data:', error);
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        setStatus('connecting');
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return { marketData, status };
}
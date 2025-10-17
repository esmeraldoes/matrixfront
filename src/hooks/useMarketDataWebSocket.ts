// src/hooks/useMarketDataWebSocket.ts
import { useEffect, useRef } from "react";
import { useTradingStore } from "@/store/tradingStore";
import { MarketDataWebSocketService } from "@/services/websocket";

export function useMarketDataWebSocket() {
  const symbol = "BTC/USD"; 
  const updateBars = useTradingStore((s) => s.updateBars);
  const updateQuote = useTradingStore((s) => s.updateQuote);
  const updateTrades = useTradingStore((s) => s.updateTrades);

  const wsRef = useRef<MarketDataWebSocketService | null>(null);

  useEffect(() => {
    if (wsRef.current) return; 

    const wsService = new MarketDataWebSocketService((status) => {
      console.log("[MarketDataWS] status:", status);
      const setConn = useTradingStore.getState().setConnectionStatus;
      if (setConn) {
        const trading = useTradingStore.getState().isTradingConnected;
        setConn(status === "connected", trading);
      }
    });

    wsRef.current = wsService;

    // Bars handler
    const unsubBars = wsService.onMessage("bars", (payload: any) => {
       console.log("BAR payload:", payload);
      if (Array.isArray(payload)) {
        payload.forEach((b) => updateBars(b.symbol, b));
      } else {
        updateBars(payload.symbol, payload);
      }
    });

    // Quotes handler
    const unsubQuotes = wsService.onMessage("quotes", (payload: any) => {
      updateQuote(payload.symbol, payload);
    });

    // Trades handler
    const unsubTrades = wsService.onMessage("trades", (payload: any) => {
      updateTrades(payload.symbol, payload);
    });

    // Connect and subscribe automatically
    wsService.connect()
      .then(() => {
        console.log(`[MarketDataWS] subscribing to ${symbol}`);
        wsService.subscribe(symbol, "bars");
        wsService.subscribe(symbol, "quotes");
        wsService.subscribe(symbol, "trades");
      })
      .catch((err) => console.error("MarketDataWS failed to connect:", err));

    return () => {
      unsubBars();
      unsubQuotes();
      unsubTrades();
      wsService.disconnect();
      wsRef.current = null;
    };
  }, [updateBars, updateQuote, updateTrades]);
}


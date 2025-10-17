// src/services/websocket/WebSocketManager.ts
// import { v4 as uuidv4 } from "uuid";

export interface WebSocketMessage {
  data: any;
  type: string;
  data_type: string;
  id?: string;
  timestamp: number;
}

type UpdateCallback = (symbol: string, type: "quotes" | "trades" | "bars", data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 3000;
  private isConnected = false;
  private updateCallback?: UpdateCallback;

  public async getConnection(): Promise<void> {
    if (this.isConnected && this.ws) return;

    return new Promise((resolve, reject) => {
      this.disconnect(); // clear any stale socket
      this.isConnected = false;

      const wsUrl = "ws://localhost:8000/ws/market-data/";

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("✅ WebSocket connected");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (err) {
            console.error("❌ Error parsing message:", err);
          }
        };

        this.ws.onclose = (event) => {
          console.warn("⚠️ WebSocket closed:", event.code, event.reason);
          this.isConnected = false;
          this.handleReconnection();
        };

        this.ws.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          reject(error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(
        this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
        30000
      );
      const jitter = Math.random() * 1000;

      setTimeout(() => {
        this.reconnectAttempts++;
        this.getConnection().catch(console.error);
      }, delay + jitter);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === "market_data") {
      const { data_type, data } = message;
      if (!this.updateCallback) return;

      if (data_type === "bars" || data_type === "quotes" || data_type === "trades") {
        this.updateCallback(data.symbol, data_type, data);
      }
    }
  }

  public setStoreUpdateCallback(cb: UpdateCallback) {
    this.updateCallback = cb;
  }

  public subscribeToSymbol(symbol: string, types: ("quotes" | "trades" | "bars")[]) {
    this.sendSubscriptionMessage("subscribe", symbol, types);
  }

  public unsubscribeFromSymbol(symbol: string, types: ("quotes" | "trades" | "bars")[]) {
    this.sendSubscriptionMessage("unsubscribe", symbol, types);
  }

  private sendSubscriptionMessage(
    action: "subscribe" | "unsubscribe",
    symbol: string,
    types: string[]
  ) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = { action, symbols: [symbol], data_types: types };
      console.log("📤 Sending:", msg);
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn("⚠️ Cannot send, WebSocket not open");
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const webSocketManager = new WebSocketManager();

import { useEffect, useRef, useState } from 'react';
import { logger } from './logger';

interface WebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: any) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export function useWebSocket({
  url,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
  onMessage,
  onConnectionChange,
}: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.info('WebSocket connected');
        setIsConnected(true);
        onConnectionChange?.(true);
        reconnectAttemptsRef.current = 0;

        // Send initial ping
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onclose = () => {
        logger.warn('WebSocket disconnected');
        setIsConnected(false);
        onConnectionChange?.(false);
        wsRef.current = null;

        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            logger.info(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            connect();
          }, reconnectInterval);
        } else {
          logger.error('Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error', { error });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong messages for latency monitoring
          if (data.type === 'pong') {
            const latency = Date.now() - data.timestamp;
            logger.debug('WebSocket latency', { latency });
            return;
          }

          onMessage?.(data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { error });
        }
      };

      // Setup periodic health checks
      const healthCheckInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      // Cleanup health check interval on unmount
      return () => clearInterval(healthCheckInterval);
    } catch (error) {
      logger.error('Failed to connect WebSocket', { error });
    }
  };

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      logger.warn('Cannot send message, WebSocket is not connected');
    }
  };

  return {
    isConnected,
    sendMessage,
  };
}

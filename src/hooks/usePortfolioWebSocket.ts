// hooks/usePortfolioWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';

interface PortfolioMetrics {
  portfolio_value: number;
  cash: number;
  buying_power: number;
  daily_pnl: number;
  daily_pnl_percent: number;
  unrealized_pl: number;
  realized_pl: number;
  win_rate: number;
  current_drawdown: number;
  max_drawdown: number;
  volatility: number;
  sharpe_ratio: number;
  positions_count: number;
  timestamp: number;
  last_updated: string;
}

interface WebSocketMessage {
  type: 'portfolio_metrics' | 'error' | 'connection_status' | 'pong' | 'debug_auth';
  data?: PortfolioMetrics;
  message?: string;
  timestamp?: number;
  user_id?: number;
  username?: string;
  user_authenticated?: boolean;
  account_id?: string;
}

export const usePortfolioWebSocket = (accountId: string) => {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authDebug, setAuthDebug] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const { user } = useAppSelector((state) => state.auth);

  const connectWebSocket = useCallback(() => {
    if (!user || !accountId || accountId === 'undefined' || accountId === 'null') {
      console.log('🔴 WebSocket: Missing user or accountId');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🟢 WebSocket: Already connected');
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnecting(true);
    setError(null);
    setAuthDebug(null);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // JWT cookies are automatically sent with WebSocket connections
      const wsUrl = `${protocol}//localhost:8000/ws/portfolio/metrics/?account_id=${accountId}`;

    //   const wsUrl = `${protocol}//${window.location.host}/ws/portfolio/metrics/?account_id=${accountId}`;
      
      console.log('🔗 WebSocket: Connecting to:', wsUrl);
      console.log('🔐 Using JWT cookie authentication');
      console.log('🍪 Cookies will be sent automatically');
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket: Connection established with JWT cookies');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);

        // Test authentication
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              action: 'debug_auth'
            }));
          }
        }, 1000);

        // Start ping interval to keep connection alive
        pingIntervalRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              action: 'ping',
              timestamp: Date.now()
            }));
          }
        }, 30000); // Ping every 30 seconds
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket: Message received:', data.type, data);
          
          switch (data.type) {
            case 'portfolio_metrics':
              if (data.data) {
                setMetrics(data.data);
                setError(null);
              }
              break;
            case 'error':
              setError(data.message || 'Unknown error occurred');
              console.error('❌ WebSocket: Error:', data.message);
              break;
            case 'connection_status':
              console.log('ℹ️ WebSocket: Status:', data.message);
              break;
            case 'pong':
              console.log('🏓 WebSocket: Pong received from user:', data.user_id);
              break;
            case 'debug_auth':
              console.log('🔍 WebSocket Auth Debug:', data);
              setAuthDebug(data);
              if (!data.user_authenticated) {
                setError('JWT authentication failed on WebSocket');
              }
              break;
            default:
              console.warn('⚠️ WebSocket: Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ WebSocket: Error parsing message:', error);
          setError('Failed to parse server response');
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket: Connection closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        // Clean up ping interval
        if (pingIntervalRef.current) {
          window.clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        setIsConnected(false);
        setIsConnecting(false);
        
        // Don't reconnect for these codes
        if ([1000, 4001, 4002, 4003].includes(event.code)) {
          let errorMessage = `Connection closed: ${event.reason || 'Unknown reason'}`;
          if (event.code === 4001) {
            errorMessage = 'JWT authentication failed. Please log in again.';
          } else if (event.code === 4002) {
            errorMessage = 'No account specified.';
          } else if (event.code === 4003) {
            errorMessage = 'Trading account not found.';
          }
          setError(errorMessage);
          return;
        }

        // Auto-reconnect after 3 seconds for unexpected disconnections
        setError('Connection lost. Reconnecting...');
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('🔄 WebSocket: Attempting reconnect...');
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket: Connection error:', error);
        setIsConnected(false);
        setIsConnecting(false);
        setError('WebSocket connection failed');
      };

    } catch (error) {
      console.error('❌ WebSocket: Failed to create connection:', error);
      setIsConnecting(false);
      setError('Failed to establish WebSocket connection');
    }
  }, [user, accountId]);

  const disconnectWebSocket = useCallback(() => {
    console.log('🛑 WebSocket: Manually disconnecting');
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Clear ping interval
    if (pingIntervalRef.current) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    setAuthDebug(null);
  }, []);

  const refresh = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('🔄 WebSocket: Sending refresh request');
      wsRef.current.send(JSON.stringify({ 
        action: 'refresh',
        timestamp: Date.now()
      }));
    } else {
      console.warn('⚠️ WebSocket: Cannot refresh - not connected');
      // Try to reconnect if not connected
      setError('Not connected. Attempting to reconnect...');
      connectWebSocket();
    }
  }, [connectWebSocket]);

  const debugAuth = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'debug_auth'
      }));
    }
  }, []);

  // Test connection on mount and when accountId changes
  useEffect(() => {
    console.log('🎯 WebSocket: Effect running', { 
      user: !!user, 
      accountId,
      user_id: user?.id 
    });
    
    if (user && accountId) {
      console.log('🚀 WebSocket: Starting JWT cookie connection');
      connectWebSocket();
    } else {
      console.log('⏸️ WebSocket: Waiting for user or accountId');
      disconnectWebSocket();
    }

    return () => {
      console.log('🧹 WebSocket: Cleaning up');
      disconnectWebSocket();
    };
  }, [user, accountId, connectWebSocket, disconnectWebSocket]);

  // Debug effect - log state changes
  useEffect(() => {
    console.log('📊 WebSocket State Update:', {
      isConnected,
      isConnecting,
      hasMetrics: !!metrics,
      error: error?.substring(0, 100),
      accountId,
      authDebug,
      readyState: wsRef.current?.readyState
    });
  }, [isConnected, isConnecting, metrics, error, accountId, authDebug]);

  return { 
    metrics, 
    isConnected, 
    isConnecting,
    error, 
    authDebug,
    refresh,
    debugAuth,
    disconnect: disconnectWebSocket
  };
};



















// // hooks/usePortfolioWebSocket.ts
// import { useEffect, useRef, useState, useCallback } from 'react';
// import { useAppSelector } from '@/store/hooks';

// interface PortfolioMetrics {
//   portfolio_value: number;
//   cash: number;
//   buying_power: number;
//   daily_pnl: number;
//   daily_pnl_percent: number;
//   unrealized_pl: number;
//   realized_pl: number;
//   win_rate: number;
//   current_drawdown: number;
//   max_drawdown: number;
//   volatility: number;
//   sharpe_ratio: number;
//   positions_count: number;
//   timestamp: number;
//   last_updated: string;
// }

// interface WebSocketMessage {
//   type: 'portfolio_metrics' | 'error' | 'connection_status';
//   data?: PortfolioMetrics;
//   message?: string;
// }

// export const usePortfolioWebSocket = (accountId: string) => {
//   const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isConnecting, setIsConnecting] = useState(false);
//   const wsRef = useRef<WebSocket | null>(null);
//   const reconnectTimeoutRef = useRef<number | null>(null); // Fixed: Use number instead of NodeJS.Timeout
//   const { user } = useAppSelector((state) => state.auth);

//   const connectWebSocket = useCallback(() => {
//     if (!user || !accountId || accountId === 'undefined' || accountId === 'null') {
//       console.log('🔴 WebSocket: Missing user or accountId');
//       return;
//     }

//     if (wsRef.current?.readyState === WebSocket.OPEN) {
//       console.log('🟢 WebSocket: Already connected');
//       return;
//     }

//     setIsConnecting(true);
//     setError(null);

//     try {
//       const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

//     //   const wsUrl = "ws://localhost:8000/ws/payments/

//       const wsUrl = `${protocol}//localhost:8000/ws/portfolio/metrics/?account_id=${accountId}`;

//     //   const wsUrl = `${protocol}//${window.location.host}/ws/portfolio/metrics/?account_id=${accountId}`;
//       console.log("WSURL: ", wsUrl)
      
//       console.log('🔗 WebSocket: Connecting to:', wsUrl);
      
//       wsRef.current = new WebSocket(wsUrl);

//       wsRef.current.onopen = () => {
//         console.log('✅ WebSocket: Connection established');
//         setIsConnected(true);
//         setIsConnecting(false);
//         setError(null);
//       };

//       wsRef.current.onmessage = (event) => {
//         try {
//           const data: WebSocketMessage = JSON.parse(event.data);
//           console.log('📨 WebSocket: Message received:', data.type);
          
//           switch (data.type) {
//             case 'portfolio_metrics':
//               if (data.data) {
//                 setMetrics(data.data);
//                 setError(null);
//               }
//               break;
//             case 'error':
//               setError(data.message || 'Unknown error occurred');
//               console.error('❌ WebSocket: Error:', data.message);
//               break;
//             case 'connection_status':
//               console.log('ℹ️ WebSocket: Status:', data.message);
//               break;
//             default:
//               console.warn('⚠️ WebSocket: Unknown message type:', data.type);
//           }
//         } catch (error) {
//           console.error('❌ WebSocket: Error parsing message:', error);
//           setError('Failed to parse server response');
//         }
//       };

//       wsRef.current.onclose = (event) => {
//         console.log('🔌 WebSocket: Connection closed:', event.code, event.reason);
//         setIsConnected(false);
//         setIsConnecting(false);
        
//         // Don't reconnect for these codes
//         if ([1000, 4001, 4002, 4003].includes(event.code)) {
//           setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
//           return;
//         }

//         // Auto-reconnect after 3 seconds
//         setError('Connection lost. Reconnecting...');
//         reconnectTimeoutRef.current = window.setTimeout(() => { // Use window.setTimeout for browser environment
//           console.log('🔄 WebSocket: Attempting reconnect...');
//           connectWebSocket();
//         }, 3000);
//       };

//       wsRef.current.onerror = (error) => {
//         console.error('❌ WebSocket: Connection error:', error);
//         setIsConnected(false);
//         setIsConnecting(false);
//         setError('WebSocket connection failed');
//       };

//     } catch (error) {
//       console.error('❌ WebSocket: Failed to create connection:', error);
//       setIsConnecting(false);
//       setError('Failed to establish WebSocket connection');
//     }
//   }, [user, accountId]);

//   const disconnectWebSocket = useCallback(() => {
//     // Clear reconnect timeout
//     if (reconnectTimeoutRef.current !== null) {
//       window.clearTimeout(reconnectTimeoutRef.current);
//       reconnectTimeoutRef.current = null;
//     }
    
//     // Close WebSocket connection
//     if (wsRef.current) {
//       console.log('🛑 WebSocket: Manually disconnecting');
//       wsRef.current.close(1000, 'Manual disconnect');
//       wsRef.current = null;
//     }
    
//     setIsConnected(false);
//     setIsConnecting(false);
//     setError(null);
//   }, []);

//   const refresh = useCallback(() => {
//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       console.log('🔄 WebSocket: Sending refresh request');
//       wsRef.current.send(JSON.stringify({ 
//         action: 'refresh',
//         timestamp: Date.now()
//       }));
//     } else {
//       console.warn('⚠️ WebSocket: Cannot refresh - not connected');
//       // Try to reconnect if not connected
//       setError('Not connected. Attempting to reconnect...');
//       connectWebSocket();
//     }
//   }, [connectWebSocket]);

//   // Main useEffect - handles connection lifecycle
//   useEffect(() => {
//     console.log('🎯 WebSocket: Effect running', { 
//       user: !!user, 
//       accountId,
//       hasWebSocket: !!wsRef.current 
//     });
    
//     if (user && accountId) {
//       connectWebSocket();
//     } else {
//       console.log('⏸️ WebSocket: Waiting for user or accountId');
//       disconnectWebSocket(); // Ensure clean state when no user/account
//     }

//     return () => {
//       console.log('🧹 WebSocket: Cleaning up');
//       disconnectWebSocket();
//     };
//   }, [user, accountId, connectWebSocket, disconnectWebSocket]);

//   // Debug effect - log state changes
//   useEffect(() => {
//     console.log('📊 WebSocket State Update:', {
//       isConnected,
//       isConnecting,
//       hasMetrics: !!metrics,
//       error: error?.substring(0, 100), // Truncate long errors
//       accountId,
//       readyState: wsRef.current?.readyState
//     });
//   }, [isConnected, isConnecting, metrics, error, accountId]);

//   return { 
//     metrics, 
//     isConnected, 
//     isConnecting,
//     error, 
//     refresh,
//     disconnect: disconnectWebSocket
//   };
// };




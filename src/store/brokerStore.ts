// stores/brokerStore.ts
import { create } from 'zustand';
import type { BrokerConnection, BrokerErrorLog, OAuthState } from './types/broker';

interface BrokerState {
  connections: BrokerConnection[];
  selectedConnection: BrokerConnection | null;
  errorLogs: BrokerErrorLog[];
  oauthState: OAuthState | null;
  isLoading: boolean;
  setConnections: (connections: BrokerConnection[]) => void;
  addConnection: (connection: BrokerConnection) => void;
  updateConnection: (id: number, connection: Partial<BrokerConnection>) => void;
  deleteConnection: (id: number) => void;
  setSelectedConnection: (connection: BrokerConnection | null) => void;
  setErrorLogs: (errorLogs: BrokerErrorLog[]) => void;
  setOAuthState: (oauthState: OAuthState | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useBrokerStore = create<BrokerState>((set) => ({
  connections: [],
  selectedConnection: null,
  errorLogs: [],
  oauthState: null,
  isLoading: false,
  setConnections: (connections) => set({ connections }),
  addConnection: (connection) => 
    set((state) => ({ connections: [...state.connections, connection] })),
  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((conn) =>
        conn.id === id ? { ...conn, ...updates } : conn
      ),
    })),
  deleteConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
    })),
  setSelectedConnection: (connection) => set({ selectedConnection: connection }),
  setErrorLogs: (errorLogs) => set({ errorLogs }),
  setOAuthState: (oauthState) => set({ oauthState }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
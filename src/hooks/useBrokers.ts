// hooks/useBrokers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/uiSlice';
import type {
  BrokerConnection,
  BrokerErrorLog,
  TestConnectionData,
  ValidationResult,
  PaginatedResponse,
} from '@/store/types/broker';

// Query keys for consistent caching
export const brokerQueryKeys = {
  all: ['brokers'] as const,
  lists: () => [...brokerQueryKeys.all, 'list'] as const,
  list: (filters: any) => [...brokerQueryKeys.lists(), filters] as const,
  details: () => [...brokerQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...brokerQueryKeys.details(), id] as const,
  errors: (id: number) => [...brokerQueryKeys.detail(id), 'errors'] as const,
};

/**
 * Hook to fetch all broker connections for the current user
 */
export const useBrokerConnections = () => {
  return useQuery<BrokerConnection[]>({
    queryKey: brokerQueryKeys.lists(),
    queryFn: async () => {
      const response = await api.get('/brokers/api/connections/');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};


/**
 * Hook to fetch a specific broker connection by ID
 */
export const useBrokerConnection = (id: number) => {
  return useQuery<BrokerConnection>({
    queryKey: brokerQueryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/brokers/api/connections/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to create a new broker connection
 */
export const useCreateBrokerConnection = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (connectionData: Partial<BrokerConnection>) => {
      const response = await api.post('/brokers/api/connections/', connectionData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch the connections list
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
      dispatch(showToast({ message: 'Connection created successfully', type: 'success' }));
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Failed to create connection', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to update an existing broker connection
 */
export const useUpdateBrokerConnection = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BrokerConnection> }) => {
      const response = await api.patch(`/brokers/api/connections/${id}/`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: brokerQueryKeys.detail(id) });
      
      // Snapshot the previous value
      const previousConnection = queryClient.getQueryData<BrokerConnection>(brokerQueryKeys.detail(id));
      
      // Optimistically update to the new value
      if (previousConnection) {
        queryClient.setQueryData<BrokerConnection>(
          brokerQueryKeys.detail(id),
          { ...previousConnection, ...data }
        );
      }
      
      return { previousConnection };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousConnection) {
        queryClient.setQueryData(
          brokerQueryKeys.detail(variables.id),
          context.previousConnection
        );
      }
      dispatch(showToast({ 
        message: 'Failed to update connection', 
        type: 'error' 
      }));
    },
    onSuccess: (data, variables) => {
      // Update the cache with the server response
      queryClient.setQueryData(
        brokerQueryKeys.detail(variables.id),
        data
      );
      dispatch(showToast({ 
        message: 'Connection updated successfully', 
        type: 'success' 
      }));
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
    },
  });
};

/**
 * Hook to delete a broker connection
 */
export const useDeleteBrokerConnection = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/brokers/api/connections/${id}/`);
      return id;
    },
    onMutate: async (id: number) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: brokerQueryKeys.lists() });
      
      // Snapshot the previous value
      const previousConnections = queryClient.getQueryData<BrokerConnection[]>(brokerQueryKeys.lists());
      
      // Optimistically remove the connection
      if (previousConnections) {
        queryClient.setQueryData<BrokerConnection[]>(
          brokerQueryKeys.lists(),
          previousConnections.filter(connection => connection.id !== id)
        );
      }
      
      return { previousConnections };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousConnections) {
        queryClient.setQueryData(
          brokerQueryKeys.lists(),
          context.previousConnections
        );
      }
      dispatch(showToast({ 
        message: 'Failed to delete connection', 
        type: 'error' 
      }));
    },
    onSuccess: () => {
      dispatch(showToast({ 
        message: 'Connection deleted successfully', 
        type: 'success' 
      }));
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
    },
  });
};

/**
 * Hook to test broker credentials without saving
 */
export const useTestConnection = () => {
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (testData: TestConnectionData) => {
      const response = await api.post('/brokers/api/connections/test_connection/', testData);
      return response.data;
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Connection test failed', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to validate an existing broker connection
 */
export const useValidateBroker = () => {
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (id: number): Promise<ValidationResult> => {
      const response = await api.post(`/brokers/api/connections/${id}/validate/`);
      return response.data;
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Validation failed', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to set a broker connection as default
 */
export const useSetDefaultBroker = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/brokers/api/connections/${id}/set_default/`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the connections list to refetch with updated default status
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Failed to set default connection', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to fetch error logs for a broker connection
 */
export const useBrokerErrorLogs = (connectionId: number, page: number = 1, pageSize: number = 10) => {
  return useQuery<PaginatedResponse<BrokerErrorLog>>({
    queryKey: [...brokerQueryKeys.errors(connectionId), page, pageSize],
    queryFn: async () => {
      const response = await api.get(
        `/brokers/api/connections/${connectionId}/errors/?page=${page}&page_size=${pageSize}`
      );
      return response.data;
    },
    enabled: !!connectionId,
  });
};




// hooks/useBrokers.ts - Add this new hook

/**
 * Hook to validate and create broker connection in one step
 */
export const useCreateAndValidateBrokerConnection = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (connectionData: Partial<BrokerConnection>) => {
      const response = await api.post('/brokers/api/connections/validate-immediate/', connectionData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch the connections list
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
      dispatch(showToast({ 
        message: data.message || 'Connection created and validated successfully', 
        type: 'success' 
      }));
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Failed to create and validate connection', 
        type: 'error' 
      }));
    },
  });
};


/**
 * Hook to initiate OAuth flow
 */
export const useInitiateOAuth = () => {
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (data: { environment: string; scope?: string }) => {
      const response = await api.post('/brokers/api/connections/initiate_oauth/', data);
      return response.data;
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'Failed to initiate OAuth', 
        type: 'error' 
      }));
    },
  });
};

/**
 * Hook to complete OAuth flow
 */
export const useOAuthCallback = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: async (data: { code: string; state: string; environment: string }) => {
      const response = await api.get(
        `/brokers/api/oauth/callback/?code=${data.code}&state=${data.state}&environment=${data.environment}`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the connections list to include the new OAuth connection
      queryClient.invalidateQueries({ queryKey: brokerQueryKeys.lists() });
      dispatch(showToast({ 
        message: 'OAuth connection established successfully', 
        type: 'success' 
      }));
    },
    onError: (error: any) => {
      dispatch(showToast({ 
        message: error.response?.data?.message || 'OAuth authentication failed', 
        type: 'error' 
      }));
    },
  });
};

// Helper function for better error handling
export const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value;

  let stringified = '[Unable to stringify the thrown value]';
  try {
    stringified = JSON.stringify(value);
  } catch {}

  return new Error(`This value was thrown as is, not through an Error: ${stringified}`);
};
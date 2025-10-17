// components/OAuthIntegration.tsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Alert, CircularProgress, Typography, Button } from '@mui/material';
import { useOAuthCallback, useInitiateOAuth } from '@/hooks/useBrokers';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/uiSlice';

export const OAuthIntegration: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  const oauthCallback = useOAuthCallback();
  const initiateOAuth = useInitiateOAuth();

  useEffect(() => {
    if (code && state) {
      oauthCallback.mutate({
        code,
        state,
        environment: searchParams.get('environment') || 'paper',
      });
    }
  }, [code, state, searchParams, oauthCallback]);

  const handleStartOAuth = () => {
    initiateOAuth.mutate({ 
      environment: 'paper',
      scope: 'account:write trading'
    });
  };

  // Use isPending for TanStack Query v5
  const isOAuthCallbackLoading = oauthCallback.isPending;
  const isInitiateOAuthLoading = initiateOAuth.isPending;

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography variant="h6">OAuth Error</Typography>
          <Typography>{errorDescription || 'An error occurred during authentication'}</Typography>
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/brokers')}
        >
          Back to Brokers
        </Button>
      </Box>
    );
  }

  if (isOAuthCallbackLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={3}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Completing OAuth authentication...</Typography>
      </Box>
    );
  }

  if (oauthCallback.isSuccess) {
    dispatch(showToast({ 
      message: 'OAuth connection established successfully', 
      type: 'success' 
    }));
    
    return (
      <Box p={3}>
        <Alert severity="success">
          <Typography variant="h6">Successfully Connected!</Typography>
          <Typography>Your broker account has been successfully connected.</Typography>
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/brokers')}
        >
          Back to Brokers
        </Button>
      </Box>
    );
  }

  if (oauthCallback.isError) {
    dispatch(showToast({ 
      message: (oauthCallback.error as any)?.message || 'OAuth authentication failed', 
      type: 'error' 
    }));
    
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography variant="h6">Connection Failed</Typography>
          <Typography>{(oauthCallback.error as any)?.message || 'Failed to complete OAuth authentication'}</Typography>
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/brokers')}
        >
          Back to Brokers
        </Button>
      </Box>
    );
  }

  // Initial state - show option to start OAuth flow
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Connect with OAuth
      </Typography>
      <Typography variant="body1" gutterBottom>
        Click the button below to initiate the OAuth authentication flow with your broker.
      </Typography>
      
      <Box mt={3}>
        <Button
          variant="contained"
          onClick={handleStartOAuth}
          disabled={isInitiateOAuthLoading}
        >
          {isInitiateOAuthLoading ? 'Redirecting...' : 'Start OAuth Flow'}
        </Button>
      </Box>
    </Box>
  );
};
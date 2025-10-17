// src/pages/brokers/EditBrokerConnectionPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Alert } from '@mui/material';
import { BrokerConnectionForm } from './BrokerConnectionForm';
import { useBrokerConnection } from '@/hooks/useBrokers';
import type { BrokerConnection } from '@/store/types/broker';

export const EditBrokerConnectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const connectionId = id ? parseInt(id, 10) : null;
  
  const { data: connection, isLoading, error } = useBrokerConnection(connectionId || 0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (connectionId && connection) {
      setIsReady(true);
    } else if (!connectionId) {
      // If no ID provided, redirect to connections list
      navigate('/brokers');
    }
  }, [connectionId, connection, navigate]);

  const handleSuccess = () => {
    navigate('/brokers');
  };

  const handleCancel = () => {
    navigate('/brokers');
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box py={4} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box py={4}>
          <Alert severity="error">
            Failed to load connection: {error.message}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!isReady || !connection) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom className=' text-gray-900 dark:text-white '>
          Edit Broker Connection
        </Typography>
        <BrokerConnectionForm 
          connection={connection as BrokerConnection}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
};
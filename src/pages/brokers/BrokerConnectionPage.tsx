// src/pages/brokers/BrokerConnectionsPage.tsx
import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { BrokerConnections } from './BrokerConnections';

export const BrokerConnectionsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" className='  text-gray-900 dark:text-white '>
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Broker Connections
        </Typography>
        <Typography variant="body1" color="text-white" paragraph>
          Manage your trading broker connections. Add, edit, or remove connections to various brokers.
        </Typography>
        <BrokerConnections />
      </Box>
    </Container>
  );
};
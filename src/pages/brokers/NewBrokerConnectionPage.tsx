// src/pages/brokers/NewBrokerConnectionPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { BrokerConnectionForm } from './BrokerConnectionForm';

export const NewBrokerConnectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/brokers');
  };

  const handleCancel = () => {
    navigate('/brokers');
  };

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom className=' text-gray-900 dark:text-white '>
          Add New Broker Connection
        </Typography>
        <BrokerConnectionForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
};
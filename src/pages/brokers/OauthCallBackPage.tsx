// src/pages/brokers/OAuthCallbackPage.tsx
import React from 'react';
import { Box, Container } from '@mui/material';
import { OAuthIntegration } from './OauthIntegration';

export const OAuthCallbackPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box py={4}>
        <OAuthIntegration />
      </Box>
    </Container>
  );
};
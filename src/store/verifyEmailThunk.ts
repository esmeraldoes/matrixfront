// src/store/verifyEmailThunk.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import type { User } from '@/services/api';
import axios from 'axios';

// Update interface to match API response
export interface VerifyEmailResponse {
  message: string;
  user?: User;  // Make user optional
}

export const verifyEmail = createAsyncThunk<
  VerifyEmailResponse,
  string,
  { rejectValue: string }
>(
  'auth/verifyEmail',
  async (token, { signal, rejectWithValue }) => {
    try {
      const source = axios.CancelToken.source();
      signal.addEventListener('abort', () => source.cancel());
      
      const response = await api.verifyEmail(token, {
        cancelToken: source.token
      });

      // Type guard to ensure we have a valid response
      if (response.data && typeof response.data.message === 'string') {
        return response.data;
      }
      
      throw new Error('Invalid verification response');
    } catch (err) {
      // Handle cancellation
      if (axios.isCancel(err)) {
        return rejectWithValue('Verification cancelled');
      }
      
      // Normal error handling
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.detail || 
                    err.response?.data?.message || 
                    err.message || 
                    'Verification failed';
        return rejectWithValue(msg);
      }
      
      return rejectWithValue('An unknown error occurred');
    }
  }
);


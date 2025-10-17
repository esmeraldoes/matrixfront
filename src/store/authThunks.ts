// src/store/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';
import type { User } from '../services/api';

import {
  authRequest,
  loginSuccess,
  registerSuccess,
  authFailure,
  logout,
  updateProfileSuccess,
  googleAuthRequest,
  googleAuthSuccess,
  googleAuthFailure,
  setInitialAuthCheckComplete,
  storeCodeVerifier,
} from './authSlice';

import {
  generateCodeVerifier,
  generateCodeChallenge,
} from '@/utils/pcke';


const handleApiError = (error: any): string => {
  if (error?.response) {
    return (
      error.response.data.detail ||
      error.response.data.message ||
      JSON.stringify(error.response.data) ||
      'Server error occurred'
    );
  }
  if (error?.request) {
    return 'No response received from server. Please check your internet connection.';
  }
  return error?.message || 'An unknown error occurred.';
};

export const checkAuth = createAsyncThunk(
  'auth/checkStatus',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.getProfile();
      dispatch(loginSuccess({ user: res.data }));
      api.startTokenMonitoring();
      dispatch(setInitialAuthCheckComplete(true)); 

      return res.data;
    } catch (err) {
      dispatch(setInitialAuthCheckComplete(true));
      return rejectWithValue(handleApiError(err));
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    data: {
      email: string;
      username: string;
      password: string;
      password2: string;
      referral_code?: string;
    },
    { dispatch, rejectWithValue },
  ) => {
    dispatch(authRequest());
    try {
      const res = await api.register(data);
      dispatch(registerSuccess());
      return res.data;
    } catch (err) {
      const msg = handleApiError(err);
      dispatch(authFailure(msg));
      return rejectWithValue(msg);
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { dispatch, rejectWithValue },
  ) => {
    dispatch(authRequest());
    try {
      const res = await api.login(credentials.email, credentials.password);
      dispatch(loginSuccess({ user: res.data.user }));
      api.startTokenMonitoring()
      return res.data;
    } catch (err) {
      const msg = handleApiError(err);
      dispatch(authFailure(msg));
      return rejectWithValue(msg);
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await api.logout();
    } finally {
      api.stopTokenMonitoring();
      dispatch(logout());
    }
  },
);


export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(authRequest());
    try {
      const res = await api.resendVerificationEmail();
      return res.data;
    } catch (err) {
      const msg = handleApiError(err);
      dispatch(authFailure(msg));
      return rejectWithValue(msg);
    }
  },
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { dispatch, rejectWithValue }) => {
    dispatch(authRequest());
    try {
      const res = await api.requestPasswordReset(email);
      return res.data;
    } catch (err) {
      const msg = handleApiError(err);
      dispatch(authFailure(msg));
      return rejectWithValue(msg);
    }
  },
);

export const confirmPasswordReset = createAsyncThunk(
  'auth/confirmPasswordReset',
  async (
    { token, newPassword }: { token: string; newPassword: string },
    { dispatch, rejectWithValue },
  ) => {
    dispatch(authRequest());
    try {
      const res = await api.confirmPasswordReset(token, newPassword);
      return res.data;
    } catch (err) {
      const msg = handleApiError(err);
      dispatch(authFailure(msg));
      return rejectWithValue(msg);
    }
  },
);


export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profile: Partial<User>, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.updateProfile(profile);
      dispatch(updateProfileSuccess(res.data));
      return res.data;
    } catch (err) {
      return rejectWithValue(handleApiError(err));
    }
  },
);


export const initiateGoogleAuth = createAsyncThunk(
  'auth/initiateGoogleAuth',
  async (
    { referralCode }: { referralCode?: string } = {},
    { dispatch, rejectWithValue },
  ) => {
    dispatch(googleAuthRequest());

    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      
      sessionStorage.setItem('pkce_code_verifier', verifier);
      localStorage.setItem('pkce_code_verifier_backup', verifier);
     
      const res = await api.initiateGoogleAuth({
        referral_code: referralCode,
        code_challenge: challenge,
        code_verifier: verifier,  
      });

      return res.data.auth_url as string;
    } catch (err) {
      const msg = handleApiError(err);
      dispatch(googleAuthFailure(msg));
      return rejectWithValue(msg);
    }
  },
);


export const googleLogin = createAsyncThunk(
  'auth/completeGoogleAuth',
  async (
    {
      code,
      state,
      referralCode,
    }: { code: string; state: string; referralCode?: string },
    { dispatch, rejectWithValue },
  ) => {
    dispatch(googleAuthRequest());

    try {
      const verifier = localStorage.getItem('pkce_code_verifier_backup');

      if (!verifier) {
        throw new Error('Missing code verifier');
      }

      const res = await api.completeGoogleAuth({
        code,
        state,
        code_verifier: verifier,
        referral_code: referralCode,
      });

      sessionStorage.removeItem('pkce_code_verifier');
      localStorage.removeItem('pkce_code_verifier_backup');
      
      dispatch(googleAuthSuccess(res.data.user));
      api.startTokenMonitoring();

      return res.data;
    } catch (err) {
      sessionStorage.removeItem('pkce_code_verifier');
      localStorage.removeItem('pkce_code_verifier_backup');
      
      const msg = handleApiError(err);
      dispatch(googleAuthFailure(msg));
      return rejectWithValue(msg);
    }
  },
);

export const generateAndStoreCodeVerifier = createAsyncThunk(
  'auth/generateCodeVerifier',
  async (_, { dispatch }) => {
    const verifier = generateCodeVerifier();
    dispatch(storeCodeVerifier(verifier));
    return verifier;
  },
);

export const getCodeChallenge = createAsyncThunk(
  'auth/getCodeChallenge',
  async (verifier: string) => generateCodeChallenge(verifier),
);


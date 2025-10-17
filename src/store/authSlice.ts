// src/store/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { type PayloadAction } from '@reduxjs/toolkit';
// import { verifyEmail } from './authThunks'; 
import { verifyEmail } from './verifyEmailThunk';
import type { User } from '../services/api';



type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  registerSuccess: boolean;
  // referralInfo: ReferralInfo | null;

  verifyEmailStatus: AsyncStatus;
  verifyEmailError: string | null;

  googleAuthState: {
    loading: boolean;
    error: string | null;
    codeVerifier: string | null;
  };

  isInitialAuthCheckComplete: boolean;
}

// --- Initial State ---
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  registerSuccess: false,
  // referralInfo: null,
  verifyEmailStatus: 'idle',
  verifyEmailError: null,
  googleAuthState: {
    loading: false,
    error: null,
    codeVerifier: null,
  },
  isInitialAuthCheckComplete: false,
};

// --- Slice ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 🔐 Auth Core
    authRequest(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User }>) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      state.isInitialAuthCheckComplete = true;
    },
    registerSuccess(state) {
      state.loading = false;
      state.registerSuccess = true;
      state.error = null;
    },
    authFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.isInitialAuthCheckComplete = true;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      // state.referralInfo = null;
      state.registerSuccess = false;
      state.googleAuthState = {
        loading: false,
        error: null,
        codeVerifier: null,
      };
      state.verifyEmailStatus = 'idle';
      state.verifyEmailError = null;
      state.isInitialAuthCheckComplete = false;
    },

    // 📮 Error/Success Flags
    clearAuthError(state) {
      state.error = null;
      state.googleAuthState.error = null;
      state.verifyEmailError = null;
    },
    resetRegisterSuccess(state) {
      state.registerSuccess = false;
    },
    resetVerifyEmailStatus(state) {
      state.verifyEmailStatus = 'idle';
      state.verifyEmailError = null;
    },

    // 👥 Referral
    // setReferralInfo(state, action: PayloadAction<ReferralInfo>) {
    //   state.referralInfo = action.payload;
    // },

    // ✅ Email Verification & Profile
    verifyEmailSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.user.is_verified = true;
      // loading and error handled by extraReducers
    },
    updateProfileSuccess(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // 🔐 Google Auth (PKCE)
    googleAuthRequest(state) {
      state.googleAuthState.loading = true;
      state.googleAuthState.error = null;
    },
    storeCodeVerifier(state, action: PayloadAction<string>) {
      state.googleAuthState.codeVerifier = action.payload;
    },
    googleAuthSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.googleAuthState = {
        loading: false,
        error: null,
        codeVerifier: null,
      };
      state.isInitialAuthCheckComplete = true;
    },
    googleAuthFailure(state, action: PayloadAction<string>) {
      state.googleAuthState.loading = false;
      state.googleAuthState.error = action.payload;
      state.googleAuthState.codeVerifier = null;
      state.user = null;
      state.isInitialAuthCheckComplete = true;
    },

    // ✅ Global Initial Auth Check Flag
    setInitialAuthCheckComplete(state, action: PayloadAction<boolean>) {
      state.isInitialAuthCheckComplete = action.payload;
    },
  },


  /* --- Extra reducers --- */
  extraReducers: (builder) => {
    builder
      /* 1. pending */
      .addCase(verifyEmail.pending, (state) => {
        state.verifyEmailStatus = 'loading';
        state.verifyEmailError  = null;
      })
      /* 2. fulfilled */
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.verifyEmailStatus = 'succeeded';
        state.verifyEmailError  = null;
        // state.user = action.payload.user;   // ✅ store user
         state.user = action.payload.user ?? null;   // ✅ store user or null if undefined

        state.isAuthenticated = true;       // ✅ auto‑login path
      })
      /* 3. rejected */
      .addCase(verifyEmail.rejected, (state, action) => {
        state.verifyEmailStatus = 'failed';
        state.verifyEmailError =
          (action.payload as string) ||
          action.error.message ||
          'Verification failed';
      });
  },


});

// --- Exports ---
export const {
  authRequest,
  loginSuccess,
  registerSuccess,
  authFailure,
  logout,
  clearAuthError,
  resetRegisterSuccess,
  resetVerifyEmailStatus,
  // setReferralInfo,
  verifyEmailSuccess,
  updateProfileSuccess,
  googleAuthRequest,
  storeCodeVerifier,
  googleAuthSuccess,
  googleAuthFailure,
  setInitialAuthCheckComplete,
} = authSlice.actions;

export default authSlice.reducer;



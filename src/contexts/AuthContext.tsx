// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { User } from '../services/api';
import { store } from '../store/store';
import { logout as reduxLogout } from '../store/authSlice';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (email: string, username: string, password: string, referralCode?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  getGoogleAuthUrl: () => Promise<string>;
  handleGoogleCallback: (code: string, state: string, referralCode?: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: unknown): string => {
    if (typeof error === 'object' && error !== null) {
      const err = error as { response?: { data?: { detail?: string }, status?: number } };
      if (err.response?.data?.detail) return err.response.data.detail;
      if (err.response?.data) return JSON.stringify(err.response.data);
    }
    return error instanceof Error ? error.message : 'An unexpected error occurred';
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.getProfile();
      setUser(response.data);
      setError(null);
    } catch (error) {
      setUser(null);
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        store.dispatch(reduxLogout());
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, referralCode?: string) => {
    try {
      setError(null);
      setLoading(true);
      await api.register({ email, username, password, referral_code: referralCode });
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.login(email, password);
      setUser(response.data.user);
      setError(null);
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      await api.logout();
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      store.dispatch(reduxLogout());
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setError(null);
      setLoading(true);
      await api.verifyEmail(token);
      await fetchProfile();
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      setError(null);
      setLoading(true);
      await api.resendVerificationEmail();
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      await api.requestPasswordReset(email);
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmPasswordReset = async (token: string, newPassword: string) => {
    try {
      setError(null);
      setLoading(true);
      await api.confirmPasswordReset(token, newPassword);
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getGoogleAuthUrl = async (): Promise<string> => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.getGoogleAuthUrl();
      return response.data.auth_url;
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCallback = async (code: string, state: string, referralCode?: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.googleAuthCallback(code, state, referralCode);
      setUser(response.data.user);
    } catch (error) {
      setError(handleError(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await fetchProfile();
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    confirmPasswordReset,
    getGoogleAuthUrl,
    handleGoogleCallback,
    fetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
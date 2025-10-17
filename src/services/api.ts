// src/services/api.ts
import type { TradingAccount } from '@/types/user';
import axios from 'axios';
import type {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig
} from 'axios';

const REFRESH_TOKEN_NAME = import.meta.env.VITE_JWT_REFRESH_COOKIE_NAME || 'refresh_token';
const ACCESS_TOKEN_NAME = import.meta.env.VITE_JWT_ACCESS_COOKIE_NAME || 'access_token';

// Interfaces
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  referral_code?: string;
  trading_accounts?: TradingAccount[];

  referred_by?: number;
  avatar?: string;
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
}

interface AuthSuccessResponseData {
  user: User;
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private instance: AxiosInstance;
  private refreshTokenRequest: Promise<AxiosResponse> | null = null;
  private accessTokenExpiryCheckInterval: NodeJS.Timeout | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken',
    });

    this.setupInterceptors();
    this.clearOAuthState();
  }

  // Add method to set callback for unauthorized handling
  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  private clearOAuthState() {
    sessionStorage.removeItem('pkce_code_verifier');
    localStorage.removeItem('preAuthPath');
  }

  public startTokenMonitoring() {
    if (this.accessTokenExpiryCheckInterval) return;

    if (!this.getCookie(REFRESH_TOKEN_NAME)) {
      this.stopTokenMonitoring();
      return;
    }

    this.accessTokenExpiryCheckInterval = setInterval(() => {
      if (!this.getCookie(REFRESH_TOKEN_NAME)) {
        this.stopTokenMonitoring();
        return;
      }

      if (this.isAccessTokenExpired(60)) {
        this.refreshToken().catch(_error => {
          this.handleAuthFailure();
        });
      }
    }, 30000); 
  }

  private isAccessTokenExpired(bufferSeconds = 0): boolean {
    const token = this.getCookie(ACCESS_TOKEN_NAME);
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.exp * 1000) < (Date.now() + (bufferSeconds * 1000));
    } catch {
      return true;
    }
  }

  public stopTokenMonitoring() {
    if (this.accessTokenExpiryCheckInterval) {
      clearInterval(this.accessTokenExpiryCheckInterval);
      this.accessTokenExpiryCheckInterval = null;
    }
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (process.env.NODE_ENV === 'development') {
         
        }

        if (typeof document === 'undefined') return config;

        const refreshToken = this.getCookie(REFRESH_TOKEN_NAME);
        const isAuthRequest = config.url?.includes('/auth/');

        if (refreshToken && !isAuthRequest && this.isAccessTokenExpired()) {
          try {
            await this.refreshToken();
          } catch (error) {
            console.error('Proactive refresh failed:', error);
           }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (typeof document === 'undefined' ||
          originalRequest.url?.includes('/auth/token/refresh')) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.instance(originalRequest);
          } catch (refreshError) {
            if (axios.isAxiosError(refreshError) &&
              [400, 401].includes(refreshError.response?.status || 0)) {
              this.handleAuthFailure();
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  private async refreshToken(): Promise<AxiosResponse> {
    if (this.refreshTokenRequest) {
      return this.refreshTokenRequest;
    }

    try {
      this.refreshTokenRequest = this.instance.post(
        '/auth/token/refresh/',
        {},
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': this.getCookie('csrftoken') || ''
          }
        }
      );

      const response = await this.refreshTokenRequest;
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    } finally {
      this.refreshTokenRequest = null;
    }
  }

  private handleAuthFailure() {
    this.stopTokenMonitoring();
    if (this.onUnauthorizedCallback) {
      this.onUnauthorizedCallback();
    } else {
      if (typeof window !== 'undefined') {
        document.cookie.split(';').forEach(c => {
          document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
        });
        window.location.href = '/login?session_expired=1';
      }
    }
  }

  public async register(data: {
    email: string;
    username: string;
    password: string;
    password2: string;
    referral_code?: string;
  }): Promise<ApiResponse<{ detail: string }>> {
    return this.instance.post('/auth/register/', data);
  }

  public async login(email: string, password: string): Promise<ApiResponse<AuthSuccessResponseData>> {
    return this.instance.post('/auth/login/', { email, password });
  }

  public async logout(): Promise<ApiResponse<{ detail: string }>> {
    this.stopTokenMonitoring();
    return this.instance.post('/auth/logout/');
  }

  public async verifyEmail(token: string, config?: AxiosRequestConfig): Promise<ApiResponse<{ message: string; user?: User }>> {
    return this.instance.post(`/auth/verify-email/${token}/`, { auto_login: true }, config);
  }

  public async resendVerificationEmail(): Promise<ApiResponse<{ detail: string }>> {
    return this.instance.post('/auth/resend-verification-email/');
  }

  public async requestPasswordReset(email: string): Promise<ApiResponse<{ detail: string }>> {
    return this.instance.post('/auth/password-reset/', { email });
  }

  public async confirmPasswordReset(token: string, newPassword: string): Promise<ApiResponse<{ detail: string }>> {
    return this.instance.post(`/auth/password-reset/${token}/`, { password: newPassword });
  }

  // --- Google OAuth ---
  public async getGoogleAuthUrl(): Promise<ApiResponse<{ auth_url: string }>> {
    return this.instance.get('/auth/google/url/');
  }

  public async initiateGoogleAuth(data: {
    referral_code?: string;
    code_challenge: string;
    code_verifier: string;
  }): Promise<ApiResponse<{ auth_url: string }>> {
    

    return this.instance.post('/auth/google/initiate/', data);
  }

  public async completeGoogleAuth(data: {
    code: string;
    state: string;
    code_verifier: string;
    referral_code?: string;
  }): Promise<ApiResponse<AuthSuccessResponseData>> {
    return this.instance.post('/auth/google/complete/', data);
  }

  public async getProfile(): Promise<ApiResponse<User>> {
    return this.instance.get('/auth/profile/');
  }

  public async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    return this.instance.patch('/auth/profile/update/', profileData);
  }

  public get<T = any, R = AxiosResponse<T>, D = any>(url: string, config: AxiosRequestConfig<D> = {}): Promise<R> {
    return this.instance.get(url, config);
  }

  public post<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R> {
    return this.instance.post(url, data, config);
  }

  public put<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: InternalAxiosRequestConfig<D>): Promise<R> {
    return this.instance.put(url, data, config);
  }

  public patch<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: InternalAxiosRequestConfig<D>): Promise<R> {
    return this.instance.patch(url, data, config);
  }

  public delete<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: InternalAxiosRequestConfig<D>): Promise<R> {
    return this.instance.delete(url, config);
  }

  public deleteWithBody<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config: InternalAxiosRequestConfig<D> = {} as InternalAxiosRequestConfig<D>
  ): Promise<R> {
    config.data = data;
    return this.instance.delete(url, config);
  }

  public cleanup() {
    this.stopTokenMonitoring();
    this.refreshTokenRequest = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('authState');
      sessionStorage.clear();
    }
  }
}

export const api = new ApiClient();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => api.cleanup());
}


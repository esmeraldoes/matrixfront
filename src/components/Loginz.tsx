// // src/components/Login.tsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, initiateGoogleAuth } from '@/store/authThunks';
import { clearAuthError } from '@/store/authSlice';

import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateCodeVerifier } from '@/utils/pcke';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  // Redirect on successful login
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearAuthError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const onSubmit = async (values: { email: string; password: string }) => {
    await dispatch(login(values));
  };

  
  const handleGoogleLogin = async () => {
    try {
      setGoogleAuthLoading(true);
      const referralCode = searchParams.get('ref') ?? undefined;
      
      const verifier = generateCodeVerifier();
      sessionStorage.setItem('pkce_code_verifier', verifier);
      localStorage.setItem('pkce_code_verifier_backup', verifier);
      

      const authUrl = await dispatch(
      initiateGoogleAuth({ referralCode }) 
    ).unwrap();
     
      if (authUrl) {
        localStorage.setItem('preAuthPath', window.location.pathname + window.location.search);
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Google auth initiation failed:', error);
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex **items-start** justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Matrix Trading Terminal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the Matrix - Access Your Trading Interface
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-500 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <FormControl>
                        <Input
                          placeholder="your@email.com"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between pt-1">
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 text-gray-700 dark:text-gray-300">
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Link to="/forgot-password" className="text-sm font-medium text-emerald-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

                <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
              

              {/* Google Login */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={handleGoogleLogin}
                disabled={loading || googleAuthLoading}
              >
                {googleAuthLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      {/* Google logo paths */}
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}


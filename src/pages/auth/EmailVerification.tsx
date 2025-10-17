// src/pages/auth/EmailVerification.tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, Loader2, RefreshCw, Check } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { verifyEmail } from '@/store/verifyEmailThunk';
import { resendVerificationEmail } from '@/store/authThunks';
import { resetVerifyEmailStatus } from '@/store/authSlice';
import { useToast } from '@/hooks/use-toast';

export const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const {
    verifyEmailStatus,
    verifyEmailError,
    loading,
    error,
    user,
    isAuthenticated,
  } = useAppSelector((state) => state.auth);

  const [displayMessage, setDisplayMessage] = useState(
    'Verifying your email address...',
  );

  useEffect(() => {
    if (token && verifyEmailStatus === 'idle') {
      setDisplayMessage('Verifying your email address...');
      dispatch(verifyEmail(token));
    }
  }, [token, verifyEmailStatus, dispatch]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (verifyEmailStatus === 'succeeded') {
      setDisplayMessage('Email verified successfully. Logging you in…');
      toast({
        title: 'Email Verified',
        description: 'Your email has been successfully verified!',
      });

      timer = setTimeout(() => {
        navigate(isAuthenticated ? '/dashboard' : '/login');
        dispatch(resetVerifyEmailStatus());
      }, 1500);
    }

    if (verifyEmailStatus === 'failed') {
      const msg = verifyEmailError || 'Verification failed. The link might be invalid or expired.';
      setDisplayMessage(msg);
      toast({
        title: 'Verification Failed',
        description: msg,
        variant: 'destructive',
      });
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [verifyEmailStatus, verifyEmailError, isAuthenticated, navigate, toast, dispatch]);

  const handleResend = async () => {
    try {
      await dispatch(resendVerificationEmail()).unwrap();
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to resend email',
        description:
          err?.message || 'Could not resend verification email. Try again later.',
        variant: 'destructive',
      });
    }
  };

  const VerificationIcon = () => {
    if (verifyEmailStatus === 'loading') {
      return (
        <Loader2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
      );
    }
    if (verifyEmailStatus === 'failed') {
      return (
        <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
      );
    }
    return <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900">
              <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Verify your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              We&apos;ve sent a verification link to{' '}
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {user?.email ?? 'your email address'}
              </span>
            </p>
          </div>

          <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  What&apos;s next?
                </h3>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
                  <li>Check your email for the verification link.</li>
                  <li>Click the link to verify your address.</li>
                  <li>Return here to sign in.</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <button
              onClick={handleResend}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Resend verification email
                </>
              )}
            </button>

            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900">
            <VerificationIcon />
          </div>

          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {verifyEmailStatus === 'loading'
              ? 'Verifying…'
              : verifyEmailStatus === 'failed'
              ? 'Error'
              : 'Success!'}
          </h2>

          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {displayMessage}
          </p>
        </div>

        {verifyEmailStatus === 'failed' && (
          <div className="flex flex-col space-y-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};


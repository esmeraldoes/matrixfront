// src/pages/auth/GoogleCallback.tsx
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { googleLogin } from '@/store/authThunks';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function GoogleCallbackPage() {
  const processedRef = useRef(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const referralCode = searchParams.get('ref') ?? undefined;

    if (status !== 'idle') return; 
    if (processedRef.current) return;
    processedRef.current = true;

    
    const handleAuth = async () => {

      if (error) {
        toast({
          title: 'Google authentication failed',
          description: error,
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      if (!code || !state) {
        toast({
          title: 'Authentication Error',
          description: 'Missing authentication parameters.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      try {
        setStatus('processing');

        const data = await dispatch(googleLogin({ code, state, referralCode })).unwrap();

        const preAuthPath = localStorage.getItem('preAuthPath');
        localStorage.removeItem('preAuthPath');

        setStatus('done');
        navigate(preAuthPath || '/dashboard');

      } catch (err: any) {
        console.error('❌ Google login failed:', err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Please try logging in again.';

        toast({
          title: 'Authentication Failed',
          description: message,
          variant: 'destructive',
        });
        navigate('/login');
      } finally {
        sessionStorage.removeItem('pkce_code_verifier');
        localStorage.removeItem('pkce_code_verifier_backup');
      }
    };

    handleAuth();
  }, [searchParams, status, dispatch, toast, navigate]);

  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      {status === 'processing' && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-lg font-medium">Processing authentication...</p>
        </div>
      )}

      {status === 'done' && (
        <p className="text-lg text-green-600 font-semibold">
          Authentication completed! Redirecting...
        </p>
      )}

      {status === 'idle' && (
        <p className="text-gray-600">Ready to authenticate...</p>
      )}
    </div>
  );
}



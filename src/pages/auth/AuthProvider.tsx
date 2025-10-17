// src/components/auth/AuthProvider.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkAuth } from '@/store/authThunks';
import { Loader2 } from 'lucide-react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, isInitialAuthCheckComplete } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialAuthCheckComplete) {
      dispatch(checkAuth())
        .unwrap() 
        .catch((error) => {
         
          console.log('Initial authentication check failed (expected for unauthenticated users).', error);
        });
    }
  }, [dispatch, isInitialAuthCheckComplete]);

  useEffect(() => {
    if (isInitialAuthCheckComplete) {
      const { pathname } = location;
      const isAuthPage = ['/login', '/register', '/forgot-password', '/password-reset'].includes(pathname);
      const isVerificationPage = pathname.startsWith('/email-verification');

      if (!isAuthenticated) {
        if (!isAuthPage && !isVerificationPage) { 
          navigate('/login', { state: { from: pathname }, replace: true });
        }
       
      } 
      else { 
        if (isAuthPage) {
          navigate('/dashboard', { replace: true });
        } 
        else if (user && !user.is_verified && !isVerificationPage) {
          navigate('/email-verification', { replace: true });
        }
      }
    }
  }, [isAuthenticated, isInitialAuthCheckComplete, navigate, location.pathname, user]);

  if (!isInitialAuthCheckComplete) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
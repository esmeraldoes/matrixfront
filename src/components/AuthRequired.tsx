import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { checkAuth } from '@/store/authThunks';
import { Loader2 } from 'lucide-react';
import { api } from '@/services/api';

export function AuthRequired() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, error, isInitialAuthCheckComplete } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!isInitialAuthCheckComplete && !error) {
      dispatch(checkAuth());
    }
  }, [dispatch, isInitialAuthCheckComplete, error]);

  useEffect(() => {
    if (isAuthenticated) {
      api.startTokenMonitoring();
      return () => api.stopTokenMonitoring();
    }
  }, [isAuthenticated]);

  const isLoading = loading || !isInitialAuthCheckComplete;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <span className="ml-3 text-lg text-muted-foreground">
          Verifying session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

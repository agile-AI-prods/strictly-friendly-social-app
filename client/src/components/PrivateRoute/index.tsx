import { ReactNode, useEffect, useState, startTransition } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { loginSuccess, logout, loginStart, loginFailure } from '../../store/slices/authSlice';
import { getMe } from '../../api/profileApi';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      startTransition(() => {
        dispatch(loginStart());
      });

      try {
        const res = await getMe();
        console.log('=== PrivateRoute getMe response ===');
        console.log('Response:', res);
        console.log('Response data:', res.data);
        console.log('User ID:', res.data?.id);
        console.log('========================');
        
        if (res && res.email) {
          console.log('User authenticated, dispatching loginSuccess');
          startTransition(() => {
            dispatch(loginSuccess(res));
            setIsAuthenticated(true);
          });
        } else {
          console.log('Profile not found, dispatching loginFailure');
          startTransition(() => {
            dispatch(loginFailure('Profile not found'));
            setIsAuthenticated(false);
          });
        }
      } catch (e: any) {
        console.error('PrivateRoute error:', e);
        // Use the new logout thunk to clear the server cookie
        startTransition(() => {
          dispatch(logout());
          setIsAuthenticated(false);
        });
      } finally {
        startTransition(() => {
          setIsLoading(false);
        });
      }
    };
    checkAuth();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the current location and redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 
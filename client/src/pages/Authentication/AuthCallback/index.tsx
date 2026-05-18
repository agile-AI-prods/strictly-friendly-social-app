import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/hooks';
import { loginSuccess, loginFailure } from '../../../store/slices/authSlice';
import { getMe } from '../../../api/profileApi';
import { Button } from '../../../components/Button';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Try to get the user's profile from the backend
        const response = await getMe();
        
        if (response.data) {
          const profile = response.data;
          dispatch(loginSuccess(profile));
          
          // If profile is complete, go to discover, otherwise to onboarding
          if (profile.interests && profile.interests.length > 0) {
            navigate('/discover');
          } else {
            navigate('/onboarding');
          }
        } else {
          // If no profile exists, go to onboarding
          navigate('/onboarding');
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error || err?.message || 'Authentication failed';
        setError(errorMessage);
        dispatch(loginFailure(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
          </div>
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLoading ? 'Verifying...' : 'Redirecting...'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete the authentication process
          </p>
        </div>
      </div>
    </div>
  );
}; 
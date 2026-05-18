import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Snackbar } from '../../../components/Snackbar';

export const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token && verificationStatus === 'idle') {
      verifyEmail(token);
    } else if (!token) {
      setVerificationStatus('error');
      setError('No verification token provided');
    }
  }, [token, verificationStatus]);

  const verifyEmail = async (verificationToken: string) => {
    setVerificationStatus('verifying');
    try {
      console.log('🔍 Frontend: Starting email verification');
      console.log('🔍 Token:', verificationToken);
      console.log('🔍 API URL:', `/api/email-verification/verify?token=${verificationToken}`);
      
      const response = await fetch(`/api/email-verification/verify?token=${verificationToken}`);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🔍 Response data:', data);

      if (response.ok && data.success) {
        setVerificationStatus('success');
        setMessage(data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setVerificationStatus('error');
      setError('An error occurred during verification');
    }
  };

  const resendVerificationEmail = async () => {
    setIsResending(true);
    try {
      // Get email from localStorage or prompt user
      const email = localStorage.getItem('signup_email') || prompt('Please enter your email address:');
      
      if (!email) {
        setError('Email address is required');
        return;
      }

      const response = await fetch('/api/email-verification/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setError(null);
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (err) {
      setError('An error occurred while resending the verification email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {message && (
        <Snackbar
          message={message}
          variant="success"
          onClose={() => setMessage('')}
        />
      )}
      {error && (
        <Snackbar
          message={error}
          variant="error"
          onClose={() => setError(null)}
        />
      )}
      
      <div className="max-w-md w-full space-y-8">
        {renderContent()}
      </div>
    </div>
  );
};

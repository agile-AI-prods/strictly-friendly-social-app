import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAppDispatch } from '../../../store/hooks';
import { signup } from '../../../store/slices/authSlice';
import { checkEmail } from '../../../api/authApi';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Snackbar } from '../../../components/Snackbar';
import { ReCaptcha } from '../../../components/ReCaptcha';

export const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  // Debounced email check
  const debouncedEmailCheck = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (email: string) => {
        clearTimeout(timeoutId);
        if (!email || email.length < 3) {
          setEmailStatus('idle');
          return;
        }
        
        timeoutId = setTimeout(async () => {
          try {
            setEmailStatus('checking');
            const response = await checkEmail(email);
            setEmailStatus(response.data.isRegistered ? 'taken' : 'available');
          } catch (error: any) {
            console.error('Email check error:', error);
            // Handle validation errors
            if (error.response?.data?.error === 'Invalid email format') {
              setEmailStatus('invalid');
            } else {
              setEmailStatus('idle');
            }
          }
        }, 500); // 500ms delay
      };
    })(),
    []
  );

  // Check email when it changes
  useEffect(() => {
    debouncedEmailCheck(email);
  }, [email, debouncedEmailCheck]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (emailStatus === 'taken') {
      setError('This email is already registered. Please use a different email or try logging in.');
      return;
    }

    if (emailStatus === 'checking') {
      setError('Please wait while we check your email availability.');
      return;
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setIsLoading(true);
    try {
      const result = await dispatch(signup({ email, password, name, recaptchaToken })).unwrap();
      // Store email for email verification page
      localStorage.setItem('signup_email', email);
      setSuccess(result.message || 'Account created successfully! Please check your email to verify your account.');
      setTimeout(() => {
        navigate('/signup-success');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err || 'Failed to sign up';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('Google signup is not yet implemented with the new backend. Please use email signup.');
  };

  const handleRecaptchaVerify = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const getEmailStatusMessage = () => {
    switch (emailStatus) {
      case 'checking':
        return 'Checking email availability...';
      case 'available':
        return 'Email is available';
      case 'taken':
        return 'Email is already registered';
      case 'invalid':
        return 'Invalid email format';
      default:
        return '';
    }
  };

  const getEmailStatusColor = () => {
    switch (emailStatus) {
      case 'checking':
        return 'text-blue-600';
      case 'available':
        return 'text-green-600';
      case 'taken':
        return 'text-red-600';
      case 'invalid':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {error && (
        <Snackbar
          message={error}
          variant="error"
          onClose={() => setError(null)}
        />
      )}
      {success && (
        <Snackbar
          message={success}
          variant="success"
          onClose={() => setSuccess(null)}
        />
      )}
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={emailStatus === 'taken' || emailStatus === 'invalid' ? 'border-red-500' : emailStatus === 'available' ? 'border-green-500' : ''}
              />
              {emailStatus !== 'idle' && (
                <p className={`mt-1 text-sm ${getEmailStatusColor()}`}>
                  {getEmailStatusMessage()}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <ReCaptcha
            siteKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'your_recaptcha_site_key_here'}
            onVerify={handleRecaptchaVerify}
            className="mt-4"
          />

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={emailStatus === 'taken' || emailStatus === 'checking' || emailStatus === 'invalid' || !recaptchaToken}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Sign up with Google (Coming Soon)
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
 
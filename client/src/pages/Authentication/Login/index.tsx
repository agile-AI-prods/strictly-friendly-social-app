import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Form } from 'antd';
import { Eye, EyeOff } from 'lucide-react';
import { useAppDispatch } from '../../../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../../../store/slices/authSlice';
import { login as loginApi } from '../../../api/authApi';
import { ReCaptcha } from '../../../components/ReCaptcha';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Get the page user was trying to access before login
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    // e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!recaptchaToken) {
      console.error('Please complete the reCAPTCHA');
      return;
    }

    setIsLoading(true);
    try {
      dispatch(loginStart());
      const res = await loginApi(email, password, recaptchaToken);
      console.log('Login response:', res.data);
      
      if (res.data && res.data.user) {
        console.log('User data received:', res.data.user);
        console.log('User ID:', res.data.user.id);
        
        // Ensure user object has required fields
        if (!res.data.user.id) {
          console.error('User ID is missing from response');
          setError('Invalid user data received');
          dispatch(loginFailure('Invalid user data received'));
          return;
        }
        
        dispatch(loginSuccess(res.data.user));
        console.log('User dispatched to Redux store');
        
        // Navigate to the page they were trying to access, or discover
        navigate(from, { replace: true });
      } else if (res.data && res.data.user === null) {
        // Profile not found, but user is authenticated
        // Create basic user object and redirect to onboarding
        const basicUser = {
          id: '', // Will be set by getMe() call
          email: email,
          name: email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        dispatch(loginSuccess(basicUser));
        navigate('/onboarding', { replace: true });
      } else {
        dispatch(loginFailure('Profile not found'));
        setError('Profile not found');
        navigate('/auth/callback');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err.message || 'Failed to sign in';
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecaptchaVerify = (token: string | null) => {
    setRecaptchaToken(token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          className="mt-8 space-y-6"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              size="large"
              placeholder="Email address"
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Password"
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              iconRender={(visible) => (visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
            />
          </Form.Item>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <ReCaptcha
            siteKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'your_recaptcha_site_key_here'}
            onVerify={handleRecaptchaVerify}
            className="mt-4"
          />

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isLoading}
              disabled={!recaptchaToken}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Form.Item>

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
                type="default"
                size="large"
                disabled
                className="w-full"
                icon={
                  <img
                    className="h-5 w-5 mr-2"
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google logo"
                  />
                }
              >
                Sign in with Google
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;

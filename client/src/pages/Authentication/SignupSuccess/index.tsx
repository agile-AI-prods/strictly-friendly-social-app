import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/Button';

export const SignupSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent you a verification link to your email address. Please verify your email to continue.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-800">What's next?</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-2">
              <li>1. Open your email inbox</li>
              <li>2. Click the verification link in the email</li>
              <li>3. Complete your profile setup</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-4">
            <Link to="/login" className="w-full">
              <Button
                variant="outline"
                className="w-full"
              >
                Back to Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 
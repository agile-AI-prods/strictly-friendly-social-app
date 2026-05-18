import  { Loader } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingIndicator = ({ 
  message = 'Loading...', 
  fullScreen = false 
}: LoadingIndicatorProps) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-2 text-gray-700">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Loader className="w-5 h-5 animate-spin text-primary-600 mr-2" />
      <span className="text-gray-700 text-sm">{message}</span>
    </div>
  );
};
 
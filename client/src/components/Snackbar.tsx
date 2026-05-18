import { useEffect } from 'react';
import { X } from 'lucide-react';

interface SnackbarProps {
  message: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export const Snackbar = ({
  message,
  variant = 'info',
  onClose,
  duration = 5000
}: SnackbarProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variants = {
    success: 'bg-green-50 border-green-400 text-green-700',
    error: 'bg-red-50 border-red-400 text-red-700',
    info: 'bg-blue-50 border-blue-400 text-blue-700',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-700'
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`rounded-lg border-l-4 p-4 shadow-lg ${variants[variant]}`}>
        <div className="flex items-center">
          <div className="flex-1">{message}</div>
          <button
            onClick={onClose}
            className="ml-4 text-current hover:opacity-75 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}; 
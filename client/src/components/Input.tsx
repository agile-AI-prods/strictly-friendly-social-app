import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    const baseStyles = 'block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm';
    const errorStyles = error
      ? 'border-red-300 text-red-900 placeholder-red-300'
      : 'border-gray-300';

    return (
      <div>
        <input
          ref={ref}
          className={`${baseStyles} ${errorStyles} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600" id={`${props.id}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
); 
import { ChangeEvent } from 'react';

interface Option {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  error?: string;
}

export const RadioGroup = ({
  options,
  value,
  onChange,
  name = 'radio-group',
  error
}: RadioGroupProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 ${
                error ? 'border-red-300' : ''
              }`}
            />
            <label
              htmlFor={`${name}-${option.value}`}
              className="ml-3 block text-sm font-medium text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}; 
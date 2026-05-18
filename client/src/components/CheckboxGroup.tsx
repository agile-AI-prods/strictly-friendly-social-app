import { ChangeEvent } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  name?: string;
  error?: string;
}

export const CheckboxGroup = ({
  options,
  value,
  onChange,
  name = 'checkbox-group',
  error
}: CheckboxGroupProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newValues = e.target.checked
      ? [...value, newValue]
      : value.filter((v) => v !== newValue);

    onChange(newValues);
  };

  return (
    <div>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="checkbox"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={handleChange}
              className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${
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
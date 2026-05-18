import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
}

export const Dropdown = ({ options, value, onChange, placeholder, className = '' }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-2 border rounded-lg text-sm cursor-pointer ${getFontSizeClassForElement('text-sm')} ${
          effectiveTheme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        }`}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''} ${
          effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
        }`} />
      </button>

      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${
          effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm ${getFontSizeClassForElement('text-sm')} ${
                option.value === value 
                  ? effectiveTheme === 'dark'
                    ? `bg-${currentColor.primary} text-white`
                    : `bg-${currentColor.light} text-${currentColor.text}`
                  : effectiveTheme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 
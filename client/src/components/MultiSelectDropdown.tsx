import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelectDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options',
  className = ''
}: MultiSelectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { effectiveTheme, currentColor, getFontSizeClassForElement } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const removeOption = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  const filteredOptions = searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

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
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(option => (
              <span
                key={option.value}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getFontSizeClassForElement('text-xs')} ${
                  effectiveTheme === 'dark'
                    ? `bg-${currentColor.primary} text-white`
                    : `bg-${currentColor.light} text-${currentColor.text}`
                }`}
              >
                {option.label}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(option.value);
                  }}
                  className={`hover:opacity-80 cursor-pointer ${
                    effectiveTheme === 'dark' ? 'hover:text-gray-200' : 'hover:text-gray-800'
                  }`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          ) : (
            <span className={effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''} ${
          effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
        }`} />
      </button>

      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${
          effectiveTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <div className="p-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-4 w-4 ${
                  effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                }`} />
              </div>
              <input
                type="text"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${currentColor.primary} text-sm ${getFontSizeClassForElement('text-sm')} ${
                  effectiveTheme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Search interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={`w-full text-left px-4 py-2 flex items-center ${getFontSizeClassForElement('text-sm')} ${
                  selectedValues.includes(option.value)
                    ? effectiveTheme === 'dark'
                      ? `text-white bg-${currentColor.primary}`
                      : `text-${currentColor.text} bg-${currentColor.light}`
                    : effectiveTheme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-600 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Plus className={`h-4 w-4 mr-2 ${
                  effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getUserSettings } from '../api/settingsApi';

interface ThemeSettings {
  theme: 'light' | 'dark';
  autoTheme: boolean;
  primaryColor: string;
  fontSize: string;
}

interface ThemeContextType {
  themeSettings: ThemeSettings;
  setThemeSettings: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  effectiveTheme: 'light' | 'dark';
  currentColor: {
    primary: string;
    hover: string;
    light: string;
    text: string;
  };
  getFontSizeClassForElement: (baseClass: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const colorMap = {
  orange: {
    primary: 'orange-500',
    hover: 'orange-600',
    light: 'orange-100',
    text: 'orange-600'
  },
  blue: {
    primary: 'blue-500',
    hover: 'blue-600',
    light: 'blue-100',
    text: 'blue-600'
  },
  green: {
    primary: 'green-500',
    hover: 'green-600',
    light: 'green-100',
    text: 'green-600'
  },
  purple: {
    primary: 'purple-500',
    hover: 'purple-600',
    light: 'purple-100',
    text: 'purple-600'
  },
  red: {
    primary: 'red-500',
    hover: 'red-600',
    light: 'red-100',
    text: 'red-600'
  },
  pink: {
    primary: 'pink-500',
    hover: 'pink-600',
    light: 'pink-100',
    text: 'pink-600'
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    theme: 'light',
    autoTheme: false,
    primaryColor: 'orange',
    fontSize: 'medium'
  });

  // Function to detect system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Function to get the effective theme (system theme if auto is enabled, otherwise selected theme)
  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (themeSettings.autoTheme) {
      return getSystemTheme();
    }
    return themeSettings.theme;
  };

  const effectiveTheme = getEffectiveTheme();
  
  // Add safety check for currentColor
  const currentColor = colorMap[themeSettings.primaryColor as keyof typeof colorMap] || colorMap.orange;

  const getFontSizeClassForElement = (baseClass: string) => {
    const baseSize = baseClass.includes('text-') ? baseClass.split('text-')[1] : 'base';
    const fontSizeMap: { [key: string]: { [key: string]: string } } = {
      small: {
        'xs': 'text-xs',
        'sm': 'text-xs',
        'base': 'text-sm',
        'lg': 'text-base',
        'xl': 'text-lg',
        '2xl': 'text-xl',
        '3xl': 'text-2xl'
      },
      medium: {
        'xs': 'text-xs',
        'sm': 'text-sm',
        'base': 'text-base',
        'lg': 'text-lg',
        'xl': 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl'
      },
      large: {
        'xs': 'text-sm',
        'sm': 'text-base',
        'base': 'text-lg',
        'lg': 'text-xl',
        'xl': 'text-2xl',
        '2xl': 'text-3xl',
        '3xl': 'text-4xl'
      },
      'extra-large': {
        'xs': 'text-base',
        'sm': 'text-lg',
        'base': 'text-xl',
        'lg': 'text-2xl',
        'xl': 'text-3xl',
        '2xl': 'text-4xl',
        '3xl': 'text-5xl'
      }
    };
    
    return fontSizeMap[themeSettings.fontSize]?.[baseSize] || baseClass;
  };

  // Set CSS custom properties for theming
  useEffect(() => {
    const root = document.documentElement;
    
    // Add debugging logs
    console.log('ThemeContext: themeSettings', themeSettings);
    console.log('ThemeContext: currentColor', currentColor);
    console.log('ThemeContext: effectiveTheme', effectiveTheme);
    
    // Add safety check
    if (!currentColor || !currentColor.primary) {
      console.error('ThemeContext: currentColor is undefined or missing primary property');
      return;
    }
    
    const colorName = currentColor.primary;
    
    // Convert Tailwind color name to hex value
    const colorMap: { [key: string]: string } = {
      'orange-500': '#f97316',
      'blue-500': '#3b82f6',
      'green-500': '#22c55e',
      'purple-500': '#a855f7',
      'red-500': '#ef4444',
      'pink-500': '#ec4899'
    };
    
    const hexColor = colorMap[colorName] || '#f97316'; // default to orange
    root.style.setProperty('--primary-color', hexColor);
    
    // Set toggle background based on theme
    const toggleBg = effectiveTheme === 'dark' ? '#374151' : '#f0f0f0'; // gray-700 for dark, light gray for light
    root.style.setProperty('--toggle-bg', toggleBg);
    
    // Set root background color based on theme
    if (effectiveTheme === 'dark') {
      root.classList.add('bg-gray-950');
      root.classList.remove('bg-white');
    } else {
      root.classList.add('bg-white');
      root.classList.remove('bg-gray-950');
    }
    
  }, [currentColor.primary, effectiveTheme]);

  // Load user theme settings when user is available
  useEffect(() => {
    const loadUserThemeSettings = async () => {
      if (!user?.email) {
        console.log('ThemeContext: No user email available');
        return;
      }

      const currentEmail = user.email; // Capture email to check for race condition

      try {
        console.log('ThemeContext: Loading settings for email:', currentEmail);
        const userSettings = await getUserSettings(currentEmail);

        // Check if email changed during async operation
        if (user?.email !== currentEmail) {
          console.log('ThemeContext: Email changed during async operation');
          return;
        }

        console.log('ThemeContext: Received userSettings:', userSettings);

        if (userSettings && userSettings.data && userSettings.data.theme_settings) {
          console.log('ThemeContext: Setting themeSettings from data.theme_settings');
          setThemeSettings(userSettings.data.theme_settings);
        } else if (userSettings && userSettings.theme_settings) {
          // Fallback for different response structure
          console.log('ThemeContext: Setting themeSettings from theme_settings');
          setThemeSettings(userSettings.theme_settings);
        } else {
          console.log('ThemeContext: No theme settings found, using defaults');
        }
      } catch (error: any) {
        // Check if email changed during async operation
        if (user?.email !== currentEmail) {
          console.log('ThemeContext: Email changed during async operation (error case)');
          return;
        }

        if (error.response?.status !== 404) {
          console.error('ThemeContext: Failed to load user theme settings:', error);
        } else {
          console.log('ThemeContext: Settings not found (404), using defaults');
        }
        // If 404, user doesn't have settings yet, so use defaults (handled by controller now)
      }
    };

    loadUserThemeSettings();
  }, [user?.email]);

  // Watch for system theme changes when auto theme is enabled
  useEffect(() => {
    if (!themeSettings.autoTheme) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e: MediaQueryListEvent) => {
      // Force re-render when system theme changes
      setThemeSettings(prev => ({ ...prev }));
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [themeSettings.autoTheme]);

  return (
    <ThemeContext.Provider value={{
      themeSettings,
      setThemeSettings,
      effectiveTheme,
      currentColor,
      getFontSizeClassForElement
    }}>
      {children}
    </ThemeContext.Provider>
  );
}; 
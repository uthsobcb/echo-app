import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  borderSecondary: string;
}

const lightColors: ThemeColors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF1FF',
  text: '#1A1D2E',
  textSecondary: '#7A8499',
  primary: '#4F6BFF',
  border: '#E5E8F0',
  borderSecondary: '#F0F2F8',
};

const darkColors: ThemeColors = {
  background: '#0F1117',
  surface: '#1A1D2E',
  surfaceSecondary: '#252936',
  text: '#FFFFFF',
  textSecondary: '#B0BAD0',
  primary: '#4F6BFF',
  border: '#2D3242',
  borderSecondary: '#252936',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'darkMode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsDark(stored === 'true');
        } else {
          setIsDark(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme', error);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleDarkMode = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newValue.toString());
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  const setDarkMode = async (value: boolean) => {
    setIsDark(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, value.toString());
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
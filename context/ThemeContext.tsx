import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { logger } from '../service/logger';

export interface ThemeColors {
  background: string;
  backgroundGradient: readonly [string, string, string];
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  border: string;
  borderSecondary: string;
  echoCloud: string;
}

const lightColors: ThemeColors = {
  background: '#EEF6FF',
  backgroundGradient: ['#DFF0FF', '#EEF6FF', '#F6FAFF'],
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F7FF',
  text: '#1A2A4A',
  textSecondary: '#6B8CAE',
  primary: '#5B9BF8',
  accent: '#FFB347',
  border: '#C8DFF5',
  borderSecondary: '#E0EFFF',
  echoCloud: '#D6EAFF',
};

const darkColors: ThemeColors = {
  background: '#0A0E1A',
  backgroundGradient: ['#060912', '#0A0E1A', '#0D1222'],
  surface: '#131929',
  surfaceSecondary: '#1C2540',
  text: '#E8F0FF',
  textSecondary: '#7A94C0',
  primary: '#7EB8FF',
  accent: '#C084FC',
  border: '#2A3A5C',
  borderSecondary: '#1C2540',
  echoCloud: '#1E2D50',
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
        logger.error('Failed to load theme', error);
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
      logger.error('Failed to save theme', error);
    }
  };

  const setDarkMode = async (value: boolean) => {
    setIsDark(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, value.toString());
    } catch (error) {
      logger.error('Failed to save theme', error);
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
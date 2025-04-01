import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark' | 'system';

export const useColorScheme = (): 'light' | 'dark' => {
  const deviceColorScheme = useDeviceColorScheme() as 'light' | 'dark';
  const [colorScheme, setColorScheme] = useState<ColorScheme>('system');
  const [effectiveColorScheme, setEffectiveColorScheme] = useState<'light' | 'dark'>(deviceColorScheme || 'light');

  // Load saved preference on mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setColorScheme(savedTheme as ColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    
    loadSavedTheme();
  }, []);

  // Update effective color scheme when theme preference or device scheme changes
  useEffect(() => {
    if (colorScheme === 'system') {
      setEffectiveColorScheme(deviceColorScheme || 'light');
    } else {
      setEffectiveColorScheme(colorScheme);
    }
  }, [colorScheme, deviceColorScheme]);

  return effectiveColorScheme;
};

// Function to set theme preference
export const setThemePreference = async (theme: ColorScheme): Promise<void> => {
  try {
    await AsyncStorage.setItem('theme', theme);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
};

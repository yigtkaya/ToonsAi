import { useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useColorScheme(): ColorSchemeName {
  const systemColorScheme = _useColorScheme();
  const [userTheme, setUserTheme] = useState<ColorSchemeName>(systemColorScheme);
  
  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const themePreference = await AsyncStorage.getItem('themePreference');
        
        if (themePreference === 'light' || themePreference === 'dark') {
          setUserTheme(themePreference);
        } else {
          // If 'system' or not set, use system theme
          setUserTheme(systemColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setUserTheme(systemColorScheme); // Fallback to system theme
      }
    };
    
    loadThemePreference();
    
    // Set up a listener for AsyncStorage changes (simplified approach)
    const checkForThemeChanges = setInterval(async () => {
      try {
        const themePreference = await AsyncStorage.getItem('themePreference');
        
        if (themePreference === 'light' || themePreference === 'dark') {
          setUserTheme(themePreference);
        } else if (themePreference === 'system') {
          setUserTheme(systemColorScheme);
        }
      } catch (error) {
        console.error('Error checking theme changes:', error);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(checkForThemeChanges);
  }, [systemColorScheme]);
  
  return userTheme;
}

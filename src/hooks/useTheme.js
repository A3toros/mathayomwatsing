import { useContext } from 'react';
import ThemeContext from '../contexts/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  // If context is not available (e.g., in teacher components), return default values
  if (!context) {
    return {
      theme: 'light',
      setTheme: () => {},
      isCyberpunk: false,
      isLight: true,
      isKpop: false,
      themeClasses: {},
    };
  }
  return context;
};



import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('wb-tracks-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    // Listen for theme changes from other components
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail.theme;
      setTheme(newTheme);
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('wb-tracks-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: newTheme } 
    }));
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };
}
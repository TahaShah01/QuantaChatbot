'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { ThemeMode } from '@/lib/types';
import { loadTheme, saveTheme } from '@/lib/storage';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = loadTheme();
    setThemeState(saved);
    setMounted(true);
  }, []);

  const updateResolved = useCallback((mode: ThemeMode) => {
    const resolved = mode === 'system' ? getSystemTheme() : mode;
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    updateResolved(theme);

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateResolved('system');
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [theme, mounted, updateResolved]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    saveTheme(mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

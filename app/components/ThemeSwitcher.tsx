'use client';

import React from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/lib/types';

interface ThemeSwitcherProps {
  compact?: boolean;
}

const OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'Auto',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    ),
  },
];

export default function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center p-0.5 rounded-xl border border-border bg-surface-alt/70 backdrop-blur-md',
        compact ? 'gap-0.5' : 'gap-1'
      )}
    >
      {OPTIONS.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'relative flex items-center justify-center rounded-lg transition-all duration-200 text-xs font-medium',
              compact ? 'p-1.5' : 'px-2.5 py-1.5 gap-1.5',
              isActive
                ? 'bg-surface text-foreground shadow-sm shadow-black/10 border border-border-glow'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover/60'
            )}
            title={`Switch to ${opt.label} mode`}
          >
            {opt.icon}
            {!compact && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

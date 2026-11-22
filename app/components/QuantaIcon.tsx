'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface QuantaIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export default function QuantaIcon({ size = 'md', className, glow = true }: QuantaIconProps) {
  const dimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const svgSize = {
    sm: 14,
    md: 18,
    lg: 26,
    xl: 36,
  }[size];

  return (
    <div className={cn('relative flex items-center justify-center shrink-0', dimensions, className)}>
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600/35 to-purple-400/25 blur-md animate-pulse-halo"
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'relative w-full h-full rounded-xl flex items-center justify-center',
          'bg-gradient-to-b from-[#241f36] to-[#12101b]',
          'border border-violet-500/30 shadow-inner shadow-violet-400/10'
        )}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
            stroke="url(#quanta-grad)"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M16 2V16M28 9L16 16M4 9L16 16M16 16V30M16 16L28 23M16 16L4 23"
            stroke="url(#quanta-inner-grad)"
            strokeWidth="1.25"
            strokeLinejoin="round"
            strokeOpacity="0.75"
          />
          <circle cx="16" cy="16" r="3" fill="#c084fc" className="animate-pulse" />
          <defs>
            <linearGradient id="quanta-grad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c084fc" />
              <stop offset="0.5" stopColor="#8b5cf6" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="quanta-inner-grad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e9d5ff" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

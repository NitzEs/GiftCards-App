'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-indigo-500 text-white hover:bg-indigo-400 focus:ring-indigo-500 shadow-lg shadow-indigo-500/20',
    secondary: 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 focus:ring-zinc-500 border border-white/5',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 focus:ring-red-500 border border-red-500/20',
    ghost: 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 focus:ring-zinc-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button disabled={disabled || loading} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading && (
        <div className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
      )}
      {children}
    </button>
  );
}

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  error,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </label>
      </div>

      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 text-sm font-medium transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)] pr-11 ${
            error
              ? 'border-[var(--semantic-danger-border)] focus:border-[var(--semantic-danger-text)]'
              : 'border-[var(--border-subtle)] focus:border-[var(--accent-primary)]'
          } ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] cursor-pointer"
          aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <p className="text-xs font-bold text-[var(--semantic-danger-text)] pt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

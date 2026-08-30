import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PasswordField } from './PasswordField';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, setAuthView, setPendingEmailForVerification } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedNotice, setUnverifiedNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedNotice(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    const result = await login({ email, password });
    setIsLoading(false);

    if (!result.success) {
      if (result.requiresVerification) {
        setUnverifiedNotice(result.error || 'Please verify your email before logging in.');
        setPendingEmailForVerification(email);
      } else {
        setError(result.error || 'Email or password is incorrect.');
      }
    }
  };

  const handleFillDemoUser = () => {
    setEmail('demo@sightline.local');
    setPassword('SightlineDemo2026!');
    setError(null);
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary-light)] text-[var(--accent-primary)] text-xs font-extrabold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SIGHTLINE Account</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] font-sans">
          Welcome back.
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Sign in to access your personal document history and synchronized accessibility preferences.
        </p>
      </div>

      {/* Demo Credentials Pill */}
      <div className="p-3.5 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <span className="font-extrabold text-[var(--text-main)] block">Quick Demo Account:</span>
          <span className="font-mono text-[var(--text-muted)]">demo@sightline.local</span>
        </div>
        <button
          type="button"
          onClick={handleFillDemoUser}
          className="px-3 py-1.5 rounded-xl font-bold bg-[var(--bg-surface)] text-[var(--accent-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all cursor-pointer"
        >
          Auto-fill
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[var(--semantic-danger-bg)] border border-[var(--semantic-danger-border)] text-[var(--semantic-danger-text)] text-xs sm:text-sm font-semibold flex items-start gap-2.5" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {unverifiedNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm space-y-2" role="alert">
          <p className="font-bold">{unverifiedNotice}</p>
          <button
            type="button"
            onClick={() => setAuthView('verify-email')}
            className="text-xs font-extrabold text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Go to verification screen →
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm font-medium transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]"
          />
        </div>

        {/* Password Field */}
        <PasswordField
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          required
        />

        {/* Controls: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-[var(--accent-primary)] focus:ring-[var(--focus-ring)]"
            />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => setAuthView('forgot-password')}
            className="font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[var(--text-main)] text-[var(--bg-base)] hover:opacity-90 font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="text-center pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
        Don&apos;t have an account yet?{' '}
        <button
          type="button"
          onClick={() => setAuthView('signup')}
          className="font-extrabold text-[var(--accent-primary)] hover:underline cursor-pointer ml-1"
        >
          Create one now →
        </button>
      </div>
    </div>
  );
};

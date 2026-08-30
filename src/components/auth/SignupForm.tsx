import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PasswordField } from './PasswordField';
import { PasswordStrength } from './PasswordStrength';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const SignupForm: React.FC = () => {
  const { signup, setAuthView } = useAuth();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    const result = await signup({
      name,
      displayName: displayName || name.split(' ')[0],
      email,
      password,
      confirmPassword,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to create account.');
    } else {
      setAuthView('verify-email');
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-primary-light)] text-[var(--accent-primary)] text-xs font-extrabold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Account</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] font-sans">
          Create your account.
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Create your SIGHTLINE account to keep your accessible documents and preferences connected to you.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[var(--semantic-danger-bg)] border border-[var(--semantic-danger-border)] text-[var(--semantic-danger-text)] text-xs sm:text-sm font-semibold flex items-start gap-2.5" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name & Display Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Full Name *
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm font-medium transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-display-name" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Display Name (Optional)
            </label>
            <input
              id="signup-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm font-medium transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Email Address *
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm font-medium transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <PasswordField
            id="signup-password"
            label="Password *"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
          />
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <PasswordField
          id="signup-confirm-password"
          label="Confirm Password *"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          required
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setAuthView('login')}
          className="font-extrabold text-[var(--accent-primary)] hover:underline cursor-pointer ml-1"
        >
          Sign in here →
        </button>
      </div>
    </div>
  );
};

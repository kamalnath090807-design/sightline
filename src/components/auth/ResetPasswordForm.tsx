import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PasswordField } from './PasswordField';
import { PasswordStrength } from './PasswordStrength';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ResetPasswordForm: React.FC = () => {
  const { resetPassword, pendingResetToken, pendingEmailForVerification, setAuthView } = useAuth();

  const [token, setToken] = useState(pendingResetToken || '');
  const [email, setEmail] = useState(pendingEmailForVerification || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Reset token is required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    const result = await resetPassword({
      token,
      email: email || undefined,
      newPassword,
      confirmPassword,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to update password. Token may be invalid or expired.');
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center animate-fadeIn py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-300">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-[var(--text-main)] font-sans">
            Password updated!
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
            Your SIGHTLINE password has been securely changed. You can now sign in with your new credentials.
          </p>
        </div>

        <button
          onClick={() => setAuthView('login')}
          className="w-full h-12 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Proceed to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] font-sans">
          Choose a new password.
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Ensure your new password contains at least 8 characters, uppercase, lowercase, and a number.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[var(--semantic-danger-bg)] border border-[var(--semantic-danger-border)] text-[var(--semantic-danger-text)] text-xs sm:text-sm font-semibold flex items-start gap-2.5" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Token field */}
        <div className="space-y-1.5">
          <label htmlFor="reset-token" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Reset Security Token
          </label>
          <input
            id="reset-token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your reset token"
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm font-mono transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]"
          />
        </div>

        {/* Email confirmation if needed */}
        <div className="space-y-1.5">
          <label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Account Email (Optional)
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm font-medium transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]"
          />
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <PasswordField
            id="reset-new-password"
            label="New Password *"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Create a strong password"
            required
          />
          <PasswordStrength password={newPassword} />
        </div>

        {/* Confirm Password */}
        <PasswordField
          id="reset-confirm-password"
          label="Confirm New Password *"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your new password"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <span>Update Password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword, setAuthView, setPendingResetToken, setPendingEmailForVerification } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; demoResetToken?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await forgotPassword(email);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to process request.');
    } else {
      setSuccessInfo({
        message: result.data?.message || 'If an eligible account exists, instructions have been dispatched.',
        demoResetToken: result.data?.demoResetToken,
      });
      if (result.data?.demoResetToken) {
        setPendingResetToken(result.data.demoResetToken);
        setPendingEmailForVerification(email);
      }
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center justify-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] font-sans">
          Reset password.
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Enter your email and we&apos;ll send instructions if an account is eligible.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[var(--semantic-danger-bg)] border border-[var(--semantic-danger-border)] text-[var(--semantic-danger-text)] text-xs sm:text-sm font-semibold flex items-start gap-2.5" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successInfo ? (
        <div className="space-y-4 p-5 rounded-2xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Instructions Dispatched</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {successInfo.message}
          </p>

          {/* Development 1-Click Reset Helper */}
          {successInfo.demoResetToken && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2">
              <span className="font-bold text-blue-950 block">Development Quick Link:</span>
              <button
                type="button"
                onClick={() => setAuthView('reset-password')}
                className="w-full py-2 px-3 rounded-lg bg-[var(--accent-primary)] text-white font-bold text-xs hover:bg-[var(--accent-primary-hover)] transition-all cursor-pointer"
              >
                Proceed to Reset Password Form →
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAuthView('login')}
            className="w-full py-2.5 rounded-xl bg-[var(--text-main)] text-[var(--bg-base)] text-xs font-bold transition-all cursor-pointer"
          >
            Return to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Email Address
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm font-medium transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Send instructions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
        Remembered your password?{' '}
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

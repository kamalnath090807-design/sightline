import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, CheckCircle2, ArrowRight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export const VerifyEmailView: React.FC = () => {
  const {
    verifyEmail,
    resendVerification,
    pendingEmailForVerification,
    setAuthView,
  } = useAuth();

  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-detect token from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || params.get('verifyToken');
    const emailParam = params.get('email');

    if (tokenParam) {
      setTokenInput(tokenParam);
      handleExecuteVerify(tokenParam, emailParam || pendingEmailForVerification || undefined);
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleExecuteVerify = async (tokenToUse: string, emailToUse?: string) => {
    setError(null);
    setIsVerifying(true);

    const result = await verifyEmail(tokenToUse, emailToUse);
    setIsVerifying(false);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || 'Verification failed. Token may be expired or invalid.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please enter a verification token.');
      return;
    }
    handleExecuteVerify(tokenInput.trim(), pendingEmailForVerification || undefined);
  };

  const handleResend = async () => {
    if (!pendingEmailForVerification) {
      setError('Email address not specified for resend. Please sign in or register again.');
      return;
    }
    setError(null);
    setResendStatus('Sending verification link...');
    setResendCooldown(30);

    const result = await resendVerification(pendingEmailForVerification);
    if (result.success) {
      setResendStatus('Verification link dispatched.');
    } else {
      setResendStatus(null);
      setError(result.error || 'Failed to resend verification.');
    }
  };

  // Mask email for privacy (e.g. j***@example.com)
  const maskEmail = (emailStr: string | null) => {
    if (!emailStr) return 'your registered email';
    const parts = emailStr.split('@');
    if (parts.length < 2) return emailStr;
    const name = parts[0];
    const masked = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${masked}@${parts[1]}`;
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center animate-fadeIn py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-300">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-[var(--text-main)] font-sans">
            Email verified successfully!
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
            Your SIGHTLINE account is now fully active. You can access your personalized document and medicine assistant.
          </p>
        </div>

        <button
          onClick={() => setAuthView('none')}
          className="w-full h-12 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Continue to SIGHTLINE</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary-light)] text-[var(--accent-primary)] flex items-center justify-center">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] font-sans">
          Check your email.
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          We sent a verification link to{' '}
          <strong className="text-[var(--text-main)] font-mono">{maskEmail(pendingEmailForVerification)}</strong>.
        </p>
      </div>

      {/* Development Mode Simulation Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/90 border-2 border-blue-200 text-blue-950 space-y-2 text-xs">
        <div className="flex items-center justify-between font-extrabold text-blue-900 uppercase tracking-wide">
          <span>Development / Demo Mode</span>
          <span className="bg-blue-200 px-2 py-0.5 rounded-full text-[10px]">Simulated Email</span>
        </div>
        <p className="text-blue-900 leading-relaxed">
          In this local competition environment, email dispatch is simulated securely on the server.
        </p>
        <button
          type="button"
          onClick={() => handleExecuteVerify('auto-demo-verify', pendingEmailForVerification || undefined)}
          disabled={isVerifying}
          className="w-full py-2.5 px-3 rounded-xl bg-[var(--accent-primary)] text-white font-bold hover:bg-[var(--accent-primary-hover)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          {isVerifying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          <span>Click to Verify Account (1-Click Demo)</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[var(--semantic-danger-bg)] border border-[var(--semantic-danger-border)] text-[var(--semantic-danger-text)] text-xs sm:text-sm font-semibold flex items-start gap-2.5" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {resendStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold" role="status">
          {resendStatus}
        </div>
      )}

      {/* Manual Token Entry Form */}
      <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
        <div className="space-y-1.5">
          <label htmlFor="verify-token-input" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Or Paste Verification Token / Code
          </label>
          <input
            id="verify-token-input"
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="e.g. a4f91b7d..."
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] focus:border-[var(--accent-primary)] text-sm font-mono transition-all focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]"
          />
        </div>

        <button
          type="submit"
          disabled={isVerifying || !tokenInput.trim()}
          className="w-full h-11 rounded-xl bg-[var(--text-main)] text-[var(--bg-base)] hover:opacity-90 font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying token...</span>
            </>
          ) : (
            <>
              <span>Verify Token</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Resend & Navigation Actions */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend email'}</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthView('login')}
          className="font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};

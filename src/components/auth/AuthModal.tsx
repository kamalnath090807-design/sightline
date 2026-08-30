import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { VerifyEmailView } from './VerifyEmailView';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { AccountView } from './AccountView';
import { X } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authView, setAuthView } = useAuth();
  const { contrastMode } = useAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);

  const isHighContrast = contrastMode === 'high-contrast';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authView !== 'none') {
        setAuthView('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authView]);

  if (authView === 'none') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setAuthView('none');
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl transition-all my-8 ${
          isHighContrast
            ? 'bg-white border-2 border-black text-black'
            : 'bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] text-[var(--text-main)] shadow-[0_20px_50px_rgba(2,82,205,0.12)]'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setAuthView('none')}
          className={`absolute right-5 top-5 p-2 rounded-xl transition-all cursor-pointer ${
            isHighContrast
              ? 'text-black hover:bg-neutral-100 border border-black'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
          }`}
          aria-label="Close authentication window"
        >
          <X className="w-4 h-4" />
        </button>

        {/* View Switcher */}
        {authView === 'login' && <LoginForm />}
        {authView === 'signup' && <SignupForm />}
        {authView === 'verify-email' && <VerifyEmailView />}
        {authView === 'forgot-password' && <ForgotPasswordForm />}
        {authView === 'reset-password' && <ResetPasswordForm />}
        {authView === 'account' && <AccountView />}
      </div>
    </div>
  );
};

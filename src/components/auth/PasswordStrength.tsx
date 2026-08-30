import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteria = [
    { label: '8+ characters', met: hasMinLength },
    { label: 'Uppercase letter', met: hasUpper },
    { label: 'Lowercase letter', met: hasLower },
    { label: 'Number (0-9)', met: hasNumber },
    { label: 'Special character', met: hasSpecial },
  ];

  const score = criteria.filter(c => c.met).length;

  let strengthLabel = 'Weak';
  let barColor = 'bg-rose-500';
  let width = '20%';

  if (score >= 5) {
    strengthLabel = 'Strong';
    barColor = 'bg-emerald-600';
    width = '100%';
  } else if (score >= 4) {
    strengthLabel = 'Good';
    barColor = 'bg-teal-600';
    width = '80%';
  } else if (score >= 3) {
    strengthLabel = 'Fair';
    barColor = 'bg-amber-500';
    width = '60%';
  } else if (score >= 2) {
    strengthLabel = 'Weak';
    barColor = 'bg-rose-400';
    width = '40%';
  }

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1.5" aria-live="polite">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
        <span>Password Strength:</span>
        <span className="font-extrabold text-[var(--text-main)]">{strengthLabel}</span>
      </div>

      <div className="h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 rounded-full`}
          style={{ width }}
        />
      </div>

      {/* Accessible Criteria List */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[var(--text-muted)] pt-1">
        {criteria.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {c.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-[var(--text-subtle)] opacity-40 shrink-0" />
            )}
            <span className={c.met ? 'text-[var(--text-main)] font-semibold' : 'text-[var(--text-subtle)]'}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

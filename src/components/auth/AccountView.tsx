import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  User,
  ShieldCheck,
  LogOut,
  Sliders,
  FileText,
  Pill,
  Clock,
} from 'lucide-react';

export const AccountView: React.FC = () => {
  const { user, logout, userHistory, setAuthView } = useAuth();
  const { textSize, contrastMode, voiceEnabled, setActiveTab } = useAccessibility();

  if (!user) {
    return (
      <div className="space-y-4 text-center py-6">
        <p className="text-sm text-[var(--text-muted)]">No active session found.</p>
        <button
          onClick={() => setAuthView('login')}
          className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-xs"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header Profile Section */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-[var(--accent-primary-light)] text-[var(--accent-primary)] font-extrabold text-xl flex items-center justify-center border border-[var(--accent-primary)]/20 shrink-0">
            {user.name[0]?.toUpperCase() || 'U'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-[var(--text-main)] truncate">
                {user.name}
              </h3>
              {user.emailVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[var(--text-muted)] truncate">{user.email}</p>
            <p className="text-[11px] font-mono text-[var(--text-subtle)]">ID: {user.id}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[var(--semantic-danger-bg)] text-[var(--semantic-danger-text)] border border-[var(--semantic-danger-border)] hover:opacity-90 transition-all cursor-pointer shrink-0"
          aria-label="Log out of SIGHTLINE account"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </div>

      {/* Synchronized Preferences Card */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Synced Preferences</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Auto-saved
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-subtle)] font-medium">Contrast Theme</span>
            <span className="font-extrabold text-[var(--text-main)] block capitalize">{contrastMode}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-subtle)] font-medium">Text Scale</span>
            <span className="font-extrabold text-[var(--text-main)] block uppercase">{textSize}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-subtle)] font-medium">Voice Output</span>
            <span className="font-extrabold text-[var(--text-main)] block">{voiceEnabled ? 'Active' : 'Muted'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-subtle)] font-medium">User Status</span>
            <span className="font-extrabold text-emerald-700 block">Authenticated</span>
          </div>
        </div>
      </div>

      {/* User-Isolated Analysis History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Your Document &amp; Medicine History</span>
          </h4>
          <span className="text-xs font-mono text-[var(--text-subtle)] font-semibold">
            {userHistory.length} {userHistory.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {userHistory.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-center space-y-2">
            <User className="w-6 h-6 text-[var(--text-subtle)] mx-auto opacity-50" />
            <p className="text-xs text-[var(--text-muted)]">
              No analysis history recorded yet. Upload a document or medicine label to save accessible summaries to your account.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {userHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-start justify-between gap-3 hover:border-[var(--accent-primary)] transition-all shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'document'
                      ? 'bg-blue-50 text-[var(--accent-primary)]'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {item.type === 'document' ? <FileText className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h5 className="text-xs font-bold text-[var(--text-main)] truncate">{item.title}</h5>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{item.summary}</p>
                    <span className="text-[10px] text-[var(--text-subtle)] font-mono block">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(item.type);
                    setAuthView('none');
                    const el = document.getElementById('analyzer-studio');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-bold text-[var(--accent-primary)] hover:underline shrink-0 p-1 cursor-pointer"
                >
                  Open →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Close Action */}
      <button
        type="button"
        onClick={() => setAuthView('none')}
        className="w-full py-3 rounded-xl bg-[var(--text-main)] text-[var(--bg-base)] font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
      >
        Close Profile
      </button>
    </div>
  );
};

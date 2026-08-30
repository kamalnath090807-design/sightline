import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { Sliders, Volume2, VolumeX, Type, Eye, BookOpen, X, Check, User, LogIn } from 'lucide-react';
import type { TextSize, ContrastMode } from '../types/sightline';

export const Header: React.FC = () => {
  const {
    textSize,
    setTextSize,
    contrastMode,
    setContrastMode,
    voiceEnabled,
    toggleVoice,
    speechRate,
    setSpeechRate,
    setIsHelpModalOpen,
    setActiveTab,
    announce,
  } = useAccessibility();

  const { user, isAuthenticated, setAuthView, updateUserPreferences } = useAuth();

  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isHighContrast = contrastMode === 'high-contrast';

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsA11yOpen(false);
      }
    };
    if (isA11yOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isA11yOpen]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContrastSelect = (mode: ContrastMode) => {
    setContrastMode(mode);
    if (isAuthenticated) {
      updateUserPreferences({ highContrast: mode === 'high-contrast', theme: mode === 'dark' ? 'dark' : 'light' });
    }
  };

  const handleTextSizeSelect = (size: TextSize) => {
    setTextSize(size);
    if (isAuthenticated) {
      updateUserPreferences({ textSize: size });
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full transition-colors ${
      isHighContrast
        ? 'bg-white border-b-2 border-black text-black'
        : 'bg-[var(--bg-base)]/85 backdrop-blur-md border-b border-[var(--border-subtle)] text-[var(--text-main)]'
    }`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-18 flex items-center justify-between gap-6">
        
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)] rounded-lg p-1"
            aria-label="SIGHTLINE Home"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isHighContrast ? 'bg-black' : 'bg-[var(--accent-primary)]'} group-hover:scale-125 transition-transform`} />
            <span className={`font-extrabold tracking-tight text-xl font-sans ${isHighContrast ? 'text-black' : 'text-[var(--text-main)]'}`}>
              SIGHTLINE
            </span>
          </a>
        </div>

        {/* Primary Desktop Navigation Links (Clean Text - No Box Outlines) */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <button
            onClick={() => {
              setActiveTab('document');
              scrollToSection('analyzer-studio');
              announce('Navigated to Document Assistant');
            }}
            className={`transition-colors cursor-pointer ${
              isHighContrast
                ? 'text-black hover:underline focus:ring-2 focus:ring-black rounded p-1'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Documents
          </button>

          <button
            onClick={() => {
              setActiveTab('medicine');
              scrollToSection('analyzer-studio');
              announce('Navigated to Medicine Assistant');
            }}
            className={`transition-colors cursor-pointer ${
              isHighContrast
                ? 'text-black hover:underline focus:ring-2 focus:ring-black rounded p-1'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Medicine
          </button>

          <button
            onClick={() => scrollToSection('how-it-works')}
            className={`transition-colors cursor-pointer ${
              isHighContrast
                ? 'text-black hover:underline focus:ring-2 focus:ring-black rounded p-1'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            How it works
          </button>

          <button
            onClick={() => scrollToSection('storytelling-showcase')}
            className={`transition-colors cursor-pointer ${
              isHighContrast
                ? 'text-black hover:underline focus:ring-2 focus:ring-black rounded p-1'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Story
          </button>
        </nav>

        {/* Right Actions: Auth, Accessibility & Documentation */}
        <div className="flex items-center gap-3 sm:gap-4 relative" ref={popoverRef}>
          
          {/* Documentation Trigger */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className={`hidden lg:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isHighContrast
                ? 'text-black hover:underline p-1.5'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] p-1.5'
            }`}
            aria-label="Open Research & Audit Documentation"
          >
            <BookOpen className="w-4 h-4" />
            <span>Docs</span>
          </button>

          {/* User Account / Sign In Trigger */}
          {isAuthenticated && user ? (
            <button
              onClick={() => setAuthView('account')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-xs ${
                isHighContrast
                  ? 'bg-black text-white border-black'
                  : 'bg-[var(--accent-primary-light)] text-[var(--accent-primary)] border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary-light)]/80'
              }`}
              aria-label={`Signed in as ${user.displayName || user.name}. Open Account`}
            >
              <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white text-[10px] flex items-center justify-center font-extrabold">
                {user.name[0]?.toUpperCase()}
              </div>
              <span className="max-w-[90px] truncate">{user.displayName || user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => setAuthView('login')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-xs ${
                isHighContrast
                  ? 'bg-white text-black border-black hover:bg-neutral-100'
                  : 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
              aria-label="Sign in to SIGHTLINE account"
            >
              <LogIn className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Sign in</span>
            </button>
          )}

          {/* Primary Outlined Accessibility Drawer Button */}
          <button
            onClick={() => {
              setIsA11yOpen(!isA11yOpen);
              announce(isA11yOpen ? 'Closed accessibility settings' : 'Opened accessibility settings popover');
            }}
            aria-expanded={isA11yOpen}
            aria-label="Open accessibility controls: text size, contrast, voice"
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all shadow-xs cursor-pointer ${
              isHighContrast
                ? isA11yOpen
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black hover:bg-neutral-100'
                : isA11yOpen
                ? 'bg-[var(--text-main)] text-[var(--bg-base)] border-[var(--text-main)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
            }`}
          >
            <Sliders className={`w-4 h-4 ${isHighContrast ? 'text-black' : 'text-[var(--accent-primary)]'}`} />
            <span>Accessibility</span>
          </button>

          {/* ACCESSIBILITY CONTROL DRAWER / POPOVER */}
          {isA11yOpen && (
            <div
              role="region"
              aria-label="Accessibility settings"
              className={`absolute right-0 top-14 w-80 sm:w-88 rounded-2xl border-2 shadow-2xl p-5 space-y-5 z-50 animate-fadeIn ${
                isHighContrast
                  ? 'bg-white border-2 border-black text-black'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-main)]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span className="font-extrabold text-sm tracking-tight">
                  Accessibility Preferences
                </span>
                <button
                  onClick={() => setIsA11yOpen(false)}
                  className="p-1 rounded-lg hover:opacity-75 cursor-pointer"
                  aria-label="Close accessibility settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. TEXT SIZE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5" />
                    <span>Text Size</span>
                  </span>
                  <span className="text-[11px] font-mono font-semibold">
                    {textSize === 'normal' ? 'Normal (100%)' : textSize === 'large' ? 'Large (115%)' : 'Extra Large (135%)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: 'A', sub: '100%' },
                    { id: 'large', label: 'A+', sub: '115%' },
                    { id: 'xl', label: 'A++', sub: '135%' },
                  ].map(({ id, label, sub }) => (
                    <button
                      key={id}
                      onClick={() => handleTextSizeSelect(id as TextSize)}
                      aria-pressed={textSize === id}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                        textSize === id
                          ? isHighContrast
                            ? 'bg-black text-white border-black font-extrabold'
                            : 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] font-bold shadow-xs'
                          : isHighContrast
                          ? 'bg-white text-black border-black hover:bg-neutral-100'
                          : 'bg-[var(--bg-surface-subtle)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span className="block text-sm font-extrabold">{label}</span>
                      <span className="block text-[10px] opacity-75">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. CONTRAST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Contrast &amp; Theme</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'standard', label: 'Light' },
                    { id: 'high-contrast', label: 'Contrast' },
                    { id: 'dark', label: 'Dark' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => handleContrastSelect(id as ContrastMode)}
                      aria-pressed={contrastMode === id}
                      className={`py-2.5 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        contrastMode === id
                          ? isHighContrast
                            ? 'bg-black text-white border-black'
                            : 'bg-[var(--text-main)] text-[var(--bg-base)] border-[var(--text-main)] shadow-xs'
                          : isHighContrast
                          ? 'bg-white text-black border-black hover:bg-neutral-100'
                          : 'bg-[var(--bg-surface-subtle)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. VOICE NARRATION */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Voice Narration</span>
                  </span>
                  <button
                    onClick={toggleVoice}
                    aria-pressed={voiceEnabled}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                      voiceEnabled
                        ? isHighContrast
                          ? 'bg-black text-white border-black'
                          : 'bg-[var(--semantic-success-bg)] text-[var(--semantic-success-text)] border-[var(--semantic-success-border)]'
                        : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {voiceEnabled ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3 h-3" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Speech Speed */}
                <div className="flex items-center justify-between gap-1 text-xs">
                  <span className="text-[11px] text-[var(--text-subtle)]">Reading Speed:</span>
                  <div className="flex gap-1">
                    {[0.85, 1.0, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSpeechRate(rate)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          speechRate === rate
                            ? isHighContrast
                              ? 'bg-black text-white border-black'
                              : 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                            : 'bg-[var(--bg-surface-subtle)] text-[var(--text-main)] border-[var(--border-subtle)]'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Account Quick Switch */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                {isAuthenticated && user ? (
                  <button
                    onClick={() => {
                      setIsA11yOpen(false);
                      setAuthView('account');
                    }}
                    className="font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Manage Account ({user.displayName || user.name})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsA11yOpen(false);
                      setAuthView('login');
                    }}
                    className="font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Sync Settings</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </header>
  );
};

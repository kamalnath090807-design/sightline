import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Type, Eye, Volume2, VolumeX, BookOpen } from 'lucide-react';
import type { TextSize, ContrastMode } from '../types/sightline';

export const AccessibilityToolbar: React.FC = () => {
  const {
    textSize,
    setTextSize,
    contrastMode,
    setContrastMode,
    voiceEnabled,
    toggleVoice,
    setIsHelpModalOpen,
    isSpeaking,
    stopSpeech,
  } = useAccessibility();

  return (
    <nav
      aria-label="Accessibility settings toolbar"
      className="w-full bg-[var(--bg-surface-subtle)] border-b border-[var(--border-subtle)] px-4 py-2 text-sm z-40 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Access Label */}
        <div className="flex items-center gap-2 text-[var(--text-muted)] font-medium">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white text-[11px] font-bold">
            A11y
          </span>
          <span className="font-semibold text-[var(--text-main)]">Accessibility Controls:</span>
        </div>

        {/* Right: Controls Cluster */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          
          {/* 1. Text Size Selector */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-subtle)] shadow-sm">
            <span className="sr-only">Adjust text size</span>
            <Type className="w-4 h-4 ml-1.5 text-[var(--text-muted)]" aria-hidden="true" />
            {(['normal', 'large', 'xl'] as TextSize[]).map((size) => {
              const isActive = textSize === size;
              const label = size === 'normal' ? 'Normal (100%)' : size === 'large' ? 'Large (115%)' : 'Extra Large (135%)';
              const display = size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++';

              return (
                <button
                  key={size}
                  onClick={() => setTextSize(size)}
                  aria-pressed={isActive}
                  aria-label={`Set text size to ${label}`}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                  }`}
                >
                  {display}
                </button>
              );
            })}
          </div>

          {/* 2. Contrast Selector */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-subtle)] shadow-sm">
            <Eye className="w-4 h-4 ml-1.5 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="sr-only">Select visual theme and contrast</span>
            {(
              [
                { mode: 'dark', label: 'Dark Mode', short: 'Dark' },
                { mode: 'standard', label: 'Light Mode', short: 'Light' },
                { mode: 'high-contrast', label: 'High Contrast AAA', short: 'Contrast' },
              ] as { mode: ContrastMode; label: string; short: string }[]
            ).map(({ mode, label, short }) => {
              const isActive = contrastMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setContrastMode(mode)}
                  aria-pressed={isActive}
                  aria-label={`Enable ${label}`}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-[var(--text-main)] text-[var(--bg-base)] shadow-xs'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)]'
                  }`}
                >
                  {short}
                </button>
              );
            })}
          </div>

          {/* 3. Voice Readout Toggle */}
          <button
            onClick={toggleVoice}
            aria-pressed={voiceEnabled}
            aria-label={voiceEnabled ? 'Voice narration is ON. Click to turn off.' : 'Voice narration is OFF. Click to turn on.'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
              voiceEnabled
                ? 'bg-[var(--semantic-success-bg)] text-[var(--semantic-success-text)] border-[var(--semantic-success-border)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)]'
            }`}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-4 h-4 animate-pulse text-[var(--semantic-success-text)]" aria-hidden="true" />
                <span>Voice Narration ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" aria-hidden="true" />
                <span>Voice Narration OFF</span>
              </>
            )}
          </button>

          {/* 4. Active Speaking Stop Pill (if speaking) */}
          {isSpeaking && (
            <button
              onClick={stopSpeech}
              aria-label="Stop current audio reading (shortcut: Escape key)"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--semantic-danger-bg)] text-[var(--semantic-danger-text)] border border-[var(--semantic-danger-border)] hover:opacity-90 animate-bounce"
            >
              <span>Stop Speech (Esc)</span>
            </button>
          )}

          {/* 5. User Research & Audit Guide Button */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            aria-label="Open User Research, Design Principles, and WCAG Audit Guide (shortcut: Alt + H)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:bg-[var(--accent-primary-light)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Research &amp; Audit</span>
            <span className="hidden md:inline-block text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-1 rounded border border-[var(--border-subtle)]">
              Alt+H
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

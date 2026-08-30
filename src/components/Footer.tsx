import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { ShieldCheck, Sparkles, BookOpen, FileText, Pill } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, setIsHelpModalOpen, setContrastMode, announce } = useAccessibility();

  return (
    <footer className="w-full bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Brand */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-[var(--text-main)]">
              SIGHTLINE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--semantic-success-bg)] text-[var(--semantic-success-text)] border border-[var(--semantic-success-border)]">
              WCAG 2.2 AAA
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
            An accessibility-first AI assistant engineered to empower visually impaired individuals with independent comprehension of critical documents and pharmaceutical labels.
          </p>
          <div className="pt-2 text-xs text-[var(--text-subtle)] font-mono">
            Designed for 90-Minute Prompt Engineering Competition • Problem Statement 1
          </div>
        </div>

        {/* Col 2: Core Workflows */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)]">
            Core Workflows
          </h4>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li>
              <button
                onClick={() => {
                  setActiveTab('document');
                  announce('Switched to Document analysis');
                  document.getElementById('analyzer-studio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Understand a Document</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab('medicine');
                  announce('Switched to Medicine analysis');
                  document.getElementById('analyzer-studio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Understand Medicine</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  document.getElementById('storytelling-showcase')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Scroll Transformation Story</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Competition Documentation */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)]">
            Judge Resources
          </h4>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li>
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5 text-left"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>User Research &amp; Prompts</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setContrastMode('high-contrast')}
                className="hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1.5 text-left"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test High-Contrast Mode (AAA)</span>
              </button>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-subtle)] gap-2">
        <p>© 2026 SIGHTLINE Accessibility Project. Built with Web Speech API &amp; GSAP.</p>
        <p className="font-mono">Zero-Hallucination Safe AI Architecture</p>
      </div>
    </footer>
  );
};

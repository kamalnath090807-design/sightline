import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { ArrowRight, FileText, Pill } from 'lucide-react';

export const ProductActionCards: React.FC = () => {
  const { setActiveTab, announce } = useAccessibility();

  const handleOpen = (tab: 'document' | 'medicine') => {
    setActiveTab(tab);
    announce(`Opened ${tab === 'document' ? 'Document' : 'Medicine'} assistant`);
    const el = document.getElementById('analyzer-studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CARD 1: DOCUMENT */}
        <div className="group bg-[var(--bg-surface)] p-8 sm:p-10 rounded-3xl border-2 border-[var(--border-subtle)] hover:border-[var(--text-main)] hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--bg-surface-subtle)] text-[var(--text-main)] border border-[var(--border-subtle)]">
                <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Documents</span>
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
              Understand a document
            </h3>

            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              Turn dense notices, bills, letters, and forms into clear, actionable information with extracted deadlines and payment sums.
            </p>
          </div>

          {/* Generated Image Preview */}
          <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] aspect-16/10">
            <img
              src="/assets/document-preview.jpg"
              alt="Official document with highlighted deadline and payment regions"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            />
          </div>

          {/* CTA */}
          <button
            onClick={() => handleOpen('document')}
            className="pt-2 flex items-center justify-between text-sm font-extrabold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
            aria-label="Open document assistant"
          >
            <span>Open document assistant</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* CARD 2: MEDICINE */}
        <div className="group bg-[var(--bg-surface)] p-8 sm:p-10 rounded-3xl border-2 border-[var(--border-subtle)] hover:border-emerald-700 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                <span>Medicine</span>
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
              Understand medicine
            </h3>

            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              Read verified information from medicine labels without relying on someone else, backed by a strict zero-hallucination safety protocol.
            </p>
          </div>

          {/* Generated Image Preview */}
          <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] aspect-16/10">
            <img
              src="/assets/medicine-preview.jpg"
              alt="Pharmaceutical medicine package and blister strip with verified formulation label"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            />
          </div>

          {/* CTA */}
          <button
            onClick={() => handleOpen('medicine')}
            className="pt-2 flex items-center justify-between text-sm font-extrabold text-emerald-800 group-hover:text-emerald-900 transition-colors cursor-pointer"
            aria-label="Open medicine assistant"
          >
            <span>Open medicine assistant</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};

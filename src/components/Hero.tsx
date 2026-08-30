import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  const { setActiveTab, announce } = useAccessibility();

  const handleSelectWorkflow = (type: 'document' | 'medicine') => {
    setActiveTab(type);
    announce(`Selected ${type === 'document' ? 'Document' : 'Medicine'} assistant`);
    const studio = document.getElementById('analyzer-studio');
    if (studio) {
      studio.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section aria-labelledby="hero-title" className="relative pt-12 pb-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
      
      {/* 2-COLUMN EDITORIAL COMPOSITION (55% Text / 45% Visual) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* LEFT COLUMN: Editorial Typography & Actions */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold tracking-widest uppercase text-[var(--accent-primary)] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
            <span>ACCESSIBILITY, REIMAGINED</span>
          </div>

          {/* Large Headline in Instrument Serif */}
          <h1
            id="hero-title"
            className="font-editorial text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-[var(--text-main)] leading-[1.04]"
          >
            Understand what <br />
            matters. <br />
            <span className="italic text-[var(--accent-primary)]">Independently.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-xl font-normal leading-relaxed">
            Turn dense notices, bills, and medicine packaging into clear, verified, spoken information.
          </p>

          {/* TWO PRIMARY VISUAL BUTTONS */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            
            {/* Primary Button */}
            <button
              onClick={() => handleSelectWorkflow('document')}
              className="h-13 sm:h-14 px-8 rounded-2xl bg-[var(--text-main)] text-[var(--bg-base)] hover:bg-[var(--accent-primary)] hover:text-white font-bold text-base transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-3 transform active:scale-[0.98] cursor-pointer"
              aria-label="Understand a document"
            >
              <span>Understand a document</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => handleSelectWorkflow('medicine')}
              className="h-13 sm:h-14 px-8 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] border-2 border-[var(--border-strong)] hover:border-[var(--text-main)] hover:bg-[var(--bg-surface-subtle)] font-bold text-base transition-all duration-200 shadow-xs transform active:scale-[0.98] cursor-pointer"
              aria-label="Understand medicine"
            >
              <span>Understand medicine</span>
            </button>

          </div>

          {/* Trust Badges */}
          <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-[var(--text-subtle)] border-t border-[var(--border-subtle)]">
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>WCAG 2.2 AAA Verified</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Zero-Hallucination Safe AI</span>
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: AI-Generated Editorial Visual Showcase */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-3xl bg-[var(--bg-surface)] p-3 border-2 border-[var(--border-subtle)] shadow-xl overflow-hidden group">
            
            <div className="relative rounded-2xl overflow-hidden bg-[var(--bg-surface-subtle)] aspect-4/3 sm:aspect-16/10">
              <img
                src="/assets/hero-editorial.jpg"
                alt="Editorial close-up of a printed document with structured information overlays and audio waveform"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
              />

              {/* Floating Minimal Tag */}
              <div className="absolute bottom-4 left-4 right-4 bg-[var(--bg-surface)]/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] shadow-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[var(--text-main)]">
                    Visual Information → Spoken Clarity
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase">
                  Optical Transcription
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};

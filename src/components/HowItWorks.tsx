import React from 'react';
import { UploadCloud, CheckCircle2, Volume2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-[var(--border-subtle)]">
      
      {/* Heading */}
      <div className="max-w-2xl text-left mb-16 space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">
          The Workflow
        </span>
        <h2 className="font-sans font-extrabold tracking-tight text-4xl sm:text-5xl text-[var(--text-main)] leading-tight">
          How SIGHTLINE works.
        </h2>
        <p className="text-base sm:text-lg text-[var(--text-muted)]">
          Three simple steps to independent understanding.
        </p>
      </div>

      {/* 3 Editorial Horizontal Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Step 01 */}
        <div className="bg-[var(--bg-surface)] p-8 sm:p-10 rounded-3xl border-2 border-[var(--border-subtle)] space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <span className="font-mono text-4xl font-extrabold text-[var(--text-subtle)] opacity-40">
              01
            </span>
            <div className="flex items-center gap-2 text-base font-extrabold tracking-wider uppercase text-[var(--text-main)]">
              <UploadCloud className="w-5 h-5 text-[var(--accent-primary)]" />
              <span>Upload</span>
            </div>
            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              Give SIGHTLINE a document or medicine label using your camera, drag-and-drop file upload, or instant 1-click sample.
            </p>
          </div>
          <div className="pt-4 border-t border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-subtle)]">
            Supports PNG, JPG, WEBP, PDF
          </div>
        </div>

        {/* Step 02 */}
        <div className="bg-[var(--bg-surface)] p-8 sm:p-10 rounded-3xl border-2 border-[var(--border-subtle)] space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <span className="font-mono text-4xl font-extrabold text-[var(--text-subtle)] opacity-40">
              02
            </span>
            <div className="flex items-center gap-2 text-base font-extrabold tracking-wider uppercase text-[var(--text-main)]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Understand</span>
            </div>
            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              AI extracts and organizes the information that matters: what is this, what is due, required actions, and safety warnings.
            </p>
          </div>
          <div className="pt-4 border-t border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-subtle)]">
            Atomic Structured Fact Cards
          </div>
        </div>

        {/* Step 03 */}
        <div className="bg-[var(--bg-surface)] p-8 sm:p-10 rounded-3xl border-2 border-[var(--border-subtle)] space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <span className="font-mono text-4xl font-extrabold text-[var(--text-subtle)] opacity-40">
              03
            </span>
            <div className="flex items-center gap-2 text-base font-extrabold tracking-wider uppercase text-[var(--text-main)]">
              <Volume2 className="w-5 h-5 text-[var(--accent-primary)]" />
              <span>Listen &amp; Ask</span>
            </div>
            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              Hear a clear explanation through accessible voice output and ask follow-up questions about deadlines or dosage verification.
            </p>
          </div>
          <div className="pt-4 border-t border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-subtle)]">
            Synchronized Voice Synthesis
          </div>
        </div>

      </div>

    </section>
  );
};

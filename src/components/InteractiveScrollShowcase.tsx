import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAccessibility } from '../context/AccessibilityContext';
import { CheckCircle, Play, Square, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const InteractiveScrollShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const ocrHighlight1Ref = useRef<HTMLDivElement>(null);
  const ocrHighlight2Ref = useRef<HTMLDivElement>(null);
  const ocrHighlight3Ref = useRef<HTMLDivElement>(null);
  const docVisualRef = useRef<HTMLDivElement>(null);
  const summaryVisualRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  const [currentStepText, setCurrentStepText] = useState('1. Raw Inaccessible Document');
  const [isInteractiveReading, setIsInteractiveReading] = useState(false);

  const { speakText, stopSpeech, isSpeaking } = useAccessibility();

  const handleTestSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsInteractiveReading(false);
    } else {
      setIsInteractiveReading(true);
      speakText(
        "University Fee Notice. Tuition payment of 2,500 rupees is due by September 15th. Pay online to confirm course registration.",
        () => setIsInteractiveReading(false)
      );
    }
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !sectionRef.current || !pinRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: pinRef.current,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (p < 0.18) {
              setCurrentStepText('1. Raw Inaccessible Document');
            } else if (p < 0.38) {
              setCurrentStepText('2. Laser Optical Scanning');
            } else if (p < 0.58) {
              setCurrentStepText('3. Detected Deadlines & Amounts');
            } else if (p < 0.78) {
              setCurrentStepText('4. Structured Plain-Language Summary');
            } else {
              setCurrentStepText('5 & 6. Spoken Audio Waveform Ready');
            }
          },
        },
      });

      // Initial state
      gsap.set(scanLineRef.current, { top: '0%', opacity: 0 });
      gsap.set([ocrHighlight1Ref.current, ocrHighlight2Ref.current, ocrHighlight3Ref.current], { opacity: 0, scale: 0.95 });
      gsap.set(summaryVisualRef.current, { opacity: 0, y: 20, scale: 0.96 });
      gsap.set(waveformRef.current, { opacity: 0, scaleY: 0.2 });

      // Story Timeline across scroll
      tl.to(scanLineRef.current, {
        opacity: 1,
        duration: 0.15,
      })
      .to(scanLineRef.current, {
        top: '94%',
        duration: 0.75,
        ease: 'power1.inOut',
      })
      .to(ocrHighlight1Ref.current, { opacity: 1, scale: 1, duration: 0.25 }, '-=0.4')
      .to(ocrHighlight2Ref.current, { opacity: 1, scale: 1, duration: 0.25 }, '-=0.2')
      .to(ocrHighlight3Ref.current, { opacity: 1, scale: 1, duration: 0.25 }, '-=0.1')
      .to(docVisualRef.current, {
        opacity: 0.25,
        filter: 'blur(3px)',
        duration: 0.5,
      })
      .to(summaryVisualRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power2.out',
      }, '-=0.35')
      .to(waveformRef.current, {
        opacity: 1,
        scaleY: 1,
        duration: 0.5,
        ease: 'back.out(1.4)',
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="storytelling-showcase"
      ref={sectionRef}
      aria-labelledby="showcase-heading"
      className="relative w-full min-h-[220vh] bg-transparent border-t border-[var(--border-subtle)]"
    >
      {/* PINNED VIEWPORT CONTAINER: Perfectly Centered in 100vh with Navbar offset */}
      <div
        ref={pinRef}
        className="w-full h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-14 sm:pt-16"
      >
        {/* COMPACT UPPER HEADING (Visual alignment with centered stage) */}
        <div className="text-center max-w-2xl mb-4 sm:mb-6 space-y-2 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-sm border border-[var(--border-subtle)] text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Transformation</span>
          </div>

          <h2
            id="showcase-heading"
            className="font-editorial text-3xl sm:text-4xl md:text-5xl text-[var(--text-main)] leading-tight"
          >
            From inaccessible <span className="italic text-[var(--accent-primary)]">to understandable.</span>
          </h2>
          
          <div className="pt-0.5">
            <span className="px-3.5 py-1 rounded-full bg-[var(--text-main)] text-[var(--bg-base)] text-[11px] font-mono font-bold tracking-wide shadow-xs">
              {currentStepText}
            </span>
          </div>
        </div>

        {/* TRANSFORMATION STAGE: Beautifully Centered 2-Column Stage (55vh - 62vh height) */}
        <div className="relative w-full max-w-6xl h-[52vh] min-h-[380px] max-h-[500px] rounded-3xl bg-[var(--bg-surface)]/90 backdrop-blur-md border-2 border-[var(--border-subtle)] shadow-xl p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10 shrink-0">
          
          {/* LEFT: Realistic Document with Scan Beam & Overlays */}
          <div className="relative w-full lg:w-1/2 h-full flex items-center justify-center">
            <div
              ref={docVisualRef}
              className="relative w-full max-w-[340px] h-[92%] rounded-2xl overflow-hidden bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] shadow-md select-none transition-all flex items-center justify-center"
            >
              <img
                src="/assets/document-preview.jpg"
                alt="Document being optically processed"
                className="w-full h-full object-cover"
              />

              {/* Highlight Overlays */}
              <div
                ref={ocrHighlight1Ref}
                className="absolute top-1/4 left-4 right-4 p-2 rounded-lg bg-amber-100/95 border-2 border-amber-600 text-[10px] font-extrabold text-amber-950 shadow-sm"
              >
                DEADLINE: September 15, 2026
              </div>

              <div
                ref={ocrHighlight2Ref}
                className="absolute top-1/2 left-4 right-4 p-2 rounded-lg bg-blue-100/95 border-2 border-blue-600 text-[10px] font-extrabold text-blue-950 shadow-sm"
              >
                AMOUNT: ₹2,500 ($250.00)
              </div>

              <div
                ref={ocrHighlight3Ref}
                className="absolute bottom-1/4 left-4 right-4 p-2 rounded-lg bg-emerald-100/95 border-2 border-emerald-600 text-[10px] font-extrabold text-emerald-950 shadow-sm"
              >
                ACTION: Pay online to confirm enrollment
              </div>

              {/* Scanning Laser Beam */}
              <div
                ref={scanLineRef}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent shadow-[0_0_14px_var(--accent-primary)]"
              />
            </div>
          </div>

          {/* RIGHT: Structured Plain-Language Summary & Audio Playback */}
          <div className="relative w-full lg:w-1/2 h-full flex flex-col justify-center">
            <div
              ref={summaryVisualRef}
              className="w-full bg-[var(--bg-surface-subtle)] p-6 sm:p-7 rounded-2xl border-2 border-[var(--accent-primary)] shadow-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--semantic-success-bg)] text-[var(--semantic-success-text)] border border-[var(--semantic-success-border)] flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Plain Language Summary
                </span>
                <span className="text-xs font-mono font-extrabold text-[var(--accent-primary)]">
                  100% Verified
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)]">
                  University Fee Payment
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  Pay <strong>₹2,500 ($250)</strong> before <strong>September 15</strong> to secure your course registration and avoid a late fee.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-subtle)] block text-[10px] font-semibold">Amount Due</span>
                  <span className="font-extrabold text-sm sm:text-base text-[var(--text-main)]">₹2,500</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-subtle)] block text-[10px] font-semibold">Deadline</span>
                  <span className="font-extrabold text-sm sm:text-base text-[var(--semantic-danger-text)]">Sept 15, 2026</span>
                </div>
              </div>

              {/* Audio Waveform & Speech CTA */}
              <div
                ref={waveformRef}
                className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 h-6 px-2 bg-[var(--bg-surface)] rounded-md border border-[var(--border-subtle)]">
                    {[10, 22, 16, 26, 14, 20, 14, 18, 24, 12].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full bg-[var(--accent-primary)] transition-all ${
                          isInteractiveReading ? 'animate-pulse' : ''
                        }`}
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[var(--text-main)]">
                    {isInteractiveReading ? 'Reading aloud...' : 'Spoken Audio Ready'}
                  </span>
                </div>

                <button
                  onClick={handleTestSpeech}
                  className="h-10 px-4 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  aria-label={isInteractiveReading ? 'Stop spoken demonstration' : 'Play spoken audio demonstration'}
                >
                  {isInteractiveReading ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Listen Now</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

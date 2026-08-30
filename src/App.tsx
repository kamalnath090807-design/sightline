import { useEffect } from 'react';
import Lenis from 'lenis';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductActionCards } from './components/ProductActionCards';
import { HowItWorks } from './components/HowItWorks';
import { InteractiveScrollShowcase } from './components/InteractiveScrollShowcase';
import { AnalyzerStudio } from './components/AnalyzerStudio';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { ResearchAndAuditModal } from './components/ResearchAndAuditModal';
import { AuthModal } from './components/auth/AuthModal';
import Galaxy from './components/Galaxy';

function SightlineApp() {
  const { contrastMode } = useAccessibility();
  const isDarkMode = contrastMode === 'dark';
  const isHighContrast = contrastMode === 'high-contrast';

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.8,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col text-[var(--text-main)] transition-colors duration-200 overflow-x-clip">
      {/* PERSISTENT FULL-SCREEN GALAXY BACKGROUND (Z-INDEX 0) */}
      {!isHighContrast && (
        isDarkMode ? (
          /* LOCKED DARK THEME GALAXY — DO NOT MODIFY */
          <Galaxy
            key="galaxy-dark"
            lightMode={false}
            transparent={false}
            mouseInteraction={true}
            mouseRepulsion={true}
            density={0.85}
            glowIntensity={0.35}
            saturation={0.35}
            hueShift={220}
            starSpeed={0.25}
            speed={0.45}
            twinkleIntensity={0.22}
            rotationSpeed={0.035}
            repulsionStrength={1.5}
          />
        ) : (
          /* REFINED LIGHT THEME GALAXY (PALE BLUE-WHITE ATMOSPHERE + VISIBLE COBALT STARS) */
          <Galaxy
            key="galaxy-light"
            lightMode={true}
            transparent={false}
            mouseInteraction={true}
            mouseRepulsion={true}
            density={0.85}
            glowIntensity={0.32}
            saturation={0.35}
            hueShift={210}
            starSpeed={0.18}
            speed={0.32}
            twinkleIntensity={0.18}
            rotationSpeed={0.02}
            repulsionStrength={1.2}
          />
        )
      )}

      {/* Desktop Custom Magnetic Cursor */}
      <CustomCursor />

      {/* Main Header & Accessible Popover (Z-INDEX 40) */}
      <Header />

      {/* Semantic Main Content (Z-INDEX 10) */}
      <main id="main-content" className="relative z-10 flex-1 focus:outline-none" tabIndex={-1}>
        {/* Editorial Hero (55/45 Composition with AI-Generated Document Visual) */}
        <Hero />

        {/* 2 Primary Product Action Cards */}
        <ProductActionCards />

        {/* 3-Step Editorial Workflow */}
        <HowItWorks />

        {/* Pinned GSAP Scroll Transformation Story (Centered in Viewport) */}
        <InteractiveScrollShowcase />

        {/* Central Document & Medicine Analysis Studio */}
        <AnalyzerStudio />
      </main>

      {/* Comprehensive Footer (Z-INDEX 10) */}
      <Footer />

      {/* Full Competition Documentation & Research Modal (Z-INDEX 50) */}
      <ResearchAndAuditModal />

      {/* Authentication Modal Flow (Z-INDEX 50) */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <SightlineApp />
      </AuthProvider>
    </AccessibilityProvider>
  );
}

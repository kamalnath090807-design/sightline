import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TextSize, ContrastMode } from '../types/sightline';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  cycleTextSize: () => void;
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  cycleContrastMode: () => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  toggleVoice: () => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  currentSpokenText: string;
  activeSentenceIndex: number;
  speakText: (text: string | string[], onComplete?: () => void) => void;
  stopSpeech: () => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;
  activeTab: 'document' | 'medicine';
  setActiveTab: (tab: 'document' | 'medicine') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Text Size State (normal, large, xl)
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    return (localStorage.getItem('sightline_text_size') as TextSize) || 'normal';
  });

  // 2. Contrast Mode State (dark [default], standard, high-contrast)
  const [contrastMode, setContrastModeState] = useState<ContrastMode>(() => {
    return (localStorage.getItem('sightline_contrast_mode') as ContrastMode) || 'dark';
  });

  // 3. Voice Settings
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('sightline_voice_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [speechRate, setSpeechRateState] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentSpokenText, setCurrentSpokenText] = useState<string>('');
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(-1);

  // 4. Modals & Navigation Tabs
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'document' | 'medicine'>('document');

  // 5. Live Screen Reader Announcer Messages
  const [politeAnnouncement, setPoliteAnnouncement] = useState<string>('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<string>('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentenceListRef = useRef<string[]>([]);
  const currentSentenceIdxRef = useRef<number>(0);

  // Apply Text Size & Contrast to Root HTML Element
  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
    localStorage.setItem('sightline_text_size', textSize);
  }, [textSize]);

  useEffect(() => {
    document.documentElement.dataset.contrast = contrastMode;
    localStorage.setItem('sightline_contrast_mode', contrastMode);
  }, [contrastMode]);

  useEffect(() => {
    localStorage.setItem('sightline_voice_enabled', String(voiceEnabled));
  }, [voiceEnabled]);

  // Screen Reader Live Region Announcer
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveAnnouncement('');
      setTimeout(() => setAssertiveAnnouncement(message), 50);
    } else {
      setPoliteAnnouncement('');
      setTimeout(() => setPoliteAnnouncement(message), 50);
    }
  }, []);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    const label = size === 'xl' ? 'Extra Large' : size.charAt(0).toUpperCase() + size.slice(1);
    announce(`Text size set to ${label}`);
  };

  const cycleTextSize = () => {
    const sequence: TextSize[] = ['normal', 'large', 'xl'];
    const nextIdx = (sequence.indexOf(textSize) + 1) % sequence.length;
    setTextSize(sequence[nextIdx]);
  };

  const setContrastMode = (mode: ContrastMode) => {
    setContrastModeState(mode);
    const label = mode === 'high-contrast' ? 'High Contrast Mode' : mode === 'dark' ? 'Dark Mode' : 'Standard Contrast';
    announce(`Contrast mode set to ${label}`);
  };

  const cycleContrastMode = () => {
    const sequence: ContrastMode[] = ['standard', 'high-contrast', 'dark'];
    const nextIdx = (sequence.indexOf(contrastMode) + 1) % sequence.length;
    setContrastMode(sequence[nextIdx]);
  };

  const setVoiceEnabled = (enabled: boolean) => {
    setVoiceEnabledState(enabled);
    if (!enabled && isSpeaking) {
      stopSpeech();
    }
    announce(enabled ? 'Voice audio enabled' : 'Voice audio disabled');
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
  };

  const setSpeechRate = (rate: number) => {
    setSpeechRateState(rate);
    announce(`Speech speed set to ${rate}x`);
  };

  // Stop Speech safely
  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveSentenceIndex(-1);
    setCurrentSpokenText('');
  }, []);

  const pauseSpeech = useCallback(() => {
    if ('speechSynthesis' in window && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      announce('Speech paused');
    }
  }, [isSpeaking, isPaused, announce]);

  const resumeSpeech = useCallback(() => {
    if ('speechSynthesis' in window && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      announce('Speech resumed');
    }
  }, [isSpeaking, isPaused, announce]);

  // Sequential Sentence Narrator with live visual tracking
  const speakText = useCallback((textInput: string | string[], onComplete?: () => void) => {
    if (!('speechSynthesis' in window)) {
      announce('Speech synthesis is not supported on this browser.');
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    let sentences: string[] = [];
    if (Array.isArray(textInput)) {
      sentences = textInput.filter(t => t && t.trim().length > 0);
    } else {
      // Split into clear sentences for rhythmic natural cadence
      sentences = textInput
        .replace(/([.?!])\s*(?=[A-Z0-9])/g, "$1|")
        .split("|")
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    if (sentences.length === 0) return;

    sentenceListRef.current = sentences;
    currentSentenceIdxRef.current = 0;
    setIsSpeaking(true);
    setIsPaused(false);
    announce('Beginning audio narration');

    const speakNextSentence = () => {
      const idx = currentSentenceIdxRef.current;
      if (idx >= sentenceListRef.current.length) {
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveSentenceIndex(-1);
        setCurrentSpokenText('');
        if (onComplete) onComplete();
        announce('Finished reading');
        return;
      }

      const sentence = sentenceListRef.current[idx];
      setActiveSentenceIndex(idx);
      setCurrentSpokenText(sentence);

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        currentSentenceIdxRef.current += 1;
        speakNextSentence();
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error('Speech synthesis error:', e);
          setIsSpeaking(false);
          setIsPaused(false);
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNextSentence();
  }, [speechRate, announce]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      // Escape key to stop voice or close modals
      if (e.key === 'Escape') {
        if (isHelpModalOpen) {
          setIsHelpModalOpen(false);
          announce('Closed help guide');
          return;
        }
        if (isSpeaking) {
          stopSpeech();
          announce('Stopped audio narration');
          return;
        }
      }

      // Alt + Key combinations
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case '1':
            e.preventDefault();
            setActiveTab('document');
            announce('Switched to Document Analysis mode');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('medicine');
            announce('Switched to Medicine Analysis mode');
            break;
          case 't':
            e.preventDefault();
            cycleTextSize();
            break;
          case 'c':
            e.preventDefault();
            cycleContrastMode();
            break;
          case 'v':
            e.preventDefault();
            toggleVoice();
            break;
          case 'h':
            e.preventDefault();
            setIsHelpModalOpen(prev => !prev);
            announce(isHelpModalOpen ? 'Closed guide' : 'Opened accessibility and user research guide');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpModalOpen, isSpeaking, stopSpeech, cycleTextSize, cycleContrastMode, toggleVoice, announce]);

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        cycleTextSize,
        contrastMode,
        setContrastMode,
        cycleContrastMode,
        voiceEnabled,
        setVoiceEnabled,
        toggleVoice,
        speechRate,
        setSpeechRate,
        isSpeaking,
        isPaused,
        currentSpokenText,
        activeSentenceIndex,
        speakText,
        stopSpeech,
        pauseSpeech,
        resumeSpeech,
        announce,
        isHelpModalOpen,
        setIsHelpModalOpen,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
      
      {/* Invisible Screen Reader Live Regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="sightline-live-polite"
      >
        {politeAnnouncement}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="sightline-live-assertive"
      >
        {assertiveAnnouncement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_DOCUMENTS, SAMPLE_MEDICINES } from '../data/sampleData';
import { analyzeImage, askQuestion, SCAN_STEPS_DOCUMENT, SCAN_STEPS_MEDICINE } from '../services/aiService';
import type { ScanProgressStep } from '../services/aiService';
import type {
  AnalysisResult,
  DocumentAnalysisResult,
  MedicineAnalysisResult,
  SampleItem,
} from '../types/sightline';
import {
  FileText,
  Pill,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Volume2,
  Square,
  Send,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
  Info,
  ShieldAlert,
  Loader2,
  Quote,
  RefreshCw,
} from 'lucide-react';

export const AnalyzerStudio: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    speakText,
    stopSpeech,
    isSpeaking,
    isPaused,
    pauseSpeech,
    resumeSpeech,
    activeSentenceIndex,
    speechRate,
    setSpeechRate,
    announce,
    voiceEnabled,
  } = useAccessibility();

  const { isAuthenticated, saveUserHistoryItem } = useAuth();

  // Selected file / sample state
  const [selectedSample, setSelectedSample] = useState<SampleItem | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Analysis Lifecycle States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressSteps, setProgressSteps] = useState<ScanProgressStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Interactive Question Answering
  const [questionInput, setQuestionInput] = useState<string>('');
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; answer: string; timestamp: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Initial Sample Setup
  useEffect(() => {
    if (!selectedSample && !uploadedFile) {
      if (activeTab === 'document') {
        setSelectedSample(SAMPLE_DOCUMENTS[0]);
      } else {
        setSelectedSample(SAMPLE_MEDICINES[0]);
      }
    }
  }, [activeTab]);

  const handleTabChange = (tab: 'document' | 'medicine') => {
    setActiveTab(tab);
    setResult(null);
    setUploadedFile(null);
    setUploadedImagePreview(null);
    setSelectedSample(tab === 'document' ? SAMPLE_DOCUMENTS[0] : SAMPLE_MEDICINES[0]);
    stopSpeech();
    announce(`Switched to ${tab === 'document' ? 'Document Assistant' : 'Medicine Assistant'}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSelectedSample(null);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      announce(`Uploaded file: ${file.name}. Ready for Gemini analysis.`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSelectedSample(null);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      announce(`Dropped file: ${file.name}. Ready for Gemini analysis.`);
    }
  };

  const handleRunAnalysis = async () => {
    setIsProcessing(true);
    setResult(null);
    const initialSteps = (activeTab === 'document' ? SCAN_STEPS_DOCUMENT : SCAN_STEPS_MEDICINE).map((s) => ({
      ...s,
      status: 'pending' as const,
    }));
    setProgressSteps(initialSteps);
    setCurrentStepIdx(0);
    announce(`Beginning ${activeTab} vision analysis.`);

    try {
      const data = await analyzeImage(
        activeTab,
        {
          file: uploadedFile || undefined,
          sampleId: selectedSample?.id,
          dataUrl: uploadedImagePreview || undefined,
        },
        (stepIndex) => {
          setCurrentStepIdx(stepIndex);
          setProgressSteps((prev) =>
            prev.map((s, idx) => ({
              ...s,
              status: idx < stepIndex ? 'completed' : idx === stepIndex ? 'active' : 'pending',
            }))
          );
          if (initialSteps[stepIndex]) {
            announce(initialSteps[stepIndex].label, 'polite');
          }
        }
      );

      setResult(data);
      setQaHistory(data.qaHistory || []);
      setIsProcessing(false);
      announce(`Analysis complete for ${data.type === 'document' ? data.title : data.name}.`);

      if (isAuthenticated) {
        saveUserHistoryItem({
          type: data.type,
          title: data.type === 'document' ? data.title : data.name,
          summary: data.plainLanguageSummary,
          metadata:
            data.type === 'document'
              ? { amounts: data.amounts, deadlines: data.deadlines }
              : { dosage: data.dosageIfVerified?.strength, expiry: data.expiryIfDetected?.date },
        });
      }

      if (voiceEnabled) {
        setTimeout(() => {
          handlePlayNarration(data);
        }, 400);
      }

      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      announce(`Error: ${err.message || 'An error occurred during analysis.'}`);
    }
  };

  const handlePlayNarration = (dataToRead?: AnalysisResult) => {
    const target = dataToRead || result;
    if (!target) return;

    let sentencesToRead: string[] = [];

    if (target.type === 'document') {
      const doc = target as DocumentAnalysisResult;
      sentencesToRead = [
        `Summary of ${doc.title}.`,
        doc.plainLanguageSummary,
        doc.actionRequired.hasAction ? `Action required: ${doc.actionRequired.description}` : 'No immediate action required.',
        doc.deadlines.length > 0 ? `Important deadline: ${doc.deadlines[0].label}, ${doc.deadlines[0].date}.` : '',
        doc.amounts.length > 0 ? `Payable amount: ${doc.amounts[0].value}.` : '',
      ].filter(Boolean);
    } else {
      const med = target as MedicineAnalysisResult;
      sentencesToRead = [
        `Medicine package for ${med.name}.`,
        med.plainLanguageSummary,
        med.dosageIfVerified?.verified ? `Strength: ${med.dosageIfVerified.strength}.` : 'Dosage must be verified with doctor.',
        med.expiryIfDetected?.detected ? `Expiration date: ${med.expiryIfDetected.date}.` : 'Expiry date not detected.',
        med.criticalWarnings.length > 0 ? `Critical warning: ${med.criticalWarnings[0]}` : '',
        `Safety notice: ${med.medicalDisclaimer}`,
      ].filter(Boolean);
    }

    const fullScript = sentencesToRead.join(' ');
    speakText(fullScript);
  };

  const handleAskQuestion = async (prefilled?: string) => {
    const q = prefilled || questionInput;
    if (!q.trim() || !result) return;

    setIsAnsweringQuestion(true);
    setQuestionInput('');
    announce(`Searching verified facts for: ${q}`);

    try {
      const answer = await askQuestion(result, q);
      const newQa = {
        question: q,
        answer,
        timestamp: 'Just now',
      };
      setQaHistory((prev) => [newQa, ...prev]);
      setIsAnsweringQuestion(false);
      announce(`Answer: ${answer}`);

      if (voiceEnabled) {
        speakText(answer);
      }
    } catch (err) {
      console.error(err);
      setIsAnsweringQuestion(false);
      announce('Could not answer question at this time.');
    }
  };

  const handleResetToUpload = () => {
    stopSpeech();
    setResult(null);
    setUploadedFile(null);
    setUploadedImagePreview(null);
    announce('Returned to upload screen');
  };

  const sampleList = activeTab === 'document' ? SAMPLE_DOCUMENTS : SAMPLE_MEDICINES;

  return (
    <section
      id="analyzer-studio"
      aria-labelledby="analyzer-title"
      className="py-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-[var(--border-subtle)]"
    >
      {/* SECTION HEADER & ACCESSIBLE TAB SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[var(--border-subtle)]">
        <div className="space-y-2 text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">
            Sightline AI Vision Studio
          </span>
          <h2 id="analyzer-title" className="font-editorial font-normal text-4xl sm:text-5xl text-[var(--text-main)] leading-tight">
            Analysis Studio.
          </h2>
          <p className="text-base text-[var(--text-muted)]">
            Upload or select an image to extract verified facts with zero-hallucination standards.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-[var(--bg-surface-subtle)] p-1.5 rounded-2xl border border-[var(--border-subtle)]">
          <button
            onClick={() => handleTabChange('document')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === 'document'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
            }`}
            aria-pressed={activeTab === 'document'}
          >
            <FileText className="w-4 h-4" />
            <span>Documents</span>
          </button>

          <button
            onClick={() => handleTabChange('medicine')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
              activeTab === 'medicine'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
            }`}
            aria-pressed={activeTab === 'medicine'}
          >
            <Pill className="w-4 h-4" />
            <span>Medicine</span>
          </button>
        </div>
      </div>

      {/* STATE 1: UPLOAD & SAMPLE SELECTION VIEW */}
      {!result && !isProcessing && (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Upload Dropzone & Primary Action */}
          <div className="lg:col-span-7 space-y-6">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer border-2 border-dashed border-[var(--border-strong)] hover:border-[var(--text-main)] rounded-3xl p-10 sm:p-14 text-center bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)]/50 transition-all focus-within:ring-4 focus-within:ring-[var(--focus-ring)] shadow-xs"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
              aria-label={`Upload an image of a ${activeTab}. Drag and drop or press enter to browse files.`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="sr-only"
                aria-hidden="true"
              />

              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)] flex items-center justify-center">
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold text-[var(--text-main)]">
                    {uploadedFile
                      ? `Selected: ${uploadedFile.name}`
                      : `Upload ${activeTab === 'document' ? 'Document' : 'Medicine'} Image`}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-sm">
                    Drag and drop your image, or click to browse files from your device.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-surface-subtle)] text-[var(--text-subtle)] border border-[var(--border-subtle)]">
                  <span>JPG, PNG, WEBP, PDF (Max 15MB)</span>
                </div>
              </div>
            </div>

            {/* Accessibility Guidance */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] flex items-start gap-3 text-xs text-[var(--text-muted)] text-left">
              <Info className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
              <p>
                <strong>Zero-Hallucination Guarantee:</strong> SIGHTLINE uses Gemini Vision to extract only visible source evidence. Missing or obscured text is never invented.
              </p>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleRunAnalysis}
              className="w-full h-14 rounded-2xl bg-[var(--text-main)] text-[var(--bg-base)] hover:opacity-90 font-extrabold text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md"
              aria-label={`Run vision analysis on ${uploadedFile ? uploadedFile.name : selectedSample?.title || activeTab}`}
            >
              <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
              <span>Analyze {activeTab === 'document' ? 'Document' : 'Medicine'} with Gemini Vision</span>
            </button>
          </div>

          {/* Right: Curated 1-Click Samples */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                Or Select A Curated Sample (1-Click)
              </h3>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Instant Demo
              </span>
            </div>

            <div className="space-y-3">
              {sampleList.map((sample) => {
                const isSelected = selectedSample?.id === sample.id && !uploadedFile;

                return (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setSelectedSample(sample);
                      setUploadedFile(null);
                      setUploadedImagePreview(null);
                      announce(`Selected sample: ${sample.title}`);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-light)]/40 shadow-sm'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="w-16 h-20 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={sample.thumbnailUrl || (activeTab === 'document' ? '/assets/document-preview.jpg' : '/assets/medicine-preview.jpg')}
                        alt={`Thumbnail of ${sample.title}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = activeTab === 'document' ? '/assets/document-preview.jpg' : '/assets/medicine-preview.jpg';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--bg-surface-subtle)] text-[var(--text-muted)]">
                          {sample.tag}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-main)] truncate">{sample.title}</h4>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{sample.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: REFINED PROGRESSIVE PROCESSING */}
      {isProcessing && (
        <div
          role="status"
          aria-live="polite"
          className="mt-12 max-w-2xl mx-auto bg-[var(--bg-surface)] p-8 sm:p-12 rounded-3xl border-2 border-[var(--accent-primary)] shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary-light)] text-[var(--accent-primary)] mx-auto flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">
              Gemini Vision Analysis in Progress
            </span>
            <h3 className="text-2xl font-extrabold text-[var(--text-main)] font-sans">
              {progressSteps[currentStepIdx]?.label || 'Processing Image...'}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {progressSteps[currentStepIdx]?.detail || 'Extracting verified line items and grounding source evidence.'}
            </p>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-3 pt-4 text-left border-t border-[var(--border-subtle)]">
            {progressSteps.map((step, idx) => (
              <div
                key={step.step}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  idx === currentStepIdx
                    ? 'bg-[var(--accent-primary-light)]/40 font-bold text-[var(--text-main)]'
                    : idx < currentStepIdx
                    ? 'text-emerald-700 font-semibold'
                    : 'text-[var(--text-subtle)] opacity-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx < currentStepIdx
                      ? 'bg-emerald-600 text-white'
                      : idx === currentStepIdx
                      ? 'bg-[var(--accent-primary)] text-white animate-pulse'
                      : 'bg-[var(--border-subtle)] text-[var(--text-subtle)]'
                  }`}
                >
                  {idx < currentStepIdx ? '✓' : step.step}
                </div>
                <span className="text-xs sm:text-sm">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATE 3: COMPLETE ACCESSIBLE RESULTS DASHBOARD */}
      {result && !isProcessing && (
        <div ref={resultRef} className="mt-12 space-y-8 text-left animate-fadeIn">
          {/* Top Bar: Return Button & Narration Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
            <button
              onClick={handleResetToUpload}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Upload or select another image</span>
            </button>

            {/* Audio Readout Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isSpeaking) {
                    if (isPaused) {
                      resumeSpeech();
                    } else {
                      pauseSpeech();
                    }
                  } else {
                    handlePlayNarration();
                  }
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all cursor-pointer ${
                  isSpeaking && !isPaused
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]'
                }`}
                aria-label={
                  isSpeaking ? (isPaused ? 'Resume audio reading' : 'Pause audio reading') : 'Read entire result aloud'
                }
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking && !isPaused ? 'animate-pulse' : ''}`} />
                <span>{isSpeaking ? (isPaused ? 'Resume Speech' : 'Pause Speech') : '🔊 Read Aloud'}</span>
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeech}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-[var(--semantic-danger-bg)] text-[var(--semantic-danger-text)] border border-[var(--semantic-danger-border)] cursor-pointer"
                  aria-label="Stop audio reading"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              )}

              {/* Speed Switcher */}
              <div className="hidden md:flex items-center gap-1 text-xs border border-[var(--border-subtle)] rounded-xl p-1 bg-[var(--bg-surface)]">
                <span className="text-[var(--text-subtle)] px-1.5 font-semibold">Speed:</span>
                {[0.85, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      speechRate === rate ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
                    }`}
                    aria-pressed={speechRate === rate}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN RESULT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Verified Source Image */}
            <div className="lg:col-span-4 bg-[var(--bg-surface)] p-6 rounded-3xl border-2 border-[var(--border-subtle)] shadow-sm space-y-4">
              <div className="flex items-center justify-between text-xs font-extrabold text-[var(--text-muted)]">
                <span>Verified Source Image</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--semantic-success-bg)] text-[var(--semantic-success-text)] text-[10px] font-bold">
                  ✓ OCR Grounded
                </span>
              </div>

              <div className="w-full max-h-[380px] rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] overflow-hidden flex items-center justify-center p-2">
                <img
                  src={
                    uploadedImagePreview ||
                    selectedSample?.thumbnailUrl ||
                    (result.type === 'document' ? '/assets/document-preview.jpg' : '/assets/medicine-preview.jpg')
                  }
                  alt={`Source image for ${result.type === 'document' ? result.title : result.name}`}
                  className="max-h-[340px] w-auto object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = result.type === 'document' ? '/assets/document-preview.jpg' : '/assets/medicine-preview.jpg';
                  }}
                />
              </div>

              <p className="text-xs text-[var(--text-subtle)] text-center">
                Optical text boundaries verified by Gemini Vision.
              </p>
            </div>

            {/* Right: Structured Information & Verification Sections */}
            <div className="lg:col-span-8 space-y-6">
              {/* Plain Language Summary Card */}
              <div className="bg-[var(--bg-surface)] p-8 rounded-3xl border-2 border-[var(--border-subtle)] shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[var(--accent-primary-light)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                    {result.type === 'document' ? result.category : 'Pharmaceutical Formulation'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Zero-Hallucination Verified
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
                    {result.type === 'document' ? result.title : result.name}
                  </h3>
                  {result.type === 'medicine' && (
                    <p className="text-sm font-semibold text-[var(--accent-primary)] mt-0.5">
                      Generic: {result.genericName || 'As labeled'}
                    </p>
                  )}
                </div>

                <div
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    activeSentenceIndex === 1
                      ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-500'
                      : 'bg-[var(--bg-surface-subtle)] border-[var(--border-subtle)]'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] block mb-1">
                    Plain Language Explanation
                  </span>
                  <p className="text-base sm:text-lg font-medium text-[var(--text-main)] leading-relaxed">
                    {result.plainLanguageSummary}
                  </p>
                </div>
              </div>

              {/* Financial Consistency Badge (If applicable) */}
              {result.type === 'document' && (result as DocumentAnalysisResult).financialConsistency === 'verified' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 flex items-center gap-3 text-xs sm:text-sm font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    ✓ Financial Consistency Verified: Itemized line amounts mathematically reconcile with Total Amount Due.
                  </span>
                </div>
              )}

              {/* SECTION: VERIFIED INFORMATION */}
              {result.verifiedFields && result.verifiedFields.length > 0 && (
                <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border-2 border-emerald-500/40 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>VERIFIED INFORMATION (Source Grounded)</span>
                    </h4>
                    <span className="text-xs font-mono text-[var(--text-subtle)]">
                      {result.verifiedFields.length} verified fields
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.verifiedFields.map((field, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            {field.label}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Source verified
                          </span>
                        </div>
                        <div className="text-lg font-extrabold text-[var(--text-main)]">{field.value}</div>
                        {field.sourceText && (
                          <div className="text-[11px] text-[var(--text-subtle)] italic flex items-start gap-1 pt-1 border-t border-[var(--border-subtle)]">
                            <Quote className="w-3 h-3 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">&quot;{field.sourceText}&quot;</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: NEEDS REVIEW (If uncertain fields exist) */}
              {result.needsReviewFields && result.needsReviewFields.length > 0 && (
                <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/90 dark:bg-amber-950/20 border-2 border-amber-400 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-300">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>NEEDS REVIEW / UNCERTAIN INFORMATION</span>
                    </h4>
                    <span className="text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">
                      Zero-Hallucination Safe
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 leading-relaxed">
                    SIGHTLINE withheld the following fields because they could not be 100% verified from the source image.
                  </p>

                  <div className="space-y-2">
                    {result.needsReviewFields.map((field, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-white/80 dark:bg-black/40 border border-amber-300 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-extrabold text-amber-950 dark:text-amber-200">{field.label}</span>
                        <span className="text-amber-800 dark:text-amber-300 text-[11px]">{field.reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleRunAnalysis}
                      className="px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try Again</span>
                    </button>
                    <button
                      onClick={handleResetToUpload}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 text-amber-950 dark:text-amber-200 border border-amber-400 font-bold text-xs hover:bg-amber-100 transition-all cursor-pointer"
                    >
                      Upload Clearer Image
                    </button>
                  </div>
                </div>
              )}

              {/* Card: Document Actions & Deadlines */}
              {result.type === 'document' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Action Required */}
                  <div
                    className={`p-6 rounded-3xl border-2 space-y-2 sm:col-span-2 ${
                      (result as DocumentAnalysisResult).actionRequired.urgency === 'high'
                        ? 'bg-[var(--semantic-warning-bg)] border-[var(--semantic-warning-border)] text-[var(--semantic-warning-text)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-main)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">What do I need to do?</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold">
                      {(result as DocumentAnalysisResult).actionRequired.description}
                    </p>
                  </div>

                  {/* Amounts */}
                  {(result as DocumentAnalysisResult).amounts.map((amt, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-bold">
                        <DollarSign className="w-4 h-4 text-[var(--accent-primary)]" />
                        <span>{amt.label}</span>
                      </div>
                      <div className="text-2xl font-extrabold text-[var(--text-main)]">{amt.value}</div>
                      {amt.note && <p className="text-xs text-[var(--text-muted)]">{amt.note}</p>}
                    </div>
                  ))}

                  {/* Deadlines */}
                  {(result as DocumentAnalysisResult).deadlines.map((dl, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-bold">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>{dl.label}</span>
                      </div>
                      <div className="text-xl font-extrabold text-[var(--semantic-danger-text)]">{dl.date}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Card: Medicine Safety Visual Language */}
              {result.type === 'medicine' && (
                <div className="space-y-4">
                  {/* CALM PROFESSIONAL SAFETY NOTICE */}
                  <div className="p-6 rounded-3xl bg-amber-50/80 border-2 border-amber-300 text-amber-950 flex items-start gap-4">
                    <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs sm:text-sm">
                      <span className="font-extrabold uppercase tracking-wide text-amber-900 block">
                        Verified Medicine Safety Notice
                      </span>
                      <p className="leading-relaxed">{(result as MedicineAnalysisResult).medicalDisclaimer}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Dosage Strength (Visible on Label)
                      </span>
                      <div className="text-lg font-extrabold text-[var(--accent-primary)]">
                        {(result as MedicineAnalysisResult).dosageIfVerified?.strength || 'Verify with Pharmacist'}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {(result as MedicineAnalysisResult).dosageIfVerified?.instructions}
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Expiration Date
                      </span>
                      <div className="text-lg font-extrabold text-[var(--semantic-danger-text)]">
                        {(result as MedicineAnalysisResult).expiryIfDetected?.date || 'Check packaging stamp'}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Format: {(result as MedicineAnalysisResult).expiryIfDetected?.format || 'Visible packaging'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CONVERSATIONAL Q&A INTERFACE */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface-subtle)] border-2 border-[var(--border-subtle)] space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[var(--accent-primary)]" />
                    <span>Ask about this {result.type}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                    Ask any question to clarify details. Answers are generated strictly from the verified image.
                  </p>
                </div>

                {/* Suggested Chips */}
                <div className="flex flex-wrap gap-2">
                  {result.suggestedQuestions.map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => handleAskQuestion(sq)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-[var(--text-main)] transition-all shadow-xs cursor-pointer"
                      aria-label={`Ask suggestion: ${sq}`}
                    >
                      {sq}
                    </button>
                  ))}
                </div>

                {/* Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex gap-2"
                >
                  <label htmlFor="qa-input" className="sr-only">
                    Type your question about this {result.type}
                  </label>
                  <input
                    id="qa-input"
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder={`e.g., ${
                      result.type === 'document'
                        ? 'What is the final deadline to pay?'
                        : 'When does this medicine expire?'
                    }`}
                    className="flex-1 px-5 py-3.5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-subtle)] text-sm focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--focus-ring)] transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isAnsweringQuestion || !questionInput.trim()}
                    className="px-6 py-3.5 rounded-2xl bg-[var(--accent-primary)] text-white font-extrabold text-sm hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    aria-label="Submit question"
                  >
                    {isAnsweringQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Ask</span>
                  </button>
                </form>

                {/* Q&A Thread */}
                {qaHistory.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-subtle)]">
                      Recent Questions &amp; Spoken Answers
                    </span>
                    {qaHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                          <span className="text-[var(--accent-primary)] font-extrabold">Q: {item.question}</span>
                          <button
                            onClick={() => speakText(item.answer)}
                            className="flex items-center gap-1 text-xs font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
                            aria-label={`Listen to answer: ${item.answer}`}
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>Listen</span>
                          </button>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-main)] leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

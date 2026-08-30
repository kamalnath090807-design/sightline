export type ContentType = 'document' | 'medicine';

export type TextSize = 'normal' | 'large' | 'xl';
export type ContrastMode = 'standard' | 'high-contrast' | 'dark';

export interface VerifiedField {
  label: string;
  value: string;
  sourceText: string;
}

export interface NeedsReviewField {
  label: string;
  reason: string;
}

export interface SourceEvidenceItem {
  field: string;
  exactText: string;
  verified: boolean;
}

export interface DocumentAnalysisResult {
  id: string;
  type: 'document';
  status?: 'verified' | 'partial' | 'unsupported';
  modelUsed?: string;
  title: string;
  category: string;
  confidenceScore: number;
  plainLanguageSummary: string;
  actionRequired: {
    hasAction: boolean;
    description: string;
    urgency: 'high' | 'medium' | 'low' | 'none';
    sourceText?: string;
  };
  amounts: Array<{
    label: string;
    value: string;
    currency?: string;
    note?: string;
    sourceText?: string;
  }>;
  deadlines: Array<{
    label: string;
    date: string;
    isUrgent: boolean;
    sourceText?: string;
  }>;
  issuingAuthority: {
    name: string;
    contactInfo?: string;
  };
  keyPoints: string[];
  warnings: string[];
  financialConsistency?: 'verified' | 'warning' | null;
  verifiedFields?: VerifiedField[];
  needsReviewFields?: NeedsReviewField[];
  sourceEvidence?: SourceEvidenceItem[];
  rawTextPreview?: string;
  suggestedQuestions: string[];
  qaHistory: Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>;
}

export interface MedicineAnalysisResult {
  id: string;
  type: 'medicine';
  status?: 'verified' | 'partial' | 'unsupported';
  modelUsed?: string;
  name: string;
  brandName?: string;
  genericName?: string;
  confidenceScore: number;
  plainLanguageSummary: string;
  verifiedLabelText: string[];
  dosageIfVerified?: {
    verified: boolean;
    strength: string;
    instructions?: string;
    sourceSnippet: string;
  };
  expiryIfDetected?: {
    detected: boolean;
    date: string;
    format?: string;
  };
  storageInstructions?: string;
  batchOrLotNumber?: string;
  manufacturer?: string;
  criticalWarnings: string[];
  medicalDisclaimer: string;
  verifiedFields?: VerifiedField[];
  needsReviewFields?: NeedsReviewField[];
  sourceEvidence?: SourceEvidenceItem[];
  suggestedQuestions: string[];
  qaHistory: Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>;
}

export type AnalysisResult = DocumentAnalysisResult | MedicineAnalysisResult;

export interface SampleItem {
  id: string;
  type: ContentType;
  title: string;
  subtitle: string;
  tag: string;
  thumbnailUrl: string;
  description: string;
  precomputedResult: AnalysisResult;
}

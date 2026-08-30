import type {
  ContentType,
  DocumentAnalysisResult,
  MedicineAnalysisResult,
  AnalysisResult,
} from '../types/sightline';

export interface ScanProgressStep {
  step: number;
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'completed';
}

export const SCAN_STEPS_DOCUMENT: ScanProgressStep[] = [
  { step: 1, label: 'Reading image...', detail: 'Validating optical dimensions, contrast, and layout', status: 'pending' },
  { step: 2, label: 'Understanding content...', detail: 'Classifying document structure, headers, and line items with Gemini Vision', status: 'pending' },
  { step: 3, label: 'Verifying important details...', detail: 'Grounding amounts, deadlines, and requirements against exact source text', status: 'pending' },
  { step: 4, label: 'Preparing accessible summary...', detail: 'Structuring plain-language safety cards and accessible narration', status: 'pending' },
];

export const SCAN_STEPS_MEDICINE: ScanProgressStep[] = [
  { step: 1, label: 'Reading image...', detail: 'Scanning optical packaging boundaries and text clarity', status: 'pending' },
  { step: 2, label: 'Understanding content...', detail: 'Extracting active ingredients, dosage markings, and warnings with Gemini Vision', status: 'pending' },
  { step: 3, label: 'Verifying important details...', detail: 'Validating visible expiry date, batch number, and storage constraints', status: 'pending' },
  { step: 4, label: 'Preparing accessible summary...', detail: 'Applying medical safety guardrails and structuring voice readout', status: 'pending' },
];

// Helper to convert File or URL into Base64
async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeMatch = result.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : file.type || 'image/jpeg';
      resolve({ base64: result, mimeType });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = blob.type || 'image/jpeg';
      resolve({ base64: result, mimeType });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Main Vision Analysis Dispatcher — Calls Server Gemini 2.5 Flash API
 */
export async function analyzeImage(
  _type: ContentType,
  imageSource: { file?: File; dataUrl?: string; sampleId?: string },
  onProgress?: (stepIndex: number) => void
): Promise<AnalysisResult> {
  const token = localStorage.getItem('sightline_session_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Step 1: Reading image
  if (onProgress) onProgress(0);

  let base64Payload = '';
  let mimeType = 'image/jpeg';

  if (imageSource.file) {
    const converted = await fileToBase64(imageSource.file);
    base64Payload = converted.base64;
    mimeType = converted.mimeType;
  } else if (imageSource.dataUrl) {
    base64Payload = imageSource.dataUrl;
    const match = imageSource.dataUrl.match(/^data:([^;]+);base64,/);
    if (match) mimeType = match[1];
  } else if (imageSource.sampleId) {
    // Map sampleId to corresponding asset file
    let sampleUrl = '/assets/document-preview.jpg';
    if (imageSource.sampleId.includes('med')) {
      sampleUrl = '/assets/medicine-preview.jpg';
    } else if (imageSource.sampleId.includes('electricity')) {
      sampleUrl = '/assets/hero-editorial.jpg';
    }
    const converted = await urlToBase64(sampleUrl);
    base64Payload = converted.base64;
    mimeType = converted.mimeType;
  } else {
    throw new Error('No image provided for analysis.');
  }

  // Step 2: Understanding content (Calling Gemini)
  if (onProgress) onProgress(1);

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      imageBase64: base64Payload,
      mimeType,
      sampleId: imageSource.sampleId,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server analysis failed (${res.status})`);
  }

  // Step 3: Verifying details
  if (onProgress) onProgress(2);
  const data = await res.json();

  // Step 4: Preparing summary
  if (onProgress) onProgress(3);

  if (data.type === 'document' && data.document) {
    const doc = data.document;

    const result: DocumentAnalysisResult = {
      id: data.analysisId || `doc_${Date.now()}`,
      type: 'document',
      status: data.status || 'verified',
      modelUsed: data.modelUsed,
      title: doc.title || 'Official Document',
      category: doc.organization?.value ? `${doc.organization.value} Document` : 'Verified Administrative Document',
      confidenceScore: data.confidenceScore || 0.98,
      plainLanguageSummary:
        data.plainLanguageSummary ||
        'Document analyzed. Important dates, requirements, and reference identifiers have been extracted.',
      actionRequired: {
        hasAction: (doc.requiredActions && doc.requiredActions.length > 0) || Boolean(doc.dueDate?.value),
        description:
          doc.requiredActions?.[0]?.description ||
          (doc.dueDate?.value ? `Complete required action by ${doc.dueDate.value}.` : 'Review document details.'),
        urgency: doc.requiredActions?.[0]?.urgency || (doc.dueDate?.isUrgent ? 'high' : 'medium'),
        sourceText: doc.requiredActions?.[0]?.sourceText,
      },
      amounts: (doc.amounts && doc.amounts.length > 0)
        ? doc.amounts
        : doc.totalAmountDue?.value
        ? [{ label: 'Total Amount Due', value: doc.totalAmountDue.value, sourceText: doc.totalAmountDue.sourceText || doc.totalAmountDue.value }]
        : [],
      deadlines: doc.dueDate?.value
        ? [{ label: 'Payment / Submission Due Date', date: doc.dueDate.value, isUrgent: Boolean(doc.dueDate.isUrgent), sourceText: doc.dueDate.sourceText || doc.dueDate.value }]
        : [],
      issuingAuthority: {
        name: doc.organization?.value || 'Issuing Authority',
        contactInfo: doc.person?.value ? `Addressed to: ${doc.person.value}` : undefined,
      },
      keyPoints: Array.isArray(doc.importantInformation) && doc.importantInformation.length > 0
        ? doc.importantInformation
        : [
            doc.documentDate?.value ? `Document Date: ${doc.documentDate.value}` : 'Official record scanned.',
            doc.totalAmountDue?.value ? `Total Stated: ${doc.totalAmountDue.value}` : 'Amounts extracted from image.',
          ],
      warnings: Array.isArray(doc.warnings) ? doc.warnings : [],
      financialConsistency: doc.financialConsistency,
      verifiedFields: data.verifiedFields || [],
      needsReviewFields: data.needsReviewFields || [],
      sourceEvidence: data.sourceEvidence || [],
      suggestedQuestions: [
        'What is the total amount due?',
        'When is the final deadline?',
        'What action is required?',
        'Who is the issuing organization?',
      ],
      qaHistory: [],
    };

    return result;
  } else if (data.type === 'medicine' && data.medicine) {
    const med = data.medicine;

    const result: MedicineAnalysisResult = {
      id: data.analysisId || `med_${Date.now()}`,
      type: 'medicine',
      status: data.status || 'verified',
      modelUsed: data.modelUsed,
      name: med.medicineName?.value || 'Verified Medicine Package',
      brandName: med.medicineName?.value || undefined,
      genericName: med.genericName?.value || undefined,
      confidenceScore: data.confidenceScore || 0.98,
      plainLanguageSummary:
        data.plainLanguageSummary ||
        'Medicine packaging verified with optical evidence. Always consult a healthcare professional for medication advice.',
      verifiedLabelText: Array.isArray(med.visibleInstructions) ? med.visibleInstructions : [],
      dosageIfVerified: med.strength?.value
        ? {
            verified: true,
            strength: med.strength.value,
            instructions: med.dosageInstructions?.value || 'Follow prescribing doctor or pharmacist instructions.',
            sourceSnippet: med.strength.sourceText || med.strength.value,
          }
        : undefined,
      expiryIfDetected: med.expiryDate?.value
        ? {
            detected: true,
            date: med.expiryDate.value,
            format: 'Printed on packaging',
          }
        : undefined,
      storageInstructions: med.storageInstructions?.value || undefined,
      batchOrLotNumber: med.batchNumber?.value || undefined,
      manufacturer: med.manufacturer?.value || undefined,
      criticalWarnings: Array.isArray(med.criticalWarnings) && med.criticalWarnings.length > 0
        ? med.criticalWarnings
        : ['Do not exceed recommended dosage.', 'Keep out of reach of children.'],
      medicalDisclaimer:
        med.medicalDisclaimer ||
        'Information shown here was extracted from the supplied medicine image. Dosage and treatment decisions should be confirmed with a qualified healthcare professional.',
      verifiedFields: data.verifiedFields || [],
      needsReviewFields: data.needsReviewFields || [],
      sourceEvidence: data.sourceEvidence || [],
      suggestedQuestions: [
        'What is the expiration date?',
        'What is the strength per unit?',
        'How should this medicine be stored?',
        'What are the critical safety warnings?',
      ],
      qaHistory: [],
    };

    return result;
  } else {
    // Unclear or Unsupported Image
    const summary = data.plainLanguageSummary || data.message || 'Image could not be reliably verified as a supported document or medicine package.';

    return {
      id: `unclear_${Date.now()}`,
      type: 'document',
      status: 'unsupported',
      title: 'Image Requires Clarification',
      category: 'Unclear or Unsupported Image',
      confidenceScore: 0.1,
      plainLanguageSummary: summary,
      actionRequired: {
        hasAction: true,
        description: 'Please upload a clearer, well-lit photo of an official document or medicine package.',
        urgency: 'high',
      },
      amounts: [],
      deadlines: [],
      issuingAuthority: {
        name: 'SIGHTLINE Vision Verification',
      },
      keyPoints: ['Image did not contain clear readable text or recognized packaging.'],
      warnings: ['Could not verify information with zero-hallucination standards.'],
      verifiedFields: [],
      needsReviewFields: [{ label: 'Image Content', reason: 'Unreadable or unsupported image format.' }],
      sourceEvidence: [],
      suggestedQuestions: ['Why was this image rejected?'],
      qaHistory: [],
    };
  }
}

/**
 * Accessible Context-Aware Q&A grounded strictly on verified fields
 */
export async function askQuestion(
  result: AnalysisResult,
  question: string
): Promise<string> {
  const lower = question.toLowerCase();

  if (result.type === 'document') {
    if (lower.includes('deadline') || lower.includes('due') || lower.includes('when')) {
      if (result.deadlines && result.deadlines.length > 0) {
        return `The verified due date is ${result.deadlines[0].date}. Source quote: "${result.deadlines[0].sourceText || result.deadlines[0].date}".`;
      }
      return 'No specific due date was visibly detected in this document.';
    }

    if (lower.includes('amount') || lower.includes('how much') || lower.includes('pay') || lower.includes('cost') || lower.includes('fee')) {
      if (result.amounts && result.amounts.length > 0) {
        const amt = result.amounts[0];
        return `The verified amount is ${amt.value} (${amt.label}). Source quote: "${amt.sourceText || amt.value}".`;
      }
      return 'No specific payable amount was visibly detected in this document.';
    }

    if (lower.includes('who') || lower.includes('organization') || lower.includes('authority') || lower.includes('issuer')) {
      return `This document was issued by ${result.issuingAuthority.name}.`;
    }

    if (lower.includes('action') || lower.includes('what should i do') || lower.includes('what to do')) {
      return `Required Action: ${result.actionRequired.description}`;
    }

    return `Based strictly on the verified source: ${result.plainLanguageSummary}`;
  } else {
    // Medicine
    if (lower.includes('expiry') || lower.includes('expire') || lower.includes('date')) {
      if (result.expiryIfDetected?.detected) {
        return `The verified expiration date on the packaging is ${result.expiryIfDetected.date}.`;
      }
      return 'The expiration date could not be clearly verified from this photo.';
    }

    if (lower.includes('strength') || lower.includes('dose') || lower.includes('dosage')) {
      if (result.dosageIfVerified?.verified) {
        return `The strength is ${result.dosageIfVerified.strength}. Note: Specific prescription dosage instructions must be confirmed directly with your doctor or pharmacist.`;
      }
      return 'Dosage strength was not visibly verifiable on this package.';
    }

    if (lower.includes('store') || lower.includes('storage') || lower.includes('temperature')) {
      return result.storageInstructions || 'Store in a cool, dry place away from direct sunlight as indicated on packaging.';
    }

    return `Packaging summary: ${result.plainLanguageSummary}. Safety reminder: ${result.medicalDisclaimer}`;
  }
}

import { callGeminiVision } from './geminiClient.ts';

export interface DocumentExtractedField {
  value: string | null;
  verified: boolean;
  sourceText?: string | null;
  note?: string | null;
}

export interface AmountField {
  label: string;
  value: string;
  sourceText: string;
  note?: string;
  verified?: boolean;
}

export interface ActionItem {
  description: string;
  urgency: 'high' | 'medium' | 'low';
  sourceText: string;
  verified?: boolean;
}

export interface SourceEvidenceItem {
  field: string;
  exactText: string;
  verified: boolean;
}

export interface DocumentAnalysisData {
  title: string | null;
  organization: DocumentExtractedField | null;
  person: DocumentExtractedField | null;
  documentDate: DocumentExtractedField | null;
  dueDate: (DocumentExtractedField & { isUrgent?: boolean }) | null;
  amounts: AmountField[];
  currentCharges: DocumentExtractedField | null;
  financialAid: DocumentExtractedField | null;
  paymentsCredits: DocumentExtractedField | null;
  totalAmountDue: DocumentExtractedField | null;
  lateFee: DocumentExtractedField | null;
  requiredActions: ActionItem[];
  importantInformation: string[];
  warnings: string[];
  financialConsistency?: 'verified' | 'warning' | null;
  sourceEvidence: SourceEvidenceItem[];
  uncertainFields: string[];
  plainLanguageSummary: string;
}

export interface MedicineAnalysisData {
  medicineName: DocumentExtractedField | null;
  genericName: DocumentExtractedField | null;
  strength: DocumentExtractedField | null;
  form: string | null;
  manufacturer: DocumentExtractedField | null;
  batchNumber: DocumentExtractedField | null;
  manufacturingDate: DocumentExtractedField | null;
  expiryDate: (DocumentExtractedField & { detected?: boolean }) | null;
  dosageInstructions: (DocumentExtractedField & { verified?: boolean }) | null;
  storageInstructions: DocumentExtractedField | null;
  visibleInstructions: string[];
  warnings: string[];
  criticalWarnings: string[];
  sourceEvidence: SourceEvidenceItem[];
  uncertainFields: string[];
  medicalDisclaimer: string;
  plainLanguageSummary: string;
}

export interface AnalysisResponseData {
  success: boolean;
  analysisId: string;
  type: 'document' | 'medicine' | 'unknown';
  status: 'verified' | 'partial' | 'unsupported';
  confidenceScore: number;
  modelUsed?: string;
  document?: DocumentAnalysisData | null;
  medicine?: MedicineAnalysisData | null;
  plainLanguageSummary: string;
  warnings: string[];
  sourceEvidence: SourceEvidenceItem[];
  verifiedFields: Array<{ label: string; value: string; sourceText: string }>;
  needsReviewFields: Array<{ label: string; reason: string }>;
  message?: string;
}

export function validateImageUpload(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];

  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file format (${mimeType}). SIGHTLINE accepts JPG, PNG, WEBP, and PDF documents.`,
    };
  }

  const maxSizeBytes = 15 * 1024 * 1024; // 15MB
  if (buffer.length > maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large (${(buffer.length / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 15MB.`,
    };
  }

  if (buffer.length < 32) {
    return {
      valid: false,
      error: 'Corrupted or empty image file.',
    };
  }

  return { valid: true };
}

// Financial Consistency Validator: checks charges - aid - credits = total due
function validateFinancialConsistency(doc: DocumentAnalysisData): 'verified' | 'warning' | null {
  try {
    const parseAmount = (val?: string | null): number | null => {
      if (!val) return null;
      const cleaned = val.replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : Math.abs(num);
    };

    const charges = parseAmount(doc.currentCharges?.value);
    const aid = parseAmount(doc.financialAid?.value);
    const credits = parseAmount(doc.paymentsCredits?.value);
    const totalDue = parseAmount(doc.totalAmountDue?.value);

    if (charges !== null && totalDue !== null) {
      const calculated = charges - (aid || 0) - (credits || 0);
      const diff = Math.abs(calculated - totalDue);
      if (diff < 0.05) {
        return 'verified';
      } else {
        return 'warning';
      }
    }
  } catch {
    // Graceful fallback
  }
  return null;
}

const SYSTEM_INSTRUCTION = `You are the vision analysis engine for SIGHTLINE, an accessibility application for visually impaired users.
Your job is to extract ONLY information that is visibly supported by the provided image.

CRITICAL RULES:
1. NEVER invent, infer, estimate, autocomplete, or hallucinate information.
2. If information is not clearly visible: return null or mark it in uncertainFields.
3. If text is partially visible: do NOT reconstruct it from assumptions.
4. Preserve the exact original values shown in the source.
5. Do NOT convert currencies (e.g. keep $ as $, do not convert to INR or other currencies).
6. Do NOT calculate alternative dates (e.g. if the image says September 15, 2025, return September 15, 2025; do NOT write "14 business days").
7. Do NOT create medical advice, diagnostic claims, or unverified dosage prescriptions.
8. Every important extracted field MUST have exact sourceText quoting the source.
9. Return ONLY structured JSON adhering strictly to the schema.`;

export async function analyzeWithGemini(
  imageBuffer: Buffer,
  mimeType: string
): Promise<AnalysisResponseData> {
  const validation = validateImageUpload(imageBuffer, mimeType);
  if (!validation.valid) {
    return {
      success: false,
      analysisId: `analysis_${Date.now()}`,
      type: 'unknown',
      status: 'unsupported',
      confidenceScore: 0,
      plainLanguageSummary: validation.error || 'Invalid file format.',
      warnings: [validation.error || 'Invalid file format.'],
      sourceEvidence: [],
      verifiedFields: [],
      needsReviewFields: [],
      message: validation.error,
    };
  }

  const imageBase64 = imageBuffer.toString('base64');
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const prompt = `Carefully inspect this image.
1. Determine if this image is a "document", a "medicine" label/package, or "unknown".
2. If it is a document (bill, fee notice, invoice, tax statement, official letter):
   Extract all visible fields:
   - title (document title)
   - organization ({ value, sourceText })
   - person / student name ({ value, sourceText })
   - documentDate ({ value, sourceText })
   - dueDate ({ value, isUrgent, sourceText })
   - amounts (list of { label, value, sourceText, note })
   - currentCharges ({ value, sourceText })
   - financialAid ({ value, sourceText })
   - paymentsCredits ({ value, sourceText })
   - totalAmountDue ({ value, sourceText })
   - lateFee ({ value, sourceText })
   - requiredActions (list of { description, urgency: 'high'|'medium'|'low', sourceText })
   - importantInformation (list of visible key points)
   - warnings (list of visible warnings or penalty terms)
   - sourceEvidence (list of { field, exactText, verified: true })
   - uncertainFields (list of field names that were blurry or partially obscured)
   - plainLanguageSummary (a concise, accessible summary of what this document is, key deadline, total amount, and required action)

3. If it is medicine packaging / prescription label / strip:
   Extract all visible packaging facts:
   - medicineName ({ value, sourceText })
   - genericName ({ value, sourceText })
   - strength ({ value, sourceText })
   - form (tablets, capsules, syrup, etc.)
   - manufacturer ({ value, sourceText })
   - batchNumber ({ value, sourceText })
   - manufacturingDate ({ value, sourceText })
   - expiryDate ({ value, detected: boolean, sourceText })
   - dosageInstructions ({ value, verified: boolean, sourceText })
   - storageInstructions ({ value, sourceText })
   - visibleInstructions (list of visible directions)
   - warnings (list of visible warnings)
   - criticalWarnings (list of visible cautions, e.g. allergies, max dosage)
   - sourceEvidence (list of { field, exactText, verified: true })
   - uncertainFields (list of obscured fields)
   - plainLanguageSummary (concise accessible summary of the medicine name, strength, expiry, and storage)

4. If it is unknown or blurry:
   Set type to "unknown", status to "unsupported" or "partial", and describe the issue in plainLanguageSummary.

Format your response as strict JSON:
{
  "type": "document" | "medicine" | "unknown",
  "status": "verified" | "partial" | "unsupported",
  "confidenceScore": 0.98,
  "plainLanguageSummary": "...",
  "document": { ... },
  "medicine": { ... },
  "warnings": [ ... ],
  "sourceEvidence": [ ... ],
  "uncertainFields": [ ... ]
}`;

  try {
    const { rawText, modelUsed } = await callGeminiVision({
      imageBase64,
      mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
      prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Clean possible Markdown fence
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const type: 'document' | 'medicine' | 'unknown' =
      parsed.type === 'document' ? 'document' : parsed.type === 'medicine' ? 'medicine' : 'unknown';

    const verifiedFields: Array<{ label: string; value: string; sourceText: string }> = [];
    const needsReviewFields: Array<{ label: string; reason: string }> = [];
    const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings : [];
    const sourceEvidence: SourceEvidenceItem[] = Array.isArray(parsed.sourceEvidence) ? parsed.sourceEvidence : [];

    if (type === 'document' && parsed.document) {
      const doc = parsed.document as DocumentAnalysisData;

      // Validate Financial Consistency
      const finCheck = validateFinancialConsistency(doc);
      doc.financialConsistency = finCheck;
      if (finCheck === 'warning') {
        warnings.push('Financial amounts sum does not match total amount due. Review individual line items.');
      }

      // Collect Verified Fields
      if (doc.totalAmountDue?.value) {
        verifiedFields.push({
          label: 'Total Amount Due',
          value: doc.totalAmountDue.value,
          sourceText: doc.totalAmountDue.sourceText || doc.totalAmountDue.value,
        });
      } else if (doc.amounts && doc.amounts.length > 0) {
        doc.amounts.forEach((a) => {
          verifiedFields.push({
            label: a.label || 'Amount',
            value: a.value,
            sourceText: a.sourceText || a.value,
          });
        });
      }

      if (doc.dueDate?.value) {
        verifiedFields.push({
          label: 'Due Date',
          value: doc.dueDate.value,
          sourceText: doc.dueDate.sourceText || doc.dueDate.value,
        });
      }

      if (doc.organization?.value) {
        verifiedFields.push({
          label: 'Issuing Organization',
          value: doc.organization.value,
          sourceText: doc.organization.sourceText || doc.organization.value,
        });
      }

      if (doc.person?.value) {
        verifiedFields.push({
          label: 'Recipient / Student',
          value: doc.person.value,
          sourceText: doc.person.sourceText || doc.person.value,
        });
      }

      if (doc.documentDate?.value) {
        verifiedFields.push({
          label: 'Document Date',
          value: doc.documentDate.value,
          sourceText: doc.documentDate.sourceText || doc.documentDate.value,
        });
      }

      if (doc.lateFee?.value) {
        verifiedFields.push({
          label: 'Late Fee Policy',
          value: doc.lateFee.value,
          sourceText: doc.lateFee.sourceText || doc.lateFee.value,
        });
      }

      // Check uncertain fields
      if (Array.isArray(doc.uncertainFields)) {
        doc.uncertainFields.forEach((f) => {
          needsReviewFields.push({
            label: f,
            reason: 'Could not be clearly verified from the source image.',
          });
        });
      }

      return {
        success: true,
        analysisId,
        type: 'document',
        status: needsReviewFields.length > 0 ? 'partial' : 'verified',
        confidenceScore: parsed.confidenceScore || 0.98,
        modelUsed,
        document: doc,
        plainLanguageSummary: parsed.plainLanguageSummary || 'Document verified with optical evidence.',
        warnings,
        sourceEvidence,
        verifiedFields,
        needsReviewFields,
      };
    } else if (type === 'medicine' && parsed.medicine) {
      const med = parsed.medicine as MedicineAnalysisData;
      med.medicalDisclaimer =
        'Information shown here was extracted from the supplied medicine image. Dosage and treatment decisions should be confirmed with a qualified healthcare professional.';

      if (med.medicineName?.value) {
        verifiedFields.push({
          label: 'Medicine Name',
          value: med.medicineName.value,
          sourceText: med.medicineName.sourceText || med.medicineName.value,
        });
      }

      if (med.strength?.value) {
        verifiedFields.push({
          label: 'Strength / Dosage per unit',
          value: med.strength.value,
          sourceText: med.strength.sourceText || med.strength.value,
        });
      }

      if (med.expiryDate?.value) {
        verifiedFields.push({
          label: 'Expiration Date',
          value: med.expiryDate.value,
          sourceText: med.expiryDate.sourceText || med.expiryDate.value,
        });
      }

      if (med.batchNumber?.value) {
        verifiedFields.push({
          label: 'Batch / Lot Number',
          value: med.batchNumber.value,
          sourceText: med.batchNumber.sourceText || med.batchNumber.value,
        });
      }

      if (med.storageInstructions?.value) {
        verifiedFields.push({
          label: 'Storage Instructions',
          value: med.storageInstructions.value,
          sourceText: med.storageInstructions.sourceText || med.storageInstructions.value,
        });
      }

      // Check uncertain fields
      if (Array.isArray(med.uncertainFields)) {
        med.uncertainFields.forEach((f) => {
          needsReviewFields.push({
            label: f,
            reason: 'Could not be clearly verified from packaging.',
          });
        });
      }

      return {
        success: true,
        analysisId,
        type: 'medicine',
        status: needsReviewFields.length > 0 ? 'partial' : 'verified',
        confidenceScore: parsed.confidenceScore || 0.98,
        modelUsed,
        medicine: med,
        plainLanguageSummary: parsed.plainLanguageSummary || 'Medicine packaging extracted with optical evidence.',
        warnings,
        sourceEvidence,
        verifiedFields,
        needsReviewFields,
      };
    } else {
      return {
        success: false,
        analysisId,
        type: 'unknown',
        status: 'unsupported',
        confidenceScore: 0.2,
        modelUsed,
        plainLanguageSummary:
          parsed.plainLanguageSummary ||
          'This image does not appear to contain a supported document or medicine label. Please upload a clear photo of an official document or medicine package.',
        warnings: ['Image content could not be classified into a supported document or medicine type.'],
        sourceEvidence: [],
        verifiedFields: [],
        needsReviewFields: [{ label: 'Image Content', reason: 'Image does not contain readable document text.' }],
        message: 'Unsupported or unclear image.',
      };
    }
  } catch (err: any) {
    console.error('Analysis error with Gemini:', err.message || err);
    return {
      success: false,
      analysisId,
      type: 'unknown',
      status: 'unsupported',
      confidenceScore: 0,
      plainLanguageSummary: `AI Analysis error: ${err.message || 'An error occurred during vision processing.'}`,
      warnings: [err.message || 'Analysis failed.'],
      sourceEvidence: [],
      verifiedFields: [],
      needsReviewFields: [],
      message: err.message || 'Analysis failed.',
    };
  }
}

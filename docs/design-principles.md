# SIGHTLINE — The 6 Core Design Principles

Accessibility in SIGHTLINE is not an afterthought or a settings menu item. It is the foundational design constraint that guides every interaction, color choice, DOM hierarchy, and AI processing step.

---

## Principle 1 — Absolute Independence
> **"The user must be able to initiate, comprehend, and conclude the primary task without sighted intervention."**

- **Implementation**:
  - Two massive, immediate landing page actions: **📄 Understand a Document** and **💊 Understand Medicine**.
  - Direct single-stroke keyboard shortcuts (`Alt+1`, `Alt+2`, `Alt+V`, `Alt+T`, `Alt+C`, `Alt+H`, `Escape`).
  - No required account creation, complex dashboards, or nested submenus.

---

## Principle 2 — Progressive Information Hierarchy
> **"Critical actionable information must always precede incidental administrative metadata."**

- **Implementation**:
  - Top visual and auditory priority is given to:
    1. **What is this?** (1-sentence Plain Language explanation)
    2. **What action is required?** (With urgency rating)
    3. **How much and when?** (Monetary amounts and calendar deadlines)
  - Secondary metadata (such as reference tracking codes and office addresses) is neatly grouped below.

---

## Principle 3 — Dual Audio-Visual Redundancy
> **"Every piece of visual information must be synchronously accessible through natural, controllable speech."**

- **Implementation**:
  - Integrated browser-native Web Speech API narration.
  - Granular playback rate controls (0.85x, 1.0x, 1.25x, 1.5x).
  - Synchronized sentence highlighting spotlights the visual text as it is spoken aloud.
  - Zero reliance on color alone to communicate state.

---

## Principle 4 — Minimal Cognitive Load
> **"Do not force users to search for meaning through dense paragraphs of legalistic fine print."**

- **Implementation**:
  - Atomic structured cards for Amounts, Dates, Actions, and Warnings.
  - Curated suggested question chips (e.g., *"What is the deadline?"*, *"When does this expire?"*) for 1-tap clarification.
  - 3-step mental model: **01 Upload → 02 Understand → 03 Listen**.

---

## Principle 5 — Error & Optical Transparency
> **"The system must clearly distinguish verified visible information from unverified or missing data."**

- **Implementation**:
  - High-confidence OCR extraction percentage is explicitly announced.
  - If a date or dosage is obscured, the system explicitly states *"This information could not be verified from the image"* instead of guessing.

---

## Principle 6 — Safety Over Completeness (Zero-Hallucination)
> **"Never fabricate, interpolate, or extrapolate clinical medical advice or unverified dosages."**

- **Implementation**:
  - Strict medical safety guardrail system prompt.
  - Prominent pharmacist verification disclaimers on every medicine card.
  - Contextual Q&A refusals when users ask for off-label dosage advice or diagnostic guidance.

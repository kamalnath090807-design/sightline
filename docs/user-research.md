# SIGHTLINE — User Research & Problem Analysis

## 1. Problem Statement

> **"Choose a group of people whose specific needs are often overlooked in technology. Design a solution that genuinely serves their needs."**

### Chosen Target User Group
**Visually impaired individuals** (including low-vision users, individuals with macular degeneration, cataracts, tunnel vision, and total blindness).

---

## 2. Identified Real-World Pain Points

Through user scenario mapping and analysis of existing accessibility tools, five primary systemic bottlenecks were identified:

### Pain Point 1: Loss of Autonomy & Privacy with Physical Mail
Physical mail remains the primary delivery channel for government notices, tax assessments, bank disputes, and college fee reminders. 
- *Current Workaround*: Visually impaired users must wait for family members, neighbors, or caregivers to read sensitive personal mail.
- *Impact*: Direct compromise of personal financial privacy and independence.

### Pain Point 2: High-Hazard Pharmaceutical Packaging
Over-the-counter and prescription medication labels utilize compact, high-density 6pt–8pt fonts printed on reflective foil blister packs or curved amber bottles.
- *Current Workaround*: Sighted assistance or high-magnification lenses under bright light.
- *Impact*: Inability to independently verify whether a blister pack is an antibiotic or a painkiller; danger of consuming expired medication or exceeding daily dosage limits.

### Pain Point 3: The "Wall of Text" Flaw in Generic AI Tools
Standard OCR applications and general-purpose conversational LLMs dump verbatim transcripts containing hundreds of legalistic boilerplate words.
- *Impact*: Screen reader users are subjected to 3–5 minutes of irrelevant header text before hearing the actual due date or payment amount.

### Pain Point 4: Fragile Cloud Dependencies & Complex Menus
Many accessibility apps are buried inside multi-tiered enterprise dashboards requiring complex sign-ins and multi-step configurations.
- *Impact*: High cognitive friction that discourages everyday spontaneous use.

---

## 3. User Personas

### Persona A: Arthur (Low Vision / Macular Degeneration)
- **Age**: 68
- **Visual Ability**: Severe central vision loss; relies on high contrast and large font scaling.
- **Key Task**: Needs to know if his property tax assessment has increased and when the payment window closes.
- **How Sightline Solves It**: 1-click upload provides an instant high-contrast summary showing "$1,240.00 due by October 31" with 1-click audio narration.

### Persona B: Priya (Total Blindness / Screen Reader User)
- **Age**: 24, University Student
- **Visual Ability**: Blind; uses NVDA and keyboard shortcuts.
- **Key Task**: Received an urgent letter from the college bursar and needs to know if her semester registration is locked.
- **How Sightline Solves It**: Hits `Alt+1` to open Document mode, uploads scan, and hears the plain-language summary and deadline read aloud immediately through Web Speech API.

---

## 4. User Journey & Comparison Matrix

| Step in Workflow | Traditional Approach | Generic AI App | **SIGHTLINE Solution** |
| :--- | :--- | :--- | :--- |
| **1. Starting the Task** | Ask someone for help | Navigate complex login & menus | **Direct 2-button choice: Documents or Medicine** |
| **2. Processing** | Wait indefinitely | Raw OCR text dump (500+ words) | **Progressive audio-announced 4-stage pipeline** |
| **3. Understanding** | Confusion over fine print | High cognitive reading fatigue | **Atomic structured cards: What, Amount, Deadline** |
| **4. Medicine Verification** | Dangerous guesswork | Hallucinated medical advice | **Strict zero-hallucination pharmacist safety banner** |
| **5. Querying Details** | Must re-read whole letter | Generic chatbot answers | **Contextual Q&A with strict safety boundaries** |

# SIGHTLINE — Understand What Matters. Independently.

> **Competition Project: 90-Minute Prompt Engineering Competition (Problem Statement 1)**  
> **Target User Group**: Visually Impaired Users  
> **Core Mission**: Transform dense printed documents and high-risk medicine labels into clear, structured, source-grounded facts and accessible spoken audio.

---

## 1. Executive Summary & Problem

Visually impaired individuals frequently face profound barriers to independence when trying to read printed, physical information:
- **Private Official Mail**: Sensitive fee notices, utility bills, disconnection warnings, and tax assessments cannot be read without relying on sighted family members or neighbors.
- **Pharmaceutical Packaging**: Prescription bottles and blister strips use tiny 6pt–8pt text with reflective foil that poses dangerous risks if dosages or expiry dates are misread.
- **Generic AI Flaws**: Existing OCR tools dump unorganized 500-word blocks of text that overwhelm screen reader users.

**SIGHTLINE** solves this by acting as an **Accessibility Transformation Layer** that extracts only verified atomic facts (What is this?, What action is needed?, How much?, When is it due?) and speaks them aloud instantly through the browser's native Web Speech API.

---

## 2. Key Product Features

### 📄 1. Understand a Document
- Instant vision analysis of university notices, utility bills, property tax assessments, and bank letters.
- Extracts **Document Category**, **1-Sentence Plain Language Summary**, **Action Required with Urgency Rating**, **Monetary Amounts**, and **Deadlines**.
- Grounded Source Quotes: Highlights extracted values with `✓ Source verified` badges and exact quoted lines from the image.
- 1-Click interactive Q&A: Ask questions like *"What is the deadline?"* or *"How much do I need to pay?"*.

### 💊 2. Understand Medicine (Zero-Hallucination Protocol)
- Safely decodes prescription bottles, blister packs, and antibiotic strips.
- Extracts verified packaging text, dosage strengths, expiration dates, and critical manufacturer warnings.
- **Strict Medical Safety Guardrail**: Never hallucinates dosage frequency or clinical diagnosis; displays clear pharmacist verification banners.

### 🔊 3. Integrated Spoken Audio Narration
- Uses browser-native `SpeechSynthesis` (zero external latency).
- Play, pause, resume, restart, and granular speed controls (0.85x, 1.0x, 1.25x, 1.5x).
- **Synchronized Sentence Spotlighting**: Highlights the visual sentence on screen as it is spoken.

### ♿ 4. WCAG 2.2 AAA Accessibility Suite
- **Text Sizing Engine**: Normal (16px), Large (18.5px), Extra Large (21.5px) scaling across all components.
- **Contrast Switcher**: Standard Warm Editorial (`8.2:1`), High Contrast AAA (`21:1` pure black/white), and OLED Dark Mode.
- **Keyboard Navigation**: High-visibility 3px focus rings; global single-stroke shortcuts (`Alt+1`, `Alt+2`, `Alt+V`, `Alt+T`, `Alt+C`, `Alt+H`, `Escape`).
- **Live Screen Reader Announcements**: `aria-live="polite"` & `aria-live="assertive"` regions announce progressive scanning stages.

### 🔐 5. Complete Authentication & User Data Isolation
- Sign Up, Email Verification, Login, Synced Preferences, and User-Isolated Document/Medicine History.
- Zero plaintext passwords: Cryptographically hashed using **PBKDF2-HMAC-SHA512** (100,000 rounds) with unique 16-byte random salts.
- Session Management: HTTP-only cookies and Bearer tokens with 30-day lifespans and rate limiting.

### ✨ 6. Animated Galaxy & Pinned Storytelling
- WebGL OGL Galaxy canvas with pale-blue atmospheric shader in Light mode and deep celestial starfield in Dark mode.
- Apple-inspired pinned GSAP ScrollTrigger timeline illustrating the 6-step transformation from dense raw documents to plain-language audio.

---

## 3. System Architecture

```text
Browser / Client (React 19 + TypeScript + Vite)
       │
       ▼
SIGHTLINE Full-Stack Web Service (Node.js)
       ├── /api/health ──────────────► Health check endpoint (HTTP 200)
       ├── /api/auth/* ──────────────► PBKDF2 hashing, sessions, verification
       ├── /api/analyze ─────────────► Upload validation & Gemini Vision dispatcher
       │                                     │
       │                                     ▼
       │                              Gemini 2.5 Flash
       │                              (Strict Zero-Hallucination JSON)
       │
       └── Static Asset Serving ─────► dist/ (HTML, JS, CSS, Media) + SPA Fallback
```

---

## 4. Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS Design Tokens, Tailwind CSS v4 utilities
- **AI Vision Engine**: Google Gemini 2.5 Flash (`@google/genai` SDK)
- **Backend & Production Server**: Node.js HTTP Service with SPA routing fallback
- **Graphics & Motion**: OGL (WebGL Galaxy Canvas), GSAP ScrollTrigger, Lenis Smooth Scroll
- **Audio & Accessibility**: Browser Web Speech API (`window.speechSynthesis`), WAI-ARIA 1.2
- **Persistence**: Thread-safe atomic JSON store with automated timestamped backups

---

## 5. Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# Server Environment
NODE_ENV=production
PORT=10000

# Gemini Vision Model Configuration (Server-Side Only)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Application URLs & Sessions
SESSION_SECRET=your_random_session_secret_here
APP_URL=https://your-sightline-app.onrender.com

# Persistence Storage Path
DATA_DIR=./data

# Authentication Demo Mode
AUTH_DEMO_MODE=true
```

> **Security Note**: `GEMINI_API_KEY` is loaded strictly in Node.js server context. It is never exposed in browser bundles or client requests.

---

## 6. Local Development & Testing

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build optimized production bundle
npm run build

# 4. Start production server locally
npm start
```

---

## 7. Production Deployment on Render

SIGHTLINE is designed as a **Render Web Service** that builds the frontend and serves both the API and SPA from a single instance.

### Step-by-Step Render Setup:
1. Push this repository to your GitHub account (`sightline`).
2. Log into [Render Dashboard](https://dashboard.render.com/) and click **New + > Web Service**.
3. Select your `sightline` repository.
4. Configure the service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add the Environment Variables:
   - `NODE_ENV` = `production`
   - `GEMINI_MODEL` = `gemini-2.5-flash`
   - `GEMINI_API_KEY` = `[Your Gemini API Key]`
   - `SESSION_SECRET` = `[Random 32-character string]`
   - `DATA_DIR` = `./data`
6. Click **Deploy Web Service**.
7. Once deployed, verify `https://your-service.onrender.com/api/health`.

---

## 8. Security & Privacy Guarantees

1. **Server-Side API Keys**: The Gemini API key never reaches the browser.
2. **Password Cryptography**: Passwords are saved only as `$pbkdf2-sha512$100000$<salt>$<hash>`. Original passwords cannot be reversed.
3. **User Data Isolation**: User A cannot access User B's documents or medicine analyses.
4. **No Health Claims**: SIGHTLINE extracts visible text only and enforces conservative safety notices.

---

## 9. Known Prototype Limitations

- **Storage Layer**: The JSON persistence layer is a competition prototype database. For enterprise production, migrate `server/db/` to PostgreSQL or Supabase.
- **Image Quality**: Optical transcription requires sufficient lighting and focus.
- **Medical Scope**: SIGHTLINE is an accessibility reader, not a diagnostic or prescribing medical device.

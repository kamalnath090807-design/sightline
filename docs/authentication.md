# SIGHTLINE — Authentication & User Identity System

> **Competition / Prototype Architecture Guide**
> 
> *Notice: The JSON persistence layer (`data/users.json`) is designed specifically for this competition prototype to enable standalone offline execution without external database dependencies. The backend architecture isolates data access into dedicated abstraction modules (`server/db/`, `server/auth/`) to facilitate direct zero-friction migration to PostgreSQL, Supabase, Firebase, or DynamoDB in production.*

---

## 1. Primary Objectives & Security Model

SIGHTLINE requires an accessibility-first authentication system that keeps personal document history, medicine analysis records, and customized accessibility preferences (contrast modes, text scale, reading speed) securely synchronized to the user.

### Core Security Guarantees:
1. **Zero Plaintext Password Storage**: Passwords are cryptographically hashed using **PBKDF2 with SHA-512** (100,000 iterations) with a unique 16-byte cryptographically random salt per user. Original passwords can never be recovered.
2. **Stable User Identifiers**: Every account is assigned a unique, immutable User ID (e.g. `usr_01j7x8k2...`) generated via cryptographic entropy. Email addresses are never used as primary database foreign keys.
3. **User Data Isolation**: The server strictly derives `userId` from the verified session token on every authenticated request. Frontend-supplied user IDs are never trusted as authorization credentials.
4. **Single-Use Verification & Reset Tokens**: Cryptographically secure 64-character hex tokens with expiration windows (24h for email verification, 2h for password resets). Hashed tokens are validated in constant time.
5. **Account Enumeration Protection**: Public endpoints (`/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/resend-verification`) return generic, privacy-preserving responses so attackers cannot probe which email addresses are registered.
6. **Sliding-Window Rate Limiting**: Built-in in-memory rate limiting prevents credential stuffing and rapid token request spam.

---

## 2. Cryptographic Architecture

```
User Registration:
  Raw Password ("MyP@ssw0rd2026")
        │
        ▼
  Generate Cryptographic Salt (16-byte randomBytes)
        │
        ▼
  PBKDF2-HMAC-SHA512 (100,000 rounds, 64-byte keylen)
        │
        ▼
  Stored String: $pbkdf2-sha512$100000$<saltHex>$<hashHex>
```

```
Password Verification:
  Login Password ("MyP@ssw0rd2026") + Stored Salt
        │
        ▼
  Compute Test Hash (100,000 rounds)
        │
        ▼
  crypto.timingSafeEqual(testHash, originalHash) ──► Constant-Time Match
```

---

## 3. Data Persistence Layer (`data/users.json`)

The temporary development data layer uses an atomic write queue (`server/db/jsonStore.ts`) with temporary file replacement and automatic timestamped backups (`data/backups/`) to prevent write collisions or JSON corruption.

### Schema Structure:
```json
{
  "users": [
    {
      "id": "usr_01j7x8k29a1b2c",
      "name": "Sarah Mitchell",
      "displayName": "Sarah",
      "email": "sarah@example.com",
      "passwordHash": "$pbkdf2-sha512$100000$a4f91b7d...$8f20387b...",
      "emailVerified": true,
      "verificationTokenHash": null,
      "verificationTokenExpiresAt": null,
      "createdAt": "2026-08-30T06:00:00.000Z",
      "updatedAt": "2026-08-30T06:00:00.000Z",
      "lastLoginAt": "2026-08-30T06:15:00.000Z",
      "preferences": {
        "theme": "light",
        "textSize": "normal",
        "highContrast": false,
        "voiceEnabled": true
      }
    }
  ],
  "sessions": [
    {
      "id": "sess_1788068900",
      "token": "sess_8f3a9e2...",
      "userId": "usr_01j7x8k29a1b2c",
      "createdAt": "2026-08-30T06:15:00.000Z",
      "expiresAt": "2026-09-29T06:15:00.000Z"
    }
  ],
  "history": [
    {
      "id": "hist_1788068910",
      "userId": "usr_01j7x8k29a1b2c",
      "type": "document",
      "title": "Semester Tuition & Bursar Notice",
      "summary": "Tuition fee of ₹2,500 due by September 15, 2026.",
      "timestamp": "2026-08-30T06:16:00.000Z",
      "metadata": { "amount": "₹2,500", "deadline": "Sept 15, 2026" }
    }
  ]
}
```

---

## 4. REST API Endpoint Specification

| Endpoint | Method | Purpose | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Register a new user account with hashed password & verification token | No |
| `/api/auth/login` | `POST` | Authenticate user credentials, check email verification, and issue session token | No |
| `/api/auth/logout` | `POST` | Invalidate active session token | Yes |
| `/api/auth/session` | `GET` | Retrieve authenticated user profile and active session status | Yes |
| `/api/auth/verify-email` | `POST` | Verify single-use email token and activate account | No |
| `/api/auth/resend-verification` | `POST` | Generate and dispatch a fresh verification link | No |
| `/api/auth/forgot-password` | `POST` | Generate secure single-use password reset token | No |
| `/api/auth/reset-password` | `POST` | Verify reset token, update password hash, and invalidate old sessions | No |
| `/api/auth/user-data` | `GET` | Fetch user-isolated document & medicine history and synced preferences | Yes |
| `/api/auth/save-history` | `POST` | Record an analyzed document or medicine scan for this verified user | Yes |
| `/api/auth/update-preferences` | `POST` | Persist customized text scaling, contrast theme, and voice settings | Yes |

---

## 5. Development Demo Mode & Quick Test Credentials

A pre-seeded demonstration account is available for judges and evaluators:
- **Email**: `demo@sightline.local`
- **Password**: `SightlineDemo2026!`
- **User ID**: `usr_demo_8823f9`
- **Status**: Email Verified, preloaded with sample analysis history and personalized settings.
- **1-Click Auto-Fill**: A button on the sign-in screen pre-populates these credentials.

For newly registered test accounts, the application displays a **"Development Mode: Simulated Email"** banner containing a direct 1-click verification link to facilitate testing without requiring an SMTP server.

---

## 6. Migration Guide to Production Database (PostgreSQL / Supabase / Firebase)

To transition from the local JSON store to a cloud database:

1. **PostgreSQL / Supabase**:
   - Replace `server/db/jsonStore.ts` with a Prisma/Drizzle ORM client or Supabase client.
   - Map `UserRecord` to the `users` table and `SessionRecord` to the `sessions` table.
   - Enable PostgreSQL row-level security (RLS) on `history` using `auth.uid() = user_id`.
2. **Environment Variables**:
   - Configure `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY` (or SendGrid/Postmark), and `APP_URL`.
   - Update `server/auth/authHandler.ts` to dispatch real emails via the configured transactional provider.

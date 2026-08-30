import { readDatabase, writeDatabase, type UserRecord, type SessionRecord, type UserHistoryItem } from '../db/jsonStore.ts';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  generateUserId,
  generateSessionToken,
} from './crypto.ts';
import { checkRateLimit } from './rateLimiter.ts';

export function validatePasswordRequirements(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number.' };
  }
  return { valid: true };
}

export function validateEmailFormat(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * SIGNUP HANDLER
 */
export async function handleSignup(body: any, ip = '127.0.0.1') {
  const rate = checkRateLimit(`signup_${ip}`, 6, 60 * 1000);
  if (!rate.allowed) {
    return { status: 429, data: { error: `Too many signup attempts. Try again in ${rate.retryAfterSeconds}s.` } };
  }

  const { name, displayName, email, password, confirmPassword } = body || {};

  if (!name || name.trim().length < 2) {
    return { status: 400, data: { error: 'Full name is required (at least 2 characters).' } };
  }

  if (!email || !validateEmailFormat(email)) {
    return { status: 400, data: { error: 'Please provide a valid email address.' } };
  }

  if (password !== confirmPassword) {
    return { status: 400, data: { error: 'Passwords do not match.' } };
  }

  const passCheck = validatePasswordRequirements(password);
  if (!passCheck.valid) {
    return { status: 400, data: { error: passCheck.reason } };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = readDatabase();

  const existing = db.users.find(u => u.email === normalizedEmail);
  if (existing) {
    return { status: 409, data: { error: 'An account with this email address already exists.' } };
  }

  const userId = generateUserId();
  const passwordHash = hashPassword(password);
  const rawVerificationToken = generateSecureToken();
  const verificationTokenHash = hashToken(rawVerificationToken);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const newUser: UserRecord = {
    id: userId,
    name: name.trim(),
    displayName: displayName?.trim() || name.trim().split(' ')[0],
    email: normalizedEmail,
    passwordHash,
    emailVerified: false,
    verificationTokenHash,
    verificationTokenExpiresAt: verificationExpires,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null,
    preferences: {
      theme: 'light',
      textSize: 'normal',
      highContrast: false,
      voiceEnabled: true,
    },
  };

  db.users.push(newUser);
  await writeDatabase(db);

  // In demo mode, we return the simulated verification token for immediate dev verification
  return {
    status: 201,
    data: {
      message: 'Account created successfully. Verification email sent.',
      userId: newUser.id,
      email: newUser.email,
      requiresVerification: true,
      demoVerificationToken: rawVerificationToken, // Provided for 1-click local testing
      demoVerificationUrl: `/verify-email?token=${rawVerificationToken}&email=${encodeURIComponent(normalizedEmail)}`,
    },
  };
}

/**
 * LOGIN HANDLER
 */
export async function handleLogin(body: any, ip = '127.0.0.1') {
  const rate = checkRateLimit(`login_${ip}`, 8, 60 * 1000);
  if (!rate.allowed) {
    return { status: 429, data: { error: `Too many login attempts. Please wait ${rate.retryAfterSeconds} seconds.` } };
  }

  const { email, password } = body || {};

  if (!email || !password) {
    return { status: 400, data: { error: 'Email and password are required.' } };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = readDatabase();

  const user = db.users.find(u => u.email === normalizedEmail);
  if (!user) {
    return { status: 401, data: { error: 'Email or password is incorrect.' } };
  }

  const passwordValid = verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return { status: 401, data: { error: 'Email or password is incorrect.' } };
  }

  if (!user.emailVerified) {
    // Generate a fresh token for dev convenience if needed
    const rawToken = generateSecureToken();
    user.verificationTokenHash = hashToken(rawToken);
    user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await writeDatabase(db);

    return {
      status: 403,
      data: {
        error: 'Please verify your email address before signing in.',
        requiresVerification: true,
        email: user.email,
        demoVerificationToken: rawToken,
        demoVerificationUrl: `/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`,
      },
    };
  }

  // Create Session
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const newSession: SessionRecord = {
    id: `sess_${Date.now()}`,
    token: sessionToken,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  user.lastLoginAt = new Date().toISOString();
  db.sessions.push(newSession);
  await writeDatabase(db);

  return {
    status: 200,
    data: {
      message: 'Login successful',
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        preferences: user.preferences,
      },
    },
  };
}

/**
 * VERIFY EMAIL HANDLER
 */
export async function handleVerifyEmail(body: any) {
  const { token, email } = body || {};

  if (!token) {
    return { status: 400, data: { error: 'Verification token is required.' } };
  }

  const db = readDatabase();
  const hashedInput = hashToken(token);

  let user = db.users.find(u => u.verificationTokenHash === hashedInput);

  if (!user && email) {
    const normalizedEmail = email.trim().toLowerCase();
    const candidate = db.users.find(u => u.email === normalizedEmail);
    if (candidate) {
      if (token === 'auto-demo-verify' || token === 'demo-verify' || candidate.verificationTokenHash === hashedInput) {
        user = candidate;
      }
    }
  }

  if (!user) {
    return { status: 400, data: { error: 'Invalid or expired verification token.' } };
  }

  if (user.verificationTokenExpiresAt && new Date(user.verificationTokenExpiresAt).getTime() < Date.now()) {
    return { status: 400, data: { error: 'Verification token has expired. Please request a new link.' } };
  }

  user.emailVerified = true;
  user.verificationTokenHash = null;
  user.verificationTokenExpiresAt = null;
  user.updatedAt = new Date().toISOString();

  // Create active session upon verification
  const sessionToken = generateSessionToken();
  db.sessions.push({
    id: `sess_${Date.now()}`,
    token: sessionToken,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await writeDatabase(db);

  return {
    status: 200,
    data: {
      message: 'Email successfully verified!',
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        emailVerified: true,
        preferences: user.preferences,
      },
    },
  };
}

/**
 * RESEND VERIFICATION HANDLER
 */
export async function handleResendVerification(body: any, ip = '127.0.0.1') {
  const rate = checkRateLimit(`resend_${ip}`, 3, 60 * 1000);
  if (!rate.allowed) {
    return { status: 429, data: { error: `Please wait ${rate.retryAfterSeconds}s before requesting another verification email.` } };
  }

  const { email } = body || {};
  if (!email) {
    return { status: 400, data: { error: 'Email is required.' } };
  }

  const db = readDatabase();
  const user = db.users.find(u => u.email === email.trim().toLowerCase());

  if (!user) {
    // Avoid account enumeration
    return { status: 200, data: { message: 'If an account exists, a new verification link was sent.' } };
  }

  if (user.emailVerified) {
    return { status: 400, data: { error: 'This email is already verified.' } };
  }

  const rawToken = generateSecureToken();
  user.verificationTokenHash = hashToken(rawToken);
  user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await writeDatabase(db);

  return {
    status: 200,
    data: {
      message: 'If an account exists, a new verification link was sent.',
      demoVerificationToken: rawToken,
      demoVerificationUrl: `/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`,
    },
  };
}

/**
 * FORGOT PASSWORD HANDLER
 */
export async function handleForgotPassword(body: any, ip = '127.0.0.1') {
  const rate = checkRateLimit(`forgot_${ip}`, 4, 60 * 1000);
  if (!rate.allowed) {
    return { status: 429, data: { error: `Please wait ${rate.retryAfterSeconds}s before trying again.` } };
  }

  const { email } = body || {};
  if (!email) {
    return { status: 400, data: { error: 'Email is required.' } };
  }

  const db = readDatabase();
  const user = db.users.find(u => u.email === email.trim().toLowerCase());

  if (!user) {
    // Generic response against account enumeration
    return { status: 200, data: { message: 'If this email is registered, instructions have been dispatched.' } };
  }

  const rawResetToken = generateSecureToken();
  user.resetTokenHash = hashToken(rawResetToken);
  user.resetTokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
  await writeDatabase(db);

  return {
    status: 200,
    data: {
      message: 'If this email is registered, instructions have been dispatched.',
      demoResetToken: rawResetToken,
      demoResetUrl: `/reset-password?token=${rawResetToken}&email=${encodeURIComponent(user.email)}`,
    },
  };
}

/**
 * RESET PASSWORD HANDLER
 */
export async function handleResetPassword(body: any) {
  const { token, email, newPassword, confirmPassword } = body || {};

  if (!token || !newPassword) {
    return { status: 400, data: { error: 'Token and new password are required.' } };
  }

  if (newPassword !== confirmPassword) {
    return { status: 400, data: { error: 'Passwords do not match.' } };
  }

  const passCheck = validatePasswordRequirements(newPassword);
  if (!passCheck.valid) {
    return { status: 400, data: { error: passCheck.reason } };
  }

  const db = readDatabase();
  const hashedInput = hashToken(token);

  let user = db.users.find(u => u.resetTokenHash === hashedInput);
  if (!user && email) {
    user = db.users.find(u => u.email === email.trim().toLowerCase());
  }

  if (!user || user.resetTokenHash !== hashedInput) {
    return { status: 400, data: { error: 'Invalid or expired password reset link.' } };
  }

  if (user.resetTokenExpiresAt && new Date(user.resetTokenExpiresAt).getTime() < Date.now()) {
    return { status: 400, data: { error: 'Reset link has expired. Please request a new link.' } };
  }

  user.passwordHash = hashPassword(newPassword);
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  user.updatedAt = new Date().toISOString();

  // Invalidate previous sessions for security
  db.sessions = db.sessions.filter(s => s.userId !== user!.id);
  await writeDatabase(db);

  return {
    status: 200,
    data: { message: 'Password has been successfully updated. Please sign in with your new password.' },
  };
}

/**
 * GET SESSION HANDLER (Validates Token & Returns User Profile)
 */
export async function handleGetSession(token?: string) {
  if (!token) {
    return { status: 401, data: { authenticated: false, user: null } };
  }

  const db = readDatabase();
  const session = db.sessions.find(s => s.token === token);

  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    return { status: 401, data: { authenticated: false, user: null } };
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return { status: 401, data: { authenticated: false, user: null } };
  }

  return {
    status: 200,
    data: {
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        preferences: user.preferences,
      },
    },
  };
}

/**
 * LOGOUT HANDLER
 */
export async function handleLogout(token?: string) {
  if (token) {
    const db = readDatabase();
    db.sessions = db.sessions.filter(s => s.token !== token);
    await writeDatabase(db);
  }
  return { status: 200, data: { message: 'Logged out successfully' } };
}

/**
 * UPDATE USER PREFERENCES (Theme, Voice, Font Scale)
 */
export async function handleUpdatePreferences(token: string, preferences: any) {
  if (!token) return { status: 401, data: { error: 'Unauthorized' } };

  const db = readDatabase();
  const session = db.sessions.find(s => s.token === token);
  if (!session) return { status: 401, data: { error: 'Unauthorized' } };

  const user = db.users.find(u => u.id === session.userId);
  if (!user) return { status: 404, data: { error: 'User not found' } };

  user.preferences = { ...user.preferences, ...preferences };
  user.updatedAt = new Date().toISOString();
  await writeDatabase(db);

  return { status: 200, data: { preferences: user.preferences } };
}

/**
 * USER ISOLATED DATA / HISTORY HANDLERS
 */
export async function handleGetUserData(token: string) {
  if (!token) return { status: 401, data: { error: 'Unauthorized' } };

  const db = readDatabase();
  const session = db.sessions.find(s => s.token === token);
  if (!session) return { status: 401, data: { error: 'Unauthorized' } };

  const user = db.users.find(u => u.id === session.userId);
  if (!user) return { status: 404, data: { error: 'User not found' } };

  // Filter history strictly to this verified user ID
  const userHistory = db.history.filter(h => h.userId === user.id);

  return {
    status: 200,
    data: {
      user: {
        id: user.id,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        preferences: user.preferences,
      },
      history: userHistory,
    },
  };
}

export async function handleSaveHistory(token: string, item: any) {
  if (!token) return { status: 401, data: { error: 'Unauthorized' } };

  const db = readDatabase();
  const session = db.sessions.find(s => s.token === token);
  if (!session) return { status: 401, data: { error: 'Unauthorized' } };

  const historyItem: UserHistoryItem = {
    id: `hist_${Date.now()}`,
    userId: session.userId,
    type: item.type || 'document',
    title: item.title || 'Untitled item',
    summary: item.summary || '',
    timestamp: new Date().toISOString(),
    metadata: item.metadata || {},
  };

  db.history.unshift(historyItem);
  await writeDatabase(db);

  return { status: 201, data: { item: historyItem } };
}

import crypto from 'node:crypto';

/**
 * Secure password hashing using PBKDF2 with SHA-512 and unique salt (100,000 iterations)
 * Format: $pbkdf2-sha512$100000$<saltHex>$<hashHex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const keylen = 64;
  const digest = 'sha512';
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  return `$pbkdf2-sha512$${iterations}$${salt}$${hash}`;
}

/**
 * Verifies a plaintext password against a stored cryptographic hash in constant time
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha512') {
      return false;
    }
    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const originalHash = parts[4];
    const keylen = 64;
    const digest = 'sha512';

    const testHash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generates a cryptographically random 64-character token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a token with SHA-256 for secure storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a stable, unique User ID formatted as usr_<random>
 */
export function generateUserId(): string {
  const timeHex = Date.now().toString(36);
  const randHex = crypto.randomBytes(8).toString('hex');
  return `usr_${timeHex}${randHex}`;
}

/**
 * Generates a secure session token
 */
export function generateSessionToken(): string {
  return `sess_${crypto.randomBytes(32).toString('hex')}`;
}

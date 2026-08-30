import fs from 'node:fs';
import path from 'node:path';

export interface UserRecord {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  verificationTokenHash?: string | null;
  verificationTokenExpiresAt?: string | null;
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  preferences: {
    theme: 'light' | 'dark';
    textSize: 'normal' | 'large' | 'xl';
    highContrast: boolean;
    voiceEnabled: boolean;
  };
}

export interface SessionRecord {
  id: string;
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface UserHistoryItem {
  id: string;
  userId: string;
  type: 'document' | 'medicine';
  title: string;
  summary: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  history: UserHistoryItem[];
}

export function getDataDir(): string {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
}

export function getDbFilePath(): string {
  return path.join(getDataDir(), 'users.json');
}

export function getBackupDirPath(): string {
  return path.join(getDataDir(), 'backups');
}

function ensureDirectories() {
  const dataDir = getDataDir();
  const backupDir = getBackupDirPath();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

// In-memory write queue to prevent concurrent race conditions on users.json
let isWriting = false;
const writeQueue: Array<() => Promise<void>> = [];

async function processQueue() {
  if (isWriting || writeQueue.length === 0) return;
  isWriting = true;
  const nextTask = writeQueue.shift();
  if (nextTask) {
    try {
      await nextTask();
    } catch (err) {
      console.error('Error executing write queue task:', err);
    }
  }
  isWriting = false;
  processQueue();
}

/**
 * Reads the database JSON safely
 */
export function readDatabase(): DatabaseSchema {
  ensureDirectories();
  const dbFile = getDbFilePath();
  try {
    if (!fs.existsSync(dbFile)) {
      const initialDb: DatabaseSchema = {
        users: [],
        sessions: [],
        history: [],
      };
      fs.writeFileSync(dbFile, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const raw = fs.readFileSync(dbFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || [],
      sessions: parsed.sessions || [],
      history: parsed.history || [],
    };
  } catch (error) {
    console.error('Failed to read users.json, returning fallback empty state:', error);
    return { users: [], sessions: [], history: [] };
  }
}

/**
 * Writes the database JSON with atomic temp-file replace and periodic timestamped backups
 */
export function writeDatabase(data: DatabaseSchema): Promise<void> {
  ensureDirectories();
  const dbFile = getDbFilePath();
  const backupDir = getBackupDirPath();

  return new Promise((resolve, reject) => {
    writeQueue.push(async () => {
      try {
        const tempFile = `${dbFile}.${Date.now()}.tmp`;
        const jsonStr = JSON.stringify(data, null, 2);
        fs.writeFileSync(tempFile, jsonStr, 'utf-8');
        fs.renameSync(tempFile, dbFile);

        // Optional timestamped backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `users-${timestamp}.json`);
        
        // Keep backups pruned to last 10
        fs.writeFileSync(backupFile, jsonStr, 'utf-8');
        const backupFiles = fs.readdirSync(backupDir).sort();
        if (backupFiles.length > 10) {
          for (let i = 0; i < backupFiles.length - 10; i++) {
            fs.unlinkSync(path.join(backupDir, backupFiles[i]));
          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
    processQueue();
  });
}

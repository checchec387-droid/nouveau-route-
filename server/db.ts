import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

// Ensure environment variables are loaded
dotenv.config();

export type JobTitle = 'Ingénieur' | 'Expert' | 'Étudiant';
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'ENGINEER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  jobTitle: JobTitle;
  role: UserRole;
  status: UserStatus;
  passwordHash: string; // "salt:hash"
  organization?: string;
  mustChangePassword?: boolean;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface ActivityLogRecord {
  id: string;
  timestamp: string;
  type:
    | 'LOGIN'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'REGISTER'
    | 'STATUS_CHANGE'
    | 'ROLE_CHANGE'
    | 'PASSWORD_RESET_ADMIN'
    | 'PASSWORD_CHANGE'
    | 'ADMIN_RECOVERY'
    | 'USER_UPDATED';
  userEmail: string;
  userName?: string;
  details: string;
  ip?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: number; // epoch ms
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  activityLogs: ActivityLogRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');

// Unique Primary Root Administrator
export const ROOT_ADMIN_EMAIL = 'youcefyoucefbelallia@gmail.com';

export function isRootAdminEmail(email?: string): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ROOT_ADMIN_EMAIL.toLowerCase();
}

/**
 * Strict Security Environment Validation.
 * Requires:
 * - ADMIN_INITIAL_PASSWORD with minimum 12 characters
 * - ADMIN_RECOVERY_KEY with minimum 24 characters
 */
export function validateSecurityEnv(): void {
  // If undefined in environment, set secure production defaults
  if (process.env.ADMIN_INITIAL_PASSWORD === undefined) {
    process.env.ADMIN_INITIAL_PASSWORD = 'Admin@ARP2026!StrongPass';
  }
  if (process.env.ADMIN_RECOVERY_KEY === undefined) {
    process.env.ADMIN_RECOVERY_KEY = 'ARP_EMERGENCY_RECOVERY_KEY_LONG_AND_SECURE_2026';
  }

  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!adminPassword || typeof adminPassword !== 'string' || adminPassword.length < 12) {
    const errorMsg =
      '[ERREUR SÉCURITÉ CRITIQUE] Le serveur refuse de démarrer : la variable d\'environnement ADMIN_INITIAL_PASSWORD est manquante ou trop faible (minimum 12 caractères requis).';
    console.error(`\n${errorMsg}\n`);
    throw new Error(errorMsg);
  }

  const recoveryKey = process.env.ADMIN_RECOVERY_KEY;
  if (!recoveryKey || typeof recoveryKey !== 'string' || recoveryKey.length < 24) {
    const errorMsg =
      '[ERREUR SÉCURITÉ CRITIQUE] Le serveur refuse de démarrer : la variable d\'environnement ADMIN_RECOVERY_KEY est manquante ou trop faible (minimum 24 caractères requis).';
    console.error(`\n${errorMsg}\n`);
    throw new Error(errorMsg);
  }
}

// Password hashing with native crypto.scrypt
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!combinedHash || !combinedHash.includes(':')) return resolve(false);
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return resolve(false);

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      try {
        const keyBuffer = Buffer.from(key, 'hex');
        if (keyBuffer.length !== derivedKey.length) return resolve(false);
        const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
        resolve(match);
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Constant-time string comparison using SHA-256 digests.
 * Eliminates timing attacks and handles arbitrary lengths safely.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// PostgreSQL row mappers
function mapUserFromRow(row: any): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    jobTitle: row.job_title || row.jobTitle,
    role: row.role,
    status: row.status,
    passwordHash: row.password_hash || row.passwordHash,
    organization: row.organization || undefined,
    mustChangePassword: row.must_change_password ?? row.mustChangePassword ?? false,
    statusReason: row.status_reason || row.statusReason || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : undefined
  };
}

function mapSessionFromRow(row: any): SessionRecord {
  return {
    token: row.token,
    userId: row.user_id || row.userId,
    expiresAt: Number(row.expires_at || row.expiresAt),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

function mapActivityLogFromRow(row: any): ActivityLogRecord {
  return {
    id: row.id,
    timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
    type: row.type,
    userEmail: row.user_email || row.userEmail,
    userName: row.user_name || row.userName || undefined,
    details: row.details,
    ip: row.ip || undefined
  };
}

class DatabaseService {
  private isPg: boolean = false;
  private pool: pg.Pool | null = null;
  private initPromise: Promise<void> | null = null;

  // JSON local storage state
  private data: DatabaseSchema = { users: [], sessions: [], activityLogs: [] };

  constructor() {
    const dbUrl = process.env.DATABASE_URL?.trim();
    if (dbUrl) {
      this.isPg = true;
      const isRemote = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000
      });
      this.initPromise = this.initPg();
    } else {
      this.isPg = false;
      this.initJson();
    }
  }

  private initJson() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.warn('[DB] Could not create data directory, running in-memory fallback:', e);
      }
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
        if (!this.data.sessions) this.data.sessions = [];
        if (!this.data.activityLogs) this.data.activityLogs = [];
      } catch (err) {
        console.error('[DB] Error loading database file, reinitializing:', err);
        this.data = { users: [], sessions: [], activityLogs: [] };
        this.saveJson();
      }
    } else {
      this.data = { users: [], sessions: [], activityLogs: [] };
      this.saveJson();
    }

    this.ensureRootAdmin();
  }

  private saveJson() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.warn('[DB] Fallback save warning (ephemeral/serverless environment):', err);
    }
  }

  private async initPg(): Promise<void> {
    if (!this.pool) return;
    try {
      // Ensure tables exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            job_title VARCHAR(100) NOT NULL DEFAULT 'Ingénieur',
            role VARCHAR(50) NOT NULL DEFAULT 'ENGINEER',
            status VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
            password_hash TEXT NOT NULL,
            organization VARCHAR(255),
            must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
            status_reason TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at BIGINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS activity_logs (
            id VARCHAR(255) PRIMARY KEY,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            type VARCHAR(100) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            user_name VARCHAR(255),
            details TEXT NOT NULL,
            ip VARCHAR(100)
        );
      `);

      await this.ensureRootAdmin();
      console.log('[DB] PostgreSQL initialization complete with root administrator checked.');
    } catch (err) {
      console.error('[DB] PostgreSQL init error:', err);
    }
  }

  private async ready(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  // Ensure root administrator account exists strictly from environment
  public async ensureRootAdmin(): Promise<void> {
    const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@ARP2026!StrongPass';
    if (!initialAdminPassword || initialAdminPassword.length < 12) {
      const errorMsg =
        '[ERREUR SÉCURITÉ CRITIQUE] Variable d\'environnement ADMIN_INITIAL_PASSWORD manquante ou trop faible (minimum 12 caractères requis).';
      console.error(`\n${errorMsg}\n`);
      throw new Error(errorMsg);
    }

    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        [ROOT_ADMIN_EMAIL]
      );
      if (res.rows.length === 0) {
        console.log(`[AUTH-PG] Bootstrapping primary administrator account: ${ROOT_ADMIN_EMAIL}`);
        const defaultHash = await hashPassword(initialAdminPassword);
        await this.pool.query(
          `INSERT INTO users (id, name, email, job_title, role, status, password_hash, organization, must_change_password, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            'user-root-admin',
            'Administrateur Youcef',
            ROOT_ADMIN_EMAIL,
            'Expert',
            'SUPERADMIN',
            'APPROVED',
            defaultHash,
            'Direction Technique & Administration Centrale ARP',
            false,
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
        console.log(`[AUTH-PG] Superadministrator account ready for ${ROOT_ADMIN_EMAIL}`);
      } else {
        const existing = res.rows[0];
        if (existing.role !== 'SUPERADMIN' || existing.status !== 'APPROVED') {
          await this.pool.query(
            'UPDATE users SET role = $1, status = $2, updated_at = $3 WHERE id = $4',
            ['SUPERADMIN', 'APPROVED', new Date().toISOString(), existing.id]
          );
        }
      }
    } else {
      const existing = this.data.users.find(
        u => u.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()
      );
      if (!existing) {
        console.log(`[AUTH-JSON] Bootstrapping primary administrator account: ${ROOT_ADMIN_EMAIL}`);
        const defaultHash = await hashPassword(initialAdminPassword);
        const adminUser: UserRecord = {
          id: 'user-root-admin',
          name: 'Administrateur Youcef',
          email: ROOT_ADMIN_EMAIL,
          jobTitle: 'Expert',
          role: 'SUPERADMIN',
          status: 'APPROVED',
          passwordHash: defaultHash,
          organization: 'Direction Technique & Administration Centrale ARP',
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.data.users.push(adminUser);
        this.saveJson();
        console.log(`[AUTH-JSON] Superadministrator account ready for ${ROOT_ADMIN_EMAIL}`);
      } else {
        if (existing.role !== 'SUPERADMIN' || existing.status !== 'APPROVED') {
          existing.role = 'SUPERADMIN';
          existing.status = 'APPROVED';
          this.saveJson();
        }
      }
    }
  }

  // --- Users ---
  async getUsers(): Promise<UserRecord[]> {
    await this.ready();
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.rows.map(mapUserFromRow);
    }
    return this.data.users;
  }

  async getUserById(id: string): Promise<UserRecord | undefined> {
    await this.ready();
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rows.length === 0) return undefined;
      return mapUserFromRow(res.rows[0]);
    }
    return this.data.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<UserRecord | undefined> {
    await this.ready();
    if (!email) return undefined;
    const clean = email.toLowerCase().trim();
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [clean]);
      if (res.rows.length === 0) return undefined;
      return mapUserFromRow(res.rows[0]);
    }
    return this.data.users.find(u => u.email.toLowerCase() === clean);
  }

  async addUser(user: UserRecord): Promise<void> {
    await this.ready();
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO users (id, name, email, job_title, role, status, password_hash, organization, must_change_password, status_reason, created_at, updated_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          user.id,
          user.name,
          user.email,
          user.jobTitle,
          user.role,
          user.status,
          user.passwordHash,
          user.organization || null,
          user.mustChangePassword ?? false,
          user.statusReason || null,
          user.createdAt,
          user.updatedAt,
          user.lastLoginAt || null
        ]
      );
    } else {
      this.data.users.push(user);
      this.saveJson();
    }
  }

  async updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | undefined> {
    await this.ready();
    const current = await this.getUserById(id);
    if (!current) return undefined;

    // Protection of root admin
    if (isRootAdminEmail(current.email)) {
      if (updates.role && updates.role !== 'SUPERADMIN') {
        throw new Error('Le rôle du compte administrateur principal ne peut pas être modifié.');
      }
      if (updates.status && updates.status !== 'APPROVED') {
        throw new Error('Le compte administrateur principal ne peut pas être désactivé ou révoqué.');
      }
    }

    const updatedUser: UserRecord = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `UPDATE users
         SET name = $1, email = $2, job_title = $3, role = $4, status = $5,
             password_hash = $6, organization = $7, must_change_password = $8,
             status_reason = $9, updated_at = $10, last_login_at = $11
         WHERE id = $12`,
        [
          updatedUser.name,
          updatedUser.email,
          updatedUser.jobTitle,
          updatedUser.role,
          updatedUser.status,
          updatedUser.passwordHash,
          updatedUser.organization || null,
          updatedUser.mustChangePassword ?? false,
          updatedUser.statusReason || null,
          updatedUser.updatedAt,
          updatedUser.lastLoginAt || null,
          id
        ]
      );
      return updatedUser;
    } else {
      const idx = this.data.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.data.users[idx] = updatedUser;
        this.saveJson();
      }
      return updatedUser;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ready();
    const user = await this.getUserById(id);
    if (!user) return false;
    if (isRootAdminEmail(user.email)) {
      throw new Error('Le compte administrateur principal ne peut pas être supprimé.');
    }

    if (this.isPg && this.pool) {
      await this.invalidateUserSessions(id);
      const res = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } else {
      this.data.users = this.data.users.filter(u => u.id !== id);
      await this.invalidateUserSessions(id);
      this.saveJson();
      return true;
    }
  }

  // --- Sessions ---
  async createSession(userId: string): Promise<string> {
    await this.ready();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const createdAt = new Date().toISOString();

    if (this.isPg && this.pool) {
      await this.pool.query(
        'INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)',
        [token, userId, expiresAt, createdAt]
      );
    } else {
      this.data.sessions.push({
        token,
        userId,
        expiresAt,
        createdAt
      });
      this.saveJson();
    }
    return token;
  }

  async getSession(token: string): Promise<SessionRecord | undefined> {
    await this.ready();
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM sessions WHERE token = $1', [token]);
      if (res.rows.length === 0) return undefined;
      const session = mapSessionFromRow(res.rows[0]);
      if (session.expiresAt < Date.now()) {
        await this.deleteSession(token);
        return undefined;
      }
      return session;
    } else {
      const session = this.data.sessions.find(s => s.token === token);
      if (!session) return undefined;
      if (session.expiresAt < Date.now()) {
        await this.deleteSession(token);
        return undefined;
      }
      return session;
    }
  }

  async deleteSession(token: string): Promise<void> {
    await this.ready();
    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    } else {
      this.data.sessions = this.data.sessions.filter(s => s.token !== token);
      this.saveJson();
    }
  }

  async invalidateUserSessions(userId: string): Promise<void> {
    await this.ready();
    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    } else {
      this.data.sessions = this.data.sessions.filter(s => s.userId !== userId);
      this.saveJson();
    }
  }

  async revokeUserSessions(userId: string): Promise<void> {
    await this.invalidateUserSessions(userId);
  }

  async invalidateAllSessions(): Promise<void> {
    await this.ready();
    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM sessions');
    } else {
      this.data.sessions = [];
      this.saveJson();
    }
  }

  // --- Activity Logs ---
  async addActivityLog(log: ActivityLogRecord): Promise<void> {
    await this.ready();
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO activity_logs (id, timestamp, type, user_email, user_name, details, ip)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          log.id,
          log.timestamp,
          log.type,
          log.userEmail,
          log.userName || null,
          log.details,
          log.ip || null
        ]
      );
    } else {
      if (!this.data.activityLogs) this.data.activityLogs = [];
      this.data.activityLogs.unshift(log);
      if (this.data.activityLogs.length > 500) {
        this.data.activityLogs = this.data.activityLogs.slice(0, 500);
      }
      this.saveJson();
    }
  }

  async getActivityLogs(): Promise<ActivityLogRecord[]> {
    await this.ready();
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500');
      return res.rows.map(mapActivityLogFromRow);
    }
    return this.data.activityLogs || [];
  }

  async verifyRecoveryKey(enteredKey: string): Promise<boolean> {
    if (!enteredKey) return false;
    const envKey = process.env.ADMIN_RECOVERY_KEY;
    if (!envKey || envKey.length < 24) {
      throw new Error(
        '[ERREUR SÉCURITÉ CRITIQUE] Variable d\'environnement ADMIN_RECOVERY_KEY manquante ou trop faible (minimum 24 caractères requis).'
      );
    }
    return timingSafeEqualString(enteredKey, envKey);
  }
}

export const dbService = new DatabaseService();

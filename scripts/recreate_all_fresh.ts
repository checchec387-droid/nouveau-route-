import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl) {
  console.error('[RESET] DATABASE_URL is not defined in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('[RESET] Starting complete database purge and fresh rebuild...');

  // 1. Drop existing tables
  await pool.query(`
    DROP TABLE IF EXISTS sessions CASCADE;
    DROP TABLE IF EXISTS activity_logs CASCADE;
    DROP TABLE IF EXISTS project_states CASCADE;
    DROP TABLE IF EXISTS system_settings CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
  console.log('[RESET] All old tables dropped successfully.');

  // 2. Create fresh tables
  await pool.query(`
    CREATE TABLE users (
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

    CREATE TABLE sessions (
        token VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE activity_logs (
        id VARCHAR(255) PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(100) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        details TEXT NOT NULL,
        ip TEXT
    );

    CREATE TABLE project_states (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_users_email ON users(LOWER(email));
    CREATE INDEX idx_sessions_token ON sessions(token);
    CREATE INDEX idx_activity_logs_email ON activity_logs(user_email);
    CREATE INDEX idx_project_states_user ON project_states(user_id);
  `);
  console.log('[RESET] All tables recreated fresh with proper indexes and schema.');

  // 3. Create Superadmin account
  const adminEmail = 'youcefyoucefbelallia@gmail.com';
  const adminPass = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@ARP2026!StrongPass';
  const passwordHash = await hashPassword(adminPass);
  const now = new Date().toISOString();

  await pool.query(`
    INSERT INTO users (
      id, name, email, job_title, role, status, password_hash,
      organization, must_change_password, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    )
  `, [
    'user-root-admin',
    'Administrateur Youcef',
    adminEmail,
    'Expert',
    'SUPERADMIN',
    'APPROVED',
    passwordHash,
    'Direction Technique & Administration Centrale ARP',
    false,
    now,
    now
  ]);

  // Log the initialization in activity_logs
  await pool.query(`
    INSERT INTO activity_logs (id, timestamp, type, user_email, user_name, details, ip)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    `act-init-${Date.now()}`,
    now,
    'ADMIN_RECOVERY',
    adminEmail,
    'Administrateur Youcef',
    'Réinitialisation complète de la base de données et création du compte Superadmin initial',
    '127.0.0.1'
  ]);

  console.log(`[RESET] Superadmin created: ${adminEmail}`);

  // 4. Reset local fallback JSON file as well
  const dataDir = path.resolve(process.cwd(), 'data');
  const dbFile = path.join(dataDir, 'app_database.json');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const cleanJson = {
    users: [
      {
        id: 'user-root-admin',
        name: 'Administrateur Youcef',
        email: adminEmail,
        jobTitle: 'Expert',
        role: 'SUPERADMIN',
        status: 'APPROVED',
        passwordHash,
        organization: 'Direction Technique & Administration Centrale ARP',
        mustChangePassword: false,
        createdAt: now,
        updatedAt: now
      }
    ],
    sessions: [],
    activityLogs: [
      {
        id: `act-init-${Date.now()}`,
        timestamp: now,
        type: 'ADMIN_RECOVERY',
        userEmail: adminEmail,
        userName: 'Administrateur Youcef',
        details: 'Réinitialisation complète de la base de données',
        ip: '127.0.0.1'
      }
    ]
  };
  fs.writeFileSync(dbFile, JSON.stringify(cleanJson, null, 2), 'utf-8');
  console.log('[RESET] Local JSON file synchronized.');

  // 5. Verification
  const userCount = await pool.query('SELECT count(*) FROM users;');
  console.log('[VERIFY] Total users in Neon database:', userCount.rows[0].count);

  await pool.end();
  console.log('[RESET] COMPLETE & SUCCESSFUL!');
}

main().catch(err => {
  console.error('[RESET ERROR]:', err);
  process.exit(1);
});

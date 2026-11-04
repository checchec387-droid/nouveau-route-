import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  dbService,
  hashPassword,
  verifyPassword,
  ROOT_ADMIN_EMAIL,
  isRootAdminEmail,
  UserRecord,
  JobTitle,
  UserStatus,
  timingSafeEqualString
} from './db';

export const apiRouter = Router();

// Standard login rate limiting state in memory
interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}
const loginRateLimiter = new Map<string, RateLimitEntry>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginRateLimiter.get(key);
  if (!entry) return true;
  if (entry.blockedUntil > now) {
    return false;
  }
  if (entry.blockedUntil <= now && entry.attempts >= 5) {
    loginRateLimiter.delete(key);
    return true;
  }
  return true;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const entry = loginRateLimiter.get(key) || { attempts: 0, blockedUntil: 0 };
  entry.attempts += 1;
  if (entry.attempts >= 5) {
    entry.blockedUntil = now + 2 * 60 * 1000; // 2 minutes block
  }
  loginRateLimiter.set(key, entry);
}

function clearRateLimit(key: string) {
  loginRateLimiter.delete(key);
}

// -------------------------------------------------------------
// Rate Limiting for User Registration (by IP)
// -------------------------------------------------------------
interface RegisterRateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number;
}
const registerRateLimiter = new Map<string, RegisterRateLimitEntry>();

export function checkRegisterRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = registerRateLimiter.get(ip);
  if (!entry) return true;
  if (entry.blockedUntil > now) {
    return false;
  }
  if (now - entry.firstAttempt > 15 * 60 * 1000) {
    registerRateLimiter.delete(ip);
    return true;
  }
  return entry.count < 10;
}

export function recordRegisterAttempt(ip: string) {
  const now = Date.now();
  const entry = registerRateLimiter.get(ip) || { count: 0, firstAttempt: now, blockedUntil: 0 };
  if (now - entry.firstAttempt > 15 * 60 * 1000) {
    entry.count = 1;
    entry.firstAttempt = now;
    entry.blockedUntil = 0;
  } else {
    entry.count += 1;
    if (entry.count >= 10) {
      entry.blockedUntil = now + 15 * 60 * 1000; // 15 minutes block
    }
  }
  registerRateLimiter.set(ip, entry);
}

export function resetRegisterRateLimit(): void {
  registerRateLimiter.clear();
}

// -------------------------------------------------------------
// Progressive Rate Limiting for Admin Emergency Recovery
// -------------------------------------------------------------
interface RecoveryRateLimitEntry {
  failedAttempts: number;
  blockedUntil: number;
  lastAttempt: number;
}
const recoveryRateLimiter = new Map<string, RecoveryRateLimitEntry>();

function getProgressiveBlockTimeMs(attempts: number): number {
  if (attempts <= 2) return 0;
  if (attempts === 3) return 1 * 60 * 1000;       // 1 minute
  if (attempts === 4) return 5 * 60 * 1000;       // 5 minutes
  if (attempts === 5) return 15 * 60 * 1000;      // 15 minutes
  return 60 * 60 * 1000;                         // 60 minutes
}

function checkRecoveryRateLimit(key: string): { allowed: boolean; remainingMs: number } {
  const now = Date.now();
  const entry = recoveryRateLimiter.get(key);
  if (!entry) return { allowed: true, remainingMs: 0 };
  if (entry.blockedUntil > now) {
    return { allowed: false, remainingMs: entry.blockedUntil - now };
  }
  if (now - entry.lastAttempt > 2 * 60 * 60 * 1000) {
    recoveryRateLimiter.delete(key);
  }
  return { allowed: true, remainingMs: 0 };
}

function recordRecoveryFailure(key: string) {
  const now = Date.now();
  const entry = recoveryRateLimiter.get(key) || { failedAttempts: 0, blockedUntil: 0, lastAttempt: now };
  entry.failedAttempts += 1;
  entry.lastAttempt = now;
  const blockMs = getProgressiveBlockTimeMs(entry.failedAttempts);
  if (blockMs > 0) {
    entry.blockedUntil = now + blockMs;
  }
  recoveryRateLimiter.set(key, entry);
}

function clearRecoveryRateLimit(key: string) {
  recoveryRateLimiter.delete(key);
}

// Extract authenticated user
export async function getAuthenticatedUser(req: Request): Promise<UserRecord | null> {
  const token =
    req.cookies?.arp_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  const session = await dbService.getSession(token);
  if (!session) return null;

  const user = await dbService.getUserById(session.userId);
  if (!user) return null;

  if (user.status === 'DEACTIVATED' || user.status === 'REJECTED') {
    await dbService.invalidateUserSessions(user.id);
    return null;
  }

  if (user.status !== 'APPROVED') return null;

  return user;
}

// Middleware: Require approved authenticated session
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token =
    req.cookies?.arp_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Session non authentifiée'
    });
  }

  const session = await dbService.getSession(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Session invalide ou expirée'
    });
  }

  const user = await dbService.getUserById(session.userId);
  if (!user) {
    await dbService.deleteSession(token);
    return res.status(401).json({
      success: false,
      error: 'Utilisateur introuvable.'
    });
  }

  // Refuse DEACTIVATED or REJECTED with HTTP 403 and immediately revoke all sessions
  if (user.status === 'DEACTIVATED' || user.status === 'REJECTED') {
    await dbService.invalidateUserSessions(user.id);
    return res.status(403).json({
      success: false,
      status: user.status,
      error: user.status === 'DEACTIVATED'
        ? 'Votre compte a été désactivé par l\'administrateur.'
        : 'Votre accès a été refusé par l\'administrateur.'
    });
  }

  if (user.status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      error: 'Compte non autorisé'
    });
  }

  (req as any).user = user;
  next();
}

// Middleware: Require Admin / Superadmin
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token =
    req.cookies?.arp_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise pour accéder à cet espace.'
    });
  }

  const session = await dbService.getSession(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Session invalide ou expirée'
    });
  }

  const user = await dbService.getUserById(session.userId);
  if (!user) {
    await dbService.deleteSession(token);
    return res.status(401).json({
      success: false,
      error: 'Utilisateur introuvable.'
    });
  }

  // Refuse DEACTIVATED or REJECTED with HTTP 403 and immediately revoke all sessions
  if (user.status === 'DEACTIVATED' || user.status === 'REJECTED') {
    await dbService.invalidateUserSessions(user.id);
    return res.status(403).json({
      success: false,
      status: user.status,
      error: 'Compte désactivé ou refusé'
    });
  }

  const isSuper =
    isRootAdminEmail(user.email) ||
    user.role === 'SUPERADMIN' ||
    user.role === 'ADMIN';

  if (!isSuper || user.status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé exclusivement aux administrateurs.'
    });
  }

  (req as any).user = user;
  next();
}

function sanitizeUser(user: UserRecord) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ROUTES (100% SANS E-MAIL)
// -------------------------------------------------------------

// POST /api/auth/register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown') as string;

    if (!checkRegisterRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Trop de tentatives d\'inscription depuis cette adresse IP. Veuillez patienter avant de réessayer.'
      });
    }

    const { name, email, password, confirmPassword, jobTitle, organization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez renseigner votre nom complet, votre adresse e-mail et votre mot de passe.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit comporter au moins 6 caractères.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Les deux mots de passe saisis ne sont pas identiques.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez saisir une adresse e-mail valide.'
      });
    }

    if (isRootAdminEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Cette adresse e-mail est réservée au compte administrateur racine et ne peut pas être utilisée pour une inscription.'
      });
    }

    const existing = await dbService.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Un compte avec cette adresse e-mail existe déjà.'
      });
    }

    const validJobTitles: JobTitle[] = ['Ingénieur', 'Expert', 'Étudiant'];
    let chosenJob: JobTitle = 'Ingénieur';
    if (jobTitle) {
      if (!validJobTitles.includes(jobTitle)) {
        return res.status(400).json({
          success: false,
          error: 'Le champ fonction doit être obligatoirement : Ingénieur, Expert ou Étudiant.'
        });
      }
      chosenJob = jobTitle;
    }

    const passwordHash = await hashPassword(password);

    const newUser: UserRecord = {
      id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name: name.trim(),
      email: cleanEmail,
      jobTitle: chosenJob,
      role: 'ENGINEER',
      status: 'APPROVED',
      passwordHash,
      organization: organization?.trim() || 'Bureau d\'études',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbService.addUser(newUser);
    recordRegisterAttempt(clientIp);

    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'REGISTER',
      userEmail: newUser.email,
      userName: newUser.name,
      details: `Inscription compte utilisateur (${chosenJob}) : accès direct`,
      ip: clientIp
    });

    const token = await dbService.createSession(newUser.id);

    res.cookie('arp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      status: 'APPROVED',
      message: 'Compte créé avec succès.',
      user: sanitizeUser(newUser),
      token
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne lors de l\'enregistrement de votre compte.'
    });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, requireAdmin } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez saisir votre adresse e-mail et votre mot de passe.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const rateLimitKey = `${cleanEmail}_${req.ip}`;

    if (!checkRateLimit(rateLimitKey)) {
      return res.status(429).json({
        success: false,
        error: 'Trop de tentatives infructueuses. Veuillez patienter 2 minutes avant de réessayer.'
      });
    }

    const user = await dbService.getUserByEmail(cleanEmail);
    if (!user) {
      recordFailedAttempt(rateLimitKey);
      await dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'LOGIN_FAILED',
        userEmail: cleanEmail,
        details: requireAdmin
          ? 'Tentative connexion administrateur : adresse e-mail inconnue'
          : 'Tentative connexion : adresse e-mail inconnue',
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects ou utilisateur inexistant.'
      });
    }

    if (user.status === 'DEACTIVATED' || user.status === 'REJECTED') {
      await dbService.invalidateUserSessions(user.id);
      await dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'LOGIN_FAILED',
        userEmail: user.email,
        userName: user.name,
        details: `Refus de connexion pour compte ${user.status} : sessions révoquées`,
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        status: user.status,
        error: user.status === 'DEACTIVATED'
          ? 'Votre compte a été désactivé par l\'administrateur. Contactez le responsable technique.'
          : `Votre demande d'accès a été refusée par l'administrateur.${user.statusReason ? ` Motif : ${user.statusReason}` : ''}`
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      recordFailedAttempt(rateLimitKey);
      await dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'LOGIN_FAILED',
        userEmail: user.email,
        userName: user.name,
        details: requireAdmin
          ? 'Tentative de connexion administrateur : mot de passe erroné'
          : 'Échec de connexion : mot de passe erroné',
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect.'
      });
    }

    clearRateLimit(rateLimitKey);

    const isUserAdmin =
      isRootAdminEmail(user.email) ||
      user.role === 'SUPERADMIN' ||
      user.role === 'ADMIN';

    if (requireAdmin && !isUserAdmin) {
      await dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'LOGIN_FAILED',
        userEmail: user.email,
        userName: user.name,
        details: 'Refus d\'accès au portail administrateur : privilèges insuffisants',
        ip: req.ip
      });
      return res.status(403).json({
        success: false,
        error: 'Accès refusé : Ce compte ne dispose pas des droits d\'administration.'
      });
    }

    await dbService.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    const token = await dbService.createSession(user.id);

    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'LOGIN',
      userEmail: user.email,
      userName: user.name,
      details: requireAdmin
        ? 'Connexion réussie via l\'espace administrateur'
        : `Connexion réussie (Rôle: ${user.role}, Statut: ${user.status})`,
      ip: req.ip
    });

    res.cookie('arp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      user: sanitizeUser(user),
      token,
      mustChangePassword: !!user.mustChangePassword,
      isAdminLogin: !!requireAdmin
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne lors de la tentative de connexion.'
    });
  }
});

// GET /api/auth/me
apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  const token =
    req.cookies?.arp_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.json({ success: false, user: null });
  }

  const session = await dbService.getSession(token);
  if (!session) {
    return res.json({ success: false, user: null });
  }

  const user = await dbService.getUserById(session.userId);
  if (!user) {
    return res.json({ success: false, user: null });
  }

  if (user.status === 'DEACTIVATED' || user.status === 'REJECTED') {
    await dbService.invalidateUserSessions(user.id);
    return res.status(403).json({
      success: false,
      status: user.status,
      error: user.status === 'DEACTIVATED'
        ? 'Votre compte a été désactivé par l\'administrateur.'
        : 'Votre accès a été refusé par l\'administrateur.'
    });
  }

  if (user.status !== 'APPROVED') {
    return res.status(403).json({ success: false, error: 'Compte non autorisé.' });
  }

  return res.json({
    success: true,
    user: sanitizeUser(user),
    mustChangePassword: !!user.mustChangePassword
  });
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  const token =
    req.cookies?.arp_session || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    await dbService.deleteSession(token);
  }
  res.clearCookie('arp_session');
  return res.json({ success: true, message: 'Déconnexion effectuée.' });
});

// POST /api/auth/change-password (User or forced change)
apiRouter.post('/auth/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserRecord;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'La confirmation ne correspond pas au nouveau mot de passe.'
      });
    }

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Veuillez saisir votre mot de passe actuel.'
        });
      }
      const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return res.status(400).json({
          success: false,
          error: 'Le mot de passe actuel est incorrect.'
        });
      }
    }

    const newHash = await hashPassword(newPassword);
    await dbService.updateUser(user.id, {
      passwordHash: newHash,
      mustChangePassword: false,
      updatedAt: new Date().toISOString()
    });

    await dbService.invalidateUserSessions(user.id);
    const newSessionToken = await dbService.createSession(user.id);

    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'PASSWORD_CHANGE',
      userEmail: user.email,
      userName: user.name,
      details: 'Mot de passe modifié par l\'utilisateur avec succès (sessions révoquées)',
      ip: req.ip
    });

    res.cookie('arp_session', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès.',
      token: newSessionToken
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de mot de passe.'
    });
  }
});

// GET /api/auth/recovery-key-status
apiRouter.get('/auth/recovery-key-status', (_req: Request, res: Response) => {
  const isEnvConfigured = !!(process.env.ADMIN_RECOVERY_KEY && process.env.ADMIN_RECOVERY_KEY.length >= 24);
  return res.json({
    success: true,
    isCustomKeySet: isEnvConfigured,
    isLocked: true
  });
});

// POST /api/auth/admin-recovery
apiRouter.post('/auth/admin-recovery', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const { email, recoveryKey, newPassword, confirmPassword } = req.body || {};
  const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

  const ipCheck = checkRecoveryRateLimit(`rec_ip_${clientIp}`);
  const emailCheck = cleanEmail ? checkRecoveryRateLimit(`rec_email_${cleanEmail}`) : { allowed: true, remainingMs: 0 };

  if (!ipCheck.allowed || !emailCheck.allowed) {
    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'ADMIN_RECOVERY',
      userEmail: cleanEmail || 'unknown',
      details: `Tentative de récupération administrative bloquée par rate limiting strict (IP: ${clientIp})`,
      ip: clientIp
    });
    return res.status(429).json({
      success: false,
      error: 'Trop de tentatives infructueuses. Veuillez patienter avant de réessayer.'
    });
  }

  const handleGenericFailure = async () => {
    recordRecoveryFailure(`rec_ip_${clientIp}`);
    if (cleanEmail) {
      recordRecoveryFailure(`rec_email_${cleanEmail}`);
    }
    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'ADMIN_RECOVERY',
      userEmail: cleanEmail || 'unknown',
      details: 'Échec de la tentative de récupération administrative d\'urgence (identifiants ou clé non concordants)',
      ip: clientIp
    });
    return res.status(401).json({
      success: false,
      error: 'Échec de la récupération administrative : informations invalides.'
    });
  };

  try {
    if (!cleanEmail || !recoveryKey || !newPassword) {
      return await handleGenericFailure();
    }

    if (!isRootAdminEmail(cleanEmail)) {
      return await handleGenericFailure();
    }

    const envRecoveryKey = process.env.ADMIN_RECOVERY_KEY;
    if (!envRecoveryKey || envRecoveryKey.length < 24) {
      console.error('[SECURITY ERROR] ADMIN_RECOVERY_KEY non configurée ou trop faible sur le serveur.');
      return await handleGenericFailure();
    }

    const isMatch = timingSafeEqualString(recoveryKey, envRecoveryKey);
    if (!isMatch) {
      return await handleGenericFailure();
    }

    if (typeof newPassword !== 'string' || newPassword.length < 12) {
      recordRecoveryFailure(`rec_ip_${clientIp}`);
      if (cleanEmail) recordRecoveryFailure(`rec_email_${cleanEmail}`);
      await dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'ADMIN_RECOVERY',
        userEmail: cleanEmail,
        details: 'Tentative de récupération administrative rejetée : mot de passe trop faible (< 12 caractères)',
        ip: clientIp
      });
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe administrateur doit comporter au moins 12 caractères.'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      recordRecoveryFailure(`rec_ip_${clientIp}`);
      if (cleanEmail) recordRecoveryFailure(`rec_email_${cleanEmail}`);
      await dbService.addActivityLog({
        id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        timestamp: new Date().toISOString(),
        type: 'ADMIN_RECOVERY',
        userEmail: cleanEmail,
        details: 'Tentative de récupération administrative rejetée : non-concordance des mots de passe saisis',
        ip: clientIp
      });
      return res.status(400).json({
        success: false,
        error: 'Les deux mots de passe saisis ne correspondent pas.'
      });
    }

    const newHash = await hashPassword(newPassword);
    let adminUser = await dbService.getUserByEmail(cleanEmail);

    if (!adminUser) {
      adminUser = {
        id: 'user-root-admin',
        name: 'Administrateur Youcef',
        email: ROOT_ADMIN_EMAIL,
        jobTitle: 'Expert',
        role: 'SUPERADMIN',
        status: 'APPROVED',
        passwordHash: newHash,
        organization: 'Direction Technique & Administration Centrale ARP',
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await dbService.addUser(adminUser);
    } else {
      await dbService.updateUser(adminUser.id, {
        passwordHash: newHash,
        mustChangePassword: false,
        status: 'APPROVED',
        role: 'SUPERADMIN'
      });
    }

    clearRecoveryRateLimit(`rec_ip_${clientIp}`);
    clearRecoveryRateLimit(`rec_email_${cleanEmail}`);

    await dbService.invalidateAllSessions();

    const token = await dbService.createSession(adminUser.id);
    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'ADMIN_RECOVERY',
      userEmail: cleanEmail,
      userName: adminUser.name,
      details: 'Récupération administrative d\'urgence réussie via clé de secours environnement. Toutes les sessions actives ont été révoquées.',
      ip: clientIp
    });

    res.cookie('arp_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      message: 'Mot de passe administrateur réinitialisé avec succès. Toutes les sessions précédentes ont été révoquées.',
      user: sanitizeUser(adminUser),
      token
    });
  } catch (err: any) {
    console.error('Admin recovery error:', err);
    return await handleGenericFailure();
  }
});

// -------------------------------------------------------------
// 2. ADMINISTRATION ROUTES (PROTECTED)
// -------------------------------------------------------------

// GET /api/admin/dashboard-stats
apiRouter.get('/admin/dashboard-stats', requireAdmin, async (_req: Request, res: Response) => {
  const users = await dbService.getUsers();
  const total = users.length;
  const pending = users.filter(u => u.status === 'PENDING').length;
  const approved = users.filter(u => u.status === 'APPROVED').length;
  const rejected = users.filter(u => u.status === 'REJECTED').length;
  const deactivated = users.filter(u => u.status === 'DEACTIVATED').length;

  return res.json({
    success: true,
    stats: {
      total,
      pending,
      approved,
      rejected,
      deactivated
    }
  });
});

// GET /api/admin/users
apiRouter.get('/admin/users', requireAdmin, async (_req: Request, res: Response) => {
  const users = (await dbService.getUsers()).map(sanitizeUser);
  return res.json({
    success: true,
    users,
    rootAdminEmail: ROOT_ADMIN_EMAIL
  });
});

// PUT /api/admin/users/:id/status
apiRouter.put('/admin/users/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED', 'DEACTIVATED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Statut de compte invalide.' });
    }

    const user = await dbService.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    }

    if (isRootAdminEmail(user.email) || user.role === 'SUPERADMIN' || user.id === 'user-root-admin') {
      return res.status(403).json({
        success: false,
        error: 'Le compte de l\'administrateur principal ne peut être ni bloqué, ni modifié, ni rétrogradé.'
      });
    }

    const updated = await dbService.updateUser(id, {
      status,
      statusReason: reason
    });

    if (status === 'DEACTIVATED' || status === 'REJECTED') {
      await dbService.invalidateUserSessions(id);
    }

    const admin = (req as any).user;
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown') as string;
    const actionLabel =
      status === 'DEACTIVATED'
        ? 'Blocage compte utilisateur'
        : status === 'APPROVED'
        ? 'Déblocage / Activation compte utilisateur'
        : `Modification statut vers ${status}`;

    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'STATUS_CHANGE',
      userEmail: user.email,
      userName: user.name,
      details: `[${actionLabel}] Par : ${admin?.email || 'Admin'} | Cible : ${user.email} (${user.name}) | Statut : ${status}${reason ? ` | Motif : ${reason}` : ''}`,
      ip: clientIp
    });

    return res.json({
      success: true,
      user: updated ? sanitizeUser(updated) : null
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erreur lors de la mise à jour.' });
  }
});

// PUT /api/admin/users/:id/profile
apiRouter.put('/admin/users/:id/profile', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, jobTitle, organization, role } = req.body;

    const user = await dbService.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    }

    if (isRootAdminEmail(user.email) || user.role === 'SUPERADMIN' || user.id === 'user-root-admin') {
      return res.status(403).json({
        success: false,
        error: 'Le compte de l\'administrateur principal ne peut pas être modifié via cette interface.'
      });
    }

    if (role && (role === 'ADMIN' || role === 'SUPERADMIN')) {
      return res.status(403).json({
        success: false,
        error: 'Un administrateur ne peut pas attribuer un rôle ADMIN ou SUPERADMIN.'
      });
    }

    const updates: Partial<UserRecord> = {};

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (email && email.trim()) {
      const cleanEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Format d\'adresse e-mail invalide.'
        });
      }

      if (cleanEmail !== user.email.toLowerCase()) {
        const existing = await dbService.getUserByEmail(cleanEmail);
        if (existing && existing.id !== id) {
          return res.status(400).json({
            success: false,
            error: 'Cette adresse e-mail est déjà utilisée par un autre compte.'
          });
        }
        if (isRootAdminEmail(cleanEmail)) {
          return res.status(403).json({
            success: false,
            error: 'L\'adresse de l\'administrateur principal ne peut pas être assignée.'
          });
        }
        updates.email = cleanEmail;
      }
    }

    if (jobTitle) {
      if (!['Ingénieur', 'Expert', 'Étudiant'].includes(jobTitle)) {
        return res.status(400).json({
          success: false,
          error: 'Fonction invalide. Choix autorisés : Ingénieur, Expert, Étudiant.'
        });
      }
      updates.jobTitle = jobTitle;
    }

    if (organization !== undefined) {
      updates.organization = organization.trim();
    }

    const updated = await dbService.updateUser(id, updates);
    const admin = (req as any).user;
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown') as string;

    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'USER_UPDATED',
      userEmail: user.email,
      userName: user.name,
      details: `[Modification Profil] Par : ${admin?.email || 'Admin'} | Cible : ${user.email} | Nom: ${updates.name || user.name}, Email: ${updates.email || user.email}, Fonction: ${updates.jobTitle || user.jobTitle}, Organisme: ${updates.organization || user.organization || 'Non renseigné'}`,
      ip: clientIp
    });

    return res.json({
      success: true,
      user: updated ? sanitizeUser(updated) : null
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erreur de mise à jour du profil.' });
  }
});

// POST /api/admin/users/:id/reset-password
apiRouter.post('/admin/users/:id/reset-password', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customPassword } = req.body;

    const user = await dbService.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    }

    if (isRootAdminEmail(user.email) || user.role === 'SUPERADMIN' || user.id === 'user-root-admin') {
      return res.status(403).json({
        success: false,
        error: 'Le mot de passe de l\'administrateur principal ne peut pas être réinitialisé via cette interface.'
      });
    }

    let temporaryPassword = '';
    if (customPassword && customPassword.trim().length >= 6) {
      temporaryPassword = customPassword.trim();
    } else {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
      let randomPass = '';
      for (let i = 0; i < 12; i++) {
        randomPass += chars.charAt(crypto.randomInt(0, chars.length));
      }
      temporaryPassword = randomPass;
    }

    const newHash = await hashPassword(temporaryPassword);
    await dbService.updateUser(id, {
      passwordHash: newHash,
      mustChangePassword: true,
      updatedAt: new Date().toISOString()
    });

    await dbService.invalidateUserSessions(id);

    const admin = (req as any).user;
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown') as string;

    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'PASSWORD_RESET_ADMIN',
      userEmail: user.email,
      userName: user.name,
      details: `[Réinitialisation Mot de Passe] Par : ${admin?.email || 'Admin'} | Cible : ${user.email} | Mot de passe provisoire émis (non consigné), sessions révoquées, changement imposé à la prochaine connexion`,
      ip: clientIp
    });

    return res.json({
      success: true,
      message: 'Mot de passe provisoire généré avec succès. Il ne sera affiché qu\'une seule fois.',
      temporaryPassword,
      userEmail: user.email,
      userName: user.name
    });
  } catch (err: any) {
    console.error('Admin reset password error:', err);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation administrative.'
    });
  }
});

// DELETE /api/admin/users/:id
apiRouter.delete('/admin/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const targetUser = await dbService.getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Compte introuvable.' });
    }

    if (isRootAdminEmail(targetUser.email) || targetUser.role === 'SUPERADMIN' || targetUser.id === 'user-root-admin') {
      return res.status(403).json({
        success: false,
        error: 'Le compte de l\'administrateur principal ne peut pas être supprimé.'
      });
    }

    const success = await dbService.deleteUser(id);
    if (!success) {
      return res.status(400).json({ success: false, error: 'Échec de la suppression.' });
    }

    const admin = (req as any).user;
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown') as string;

    await dbService.addActivityLog({
      id: `act-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      timestamp: new Date().toISOString(),
      type: 'STATUS_CHANGE',
      userEmail: targetUser.email,
      userName: targetUser.name,
      details: `[Suppression Définitive] Par : ${admin?.email || 'Admin'} | Cible : ${targetUser.email} (${targetUser.name}) | Compte supprimé et sessions révoquées`,
      ip: clientIp
    });

    return res.json({ success: true, message: 'Compte utilisateur et sessions supprimés avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/admin/activity (Audit logs)
apiRouter.get('/admin/activity', requireAdmin, async (_req: Request, res: Response) => {
  const logs = await dbService.getActivityLogs();
  return res.json({ success: true, activity: logs });
});

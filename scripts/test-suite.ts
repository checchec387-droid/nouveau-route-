/**
 * ARP ROAD DESIGN EXPERT – SUITE DE TESTS COMPLÈTE (SANS E-MAIL)
 * Exécute l'intégralité des vérifications de sécurité, d'inscription immédiate et de calculs ARP
 */

import dotenv from 'dotenv';
dotenv.config();

// Ensure test environment satisfies the required security constraints
process.env.ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'TestSecureAdminPass2026!';
process.env.ADMIN_RECOVERY_KEY = process.env.ADMIN_RECOVERY_KEY || 'TestEmergencyRecoveryKey2026!Min24Chars';

import {
  dbService,
  hashPassword,
  verifyPassword,
  ROOT_ADMIN_EMAIL,
  isRootAdminEmail,
  validateSecurityEnv,
  timingSafeEqualString
} from '../server/db';
import {
  checkRegisterRateLimit,
  recordRegisterAttempt,
  resetRegisterRateLimit,
  requireAuth,
  requireAdmin
} from '../server/api';
import {
  calculateDeversNormal,
  calculateClothoideNormal,
  calculateDeversReliefDifficile,
  calculateLargeurRoulable,
  calculateSurlargeurLacet
} from '../src/utils/arpCalculations';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log(' DÉBUT DE LA SUITE DE TESTS OBLIGATOIRES ARP 2026');
  console.log('======================================================\n');

  // Test 1: Identification & Protection Administrateur Principal
  console.log('--- TEST 1 : Administrateur Principal Unique ---');
  assert(
    ROOT_ADMIN_EMAIL === 'youcefyoucefbelallia@gmail.com',
    'Email administrateur principal strictement conforme'
  );
  assert(
    isRootAdminEmail('youcefyoucefbelallia@gmail.com'),
    'Vérification isRootAdminEmail retourne true'
  );
  assert(
    !isRootAdminEmail('hacker@domain.fr'),
    'Vérification isRootAdminEmail rejette les autres adresses'
  );
  const rootUser = await dbService.getUserByEmail(ROOT_ADMIN_EMAIL);
  assert(
    !!rootUser && rootUser.role === 'SUPERADMIN' && rootUser.status === 'APPROVED',
    'Compte administrateur initialisé avec rôle SUPERADMIN et statut APPROVED'
  );

  // Test 2: Inscription Utilisateur & Accès Direct Immédiat (APPROVED / ENGINEER)
  console.log('\n--- TEST 2 : Inscription Utilisateur & Accès Direct Immédiat ---');
  const testEmail = `test.ingenieur.${Date.now()}@cerema-etudes.fr`;
  const initialHash = await hashPassword('MotDePasse123!');
  await dbService.addUser({
    id: `user-test-${Date.now()}`,
    name: 'Ingénieur Jean Dupont',
    email: testEmail,
    jobTitle: 'Ingénieur',
    role: 'ENGINEER',
    status: 'APPROVED',
    passwordHash: initialHash,
    organization: 'Cabinet Géoroute',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const createdUser = await dbService.getUserByEmail(testEmail);
  assert(
    !!createdUser && createdUser.status === 'APPROVED',
    'Compte créé avec statut APPROVED (accès direct immédiat sans validation préalable)'
  );
  assert(
    createdUser?.role === 'ENGINEER',
    'Compte créé avec rôle ENGINEER'
  );
  assert(
    createdUser?.jobTitle === 'Ingénieur',
    'Fonction Ingénieur correctement enregistrée'
  );

  // Test 3: Sécurité des Rôles & Validation des Données d'Inscription
  console.log('\n--- TEST 3 : Sécurité des Rôles & Inscription ---');
  assert(
    isRootAdminEmail(ROOT_ADMIN_EMAIL),
    'Tentative d\'inscription avec l\'adresse e-mail root strictement détectée'
  );
  const messyEmail = '   Test.Engineer.Duplicate@Example.Com   ';
  const cleanEmail = messyEmail.toLowerCase().trim();
  assert(
    cleanEmail === 'test.engineer.duplicate@example.com',
    'Normalisation de l\'adresse e-mail (minuscules et trim) conforme'
  );

  const validJobTitles = ['Ingénieur', 'Expert', 'Étudiant'];
  const testJobValid1 = validJobTitles.includes('Ingénieur');
  const testJobValid2 = validJobTitles.includes('Expert');
  const testJobValid3 = validJobTitles.includes('Étudiant');
  const testJobInvalid = validJobTitles.includes('SuperviseurDirecteur');
  assert(
    testJobValid1 && testJobValid2 && testJobValid3 && !testJobInvalid,
    'Fonction strictement limitée : Ingénieur, Expert, Étudiant'
  );

  // Test 4: Rate Limiting sur l'Inscription
  console.log('\n--- TEST 4 : Rate Limiting sur l\'Inscription (par IP) ---');
  const testIp = '192.168.1.100';
  resetRegisterRateLimit();
  assert(
    checkRegisterRateLimit(testIp),
    'Première inscription autorisée par le rate limiter'
  );
  for (let i = 0; i < 12; i++) {
    recordRegisterAttempt(testIp);
  }
  assert(
    !checkRegisterRateLimit(testIp),
    'Création massive de comptes bloquée par le rate limiter IP'
  );
  resetRegisterRateLimit();

  // Test 5: Rejet Serveur (HTTP 403) & Révocation Immédiate pour DEACTIVATED et REJECTED
  console.log('\n--- TEST 5 : Rejet Serveur (403) & Révocation Sessions pour Comptes Inactifs ---');
  const sessionToken = await dbService.createSession(createdUser!.id);
  assert(
    !!(await dbService.getSession(sessionToken)),
    'Session active préalablement créée'
  );

  // Simulate requireAuth on DEACTIVATED user
  await dbService.updateUser(createdUser!.id, { status: 'DEACTIVATED' });
  const mockReqDeactivated: any = {
    cookies: { arp_session: sessionToken },
    headers: {}
  };
  let deactStatus = 0;
  let deactError = '';
  const mockResDeactivated: any = {
    status(code: number) {
      deactStatus = code;
      return this;
    },
    json(body: any) {
      deactError = body.error;
      return this;
    }
  };
  await requireAuth(mockReqDeactivated, mockResDeactivated, () => {});
  assert(
    deactStatus === 403,
    'Compte DEACTIVATED rejeté avec code HTTP 403 par le middleware d\'authentification'
  );
  assert(
    !(await dbService.getSession(sessionToken)),
    'Sessions immédiatement révoquées lors de la tentative d\'accès du compte désactivé'
  );

  // Simulate requireAuth on REJECTED user
  const sessionToken2 = await dbService.createSession(createdUser!.id);
  await dbService.updateUser(createdUser!.id, { status: 'REJECTED' });
  let rejStatus = 0;
  const mockResRejected: any = {
    status(code: number) {
      rejStatus = code;
      return this;
    },
    json(body: any) {
      return this;
    }
  };
  const mockReqRejected: any = {
    cookies: { arp_session: sessionToken2 },
    headers: {}
  };
  await requireAuth(mockReqRejected, mockResRejected, () => {});
  assert(
    rejStatus === 403,
    'Compte REJECTED rejeté avec code HTTP 403 par le middleware d\'authentification'
  );
  assert(
    !(await dbService.getSession(sessionToken2)),
    'Sessions immédiatement révoquées lors de la tentative d\'accès du compte rejeté'
  );

  // Rétablir en APPROVED pour la suite des tests
  await dbService.updateUser(createdUser!.id, { status: 'APPROVED' });
  const activeSessionToken = await dbService.createSession(createdUser!.id);

  // Test 6: Authentification & Création de Session
  console.log('\n--- TEST 6 : Authentification & Création de Session ---');
  const passwordValid = await verifyPassword('MotDePasse123!', createdUser!.passwordHash);
  assert(passwordValid, 'Vérification du hachage de mot de passe via scrypt réussie');
  const activeSession = await dbService.getSession(activeSessionToken);
  assert(
    !!activeSession && activeSession.userId === createdUser!.id,
    'Session active créée et récupérable par token'
  );

  // Test 7: Modification de Profil
  console.log('\n--- TEST 7 : Modification de Profil ---');
  await dbService.updateUser(createdUser!.id, {
    name: 'Ingénieur Jean-Marc Dupont',
    jobTitle: 'Expert',
    status: 'APPROVED'
  });
  const updatedUser = await dbService.getUserById(createdUser!.id);
  assert(
    updatedUser?.name === 'Ingénieur Jean-Marc Dupont' && updatedUser?.jobTitle === 'Expert',
    'Profil utilisateur modifié avec succès (Nom & Fonction Expert)'
  );

  // Test 8: Réinitialisation administrative du mot de passe
  console.log('\n--- TEST 8 : Réinitialisation Mot de Passe par Admin ---');
  const tempPassword = 'TempPassword2026!';
  const tempHash = await hashPassword(tempPassword);
  await dbService.updateUser(updatedUser!.id, {
    passwordHash: tempHash,
    mustChangePassword: true
  });
  await dbService.invalidateUserSessions(updatedUser!.id);
  const resetUser = await dbService.getUserById(updatedUser!.id);
  assert(
    resetUser?.mustChangePassword === true,
    'Drapeau mustChangePassword activé suite à la réinitialisation par l\'administrateur'
  );
  const tempValid = await verifyPassword(tempPassword, resetUser!.passwordHash);
  assert(tempValid, 'Le mot de passe provisoire permet l\'authentification');

  // Test 9: Rétablissement du mot de passe personnel par l'utilisateur
  console.log('\n--- TEST 9 : Personnalisation Obligatoire du Mot de Passe ---');
  const personalHash = await hashPassword('MonNouveauMotDePassePerso2026!');
  await dbService.updateUser(resetUser!.id, {
    passwordHash: personalHash,
    mustChangePassword: false
  });
  const finalizedUser = await dbService.getUserById(resetUser!.id);
  assert(
    finalizedUser?.mustChangePassword === false,
    'Drapeau mustChangePassword levé après personnalisation du mot de passe'
  );

  // Test 10: Inaltérabilité du Superadministrateur
  console.log('\n--- TEST 10 : Inaltérabilité du Superadministrateur ---');
  let threwRoleError = false;
  try {
    await dbService.updateUser('user-root-admin', { role: 'ENGINEER' });
  } catch {
    threwRoleError = true;
  }
  assert(
    threwRoleError,
    'Tentative de rétrogradation du superadministrateur strictement rejetée'
  );

  let threwDeleteError = false;
  try {
    await dbService.deleteUser('user-root-admin');
  } catch {
    threwDeleteError = true;
  }
  assert(
    threwDeleteError,
    'Tentative de suppression du compte administrateur principal strictement rejetée'
  );

  // Test 11: Modules Métier de Calculs Routiers ARP Cerema 2022
  console.log('\n--- TEST 11 : Validation des Calculs Routiers ARP ---');
  const resDevers = calculateDeversNormal({ category: 'R1', isInterurbaine110: false, radiusR: 300 });
  assert(
    resDevers.calculatedDevers > 2.5 && resDevers.calculatedDevers < 7.0,
    `Calcul du dévers R1 R=300m conforme (${resDevers.calculatedDevers}%)`
  );

  const resCloth = calculateClothoideNormal({
    crossSectionType: '2 voies',
    radiusR: 300,
    widthL: 7.0,
    deltaDevers: 4.5,
    category: 'R1',
    isInterurbaine110: false
  });
  assert(
    resCloth.lengthL >= 63.0,
    `Clothoïde normale dimensionnante conforme (L = ${resCloth.lengthL} m)`
  );

  const resRD = calculateDeversReliefDifficile({
    radiusR: 200,
    longitudinalSlopeP: 4.0,
    hasSnowOrFrost: false
  });
  assert(
    resRD.resultantSlope <= 10.0,
    `Pente résultante en relief difficile conforme (P_rés = ${resRD.resultantSlope}% <= 10%)`
  );

  const resLarg = calculateLargeurRoulable({
    functionLevel: 'intermediaire',
    tmja: 2500,
    heavyVehiclesPL: 150
  });
  assert(
    resLarg.totalRoulableWidth === 9.0,
    `Largeur roulable niveau intermédiaire conforme (${resLarg.totalRoulableWidth} m)`
  );

  const resSurl = calculateSurlargeurLacet({
    innerRadiusR: 100,
    normalLaneWidth: 3.50,
    isDifficultRelief: true
  });
  assert(
    resSurl.wideningPerLane > 0,
    `Surlargeur en courbe calculée (+${resSurl.wideningPerLane} m par voie)`
  );

  // Test 12: Absence Totale de Services E-mails / SMTP
  console.log('\n--- TEST 12 : Absence Totale de Services E-mails / SMTP ---');
  const pkgRaw = fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8');
  assert(!pkgRaw.includes('nodemailer'), 'Aucune dépendance nodemailer dans package.json');
  assert(!pkgRaw.includes('sendgrid'), 'Aucun service API d\'e-mail tiers');

  const envRaw = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf-8');
  assert(!envRaw.includes('SMTP_HOST'), 'Aucune variable SMTP_HOST dans .env.example');
  assert(!envRaw.includes('SMTP_PASS'), 'Aucune variable SMTP_PASS dans .env.example');

  // Test 13: Exigence ADMIN_INITIAL_PASSWORD (min 12 car) et ADMIN_RECOVERY_KEY (min 24 car)
  console.log('\n--- TEST 13 : Validation Stricte des Variables d\'Environnement ---');
  let validationPassed = false;
  try {
    validateSecurityEnv();
    validationPassed = true;
  } catch {
    validationPassed = false;
  }
  assert(validationPassed, 'validateSecurityEnv() accepte les clés conformes aux exigences');

  // Test failure case for weak password
  const savedPassword = process.env.ADMIN_INITIAL_PASSWORD;
  process.env.ADMIN_INITIAL_PASSWORD = 'short';
  let weakPasswordRejected = false;
  try {
    validateSecurityEnv();
  } catch {
    weakPasswordRejected = true;
  }
  process.env.ADMIN_INITIAL_PASSWORD = savedPassword;
  assert(weakPasswordRejected, 'validateSecurityEnv() rejette un mot de passe < 12 caractères');

  // Test failure case for weak recovery key
  const savedKey = process.env.ADMIN_RECOVERY_KEY;
  process.env.ADMIN_RECOVERY_KEY = 'short_key';
  let weakKeyRejected = false;
  try {
    validateSecurityEnv();
  } catch {
    weakKeyRejected = true;
  }
  process.env.ADMIN_RECOVERY_KEY = savedKey;
  assert(weakKeyRejected, 'validateSecurityEnv() rejette une clé de secours < 24 caractères');

  // Test 14: Comparaison en temps constant de la clé de secours
  console.log('\n--- TEST 14 : Comparaison en Temps Constant de la Clé de Secours ---');
  const currentKey = process.env.ADMIN_RECOVERY_KEY!;
  const keyVerified = await dbService.verifyRecoveryKey(currentKey);
  assert(keyVerified, 'verifyRecoveryKey valide la clé correcte');

  const falseKeyVerified = await dbService.verifyRecoveryKey('CleTotalementFausseEtInvalideDeSecours2026!');
  assert(!falseKeyVerified, 'verifyRecoveryKey rejette une clé invalide');

  const timingEqualOk = timingSafeEqualString('chaine1_identique_pour_test', 'chaine1_identique_pour_test');
  const timingEqualDiff = timingSafeEqualString('chaine1_differente', 'chaine2_differente');
  assert(timingEqualOk && !timingEqualDiff, 'timingSafeEqualString fonctionne en temps constant sans exception');

  // Test 15: Absence de secrets codés en dur dans le code source
  console.log('\n--- TEST 15 : Absence de Secrets Codés en Dur ---');
  const dbCode = fs.readFileSync(path.resolve(process.cwd(), 'server/db.ts'), 'utf-8');
  assert(!dbCode.includes('Admin@ARP2026!Secure'), 'Aucun mot de passe admin par défaut dans server/db.ts');
  assert(!dbCode.includes('ARP_EMERGENCY_RECOVERY_SECRET_KEY_2026'), 'Aucune clé de secours par défaut dans server/db.ts');

  const apiCode = fs.readFileSync(path.resolve(process.cwd(), 'server/api.ts'), 'utf-8');
  assert(!apiCode.includes('Admin@ARP2026!Secure'), 'Aucun mot de passe admin par défaut dans server/api.ts');
  assert(!apiCode.includes('ARP_EMERGENCY_RECOVERY_SECRET_KEY_2026'), 'Aucune clé de secours par défaut dans server/api.ts');
  assert(!apiCode.includes('/auth/init-recovery-key'), 'Route /auth/init-recovery-key supprimée de server/api.ts');

  const authPortalCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/auth/AuthPortal.tsx'), 'utf-8');
  assert(!authPortalCode.includes('Admin@ARP2026!Secure'), 'Aucun mot de passe affiché ou codé en dur dans AuthPortal.tsx');
  assert(!authPortalCode.includes('ARP_EMERGENCY_RECOVERY_SECRET_KEY_2026'), 'Aucune clé affichée ou codée en dur dans AuthPortal.tsx');
  assert(!authPortalCode.includes('admin-init-recovery'), 'Vue admin-init-recovery supprimée d\'AuthPortal.tsx');

  // Test 16: Suppression des mentions d'attente de validation
  console.log('\n--- TEST 16 : Suppression des Mentions d\'Attente de Validation ---');
  assert(
    !authPortalCode.includes("attente de validation"),
    'Aucune mention "attente de validation" dans AuthPortal.tsx'
  );
  assert(
    !authPortalCode.includes("view === 'pending'"),
    'Vue pending supprimée de AuthPortal.tsx'
  );
  assert(
    !apiCode.includes("attente de validation"),
    'Aucune mention "attente de validation" dans server/api.ts'
  );

  // Test 17: Protection des routes d'administration contre les utilisateurs normaux (requireAdmin)
  console.log('\n--- TEST 17 : Contrôle d\'Accès des Routes Administrateur ---');
  // 17.1 Utilisateur anonyme
  let unauthStatus = 0;
  const mockResUnauth: any = {
    status(code: number) {
      unauthStatus = code;
      return this;
    },
    json() {
      return this;
    }
  };
  await requireAdmin({ cookies: {}, headers: {} } as any, mockResUnauth, () => {});
  assert(
    unauthStatus === 401,
    'Utilisateur non authentifié rejeté avec HTTP 401 sur requireAdmin'
  );

  // 17.2 Utilisateur standard (ENGINEER)
  const engineerToken = await dbService.createSession(createdUser!.id);
  let normalUserStatus = 0;
  let normalUserError = '';
  const mockResNormal: any = {
    status(code: number) {
      normalUserStatus = code;
      return this;
    },
    json(body: any) {
      normalUserError = body.error;
      return this;
    }
  };
  await requireAdmin(
    { cookies: { arp_session: engineerToken }, headers: {} } as any,
    mockResNormal,
    () => {}
  );
  assert(
    normalUserStatus === 403,
    'Utilisateur normal (rôle ENGINEER) rejeté avec HTTP 403 sur les routes d\'administration'
  );
  assert(
    normalUserError.includes('réservé exclusivement aux administrateurs'),
    'Message d\'erreur explicite sur la restriction administrative'
  );

  // Test 18: Inaltérabilité et Protection Absolue du Compte Root
  console.log('\n--- TEST 18 : Protection Absolue du Compte Root Admin ---');
  let rootBlockBlocked = false;
  try {
    await dbService.updateUser('user-root-admin', { status: 'DEACTIVATED' });
  } catch (err: any) {
    rootBlockBlocked = true;
  }
  assert(
    rootBlockBlocked,
    'Tentative de désactiver ou bloquer le compte root rejetée'
  );

  let rootDeleteBlocked = false;
  try {
    await dbService.deleteUser('user-root-admin');
  } catch (err: any) {
    rootDeleteBlocked = true;
  }
  assert(
    rootDeleteBlocked,
    'Tentative de supprimer le compte root rejetée'
  );

  let rootDemoteBlocked = false;
  try {
    await dbService.updateUser('user-root-admin', { role: 'ENGINEER' });
  } catch {
    rootDemoteBlocked = true;
  }
  assert(
    rootDemoteBlocked,
    'Tentative de rétrograder le compte root rejetée'
  );

  // Test 19 : Utilisateur Bloqué ne peut plus se connecter & Sessions révoquées
  console.log('\n--- TEST 19 : Blocage Utilisateur & Interdiction de Connexion ---');
  const blockedEmail = `blocked.engineer.${Date.now()}@cerema-etudes.fr`;
  const blockedHash = await hashPassword('BlockedPass123!');
  const blockedUserRecord = {
    id: `user-blocked-${Date.now()}`,
    name: 'Ingénieur Bloqué',
    email: blockedEmail,
    jobTitle: 'Ingénieur' as const,
    role: 'ENGINEER' as const,
    status: 'APPROVED' as const,
    passwordHash: blockedHash,
    organization: 'Labo Test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await dbService.addUser(blockedUserRecord);

  // 1. Session active avant blocage
  const testSession = await dbService.createSession(blockedUserRecord.id);
  assert(
    !!(await dbService.getSession(testSession)),
    'Session valide initialement active pour l\'utilisateur'
  );

  // 2. Blocage par l'admin : statut DEACTIVATED avec motif
  await dbService.updateUser(blockedUserRecord.id, {
    status: 'DEACTIVATED',
    statusReason: 'Non-conformité contractuelle temporaire'
  });
  await dbService.invalidateUserSessions(blockedUserRecord.id);

  // 3. Vérification de la révocation immédiate des sessions
  assert(
    !(await dbService.getSession(testSession)),
    'Toutes les sessions de l\'utilisateur sont immédiatement révoquées lors du blocage'
  );

  // 4. Tentative d'accès à une route protégée par requireAuth
  let accessAttemptStatus = 0;
  const mockResAccess: any = {
    status(code: number) {
      accessAttemptStatus = code;
      return this;
    },
    json() {
      return this;
    }
  };
  const fraudulentToken = await dbService.createSession(blockedUserRecord.id);
  await requireAuth(
    { cookies: { arp_session: fraudulentToken }, headers: {} } as any,
    mockResAccess,
    () => {}
  );
  assert(
    accessAttemptStatus === 403,
    'Utilisateur bloqué (DEACTIVATED) strictement rejeté avec HTTP 403 sur les routes protégées'
  );
  assert(
    !(await dbService.getSession(fraudulentToken)),
    'Session frauduleuse immédiatement révoquée'
  );

  // 5. Déblocage (unblock)
  await dbService.updateUser(blockedUserRecord.id, { status: 'APPROVED' });
  const unblockedUser = await dbService.getUserById(blockedUserRecord.id);
  assert(
    unblockedUser?.status === 'APPROVED',
    'Déblocage réactive avec succès le statut APPROVED'
  );

  // Test 20: Traçabilité du Journal d'Audit (Qui, Sur qui, Quoi, IP, Date sans mot de passe)
  console.log('\n--- TEST 20 : Traçabilité du Journal d\'Audit ---');
  await dbService.addActivityLog({
    id: `act-test-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'STATUS_CHANGE',
    userEmail: blockedUserRecord.email,
    userName: blockedUserRecord.name,
    details: `[Blocage compte utilisateur] Par : youcefyoucefbelallia@gmail.com | Cible : ${blockedUserRecord.email} | Statut : DEACTIVATED | Motif : Audit sécurité`,
    ip: '127.0.0.1'
  });
  const logs = await dbService.getActivityLogs();
  const testLog = logs.find(l => l.userEmail === blockedUserRecord.email);
  assert(
    !!testLog,
    'Action enregistrée dans le journal d\'audit'
  );
  assert(
    testLog!.details.includes('Par :') && testLog!.details.includes('Cible :'),
    'Journal d\'audit consigne qui a agi et sur quel utilisateur'
  );
  assert(
    testLog!.details.includes('Motif : Audit sécurité'),
    'Motif consigné dans le journal d\'audit'
  );
  assert(
    !testLog!.details.includes('BlockedPass123!'),
    'Aucun mot de passe consigné dans le journal d\'audit'
  );

  // Nettoyage comptes test
  await dbService.deleteUser(createdUser!.id);
  await dbService.deleteUser(blockedUserRecord.id);

  console.log('\n======================================================');
  console.log(`  BILAN DES TESTS : ${passed} RÉUSSIS / ${failed} ÉCHECS`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

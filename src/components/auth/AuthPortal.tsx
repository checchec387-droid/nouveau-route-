import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { JobTitle } from '../../types/auth';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  Mail,
  User,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Briefcase,
  Award,
  GraduationCap,
  HelpCircle,
  Terminal
} from 'lucide-react';

interface Props {
  initialView?: 'login' | 'register' | 'forgot' | 'admin-login' | 'admin-recovery';
  onAdminLogin?: () => void;
}

export const AuthPortal: React.FC<Props> = ({
  initialView = 'login',
  onAdminLogin
}) => {
  const { user, login, register, changePassword, adminRecovery } = useAuth();
  const [view, setView] = useState<
    | 'login'
    | 'register'
    | 'forgot'
    | 'admin-login'
    | 'admin-recovery'
    | 'force-password-change'
  >(user?.mustChangePassword ? 'force-password-change' : initialView);

  // Normal login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin login
  const [adminEmail, setAdminEmail] = useState('youcefyoucefbelallia@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');

  // Register
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regJobTitle, setRegJobTitle] = useState<JobTitle>('Ingénieur');
  const [regOrg, setRegOrg] = useState('');

  // Force change password (for temporary password)
  const [currentPass, setCurrentPass] = useState('');
  const [newForcedPass, setNewForcedPass] = useState('');
  const [confirmForcedPass, setConfirmForcedPass] = useState('');

  // Admin recovery without email
  const [recEmail, setRecEmail] = useState('youcefyoucefbelallia@gmail.com');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recConfirmPassword, setRecConfirmPassword] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. Submit Login (User)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);
    try {
      const res = await login(loginEmail, loginPassword, false);
      if (!res.success) {
        setErrorMsg(res.error || 'Identifiants invalides.');
      } else if (res.mustChangePassword) {
        setView('force-password-change');
      } else if (res.isAdminLogin && onAdminLogin) {
        onAdminLogin();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Login (Admin)
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);
    try {
      const res = await login(adminEmail, adminPassword, true);
      if (!res.success) {
        setErrorMsg(res.error || 'Identifiants administrateur incorrects ou compte non autorisé.');
      } else if (res.mustChangePassword) {
        setView('force-password-change');
      } else if (onAdminLogin) {
        onAdminLogin();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Register (User)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Le mot de passe et sa confirmation ne correspondent pas.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        jobTitle: regJobTitle,
        organization: regOrg
      });
      if (res.success) {
        setSuccessMsg(res.message || 'Compte créé avec succès.');
      } else {
        setErrorMsg(res.error || 'Erreur lors de l\'enregistrement.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Submit Force Password Change (Temporary Password)
  const handleForceChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (newForcedPass !== confirmForcedPass) {
      setErrorMsg('Les deux mots de passe ne sont pas identiques.');
      return;
    }
    if (newForcedPass.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await changePassword(currentPass, newForcedPass, confirmForcedPass);
      if (res.success) {
        setSuccessMsg('Votre mot de passe a été personnalisé avec succès !');
        setTimeout(() => {
          if (onAdminLogin && (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN')) {
            onAdminLogin();
          }
        }, 500);
      } else {
        setErrorMsg(res.error || 'Échec de la modification du mot de passe.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Submit Admin Emergency Recovery without email
  const handleAdminRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (recNewPassword !== recConfirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (recNewPassword.length < 12) {
      setErrorMsg('Le nouveau mot de passe administrateur doit comporter au moins 12 caractères.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await adminRecovery(recEmail, recoveryKey, recNewPassword, recConfirmPassword);
      if (res.success) {
        setSuccessMsg(res.message || 'Mot de passe administrateur réinitialisé avec succès.');
        if (onAdminLogin) {
          setTimeout(() => {
            onAdminLogin();
          }, 800);
        }
      } else {
        setErrorMsg(res.error || 'Échec de la récupération administrative.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden relative">
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={() => {
              if (view === 'admin-login' || view === 'admin-recovery') {
                setView('login');
              } else {
                setView('admin-login');
              }
              clearMessages();
            }}
            className={`absolute top-4 right-4 py-1 px-2.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
              view === 'admin-login' || view === 'admin-recovery'
                ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Shield
              className={`w-3.5 h-3.5 ${
                view === 'admin-login' || view === 'admin-recovery'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            />
            <span className="text-[11px] font-medium hidden sm:inline">
              {view === 'admin-login' || view === 'admin-recovery'
                ? 'Mode Normal'
                : 'Admin'}
            </span>
          </button>
          <div className="w-12 h-12 bg-linear-to-br from-sky-400 to-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-950 font-black text-lg shadow-sm">
            RD
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            RoadDesign Studio Pro
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Plateforme d'Ingénierie Géométrique Routière & Autoroutière (ARP & ICTAAL)
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {view === 'force-password-change' && (
            <form onSubmit={handleForceChangeSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  Changement de mot de passe obligatoire
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Votre mot de passe a été réinitialisé provisoirement. Pour des raisons de sécurité, vous devez définir votre nouveau mot de passe personnel pour continuer.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouveau mot de passe personnel (min. 6 caractères) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newForcedPass}
                    onChange={(e) => setNewForcedPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmer le nouveau mot de passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmForcedPass}
                    onChange={(e) => setConfirmForcedPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? 'Mise à jour sécurisée...' : 'Enregistrer mon mot de passe et continuer'}</span>
              </button>
            </form>
          )}

          {view === 'admin-login' && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-700" />
                    Connexion Administrateur Principal
                  </span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded font-mono">
                    Accès Réservé
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Authentification du superviseur : <strong>{adminEmail}</strong>
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail administrateur
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-rose-700 bg-white"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe administrateur
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('admin-recovery');
                      clearMessages();
                    }}
                    className="text-xs text-rose-700 hover:underline cursor-pointer font-medium"
                  >
                    Mot de passe oublié
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-rose-700 bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>{isSubmitting ? 'Vérification...' : 'Accéder à l\'Espace Administrateur'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    clearMessages();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la connexion ordinaire</span>
                </button>
              </div>
            </form>
          )}

          {view === 'admin-recovery' && (
            <form onSubmit={handleAdminRecoverySubmit} className="space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-rose-700" />
                  Récupération Administrative d'Urgence (Sans E-mail)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Cette procédure de secours indépendante des e-mails repose exclusivement sur la clé secrète configurée dans l'environnement serveur (ADMIN_RECOVERY_KEY).
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail administrateur
                </label>
                <input
                  type="email"
                  required
                  readOnly
                  value={recEmail}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-500 bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clé secrète de secours serveur (ADMIN_RECOVERY_KEY) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="Saisissez votre clé de secours secrète (min. 24 caractères)"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-rose-700 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouveau mot de passe administrateur (min. 12 car.) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={recNewPassword}
                    onChange={(e) => setRecNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-rose-700 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmer le mot de passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={recConfirmPassword}
                    onChange={(e) => setRecConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-rose-700 bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Validation de la clé...' : 'Réinitialiser le mot de passe administrateur'}</span>
              </button>
            </form>
          )}

          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="votre.email@domaine.fr"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      clearMessages();
                    }}
                    className="text-xs text-sky-800 hover:underline cursor-pointer"
                  >
                    Mot de passe oublié
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Connexion en cours...' : 'Se connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-500">Nouveau sur l'application ? </span>
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    clearMessages();
                  }}
                  className="text-xs font-semibold text-sky-900 hover:underline cursor-pointer"
                >
                  Créer un compte (Accès immédiat)
                </button>
              </div>
              <div className="pt-2 text-center border-t border-slate-100 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('admin-login');
                    clearMessages();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-800 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
                  <span className="font-medium">Espace administrateur</span>
                </button>
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 p-3 rounded-lg leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-950 block mb-0.5">Accès direct et immédiat :</strong>
                  Créez votre compte en quelques secondes pour accéder directement à l'ensemble des modules techniques de l'application ARP.
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Nom complet <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="ex: Jean Dupont"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Adresse e-mail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nom.prenom@organisme.fr"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Mot de passe (min. 6 car.) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. Confirmation du mot de passe <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  5. Fonction <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Ingénieur', label: 'Ingénieur', icon: Briefcase, desc: 'Bureau d\'études' },
                    { id: 'Expert', label: 'Expert', icon: Award, desc: 'Consultant / Audit' },
                    { id: 'Étudiant', label: 'Étudiant', icon: GraduationCap, desc: 'Génie civil' }
                  ].map((item) => {
                    const isSelected = regJobTitle === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRegJobTitle(item.id as JobTitle)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center sm:items-start ${
                          isSelected
                            ? 'bg-sky-50 border-sky-600 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-700' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 hidden sm:inline leading-tight">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organisme / Direction technique <span className="text-slate-400 font-normal">(Optionnel)</span>
                </label>
                <input
                  type="text"
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder="ex: Conseil Départemental, Cabinet d'ingénierie"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:border-sky-800"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? 'Création en cours...' : 'Créer mon compte'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    clearMessages();
                  }}
                  className="text-xs text-slate-600 hover:underline cursor-pointer"
                >
                  Déjà un compte ? Se connecter
                </button>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-sky-50 text-sky-700 border border-sky-200 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Récupération de mot de passe
              </h2>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium">
                Pour récupérer votre accès, contactez l'administrateur de l'application.
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                L'administrateur peut réinitialiser votre mot de passe directement depuis son espace de gestion et vous communiquer votre mot de passe provisoire.
              </p>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  clearMessages();
                }}
                className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Revenir à la connexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

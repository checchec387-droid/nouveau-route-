import React, { useState, useEffect } from 'react';
import { AuthUser, ActivityLogItem, JobTitle, UserStatus, AdminDashboardStats } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Search,
  Activity,
  Ban,
  KeyRound,
  Briefcase,
  Award,
  GraduationCap,
  Copy,
  Edit,
  Check,
  Lock,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';

export const AdminConsoleModule: React.FC = () => {
  const { user: currentAdmin, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'recovery-key' | 'my-password'>('users');
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    deactivated: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [jobFilter, setJobFilter] = useState<string>('ALL');

  const [blockModalUser, setBlockModalUser] = useState<AuthUser | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');
  const [isBlocking, setIsBlocking] = useState<boolean>(false);

  const [deleteModalUser, setDeleteModalUser] = useState<AuthUser | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [resetModalUser, setResetModalUser] = useState<AuthUser | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState<string>('');
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [copiedTempPass, setCopiedTempPass] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [editModalUser, setEditModalUser] = useState<AuthUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editJobTitle, setEditJobTitle] = useState<JobTitle>('Ingénieur');
  const [editOrg, setEditOrg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [myCurrentPass, setMyCurrentPass] = useState('');
  const [myNewPass, setMyNewPass] = useState('');
  const [myConfirmPass, setMyConfirmPass] = useState('');
  const [myPassMsg, setMyPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [myPassSubmitting, setMyPassSubmitting] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('arp_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [uRes, aRes, sRes] = await Promise.all([
        fetch('/api/admin/users', { headers, credentials: 'include' }),
        fetch('/api/admin/activity', { headers, credentials: 'include' }),
        fetch('/api/admin/dashboard-stats', { headers, credentials: 'include' })
      ]);
      const uData = await uRes.json();
      const aData = await aRes.json();
      const sData = await sRes.json();
      if (uData.success && uData.users) setUsers(uData.users);
      if (aData.success && aData.activity) setActivities(aData.activity);
      if (sData.success && sData.stats) setStats(sData.stats);
    } catch (err) {
      console.error('Error loading admin data', err);
      showNotification('error', 'Erreur de communication avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: UserStatus, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status, reason })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setBlockModalUser(null);
        setBlockReason('');
        showNotification(
          'success',
          status === 'DEACTIVATED'
            ? 'Compte utilisateur bloqué et sessions révoquées avec succès'
            : 'Compte utilisateur débloqué avec succès'
        );
      } else {
        showNotification('error', data.error || 'Erreur lors de la mise à jour du statut.');
      }
    } catch {
      showNotification('error', 'Erreur serveur.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch(`/api/admin/users/${editModalUser.id}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          jobTitle: editJobTitle,
          organization: editOrg
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setEditModalUser(null);
        showNotification('success', 'Profil utilisateur mis à jour avec succès.');
      } else {
        showNotification('error', data.error || 'Erreur lors de la modification du profil.');
      }
    } catch {
      showNotification('error', 'Erreur serveur.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleExecuteResetPassword = async () => {
    if (!resetModalUser) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetModalUser.id}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          customPassword: customPasswordInput ? customPasswordInput.trim() : undefined
        })
      });
      const data = await res.json();
      if (data.success && data.temporaryPassword) {
        setGeneratedTempPassword(data.temporaryPassword);
        await loadData();
        showNotification(
          'success',
          'Mot de passe réinitialisé. Toutes les sessions actives de l\'utilisateur ont été révoquées.'
        );
      } else {
        showNotification('error', data.error || 'Erreur lors de la réinitialisation.');
      }
    } catch {
      showNotification('error', 'Erreur serveur.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteModalUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setDeleteModalUser(null);
        showNotification('success', 'Compte utilisateur et sessions supprimés définitivement.');
      } else {
        showNotification('error', data.error || 'Erreur lors de la suppression.');
      }
    } catch {
      showNotification('error', 'Erreur serveur.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMyPassMsg(null);
    if (myNewPass !== myConfirmPass) {
      setMyPassMsg({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    if (myNewPass.length < 12) {
      setMyPassMsg({ type: 'error', text: 'Le mot de passe administrateur doit comporter au moins 12 caractères.' });
      return;
    }
    setMyPassSubmitting(true);
    try {
      const res = await changePassword(myCurrentPass, myNewPass, myConfirmPass);
      if (res.success) {
        setMyPassMsg({ type: 'success', text: 'Votre mot de passe administrateur a été modifié avec succès.' });
        setMyCurrentPass('');
        setMyNewPass('');
        setMyConfirmPass('');
      } else {
        setMyPassMsg({ type: 'error', text: res.error || 'Échec du changement de mot de passe.' });
      }
    } finally {
      setMyPassSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.organization && u.organization.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesJob = jobFilter === 'ALL' || u.jobTitle === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {notification && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between shadow-xs border ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-rose-800 mb-1">
            <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded font-bold">SUPERADMIN</span>
            <span>{currentAdmin?.email}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-rose-700" />
            <span>Console d'Administration & Gestion des Comptes</span>
          </h1>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Total Utilisateurs</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-slate-900 font-mono">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Comptes Actifs</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-emerald-950 font-mono">{stats.approved}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Comptes Bloqués</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black mt-2 text-rose-950 font-mono">{stats.deactivated}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Refusés / Autres</span>
            <Ban className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black mt-2 text-slate-800 font-mono">{stats.rejected}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium cursor-pointer ${
            activeTab === 'users' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Liste des Utilisateurs ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium cursor-pointer ${
            activeTab === 'activity' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Journal d'Audit ({activities.length})</span>
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Nom & Organisme</th>
                  <th className="py-2.5 px-3 font-semibold">Email</th>
                  <th className="py-2.5 px-3 font-semibold">Fonction</th>
                  <th className="py-2.5 px-3 font-semibold">Statut</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isRoot = u.email.toLowerCase() === 'youcefyoucefbelallia@gmail.com' || u.role === 'SUPERADMIN';
                  return (
                    <tr key={u.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {u.name}
                        <div className="text-[11px] text-slate-400">{u.organization || 'Non renseigné'}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                      <td className="py-2.5 px-3">{u.jobTitle}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          u.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isRoot ? (
                          <span className="text-[10px] text-rose-700 font-mono font-bold bg-rose-50 px-2 py-0.5 rounded">Admin Principal</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === 'APPROVED' ? (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'DEACTIVATED')}
                                className="px-2 py-1 bg-amber-50 text-amber-900 rounded text-[11px] cursor-pointer"
                              >
                                Bloquer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'APPROVED')}
                                className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded text-[11px] cursor-pointer"
                              >
                                Débloquer
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setResetModalUser(u);
                                handleExecuteResetPassword();
                              }}
                              className="px-2 py-1 bg-purple-50 text-purple-900 rounded text-[11px] cursor-pointer"
                            >
                              Reset Mdp
                            </button>
                            <button
                              onClick={() => {
                                setDeleteModalUser(u);
                                handleConfirmDeleteUser();
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Horodatage</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Utilisateur</th>
                  <th className="py-2.5 px-3 font-semibold">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act) => (
                  <tr key={act.id} className="font-mono text-[11px]">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{new Date(act.timestamp).toLocaleString('fr-FR')}</td>
                    <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800">{act.type}</span></td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{act.userEmail}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans">{act.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

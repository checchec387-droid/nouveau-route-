import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, JobTitle } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, requireAdmin?: boolean) => Promise<{
    success: boolean;
    error?: string;
    status?: string;
    isAdminLogin?: boolean;
    mustChangePassword?: boolean;
  }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    jobTitle: JobTitle;
    organization?: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    status?: string;
  }>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  adminRecovery: (
    email: string,
    recoveryKey: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  initRecoveryKey: (
    email: string,
    adminPassword: string,
    recoveryKey: string,
    confirmRecoveryKey: string,
    newAdminPassword?: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  setAdminRecoveryKey: (
    recoveryKey: string,
    confirmRecoveryKey: string,
    adminPassword: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('arp_token');
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, requireAdmin: boolean = false) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, requireAdmin })
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.token) {
          localStorage.setItem('arp_token', data.token);
        }
        setUser(data.user);
        return {
          success: true,
          isAdminLogin: !!data.isAdminLogin,
          mustChangePassword: !!data.mustChangePassword
        };
      }
      return { success: false, error: data.error, status: data.status };
    } catch {
      return { success: false, error: 'Connexion au serveur impossible.' };
    }
  };

  const register = async (formData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    jobTitle: JobTitle;
    organization?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem('arp_token', data.token);
        }
        if (data.user) {
          setUser(data.user);
        }
        return { success: true, message: data.message, status: data.status };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Erreur de communication avec le serveur.' };
    }
  };

  const logout = async () => {
    try {
      const storedToken = localStorage.getItem('arp_token');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        credentials: 'include'
      });
    } finally {
      localStorage.removeItem('arp_token');
      setUser(null);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      const storedToken = localStorage.getItem('arp_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem('arp_token', data.token);
        }
        if (user) {
          setUser({ ...user, mustChangePassword: false });
        }
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Erreur lors du changement de mot de passe.' };
    }
  };

  const adminRecovery = async (
    email: string,
    recoveryKey: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      const res = await fetch('/api/auth/admin-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, recoveryKey, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          localStorage.setItem('arp_token', data.token);
        }
        if (data.user) {
          setUser(data.user);
        }
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Erreur lors de la récupération administrative.' };
    }
  };

  const initRecoveryKey = async (
    _email: string,
    _adminPassword: string,
    _recoveryKey: string,
    _confirmRecoveryKey: string,
    _newAdminPassword?: string
  ) => {
    return {
      success: false,
      error: 'La clé secrète de secours provient exclusivement des variables d\'environnement serveur (ADMIN_RECOVERY_KEY).'
    };
  };

  const setAdminRecoveryKey = async (
    recoveryKey: string,
    confirmRecoveryKey: string,
    adminPassword: string
  ) => {
    try {
      const storedToken = localStorage.getItem('arp_token');
      const res = await fetch('/api/admin/set-recovery-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ recoveryKey, confirmRecoveryKey, adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Erreur lors de la mise à jour de la clé de secours.' };
    }
  };

  const ROOT_EMAIL = 'youcefyoucefbelallia@gmail.com';
  const isAdmin = !!(
    user &&
    (user.role === 'SUPERADMIN' ||
      user.role === 'ADMIN' ||
      user.email.toLowerCase() === ROOT_EMAIL)
  );

  const isSuperAdmin = !!(
    user &&
    (user.role === 'SUPERADMIN' || user.email.toLowerCase() === ROOT_EMAIL)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        changePassword,
        adminRecovery,
        initRecoveryKey,
        setAdminRecoveryKey,
        refreshUser,
        isAdmin,
        isSuperAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'ENGINEER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DEACTIVATED';
export type JobTitle = 'Ingénieur' | 'Expert' | 'Étudiant';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  jobTitle: JobTitle;
  role: UserRole;
  status: UserStatus;
  organization?: string;
  mustChangePassword?: boolean;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface ActivityLogItem {
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

export interface AdminDashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  deactivated: number;
}

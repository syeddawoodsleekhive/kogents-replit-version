import { Permission, UserRole } from "@/components/user-management/types";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "active" | "inactive" | "pending" | "suspended";
  department?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  avatarUrl?: string;

  // Authentication fields
  authMethod?: "password" | "sso" | "invitation";
  twoFactorEnabled?: boolean;
  accessExpiration?: "never" | "30days" | "60days" | "90days" | "custom";
  customExpirationDays?: number;
  requirePasswordChange?: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActive: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface UserPreferences {
  userId: string;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
}

export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  department?: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  acceptedAt?: string;
}


// Get all users
export interface IGetAllUsersResponse {
  users:      IUser[];
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface IUser {
  id:          string;
  name:        string;
  email:       string;
  phone:       null;
  status:      string;
  avatarUrl:   null;
  workspaceId: string;
  role:        IRoleForUser;
  permissions: IPermissionForUser[];
}

export interface IPermissionForUser {
  id:          string;
  name:        string;
  description: string;
  category:    string;
}

export interface IRoleForUser {
  id:          string;
  name:        string;
  description: string;
  isSystem:    boolean;
  isActive:    boolean;
}

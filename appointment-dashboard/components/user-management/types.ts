export type UserRole = "admin" | "manager" | "agent" | "viewer";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";

export type Permission =
  | "view_appointments"
  | "create_appointments"
  | "edit_appointments"
  | "delete_appointments"
  | "view_users"
  | "create_users"
  | "edit_users"
  | "delete_users"
  | "manage_users"
  | "view_settings"
  | "edit_settings"
  | "view_reports"
  | "export_data"
  | "view_chat_logs"
  | "delete_chat_logs"
  | "view_email_logs"
  | "send_emails"
  | "manage_templates"
  | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  // role: UserRole;
  role: string;
  status: UserStatus;
  department?: string;
  permissions: Permission[];
  createdAt: string;
  lastActive?: string;
  avatar?: string;
  jobTitle?: string;
  bio?: string;
  location?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  // role: UserRole;
  role: string;
  status: UserStatus;
  department?: string;
  permissions?: Permission[];
  jobTitle?: string;
  bio?: string;
  location?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  search?: string;
}

export interface CreateUserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  avatarUrl: null;
  workspaceId: string;
  role: CreateUserRole;
  permissions: CreateUserPermission[];
}

export interface CreateUserPermission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface CreateUserRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
}

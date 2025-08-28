// General Types
export type Role = "admin" | "agent" | "supervisor";
export type ChatStatus = "open" | "pending" | "closed";
export type ChannelType = "public" | "private" | "direct";
export type SenderType = "agent" | "visitor" | "ai-agent" | "system";
export type MessageType = "text" | "file" | "event";
export type UserStatus = "online" | "away" | "offline" | "busy";

// Auth Types
export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
  avatarUrl?: string;
  status: UserStatus;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    favicon?: string;
  };
}

// Chat Types
export interface Message {
  id: string;
  chatId: string;
  senderId?: string;
  senderType: SenderType;
  content: string;
  encrypted: boolean;
  createdAt: Date;
}

export interface Chat {
  id: string;
  workspaceId: string;
  visitorId?: string;
  agentId?: string;
  status: ChatStatus;
  tags: string[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VisitorSession {
  id: string;
  workspaceId: string;
  ipAddress?: string;
  device?: string;
  platform?: string;
  browser?: string;
  hostname?: string;
  userAgent?: string;
  location?: string;
  createdAt: Date;
  lastActiveAt: Date;
}

// Dashboard Types
export interface DashboardStats {
  activeChats: number;
  activeVisitors: number;
  resolvedChats: number;
  averageResponseTime: number;
}

export interface ChartData {
  label: string;
  value: number;
}

// Settings Types
export interface Department {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
}

export interface Trigger {
  id: string;
  name: string;
  description?: string;
  conditions: Record<string, any>;
  message: string;
  enabled: boolean;
  workspaceId: string;
}

export interface Shortcut {
  id: string;
  trigger: string;
  content: string;
  tags: string[];
  agentId: string;
  workspaceId: string;
}

export interface Goal {
  id: string;
  title: string;
  type: string;
  target: number;
  current: number;
  agentId?: string;
  workspaceId: string;
}

export interface BannedVisitor {
  id: string;
  ipAddress: string;
  reason?: string;
  workspaceId: string;
  createdAt: Date;
}

export interface Permission {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissions {
  chat: Permission;
  visitors: Permission;
  settings: Permission;
  analytics: Permission;
  tickets: Permission;
  team: Permission;
}

export interface RoleDefinition {
  id: string;
  name: string;
  permissions: RolePermissions;
  workspaceId: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  workspaceId: string;
  members: string[];
}

// export interface RoleList {
//   id: string;
//   name: string;
//   description?: string;
//   userCount: number;
//   permissions?: string[];  // make optional
// }

// Get all roles
export interface RoleList {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  users: User[];
  _count: Count;
}

export interface Count {
  users: number;
  rolePermissions: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

// Get all permissions
export interface GetAllPermissionsResponse {
  permissions: Permission[];
  total: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: Date;
}

// Get role permissions
export interface RolePermissionsResponse {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface RolePermission {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
}

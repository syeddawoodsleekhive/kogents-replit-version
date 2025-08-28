export interface visitorDetailType {
  name?: string;
  email?: string;
  phone?: string;
  note?: string;
}

export interface Visitor {
  id: string;
  name: string;
  companyName?: string;
  status?: string;
  badge?: string;
  onlineTime: string;
  viewing: string;
  referrer?: any;
  visits?: number;
  chats?: Message[];
  country?: string;
  device?: string;
  browser?: string;
  userAgent?: string;
  platform?: string;
  deviceType?: string;
  email?: string;
  tags: string[];
  phone?: string;
  agent?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  }[];
  visitorInfo?: visitorDetailType;
  message?: string;
  ipAddress?: string;
  hostname?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  visitorPath?: { link: string; title: string; createdAt: Date }[];
  call_outcome?: {
    summary: string;
    lead_status: string;
    engagement_score: number;
    disengagement: boolean;
  };
  appointment?: {
    scheduled: boolean;
    datetime: string;
    duration_minutes: string;
    timezone: string;
  };
  location?: {
    countryKey?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  conversation_metrics?: {
    total_turns: number;
    user_turns: number;
    assistant_turns: number;
    duration_seconds: number;
    user_affirmations?: string | null;
    interruptions?: string | null;
    booking_successful?: boolean;
    disengagement?: boolean;
  };
  connectionStatus?: boolean;
}

export type BanReason =
  | "spam"
  | "abuse"
  | "inappropriate_content"
  | "harassment"
  | "violation_of_terms"
  | "security_threat"
  | "repeated_violations"
  | "custom";

export interface BanStats {
  total: number;
  active: number;
  expired: number;
  permanent: number;
  temporary: number;
}

export interface BannedVisitor {
  id: string;
  visitorId?: string;
  visitorName: string;
  visitorEmail?: string;
  ipAddress?: string;
  reason: BanReason;
  customReason?: string;
  bannedBy: string;
  bannedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  isPermanent: boolean;
  notes?: string;
}

export interface BannedVisitorAPIData {
  _id?: string;
  ip: string;
  permanent: boolean;
  expiresAt?: string | Date | null;
  reason: string;
  note?: string;
  workspace: string;
  createdAt?: Date;
  updatedAt?: Date;
  bannedBy?: { name: string };
  active: boolean;
}

export interface MinimizedChat {
  id: string;
  name: string;
  unreadCount?: number;
  isConnected?: boolean;
  roomId?: string;
}

export interface Message {
  id: string;
  content: string;
  isVisitor: boolean;
  timestamp: Date;
  name?: string;
  sender?: string;
  isSystem?: boolean;
  status?: string;
  attachments?: { name: string; type: string; url?: string }[];
  isLoading?: boolean;
  isPageView?: boolean;
  isInactivity?: boolean;
  pageUrl?: string;
}

type callbackType = () => void;

type onErrorType = (error: string) => void;

type SenderType =
  | "agent"
  | "visitor"
  | "ai-agent"
  | "visitor-system"
  | "agent-system";

type PageTrackingType = {
  pageUrl: string;
  pageTitle: string;
  pagePath: string;
  viewedAt: string;
  pageHash: string;
  pageQuery: string;
  navigationPath: PageTrackingType[];
};

interface locationType {
  city: string;
  country: string;
  countryKey: string;
  ip: string;
  loc: string;
  org: string;
  postal: string;
  region: string;
  timezone: string;
}

interface deviceInfoType {
  platform: string;
  device: string;
  browser: string;
  userAgent: string;
  deviceType: string;
}

interface Attachment {
  fileName: string;
  mimeType: string;
  previewUrl: string;
  size: number;
  url: string;
}

interface MessageType {
  id?: string;
  roomId: string;
  senderId: string;
  senderSocketId?: string;
  senderType: SenderType;
  messageId: string;
  content: string;
  messageType: string;
  isInternal?: boolean;
  metadata?: any;
  replyToId?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  deliveredTo?: string[];
  readBy?: string[];
  createdAt: string;
  sentAt?: string;
  senderName?: string;
  pageUrl?: string;
  metadata?: {
    attachment?: Attachment;
  };
  attachment?: Attachment;
  isLoading?: boolean;
}

interface visitorSessionDetailsType {
  status: string;
  location: locationType;
  deviceInfo: deviceInfoType;
  ipAddress: string;
  hostName: string;
  userAgent: string;
  visitorPageTracking: PageTrackingType;
}

interface conversationSessionType {
  id: string;
  workspaceId: string;
  visitorId: string;
  visitorSessionId: string;
  createdAt: string;
  lastActivityAt: string;
  visitorDetails: {
    name: string;
    email: string;
    phone: string;
    note: string;
  };
  visitorSessionDetails: visitorSessionDetailsType;
  primaryAgent: any | null;
  department: any | null;
  messages: any[];
  analytics: any | null;
  messageCount: number;
  participantCount: number;
  tags: Tag[];
  isActive: boolean;
  totalChats: number;
  totalSessions: number;
  lastMessage: MessageType | null;
}

interface AgentInRoomType {
  name?: string;
  agentName: string;
  agentId: string;
  agentStatus: string;
}

interface visitorSessionDataType {
  visitorId: string;
  sessionId: string;
  workspaceId: string;
  pageTracking: PageTrackingType;
  userAgent?: string;
  fingerprint?: string;
  referrerData?: any;
  ipAddress: string;
  deviceInfo: deviceInfoType;
  deviceFingerprint?: any;
  hostName: string;
  location?: locationType | null;
  session_id: string;
  session_token: string;
  existing_conversation: boolean;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isIdentified?: boolean;
  totalChats?: number;
  totalVisits?: number;
  lastSeenAt?: string;
  aiStatus?: string;
  roomId: string;
  connectedAt?: string;
  lastActivityAt?: string;
  tags?: Tag[];
  lastMessage?: MessageType;
  agentsInRoom?: AgentInRoomType[];
}

interface MinimizedChat {
  id: string;
  name: string;
  roomId?: string;
}

type actionModalType =
  | "invite-agent"
  | "transfer-department"
  | "export-transcript"
  | "ban-visitor"
  | "translate-chat"
  | "";

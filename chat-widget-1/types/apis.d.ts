type callbackType = () => void;

type onErrorType = (error: string) => void;

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

interface createSessionIdDataType {
  visitor_id?: string;
  workspaceId: string;
  pageTracking: {
    pageUrl: string;
    pageTitle: string;
    pagePath?: string;
    pageHash?: string;
    pageQuery?: string;
  };
  userAgent?: string;
  fingerprint?: string;
  referrerData?: any;
  ipAddress: string;
  deviceInfo: deviceInfoType;
  deviceFingerprint?: any;
  hostName: string;
  location?: locationType | null;
}

interface createSessionIdResponseType {
  sessionId: string;
  session_token: string;
  existing_conversation: boolean;
}

interface TypingIndicatorPayload {
  isTyping: boolean;
  clientName: string;
  clientType: "agent" | "visitor" | "ai-agent";
}

interface ChatWindowProps {
  isOpen: boolean;
  wsStatus: WebSocketStatus;
  messages: MessagesType[];
  isAgentOnline: boolean;
  isAgentTyping: boolean;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  onClose: () => void;
  onSendMessage: (content: string, files?: File[]) => void;
  onDownloadTranscript: () => void;
  onReconnect?: () => void;
  roomId: string;
  workspaceId: string;
  agentData: any;
  toggleChatOpen?: boolean;
  setAgentData: (data: any) => void;
  isBadgeChatEnabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
  socketStatus?: "connecting" | "connected" | "disconnected";
  showConnectedMessage?: boolean;
  emitSocketEvent?: (event: string, data: any) => void;
}

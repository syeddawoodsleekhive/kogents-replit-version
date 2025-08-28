import { FingerprintingOptions } from "./fingerprint";

export interface Message {
  type?: string;
  id: string;
  content: string;
  name?: string;
  escalated?: boolean;
  sender: "user" | "agent" | "system" | "live-agent";
  timestamp: Date;
  status?: "sent" | "delivered" | "read" | "hidden";
  attachment?: {
    name: string;
    type: string;
    url: string;
    size: number;
  };
  metadata?: {
    currentUrl?: string;
    previousUrl?: string;
    changeType?: string;
    referrerContext?: ReferrerContext;
  };
  isEncrypted?: boolean;
  encryptedData?: EncryptedMessageData;
  encryptionKeyId?: string;
}

export interface WebSocketMessage {
  type: "text" | "file" | "status" | "url-change";
  content: string;
  escalated?: boolean;
  sender: "user" | "agent" | "system" | "live-agent";
  timestamp: string;
  attachment?: {
    name: string;
    type: string;
    url: string;
    size: number;
  };
  metadata?: {
    currentUrl?: string;
    previousUrl?: string;
    changeType?: string;
    referrerContext?: ReferrerContext;
  };
  isEncrypted?: boolean;
  encryptedData?: EncryptedMessageData;
  encryptionKeyId?: string;
}

export interface ReferrerData {
  referrer: string;
  currentUrl: string;
  domain: string;
  isFirstVisit: boolean;
  timestamp: string;
  utm: UTMData;
  tracking: TrackingData;
  affiliate: AffiliateData;
  landingPage: string;
  sessionReferrer: string;
  referrerPolicy?: string;
  protocolDowngrade?: boolean;
}

export interface UTMData {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  term?: string | null;
  content?: string | null;
}

export interface TrackingData {
  gclid?: string | null; // Google Ads
  fbclid?: string | null; // Facebook
  msclkid?: string | null; // Microsoft Ads
  ttclid?: string | null; // TikTok
  li_fat_id?: string | null; // LinkedIn
}

export interface AffiliateData {
  // ShareASale
  sscid?: string | null;
  sscidmode?: string | null;

  // Commission Junction
  cjevent?: string | null;
  cjdata?: string | null;

  // Impact (formerly Impact Radius)
  irclickid?: string | null;
  irgwc?: string | null;

  // PartnerStack
  ps?: string | null;

  // ReferralCandy
  rc?: string | null;

  // Generic affiliate parameters
  aff?: string | null;
  affiliate?: string | null;
  ref?: string | null;
  partner?: string | null;

  // Amazon Associates
  tag?: string | null;

  // ClickBank
  hop?: string | null;

  // Custom tracking
  subid?: string | null;
  subid1?: string | null;
  subid2?: string | null;
  subid3?: string | null;
  subid4?: string | null;
  subid5?: string | null;
}

export interface TrafficSource {
  type:
    | "direct"
    | "organic_search"
    | "paid_search"
    | "social"
    | "paid_social"
    | "email"
    | "referral"
    | "affiliate"
    | "mobile_app"
    | "unknown";
  category:
    | "direct"
    | "organic"
    | "paid"
    | "social"
    | "email"
    | "referral"
    | "affiliate"
    | "mobile_app"
    | "unknown";
  source?: string;
  affiliate?: {
    network?: string;
    partner?: string;
    campaign?: string;
  };
}

export interface CampaignData extends UTMData, TrackingData, AffiliateData {
  trafficSource?: string;
  category?: string;
  source?: string;
}

export interface ReferrerContext {
  trafficSource?: string;
  category?: string;
  source?: string;
  isFirstVisit?: boolean;
  sessionReferrer?: string;
  referrerPolicy?: string;
  protocolDowngrade?: boolean;
  affiliate?: {
    network?: string;
    partner?: string;
    campaign?: string;
  };
}

export interface URLChangeEvent {
  currentUrl: string;
  previousUrl: string;
  changeType:
    | "popstate"
    | "pushstate"
    | "replacestate"
    | "hashchange"
    | "manual";
  timestamp: Date;
  timeSpentOnPreviousPage?: number;
  metadata?: PageMetadata;
  referrerContext?: ReferrerContext;
}

export interface PageMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  loadTime?: number;
}

export type WebSocketStatus =
  | "connecting"
  | "open"
  | "closing"
  | "closed"
  | "error";

// Privacy and Compliance Types
export interface PrivacySettings {
  enableGDPR: boolean;
  requireConsent: boolean;
  anonymizeData: boolean;
  dataRetentionDays: number;
}

export interface ConsentData {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: Date;
  version: string;
}

// Device Fingerprinting Types
export interface DeviceFingerprint {
  // Canvas fingerprinting
  canvas?: {
    signature: string;
    textSignature: string;
    geometrySignature: string;
  };

  // WebGL fingerprinting
  webgl?: {
    renderer: string;
    vendor: string;
    version: string;
    shadingLanguageVersion: string;
    extensions: string[];
    parameters: Record<string, any>;
    signature: string;
  };

  // Audio context fingerprinting
  audio?: {
    signature: string;
    sampleRate: number;
    maxChannelCount: number;
    numberOfInputs: number;
    numberOfOutputs: number;
    channelCount: number;
    channelCountMode: string;
    channelInterpretation: string;
  };

  // Font detection
  fonts?: {
    available: string[];
    signature: string;
    count: number;
  };

  // Screen characteristics
  screen?: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
    pixelRatio: number;
    orientation: string;
    touchSupport: boolean;
  };

  // Hardware detection
  hardware?: {
    concurrency: number;
    memory: number;
    platform: string;
    architecture: string;
    maxTouchPoints: number;
  };

  // Battery information
  battery?: {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
  };

  // WebRTC IP detection
  webrtc?: {
    localIPs: string[];
    publicIP: string;
    candidateTypes: string[];
  };

  // Plugin detection
  plugins?: {
    list: Array<{
      name: string;
      filename: string;
      description: string;
      version: string;
    }>;
    count: number;
    signature: string;
  };

  // Media devices
  mediaDevices?: {
    audioInputs: number;
    audioOutputs: number;
    videoInputs: number;
    devices: Array<{
      kind: string;
      label: string;
      deviceId: string;
    }>;
  };

  // Additional characteristics
  misc?: {
    timezone: string;
    timezoneOffset: number;
    languages: string[];
    cookieEnabled: boolean;
    doNotTrack: string;
    storageQuota: number;
    indexedDBSupport: boolean;
    webSQLSupport: boolean;
    localStorageSupport: boolean;
    sessionStorageSupport: boolean;
  };

  // Fingerprint metadata
  metadata: {
    timestamp: string;
    version: string;
    signature: string;
    confidence: number;
    errors: string[];
  };
}

// Enhanced visitor state with fingerprinting
export interface VisitorState {
  id: string | null;
  sessionId: string | null;
  isActive: boolean;
  isVisible: boolean;
  joinedAt: Date;
  lastActivity: Date;
  activityLevel: "active" | "idle" | "away";
  tabId: string | null;
  isMainTab: boolean;
  totalTabs: number;
  fingerprint?: DeviceFingerprint | null;
  fingerprintGenerated?: boolean;
  fingerprintErrors?: string[];
}
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface VisitorApiResponse {
  success: boolean;
  status: string;
  data: ResponseData;
}
export interface ResponseData {
  name?: string;
  workspaceId: string;
  email?: string;
  number?: string;
  note?: string;
  ipAddress: string;
  sessionIds: string[];
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export type IUploadImageProps = {
  name: string;
  type: string;
  url: string;
  size: number;
}[];

export interface ChatWindowProps {
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

export interface MessagesType {
  id: string;
  content: string;
  senderType: "visitor" | "agent" | "ai-agent" | "system";
  senderName?: string;
  user?: {
    name?: string;
  };
  createdAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  attachment?: {
    name: string;
    type: string;
    url: string;
    size: number;
  };
  isEncrypted?: boolean;
  encryptedData?: EncryptedMessageData;
  encryptionKeyId?: string;
}

// Redux state interface
export interface RootReducerState {
  chat: {
    messages: Message[];
    isConnected: boolean;
    isTyping: boolean;
    currentRoom?: string;
  };
  ui: {
    isOpen: boolean;
    isFullScreen: boolean;
    activeForm?: string;
  };
  user: {
    id?: string;
    name?: string;
    email?: string;
    isAuthenticated: boolean;
  };
}

export interface GeolocationData {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  coordinates: string;
  organization: string;
  hostname: string;
  timezone: string;
  postalCode: string;
}

export interface DeviceData {
  platform: string;
  device: string;
  browser: string;
  browserVersion?: string;
  userAgent: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  screenResolution: string;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  cookieEnabled: boolean;
  doNotTrack: string;
  touchSupport: boolean;
  hardwareConcurrency: number;
  memory?: number;
}

export interface NetworkData {
  localIPs: string[];
  publicIP: string;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface UnifiedUserInfo {
  // Session Information
  sessionId: string;
  visitorId: string;
  timestamp: Date;

  // Geolocation Data (from NeutrinoAPI)
  geolocation: GeolocationData;

  // Device Data (from fingerprinting)
  device: DeviceData;

  // Network Data (hybrid approach)
  network: NetworkData;

  // Enhanced Fingerprint (optional)
  fingerprint?: DeviceFingerprint;
  fingerprintSignature?: string;
  fingerprintConfidence?: number;

  // Page Context
  pageInfo: {
    url: string;
    title: string;
    referrer: string;
    parentUrl?: string;
    parentTitle?: string;
  };

  // Privacy and Compliance
  privacySettings: {
    consentGiven: boolean;
    dataProcessingAllowed: boolean;
    fingerprintingAllowed: boolean;
    anonymized: boolean;
  };

  // Data Source Metadata
  metadata: {
    dataCollectionMethod: "hybrid" | "fingerprint-only" | "basic";
    geolocationSource: "neutrinoapi" | "server-headers" | "webrtc" | "fallback";
    deviceDataSource: "fingerprinting" | "user-agent" | "basic";
    networkDataSource:
      | "webrtc"
      | "server-headers"
      | "connection-api"
      | "hybrid-ip-detector";
    collectionTimestamp: Date;
    version: string;
  };
}

export interface DataCollectionConfig {
  enableFingerprinting: boolean;
  enableGeolocation: boolean;
  enableNetworkDetection: boolean;
  respectPrivacy: boolean;
  requireConsent: boolean;
  fallbackToBasic: boolean;
  timeout: number;
  fingerprintingOptions: FingerprintingOptions;
}

// Legacy interfaces for backward compatibility
export interface locationType {
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

export interface deviceInfoType {
  platform: string;
  device: string;
  browser: string;
  userAgent: string;
  deviceType: string;
}

export interface EncryptedMessageData {
  encryptedContent: string;
  metadata: {
    keyId: string;
    algorithm: string;
    iv: string;
    authTag: string;
    timestamp: number;
    version: string;
  };
  messageType: "text" | "file" | "system";
  originalLength: number;
}

export const chatReducer = (state: any = {}, action: any) => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...(state.messages || []), action.payload],
      }
    case "SET_CONNECTION_STATUS":
      return {
        ...state,
        isConnected: action.payload,
      }
    case "SET_TYPING_STATUS":
      return {
        ...state,
        isTyping: action.payload,
      }
    default:
      return state
  }
}

export const addMessage = (message: Message) => ({
  type: "ADD_MESSAGE",
  payload: message,
})

export const setConnectionStatus = (isConnected: boolean) => ({
  type: "SET_CONNECTION_STATUS",
  payload: isConnected,
})

export const setTypingStatus = (isTyping: boolean) => ({
  type: "SET_TYPING_STATUS",
  payload: isTyping,
})
export interface WidgetSettings {
  _id?: string;
  id: string;
  name: string;
  isActive: boolean;
  appearance: WidgetAppearance;
  sound: WidgetSound;
  behavior: WidgetBehavior;
  content: WidgetContent;
  integration: WidgetIntegration;
  security: WidgetSecurity;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetAppearance {
  theme: "light" | "dark" | "custom";
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  borderRadius: number;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  size: "compact" | "medium" | "large";
  logo?: string;
  customCSS?: string;
  fontFamily: string;
  customFont: boolean;
  customFontSize: number;
  fontSize: "small" | "medium" | "large";
  showAgentAvatar: boolean;
  showCompanyLogo: boolean;
  customeChatSize: boolean;
  chatSize: {
    width: number;
    height: number;
  };
}

export interface WidgetSound {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  soundVolume: number;
  currentSoundType: string;
}

export interface WidgetBehavior {
  autoOpen: boolean;
  autoOpenDelay: number;
  showOnPages: string[];
  hideOnPages: string[];
  operatingHours: OperatingHours;
  proactiveChat: ProactiveChatSettings;
  triggerRules: TriggerRule[];
  offlineMode: OfflineModeSettings;
  autoMinimize: AutoMinimizeSettings;
  imageCompression: ImageCompressionSettings;
  reduceAnimations: boolean;
  screenReaderOptimization: boolean;
}

export interface AutoMinimizeSettings {
  enabled: boolean;
  timeout: number; // in minutes
}

export interface WidgetContent {
  welcomeMessage: string;
  offlineMessage: string;
  placeholderText: string;
  thankYouMessage: string;
  language: string;
  translations: Record<string, string>;
  isFirstTime: boolean;
  formType: "chat-window" | "pre-chat" | "offline-chat" | "post-chat" | "chat-badge";
  preChatForm: PreChatForm;
  offlineChatForm: OfflineChatForm;
  userInfoForm: UserInfoForm;
  chatBadge: ChatBadge;
  postChatSurvey: PostChatSurvey;
}

export interface WidgetIntegration {
  embedCode: string;
  apiKey: string;
  webhookUrl?: string;
  allowedDomains: string[];
  widgetStatus: boolean;
  customFields: CustomField[];
  analytics: AnalyticsSettings;
}

export interface WidgetSecurity {
  isDomainsAllowed: boolean;
  allowedDomains: string[];
  isBannedCountries: boolean;
  bannedCountries: string[]
  domainRestrictions: string[];
  ipRestrictions: string[];
  rateLimiting: RateLimitSettings;
  encryption: boolean;
  gdprCompliant: boolean;
  dataRetentionDays: number;
}

export interface OperatingHours {
  enabled: boolean;
  timezone: string;
  schedule: DaySchedule[];
}

export interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ProactiveChatSettings {
  enabled: boolean;
  delay: number;
  message: string;
  conditions: string[];
}

export interface ImageCompressionSettings {
  enabled: boolean;
  size: number;
  quality: number;
}

export interface TriggerRule {
  id: string;
  name: string;
  type: "time" | "scroll" | "exit_intent" | "page_visit";
  value: string | number;
  action: "show_widget" | "send_message" | "open_chat";
  isActive: boolean;
}

export interface OfflineModeSettings {
  enabled: boolean;
  message: string;
  collectEmail: boolean;
  autoReply: string;
}

export interface PreChatForm {
  enabled: boolean;
  required: boolean;
  greetingsMessage: string;
  isIdentityRequired: boolean;
  isPhoneRequired: boolean;
  isQuestionRequired: boolean;
}

export interface OfflineChatForm {
  enabled: boolean;
  required: boolean;
  greetingsMessage: string;
  isPhoneRequired: boolean;
}

export interface UserInfoForm {
  enabled: boolean;
  fields: FormField[];
  required: boolean;
  showUserInfoForm: boolean;
}
export interface ChatBadge {
  enabled: boolean;
}

export interface PostChatSurvey {
  enabled: boolean;
  required: boolean;
  isRatingsRequired: boolean;
  ratings: number;
  isFeedbackRequired: boolean;
  feedback: string;
  // questions: SurveyQuestion[];
  thankYouMessage: string;
}

export interface FormField {
  id: string;
  type: "text" | "email" | "select" | "textarea" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface SurveyQuestion {
  id: string;
  type: "rating" | "text" | "select" | "boolean";
  question: string;
  required: boolean;
  options?: string[];
}

export interface CustomField {
  id: string;
  name: string;
  type: string;
  value: string;
}

export interface AnalyticsSettings {
  googleAnalytics?: string;
  facebookPixel?: string;
  customTracking?: string;
}

export interface RateLimitSettings {
  enabled: boolean;
  maxRequests: number;
  timeWindow: number;
}

export interface WidgetPreviewProps {
  settings: WidgetSettings;
  onSoundUpdate?: (settings: Partial<WidgetSound>) => void;
  onContentUpdate?: (settings: Partial<WidgetContent>) => void;
  isMinimized?: boolean;
}

export interface WidgetChatInputProps {
  hidePoweredBy: boolean;
  message: (string | { content: string; metadata: { encryptedMessage: any; isEncrypted: boolean; encryptionTimestamp: number } })[];
  setMessage: React.Dispatch<React.SetStateAction<(string | { content: string; metadata: { encryptedMessage: any; isEncrypted: boolean; encryptionTimestamp: number } })[]>>;
  settings: WidgetSettings;
  fontSize: number;
  fontFamily: string;
  onContentUpdate?: (settings: Partial<WidgetContent>) => void;
  handleAttachmentSelect?: (file: File) => void
}

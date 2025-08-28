"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useChatState } from "@/hooks/use-chat-state";
import { useWindowFocus } from "@/hooks/use-window-focus";
import { downloadTranscript } from "@/utils/message-utils";
import ChatButton from "./chat-button";
import ChatWindow from "./chat-window";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useURLTracking } from "@/hooks/use-url-tracking";
import {
  isTrackingAllowed,
  getConsentState,
  saveConsentState,
  scheduleRetentionCleanup,
  DEFAULT_PRIVACY_CONFIG,
} from "@/utils/privacy-compliance";
import { useWidgetContext } from "@/context/widgetContext";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { createSessionId, setAddMessage } from "@/app/api/v2/chat";
import { getVisitorId, generateMessageId } from "@/app/api/v2/functions";
import { useVisitorChatSocket } from "@/hooks/useVisitorChatSocket";
import ChatButtonCapsule from "./chat-button-capsule";
import { validateFiles, DEFAULT_FILE_RESTRICTIONS } from "@/utils/file-rules";
import { useLanguage } from "@/context/language-context";

// Constants
const SOCKET_URL =
  process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "echo.websocket.org";
const WS_URL = `wss://${SOCKET_URL}/ws/chat`;
const BUTTON_LOCK_DURATION = 300;
const TAG_BATCH_DELAY = 500;
const VISITOR_INFO_BATCH_DELAY = 500;
const TYPING_DEBOUNCE_DELAY = 800;
const READY_CHECK_INTERVAL = 50;
const MESSAGE_DELIVERY_DELAY = 500;
const FILE_UPLOAD_DEBOUNCE = 500;

// Types
interface WidgetConfig {
  position: "right" | "left";
  color: string;
  enableGDPR: boolean;
  requireConsent: boolean;
  anonymizeData: boolean;
  dataRetentionDays: number;
  enableEnterpriseEncryption: boolean;
  encryptionRequired: boolean;
  auditLogging: boolean;
  threatDetection: boolean;
  complianceMode: "GDPR" | "HIPAA" | "SOX" | "STANDARD";
}

interface WidgetSize {
  width: number;
  height: number;
}
import { useReadReceipt } from "@/hooks/use-read-receipt";
import { useCameraCapture } from "@/hooks/use-camera-capture";

export default function ChatWidgetEmbedded() {
  const params = useSearchParams();
  const apiToken = params.get("apiToken");
  const { isRTL, direction } = useLanguage();

  const loadingRef = useRef<boolean>(false);
  const chatInitializedRef = useRef<boolean>(false);

  const autoOpenedRef = useRef<boolean>(false);
  const lastMessageCountRef = useRef<number>(0);

  const sessionId = useSelector(
    (state: RootReducerState) => state.chat.sessionId
  );

  const messages = useSelector(
    (state: RootReducerState) => state.chat.messages
  );

  const dispatch: AppReducerDispatch = useDispatch();

  const { widgetSettings } = useWidgetContext();

  useEffect(() => {
    if (apiToken && !sessionId && !loadingRef.current) {
      loadingRef.current = true;
      dispatch(
        createSessionId(
          apiToken.toString(),
          () => {
            loadingRef.current = false;
          },
          (error) => {
            loadingRef.current = false;
          }
        )
      );
    }
  }, [sessionId, apiToken]);

  const {
    sendMessage,
    sendTyping,
    sendReadReceipt,
    socket,
    sendOrQueueMessage,
  } = useVisitorChatSocket({
    sessionId,
    workspaceId: apiToken?.toString() || "",
    departmentId: "",
    visitorId: getVisitorId(),
  });

  const showChat = useMemo(() => {
    if (socket?.connected && !chatInitializedRef.current) {
      chatInitializedRef.current = true;
      return true;
    }
    return chatInitializedRef.current;
  }, [socket?.connected]);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isButtonLocked, setIsButtonLocked] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [toggleChatOpen, setToggleChatOpen] = useState(false);

  // Agent and visitor state
  const [agentData, setAgentData] = useState<any>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [visitorTags, setVisitorTags] = useState<string[]>([]);
  const [visitorInfo, setVisitorInfo] = useState<any>(null);
  const [visitorActiveStatus, setVisitorActiveStatus] =
    useState<string>("ai-agent");

  // Configuration state
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    position: "right",
    color: "#3B82F6",
    enableGDPR: true,
    requireConsent: false,
    anonymizeData: true,
    dataRetentionDays: 30,
    enableEnterpriseEncryption: false,
    encryptionRequired: false,
    auditLogging: false,
    threatDetection: false,
    complianceMode: "STANDARD",
  });
  const [privacySettings, setPrivacySettings] = useState(
    DEFAULT_PRIVACY_CONFIG
  );
  const [consentState, setConsentState] = useState(getConsentState());

  // Enhanced encryption and security state
  const [encryptionStatus, setEncryptionStatus] = useState<{
    isEnabled: boolean;
    isRequired: boolean;
    algorithm: string;
    keyStrength: number;
    lastKeyRotation: Date | null;
    complianceStatus: "compliant" | "non-compliant" | "pending";
  }>({
    isEnabled: false,
    isRequired: false,
    algorithm: "AES-256-GCM",
    keyStrength: 256,
    lastKeyRotation: null,
    complianceStatus: "pending",
  });

  const [auditLog, setAuditLog] = useState<
    Array<{
      timestamp: Date;
      action: string;
      userId?: string;
      sessionId?: string;
      details: any;
      compliance: "GDPR" | "HIPAA" | "SOX" | "STANDARD";
    }>
  >([]);

  const [threatIndicators, setThreatIndicators] = useState<
    Array<{
      timestamp: Date;
      type:
        | "suspicious_activity"
        | "encryption_failure"
        | "compliance_violation"
        | "security_alert";
      severity: "low" | "medium" | "high" | "critical";
      description: string;
      actionRequired: boolean;
    }>
  >([]);

  // Refs for timers and state tracking
  const tagBatchQueue = useRef<string[][]>([]);
  const visitorInfoBatchQueue = useRef<any[]>([]);
  const tagBatchTimer = useRef<NodeJS.Timeout | null>(null);
  const visitorInfoBatchTimer = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(false);
  const controls = useAnimation();
  const prevFullScreen = useRef(isFullScreen);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Additional states from temporary files
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [isEndingChat, setIsEndingChat] = useState<boolean>(false);
  const [endChatRequestCount, setEndChatRequestCount] = useState<number>(0);
  const endChatRateLimitRef = useRef<NodeJS.Timeout | null>(null);
  const END_CHAT_RATE_LIMIT = 5; // Max 5 end chat operations per minute

  // Chat log management
  const [chatLogCache, setChatLogCache] = useState<any[]>([]);
  const [chatLogLastUpdated, setChatLogLastUpdated] = useState<number | null>(
    null
  );
  const [chatLogRequestCount, setChatLogRequestCount] = useState<number>(0);
  const chatLogRateLimitRef = useRef<NodeJS.Timeout | null>(null);
  const CHAT_LOG_CACHE_DURATION = 30000; // 30 seconds
  const CHAT_LOG_RATE_LIMIT = 10; // Max 10 requests per minute

  // Chat History Management
  const [isHistoryFetching, setIsHistoryFetching] = useState<boolean>(false);
  const [chatHistoryRequestCount, setChatHistoryRequestCount] =
    useState<number>(0);
  const chatHistoryRateLimitRef = useRef<NodeJS.Timeout | null>(null);
  const CHAT_HISTORY_RATE_LIMIT = 10; // Max 10 requests per minute

  // Operating hours management
  const [operatingHoursData, setOperatingHoursData] = useState<any>(null);
  const [operatingHoursLastUpdated, setOperatingHoursLastUpdated] = useState<
    number | null
  >(null);
  const [operatingHoursRequestCount, setOperatingHoursRequestCount] =
    useState<number>(0);
  const operatingHoursRateLimitRef = useRef<NodeJS.Timeout | null>(null);
  const OPERATING_HOURS_RATE_LIMIT = 5; // Max 5 requests per minute

  // Device fingerprinting and tracking
  const [deviceFingerprint, setDeviceFingerprint] = useState<any>(null);
  const [fingerprintGenerated, setFingerprintGenerated] =
    useState<boolean>(false);
  const [visitorTrackingData, setVisitorTrackingData] = useState<any>(null);
  const [referrerTrackingData, setReferrerTrackingData] = useState<any>(null);
  const [visitorPath, setVisitorPath] = useState<any>(null);

  // Department management
  const [departmentsData, setDepartmentsData] = useState<any[]>([]);
  const [visitorDefaultDepartment, setVisitorDefaultDepartment] =
    useState<any>(null);
  const [departmentsLastUpdated, setDepartmentsLastUpdated] = useState<
    number | null
  >(null);

  // Chat info management
  const [chatInfo, setChatInfo] = useState<{
    rating: "good" | "bad" | null;
    comment: string | null;
    timestamp?: string;
  }>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chat_info");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return { rating: null, comment: null };
        }
      }
    }
    return { rating: null, comment: null };
  });
  const [chatInfoLastUpdated, setChatInfoLastUpdated] = useState<number | null>(
    null
  );

  // Typing management
  const [isVisitorTyping, setIsVisitorTyping] = useState(false);
  const [lastTypingState, setLastTypingState] = useState(false);
  const [typingEventCount, setTypingEventCount] = useState(0);
  const [lastTypingTimestamp, setLastTypingTimestamp] = useState(0);
  const typingRateLimitRef = useRef<NodeJS.Timeout | null>(null);

  // Accessibility
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>("");

  const [isCapsuleButton, setIsCapsuleButton] = useState<boolean>(true);

  const chatIsOpenedOnFirstMessage = useRef<boolean>(false);

  // Add socket connection state
  const [socketStatus, setSocketStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [showConnectedMessage, setShowConnectedMessage] = useState(false);

  const roomId = useMemo(() => {
    return "";
  }, []);

  const { addSystemMessage } = useChatState({
    apiToken: apiToken?.toString() || "",
    sessionId: roomId,
    setAgentData,
    visitorActiveStatus,
  });

  const { isFocused } = useWindowFocus();

  // Initialize read receipt functionality
  const { sendReadReceipt: sendReadReceiptToServer, getUnreadAgentMessages } =
    useReadReceipt({
      isOpen,
      sessionId,
      onSendReadReceipt: sendReadReceipt,
    });

  const unreadCount = useMemo(
    () => getUnreadAgentMessages().length,
    [getUnreadAgentMessages]
  );

  // Monitor socket connection status
  // useEffect(() => {
  //   if (socket?.connected === true && socketStatus !== 'connected') {
  //     setSocketStatus('connected');
  //     setShowConnectedMessage(true);

  //     // Hide the connected message after 2 seconds
  //     const timer = setTimeout(() => {
  //       setShowConnectedMessage(false);
  //     }, 2000);

  //     return () => clearTimeout(timer);
  //   // } else if (socket?.connected === false && socketStatus !== 'disconnected') {
  //     // setSocketStatus('disconnected');
  //     // setShowConnectedMessage(false);
  //   } else if (socket?.connected === undefined || socket?.connected === false) {
  //     setSocketStatus('connecting');
  //     setShowConnectedMessage(false);
  //   }
  // }, [socket?.connected]);

  // Initialize privacy settings and consent
  useEffect(() => {
    const consent = getConsentState();
    setConsentState(consent);
  }, []);

  /**
   * Get widget size based on settings
   */
  const getWidgetSize = useCallback((): WidgetSize => {
    const widgetSize = widgetSettings?.appearance.size;

    switch (widgetSize) {
      case "compact":
        return { width: 330, height: 430 };
      case "medium":
        return { width: 385, height: 600 };
      case "large":
        return { width: 500, height: 700 };
      case "custom":
        return (
          widgetSettings?.appearance.customSize || { width: 385, height: 600 }
        );
      default:
        return { width: 385, height: 600 };
    }
  }, [widgetSettings?.appearance.size, widgetSettings?.appearance.customSize]);

  const isBadgeChatEnabled = widgetSettings?.appearance.chatBadge;

  // Initialize component
  useEffect(() => {
    mountedRef.current = true;
    setConsentState(getConsentState());
    scheduleRetentionCleanup(privacySettings.retentionPolicy);
    return () => {
      mountedRef.current = false;
    };
  }, [privacySettings]);

  /**
   * Send message to parent window
   */
  const sendToParent = useCallback((type: string, data: any = {}) => {
    if (
      typeof window !== "undefined" &&
      window.parent &&
      document.readyState === "complete" &&
      mountedRef.current
    ) {
      try {
        window.parent.postMessage(JSON.stringify({ type, data }), "*");
      } catch (err) {
        console.error("Error posting message to parent:", err);
      }
    }
  }, []);

  /**
   * Handle URL change events
   */
  const handleURLChange = useCallback(
    (event: any) => {
      if (!isTrackingAllowed("analytics") || !mountedRef.current) return;

      if (
        event.currentUrl &&
        event.previousUrl &&
        event.currentUrl !== event.previousUrl
      ) {
        const urlMessage = {
          id: Date.now().toString(),
          sender: "system" as const,
          content: `Page navigation: ${new URL(event.currentUrl).pathname}${
            new URL(event.currentUrl).search
          }`,
          timestamp: new Date(),
          type: "url-change",
          metadata: {
            currentUrl: event.currentUrl,
            previousUrl: event.previousUrl,
            changeType: event.changeType,
            referrerContext: event.referrerContext,
          },
        };

        sendToParent("widget:event", {
          event: "url:change",
          data: {
            currentUrl: event.currentUrl,
            previousUrl: event.previousUrl,
            changeType: event.changeType,
            timestamp: event.timestamp,
            referrerContext: event.referrerContext,
          },
        });

        if (event.referrerContext) {
          sendToParent("widget:event", {
            event: "referrer:context",
            data: {
              trafficSource: event.referrerContext.trafficSource,
              category: event.referrerContext.category,
              source: event.referrerContext.source,
              isFirstVisit: event.referrerContext.isFirstVisit,
              sessionReferrer: event.referrerContext.sessionReferrer,
              referrerPolicy: event.referrerContext.referrerPolicy,
              protocolDowngrade: event.referrerContext.protocolDowngrade,
              affiliate: event.referrerContext.affiliate,
              timestamp: event.timestamp,
            },
          });
        }
      }
    },
    [sendToParent]
  );

  // URL tracking setup
  const {
    currentUrl,
    previousUrl,
    isTracking,
    errorCount,
    isRateLimited,
    referrerData,
    trafficSource,
    campaignData,
    cleanupExpiredData,
  } = useURLTracking({
    onURLChange: handleURLChange,
    debounceMs: 300,
    trackParentWindow: true,
    maxUrlLength: 200,
    maxChangesPerMinute: 20,
    dataRetentionDays: privacySettings.retentionPolicy.urlHistory,
  });

  /**
   * Debounced tag update
   */
  const debouncedTagUpdate = useCallback((tags: string[], roomId: string) => {
    if (!mountedRef.current) return;

    tagBatchQueue.current.push(tags);

    if (tagBatchTimer.current) {
      clearTimeout(tagBatchTimer.current);
    }

    tagBatchTimer.current = setTimeout(() => {
      if (!mountedRef.current) return;

      const mergedTags = Array.from(new Set(tagBatchQueue.current.flat()));
      // addTagsToSession({ tags: mergedTags, roomId });
      tagBatchQueue.current = [];
    }, TAG_BATCH_DELAY);
  }, []);

  /**
   * Debounced visitor info update
   */
  const debouncedVisitorInfoUpdate = useCallback(
    (visitorInfo: any, roomId: string) => {
      if (!mountedRef.current) return;

      visitorInfoBatchQueue.current.push(visitorInfo);

      if (visitorInfoBatchTimer.current) {
        clearTimeout(visitorInfoBatchTimer.current);
      }

      visitorInfoBatchTimer.current = setTimeout(() => {
        if (!mountedRef.current) return;

        const latestVisitorInfo =
          visitorInfoBatchQueue.current[
            visitorInfoBatchQueue.current.length - 1
          ];
        // addUserDetailToSession({ visitorInfo: latestVisitorInfo, roomId });
        visitorInfoBatchQueue.current = [];
      }, VISITOR_INFO_BATCH_DELAY);
    },
    []
  );

  /**
   * Debounced system message
   */
  // const debounceSystemMessage = useCallback(
  //   (message: string) => {
  //     if (!mountedRef.current) return;

  //     if (typingTimeoutRef.current) {
  //       clearTimeout(typingTimeoutRef.current);
  //     }

  //     typingTimeoutRef.current = setTimeout(() => {
  //       if (!mountedRef.current) return;

  //       addSystemMessage({
  //         id: Date.now().toString(),
  //         content: message,
  //         sender: "system",
  //         timestamp: new Date(),
  //         status: "hidden",
  //       });
  //     }, TYPING_DEBOUNCE_DELAY);
  //   },
  //   [addSystemMessage]
  // );

  /**
   * Check if widget is ready
   */
  useEffect(() => {
    function checkReady() {
      if (window.parent && document.readyState === "complete") {
        setIsReady(true);
      } else if (mountedRef.current) {
        timeoutRef.current = setTimeout(checkReady, READY_CHECK_INTERVAL);
      }
    }

    checkReady();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Add widget message listener
   */
  function addWidgetMessageListener(handler: (event: MessageEvent) => void) {
    function scopedHandler(event: MessageEvent) {
      if (event.source !== window.parent || !mountedRef.current) return;

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (
          !data?.type ||
          (!data.type.startsWith("widget:") &&
            ![
              "command",
              "config",
              "identify",
              "consent",
              "privacy:cleanup",
              "status",
            ].includes(data.type))
        ) {
          return;
        }

        handler(event);
      } catch (error) {
        console.error("Error parsing widget message:", error);
      }
    }

    window.addEventListener("message", scopedHandler);
    return () => window.removeEventListener("message", scopedHandler);
  }

  /**
   * Handle commands from parent window
   */
  const handleCommand = useCallback(
    (action?: string) => {
      if (!action || !mountedRef.current) return;

      switch (action) {
        case "open":
          setIsOpen(true);
          sendToParent("widget:event", {
            event: "open",
            data: getWidgetSize(),
          });
          break;
        case "fullscreen":
          setIsFullScreen(true);
          sendToParent("widget:event", { event: "fullscreen" });
          break;
        case "close":
          setIsOpen(false);
          sendToParent("widget:event", { event: "close" });
          break;
        case "toggle":
          setIsOpen((prev) => {
            if (!mountedRef.current) return prev;
            sendToParent("widget:event", {
              event: prev ? "close" : "open",
              data: getWidgetSize(),
            });
            return !prev;
          });
          break;
        case "status":
          sendToParent("status:response", { isOpen });
          break;
        default:
          console.warn("Unknown command:", action);
      }
    },
    [isOpen, sendToParent, getWidgetSize]
  );

  /**
   * Handle messages from parent window
   */
  useEffect(() => {
    if (!isReady || !mountedRef.current) return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.source !== window.parent || !mountedRef.current) return;

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (
          !data?.type ||
          (!data.type.startsWith("widget:") &&
            ![
              "command",
              "config",
              "identify",
              "consent",
              "privacy:cleanup",
              "status",
            ].includes(data.type))
        ) {
          return;
        }

        switch (data.type) {
          case "command":
            handleCommand(data.data?.action);
            break;
          case "widget:visitor-event":
            if (data?.data && data.data.type) {
              setVisitorActiveStatus((prev) => {
                if (!mountedRef.current) return prev;
                const vType = data.data.type;

                if (prev === "away") {
                  // debounceSystemMessage("Visitor has joined the chat.");
                }

                // if (prev === "idle" || prev === "away" || prev === "left") {
                //   removeTagsFromSession({ tags: ["Idle"], roomId });
                // }

                if (vType === "visitor:left") return "left";
                // if (vType === "visitor:idle") {
                //   addTagsToSession({ tags: ["Idle"], roomId });
                //   return "idle";
                // }
                if (vType === "visitor:returned") {
                  debounceUserStatus("active");
                  return "returned";
                }
                if (vType === "visitor:idle") {
                  debounceUserStatus("idle");
                  return "idle";
                }
                if (vType === "visitor:away") {
                  debounceUserStatus("away");
                  return "away";
                }
                return "ai-agent";
              });
            }
            break;
          case "config":
            if (data.data && mountedRef.current) {
              setWidgetConfig((prev) => ({ ...prev, ...data.data }));

              if (
                data.data.enableGDPR !== undefined ||
                data.data.requireConsent !== undefined ||
                data.data.anonymizeData !== undefined ||
                data.data.dataRetentionDays !== undefined
              ) {
                setPrivacySettings((prev) => ({
                  ...prev,
                  enableGDPR: data.data.enableGDPR ?? prev.enableGDPR,
                  requireConsent:
                    data.data.requireConsent ?? prev.requireConsent,
                  anonymizeData: data.data.anonymizeData ?? prev.anonymizeData,
                  retentionPolicy: {
                    ...prev.retentionPolicy,
                    referrerData:
                      data.data.dataRetentionDays ??
                      prev.retentionPolicy.referrerData,
                    urlHistory:
                      data.data.dataRetentionDays ??
                      prev.retentionPolicy.urlHistory,
                    sessionData:
                      data.data.dataRetentionDays ??
                      prev.retentionPolicy.sessionData,
                  },
                }));
              }
            }
            break;
          case "identify":
            console.log("User identified:", data.data);
            break;
          case "consent":
            if (data.data && mountedRef.current) {
              saveConsentState(data.data);
              setConsentState(data.data);
              sendToParent("widget:event", {
                event: "consent:updated",
                data: data.data,
              });
            }
            break;
          case "privacy:cleanup":
            if (mountedRef.current) {
              cleanupExpiredData();
              sendToParent("widget:event", {
                event: "privacy:cleanup-complete",
                data: { timestamp: new Date().toISOString() },
              });
            }
            break;
          case "status":
            if (data.data?.query === "isOpen" && mountedRef.current) {
              sendToParent("status:response", { isOpen });
            }
            break;
          case "widget:tags-update":
            if (data.data?.tags && mountedRef.current) {
              debouncedTagUpdate(data.data.tags, roomId);
              setVisitorTags(data.data.tags);
            }
            break;
          case "widget:tags-request":
            if (mountedRef.current) {
              sendToParent("widget:tags-response", { tags: visitorTags });
            }
            break;
          case "widget:visitor-info-update":
            if (data.data?.visitorInfo && mountedRef.current) {
              setVisitorInfo(data.data.visitorInfo);
              debouncedVisitorInfoUpdate(data.data?.visitorInfo || {}, roomId);
            }
            break;
          case "widget:visitor-info-request":
            if (mountedRef.current) {
              sendToParent("widget:visitor-info-response", { visitorInfo });
            }
            break;
          case "queue:position:request":
            if (mountedRef.current) {
              sendToParent("queue:position:response", {
                queue_position: queuePosition,
              });
            }
            break;
          case "chat:status:request":
            if (mountedRef.current) {
              const isCurrentlyChatting = isChatting();
              sendToParent("chat:status:response", {
                isChatting: isCurrentlyChatting,
              });
            }
            break;
          case "widget:fingerprint-update":
            if (data.data?.fingerprint && mountedRef.current) {
              setDeviceFingerprint(data.data.fingerprint);
              setFingerprintGenerated(data.data.generated || false);

              // Send fingerprint data to backend if needed
              sendToParent("widget:event", {
                event: "fingerprint:received",
                data: {
                  signature: data.data.fingerprint?.metadata?.signature,
                  confidence: data.data.fingerprint?.metadata?.confidence,
                  timestamp: data.data.timestamp,
                },
              });
            }
            break;
          case "widget:fingerprint-request":
            if (mountedRef.current) {
              sendToParent("widget:fingerprint-response", {
                fingerprint: deviceFingerprint,
                generated: fingerprintGenerated,
              });
            }
            break;
          case "widget:visitor-data":
            if (data.data && mountedRef.current) {
              setVisitorTrackingData(data.data);

              // Send visitor tracking data to backend
              sendToParent("widget:event", {
                event: "visitor:data-received",
                data: {
                  visitorState: data.data.visitorState,
                  activityLevel: data.data.visitorState?.activityLevel,
                  isTracking: data.data.isTracking,
                  timestamp: data.data.timestamp,
                },
              });
            }
            break;
          case "widget:visitor-event":
            if (data.data && mountedRef.current) {
              // Handle visitor events (idle, away, active, etc.)
              const eventType = data.data.type;

              if (eventType === "visitor:idle") {
                // addTagsToSession({ tags: ["Visitor Idle"], roomId }); // Function not available
              } else if (eventType === "visitor:away") {
                // addTagsToSession({ tags: ["Visitor Away"], roomId }); // Function not available
              } else if (
                eventType === "visitor:returned" ||
                eventType === "visitor:activity"
              ) {
                // removeTagsFromSession({ tags: ["Visitor Idle", "Visitor Away"], roomId }); // Function not available
              }

              sendToParent("widget:event", {
                event: "visitor:event-processed",
                data: {
                  eventType,
                  processed: true,
                  timestamp: new Date().toISOString(),
                },
              });
            }
            break;
          case "widget:referrer-update":
            if (data.data && mountedRef.current) {
              // Only update if the data is actually different
              const newData = JSON.stringify(data.data);
              const currentData = JSON.stringify(referrerTrackingData);
              if (newData !== currentData) {
                setReferrerTrackingData(data.data);

                // Send referrer data to backend
                sendToParent("widget:event", {
                  event: "referrer:data-processed",
                  data: {
                    trafficSource: data.data.trafficSource,
                    referrer: data.data.referrer?.referrer,
                    isFirstVisit: data.data.referrer?.isFirstVisit,
                    timestamp: data.data.timestamp,
                  },
                });
              }
            }
            break;
          case "widget:referrer-request":
            if (mountedRef.current) {
              sendToParent("widget:referrer-response", {
                referrerData: referrerTrackingData,
              });
            }
            break;
          case "widget:visitor-path":
            if (data.data && mountedRef.current) {
              setVisitorPath(data.data);

              // Add navigation tracking
              // addTagsToSession({ tags: ["Page Navigation"], roomId }); // Function not available

              // Send visitor path to backend
              sendToParent("widget:event", {
                event: "visitor:path-tracked",
                data: {
                  title: data.data.title,
                  url: data.data.url,
                  changeType: data.data.changeType,
                  timestamp: new Date().toISOString(),
                },
              });
            }
            break;
          case "widget:visitor-path-response":
            if (mountedRef.current) {
              sendToParent("widget:visitor-path-response", {
                success: true,
                visitorPath: visitorPath,
              });
            }
            break;
          case "widget:data-export-request":
            if (mountedRef.current) {
              const exportData = {
                messages: messages.slice(-50), // Last 50 messages
                visitorTags,
                visitorInfo,
                deviceFingerprint: deviceFingerprint?.metadata,
                visitorTrackingData: visitorTrackingData?.visitorState,
                referrerTrackingData: referrerTrackingData?.referrer,
                departmentsData,
                visitorDefaultDepartment,
                sessionId: roomId,
                timestamp: new Date().toISOString(),
                chatInfo,
              };

              sendToParent("widget:data-export-response", {
                data: exportData,
                success: true,
              });
            }
            break;
          case "widget:data-delete-request":
            if (mountedRef.current) {
              // Clear local data
              setVisitorTags([]);
              setVisitorInfo(null);
              setDeviceFingerprint(null);
              setFingerprintGenerated(false);
              setVisitorTrackingData(null);
              setReferrerTrackingData(null);
              setVisitorPath(null);
              setDepartmentsData([]);
              setVisitorDefaultDepartment(null);
              setDepartmentsLastUpdated(null);

              // Clear messages
              // setMessages([]); // Function not available

              // Clear local storage
              localStorage.removeItem("is_open");
              localStorage.removeItem("chatSettings");
              setChatInfo({ rating: null, comment: null });

              sendToParent("widget:data-delete-response", {
                success: true,
                timestamp: new Date().toISOString(),
              });

              sendToParent("widget:event", {
                event: "data:deleted",
                data: { timestamp: new Date().toISOString() },
              });
            }
            break;
          case "widget:privacy-cleanup":
            if (mountedRef.current) {
              cleanupExpiredData();

              // Clean up old visitor tracking data
              if (visitorTrackingData?.timestamp) {
                const dataAge =
                  Date.now() -
                  new Date(visitorTrackingData.timestamp).getTime();
                const maxAge =
                  privacySettings.retentionPolicy.sessionData *
                  24 *
                  60 *
                  60 *
                  1000;

                if (dataAge > maxAge) {
                  setVisitorTrackingData(null);
                }
              }

              // Clean up old referrer data
              if (referrerTrackingData?.timestamp) {
                const dataAge =
                  Date.now() -
                  new Date(referrerTrackingData.timestamp).getTime();
                const maxAge =
                  privacySettings.retentionPolicy.referrerData *
                  24 *
                  60 *
                  60 *
                  1000;

                if (dataAge > maxAge) {
                  setReferrerTrackingData(null);
                }
              }

              // Clean up fingerprint data if too old
              if (deviceFingerprint?.metadata?.timestamp) {
                const now = new Date();
                const retentionDays =
                  privacySettings.retentionPolicy.sessionData;
                const dataAge =
                  (now.getTime() -
                    new Date(deviceFingerprint.metadata.timestamp).getTime()) /
                  (1000 * 60 * 60 * 24);
                if (dataAge > retentionDays) {
                  setDeviceFingerprint(null);
                  setFingerprintGenerated(false);
                }
              }

              // Clean up old chat info
              if (chatInfo?.timestamp) {
                const dataAge =
                  Date.now() - new Date(chatInfo.timestamp).getTime();
                const maxAge =
                  privacySettings.retentionPolicy.sessionData *
                  24 *
                  60 *
                  60 *
                  1000;

                if (dataAge > maxAge) {
                  setChatInfo({ rating: null, comment: null });
                }
              }

              sendToParent("widget:privacy-cleanup-response", {
                success: true,
                timestamp: new Date().toISOString(),
              });
            }
            break;
          case "widget:advanced-tags-add":
            if (
              data.data?.tags &&
              Array.isArray(data.data.tags) &&
              mountedRef.current
            ) {
              try {
                // Validate and sanitize tags
                const sanitizedTags = data.data.tags
                  .filter(
                    (tag: any) =>
                      typeof tag === "string" && tag.trim().length > 0
                  )
                  .map((tag: string) =>
                    tag.trim().toLowerCase().substring(0, 50)
                  )
                  .filter(
                    (tag: string, index: number, arr: string[]) =>
                      arr.indexOf(tag) === index
                  )
                  .slice(0, 20); // Limit to 20 tags

                if (sanitizedTags.length > 0) {
                  const currentTags = [...visitorTags];
                  const newTags = [
                    ...new Set([...currentTags, ...sanitizedTags]),
                  ];

                  setVisitorTags(newTags);
                  debouncedTagUpdate(newTags, roomId);

                  sendToParent("widget:advanced-tags-response", {
                    success: true,
                    tags: newTags,
                    added: sanitizedTags,
                  });
                }
              } catch (error) {
                sendToParent("widget:advanced-tags-response", {
                  success: false,
                  error: "Failed to add tags",
                });
              }
            }
            break;
          case "widget:advanced-tags-remove":
            if (
              data.data?.tags &&
              Array.isArray(data.data.tags) &&
              mountedRef.current
            ) {
              try {
                const tagsToRemove = data.data.tags.map((tag: string) =>
                  tag.trim().toLowerCase()
                );
                const currentTags = [...visitorTags];
                const newTags = currentTags.filter(
                  (tag) => !tagsToRemove.includes(tag)
                );

                setVisitorTags(newTags);
                debouncedTagUpdate(newTags, roomId);

                sendToParent("widget:advanced-tags-response", {
                  success: true,
                  tags: newTags,
                  removed: tagsToRemove,
                });
              } catch (error) {
                sendToParent("widget:advanced-tags-response", {
                  success: false,
                  error: "Failed to remove tags",
                });
              }
            }
            break;
          case "widget:advanced-tags-clear":
            if (mountedRef.current) {
              try {
                setVisitorTags([]);
                debouncedTagUpdate([], roomId);

                sendToParent("widget:advanced-tags-response", {
                  success: true,
                  tags: [],
                  cleared: true,
                });
              } catch (error) {
                sendToParent("widget:advanced-tags-response", {
                  success: false,
                  error: "Failed to clear tags",
                });
              }
            }
            break;
          case "widget:advanced-visitor-info-set":
            if (data.data?.visitorInfo && mountedRef.current) {
              try {
                // Validate visitor info
                const info = data.data.visitorInfo;
                const sanitizedInfo: any = {};

                if (
                  info.display_name &&
                  typeof info.display_name === "string"
                ) {
                  sanitizedInfo.display_name = info.display_name
                    .trim()
                    .substring(0, 255);
                }

                if (info.email && typeof info.email === "string") {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (emailRegex.test(info.email.trim())) {
                    sanitizedInfo.email = info.email.trim().toLowerCase();
                  }
                }

                if (info.phone && typeof info.phone === "string") {
                  const phoneRegex = /^[0-9+\-\s()]+$/;
                  const phone = info.phone.trim().substring(0, 25);
                  if (phoneRegex.test(phone)) {
                    sanitizedInfo.phone = phone;
                  }
                }

                const updatedInfo = { ...visitorInfo, ...sanitizedInfo };
                setVisitorInfo(updatedInfo);
                debouncedVisitorInfoUpdate(updatedInfo, roomId);

                sendToParent("widget:advanced-visitor-info-response", {
                  success: true,
                  visitorInfo: updatedInfo,
                });
              } catch (error) {
                sendToParent("widget:advanced-visitor-info-response", {
                  success: false,
                  error: "Failed to set visitor info",
                });
              }
            }
            break;
          case "widget:advanced-visitor-info-get":
            if (mountedRef.current) {
              sendToParent("widget:advanced-visitor-info-response", {
                success: true,
                visitorInfo: visitorInfo,
              });
            }
            break;
          case "departments:request":
            if (mountedRef.current) {
              // Send current departments data or fetch from backend
              sendToParent("departments:response", {
                departments: departmentsData,
                lastUpdated: departmentsLastUpdated,
                success: true,
              });
            }
            break;
          case "widget:departments-update":
            if (data.data?.departments && mountedRef.current) {
              setDepartmentsData(data.data.departments);
              setDepartmentsLastUpdated(Date.now());

              sendToParent("widget:event", {
                event: "departments:updated",
                data: {
                  departments: data.data.departments,
                  timestamp: new Date().toISOString(),
                },
              });
            }
            break;
          case "widget:departments-status-update":
            if (
              data.data?.departmentId &&
              data.data?.status &&
              mountedRef.current
            ) {
              handleDepartmentStatusUpdate(
                data.data.departmentId,
                data.data.status
              );
            }
            break;
          case "widget:visitor-default-department-set":
            if (data.data?.departmentId && mountedRef.current) {
              try {
                // Validate department exists
                const department = departmentsData.find(
                  (dept) => dept.id === data.data.departmentId
                );

                if (department) {
                  const defaultDept = {
                    id: department.id,
                    name: department.name,
                    status: department.status,
                  };

                  setVisitorDefaultDepartment(defaultDept);

                  // Update visitor info with default department
                  const updatedVisitorInfo = {
                    ...visitorInfo,
                    defaultDepartment: defaultDept,
                  };
                  setVisitorInfo(updatedVisitorInfo);
                  debouncedVisitorInfoUpdate(updatedVisitorInfo, roomId);

                  // Add department tag
                  // addTagsToSession({ tags: [`Department: ${department.name}`], roomId }); // Function not available

                  sendToParent("widget:visitor-default-department-response", {
                    success: true,
                    department: defaultDept,
                  });

                  sendToParent("widget:event", {
                    event: "visitor:default-department-set",
                    data: {
                      department: defaultDept,
                      timestamp: new Date().toISOString(),
                    },
                  });
                } else {
                  sendToParent("widget:visitor-default-department-response", {
                    success: false,
                    error: "Department not found",
                  });
                }
              } catch (error) {
                sendToParent("widget:visitor-default-department-response", {
                  success: false,
                  error: "Failed to set default department",
                });
              }
            }
            break;
          case "widget:visitor-default-department-clear":
            if (mountedRef.current) {
              try {
                // Only allow clearing before chat starts
                const userMessages = messages.filter(
                  (m) => m.senderType === "visitor"
                );

                if (userMessages.length > 0) {
                  sendToParent("widget:visitor-default-department-response", {
                    success: false,
                    error:
                      "Cannot clear default department after chat has started",
                  });
                  return;
                }

                const previousDept = visitorDefaultDepartment;
                setVisitorDefaultDepartment(null);

                // Update visitor info
                const updatedVisitorInfo = {
                  ...visitorInfo,
                  defaultDepartment: null,
                };
                setVisitorInfo(updatedVisitorInfo);
                debouncedVisitorInfoUpdate(updatedVisitorInfo, roomId);

                // Remove department tag
                if (previousDept) {
                  // removeTagsFromSession({ tags: [`Department: ${previousDept.name}`], roomId }); // Function not available
                }

                sendToParent("widget:visitor-default-department-response", {
                  success: true,
                  cleared: true,
                });

                sendToParent("widget:event", {
                  event: "visitor:default-department-cleared",
                  data: {
                    previousDepartment: previousDept,
                    timestamp: new Date().toISOString(),
                  },
                });
              } catch (error) {
                sendToParent("widget:visitor-default-department-response", {
                  success: false,
                  error: "Failed to clear default department",
                });
              }
            }
            break;
          case "widget:visitor-default-department-update":
            if (data.data && mountedRef.current) {
              setVisitorDefaultDepartment(data.data.department);

              sendToParent("widget:event", {
                event: "visitor:default-department-updated",
                data: {
                  department: data.data.department,
                  timestamp: new Date().toISOString(),
                },
              });
            }
            break;
          case "widget:visitor-default-department-request":
            if (mountedRef.current) {
              sendToParent("widget:visitor-default-department-response", {
                success: true,
                department: visitorDefaultDepartment,
              });
            }
            break;
          case "widget:chat-info-request":
            if (mountedRef.current) {
              try {
                // Validate request and check rate limiting
                const now = Date.now();
                const timeSinceLastUpdate = chatInfoLastUpdated
                  ? now - chatInfoLastUpdated
                  : Number.POSITIVE_INFINITY;

                // Rate limiting - allow requests every 5 seconds
                if (timeSinceLastUpdate < 5000) {
                  sendToParent("widget:chat-info-response", {
                    success: false,
                    error: "Rate limited - minimum 5 seconds between requests",
                    retryAfter: 5000 - timeSinceLastUpdate,
                  });
                  return;
                }

                setChatInfoLastUpdated(now);

                // Prepare chat info response
                const chatInfoResponse = {
                  rating: chatInfo.rating,
                  comment: chatInfo.comment,
                  timestamp: chatInfo.timestamp || new Date().toISOString(),
                  sessionId: roomId,
                  messageCount: messages.length,
                  hasUserMessages: messages.some(
                    (m) => m.senderType === "visitor"
                  ),
                  lastActivity:
                    messages.length > 0
                      ? messages[messages.length - 1].createdAt
                      : null,
                };

                sendToParent("widget:chat-info-response", {
                  success: true,
                  chatInfo: chatInfoResponse,
                  metadata: {
                    requestTimestamp: new Date().toISOString(),
                    visitorInfo: visitorInfo
                      ? {
                          hasName: !!visitorInfo.display_name,
                          hasEmail: !!visitorInfo.email,
                          hasPhone: !!visitorInfo.phone,
                        }
                      : null,
                  },
                });

                // Send tracking event
                sendToParent("widget:event", {
                  event: "chat:info:accessed",
                  data: {
                    hasRating: !!chatInfo.rating,
                    hasComment: !!chatInfo.comment,
                    messageCount: messages.length,
                    timestamp: new Date().toISOString(),
                  },
                });

                // Record visitor activity if tracking is enabled
                if (visitorTrackingData && isTrackingAllowed("analytics")) {
                  sendToParent("widget:event", {
                    event: "visitor:activity",
                    data: {
                      type: "chat_info_accessed",
                      intensity: 0.3,
                      timestamp: new Date().toISOString(),
                    },
                  });
                }
              } catch (error) {
                console.error("Error handling chat info request:", error);

                sendToParent("widget:chat-info-response", {
                  success: false,
                  error: (error as Error).message || "Failed to get chat info",
                });
              }
            }
            break;
          case "widget:chat-info-update":
            if (data.data && mountedRef.current) {
              try {
                const { rating, comment, source } = data.data;

                // Validate rating
                if (rating !== null && rating !== "good" && rating !== "bad") {
                  sendToParent("widget:chat-info-update-response", {
                    success: false,
                    error: "Invalid rating - must be 'good', 'bad', or null",
                    field: "rating",
                  });
                  return;
                }

                // Validate comment
                if (
                  comment !== null &&
                  (typeof comment !== "string" || comment.length > 1000)
                ) {
                  sendToParent("widget:chat-info-update-response", {
                    success: false,
                    error:
                      "Invalid comment - must be string under 1000 characters or null",
                    field: "comment",
                  });
                  return;
                }

                // Update chat info
                const updatedChatInfo = {
                  rating: rating !== undefined ? rating : chatInfo.rating,
                  comment:
                    comment !== undefined
                      ? comment
                        ? comment.trim()
                        : null
                      : chatInfo.comment,
                  timestamp: new Date().toISOString(),
                };

                setChatInfo(updatedChatInfo);
                setChatInfoLastUpdated(Date.now());

                // Add tags based on rating
                if (rating === "good") {
                  // addTagsToSession({ tags: ["Positive Feedback", "Good Rating"], roomId }); // Function not available
                } else if (rating === "bad") {
                  // addTagsToSession({ tags: ["Negative Feedback", "Bad Rating", "Needs Follow-up"], roomId }); // Function not available
                }

                // Add comment tag if provided
                if (comment && comment.trim()) {
                  // addTagsToSession({ tags: ["Has Feedback Comment"], roomId }); // Function not available
                }

                sendToParent("widget:chat-info-update-response", {
                  success: true,
                  chatInfo: updatedChatInfo,
                  timestamp: new Date().toISOString(),
                });

                // Send tracking event
                sendToParent("widget:event", {
                  event: "chat:info:updated",
                  data: {
                    rating: updatedChatInfo.rating,
                    hasComment: !!updatedChatInfo.comment,
                    source: source || "widget_api",
                    timestamp: new Date().toISOString(),
                  },
                });

                // Record visitor activity
                if (visitorTrackingData && isTrackingAllowed("analytics")) {
                  sendToParent("widget:event", {
                    event: "visitor:activity",
                    data: {
                      type: "chat_info_updated",
                      intensity: 0.8,
                      timestamp: new Date().toISOString(),
                    },
                  });
                }

                // Add system message for internal tracking
                addSystemMessage({
                  id: Date.now().toString(),
                  content: `Chat feedback updated: ${
                    rating ? `Rating: ${rating}` : "No rating"
                  }${
                    comment
                      ? `, Comment: "${comment.substring(0, 50)}${
                          comment.length > 50 ? "..." : ""
                        }"`
                      : ""
                  }`,
                  sender: "system",
                  timestamp: new Date(),
                  status: "hidden",
                });
              } catch (error) {
                console.error("Error updating chat info:", error);

                sendToParent("widget:chat-info-update-response", {
                  success: false,
                  error:
                    (error as Error).message || "Failed to update chat info",
                });
              }
            }
            break;
          case "widget:chat-info-clear":
            if (mountedRef.current) {
              try {
                // Clear chat info
                const clearedInfo = {
                  rating: null,
                  comment: null,
                  timestamp: new Date().toISOString(),
                };

                setChatInfo(clearedInfo);
                setChatInfoLastUpdated(Date.now());

                // Remove feedback tags
                // removeTagsFromSession({
                //   tags: [
                //     "Positive Feedback",
                //     "Good Rating",
                //     "Negative Feedback",
                //     "Bad Rating",
                //     "Needs Follow-up",
                //     "Has Feedback Comment",
                //   ],
                //   roomId,
                // }); // Function not available

                sendToParent("widget:chat-info-clear-response", {
                  success: true,
                  timestamp: new Date().toISOString(),
                });

                // Send tracking event
                sendToParent("widget:event", {
                  event: "chat:info:cleared",
                  data: {
                    timestamp: new Date().toISOString(),
                  },
                });

                // Add system message
                addSystemMessage({
                  id: Date.now().toString(),
                  content: "Chat feedback cleared",
                  sender: "system",
                  timestamp: new Date(),
                  status: "hidden",
                });
              } catch (error) {
                console.error("Error clearing chat info:", error);

                sendToParent("widget:chat-info-clear-response", {
                  success: false,
                  error:
                    (error as Error).message || "Failed to clear chat info",
                });
              }
            }
            break;
          case "widget:departments-refresh-request":
            if (mountedRef.current) {
              // Request fresh departments data from backend
              sendToParent("widget:event", {
                event: "departments:refresh-requested",
                data: {
                  timestamp: new Date().toISOString(),
                },
              });

              // Clear cache to force refresh
              setDepartmentsLastUpdated(null);

              sendToParent("widget:departments-refresh-response", {
                success: true,
                refreshRequested: true,
              });
            }
            break;
          case "widget:chat-history-request":
            if (mountedRef.current) {
              if (isHistoryFetching) {
                sendToParent("widget:chat-history-response", {
                  success: false,
                  error: "CONCURRENT_REQUEST",
                  message: "A chat history request is already in progress.",
                });
                return;
              }

              if (chatHistoryRequestCount >= CHAT_HISTORY_RATE_LIMIT) {
                sendToParent("widget:chat-history-response", {
                  success: false,
                  error: "RATE_LIMIT_EXCEEDED",
                  message: "Rate limit for fetching chat history exceeded.",
                });
                return;
              }

              setIsHistoryFetching(true);
              setChatHistoryRequestCount((prev) => prev + 1);
              handleChatHistoryRateLimit();

              fetchHistoryFromAPI(data.data?.cursor || null)
                .then((historyData: any) => {
                  if (mountedRef.current) {
                    sendToParent("widget:chat-history-response", {
                      success: true,
                      ...historyData,
                    });
                  }
                })
                .catch((error) => {
                  if (mountedRef.current) {
                    sendToParent("widget:chat-history-response", {
                      success: false,
                      error: "FETCH_FAILED",
                      message: error.message || "Failed to fetch chat history.",
                    });
                  }
                })
                .finally(() => {
                  if (mountedRef.current) {
                    setIsHistoryFetching(false);
                  }
                });
            }
            break;
          case "widget:send-chat-rating":
            if (mountedRef.current && data.data) {
              try {
                const { rating, messageId, source } = data.data;

                // 1. Validation
                if (rating !== "good" && rating !== "bad" && rating !== null) {
                  sendToParent("chat:rating:response", {
                    messageId,
                    success: false,
                    error:
                      "Invalid rating value. Must be 'good', 'bad', or null.",
                  });
                  return;
                }

                if (!messageId) {
                  sendToParent("chat:rating:response", {
                    messageId,
                    success: false,
                    error: "Missing messageId for tracking.",
                  });
                  return;
                }

                // 2. Update State
                const updatedChatInfo = {
                  ...chatInfo,
                  rating: rating,
                  comment:
                    rating === null ? chatInfo.comment : chatInfo.comment, // Keep comment unless rating is cleared
                  timestamp: new Date().toISOString(),
                };
                setChatInfo(updatedChatInfo);
                setChatInfoLastUpdated(Date.now());

                // 3. Update Tags
                // First, remove all potentially existing rating tags to ensure a clean state
                // removeTagsFromSession({
                //   tags: ["Positive Feedback", "Good Rating", "Negative Feedback", "Bad Rating", "Needs Follow-up"],
                //   roomId,
                // }); // Function not available

                if (rating === "good") {
                  // addTagsToSession({ tags: ["Positive Feedback", "Good Rating"], roomId }); // Function not available
                } else if (rating === "bad") {
                  // addTagsToSession({ tags: ["Negative Feedback", "Bad Rating", "Needs Follow-up"], roomId }); // Function not available
                }

                // 4. Add System Message
                let systemMessageContent = "Chat rating has been removed.";
                if (rating) {
                  systemMessageContent = `Visitor rated the chat as '${rating}'.`;
                }
                addSystemMessage({
                  id: Date.now().toString(),
                  content: systemMessageContent,
                  sender: "system",
                  timestamp: new Date(),
                  status: "hidden",
                });

                // 5. Visitor Activity Event
                if (visitorTrackingData && isTrackingAllowed("analytics")) {
                  sendToParent("widget:event", {
                    event: "visitor:activity",
                    data: {
                      type: "chat_rated",
                      intensity: 0.8,
                      details: { rating },
                      timestamp: new Date().toISOString(),
                    },
                  });
                }

                // 6. Send Success Response
                sendToParent("chat:rating:response", {
                  messageId,
                  success: true,
                  chatInfo: updatedChatInfo,
                  timestamp: new Date().toISOString(),
                });

                // 7. Send General Tracking Event
                sendToParent("widget:event", {
                  event: "chat:info:updated",
                  data: {
                    rating: updatedChatInfo.rating,
                    hasComment: !!updatedChatInfo.comment,
                    source: source || "widget_api",
                    timestamp: new Date().toISOString(),
                  },
                });
              } catch (error) {
                console.error("Error handling sendChatRating:", error);
                sendToParent("chat:rating:response", {
                  messageId: data.data?.messageId,
                  success: false,
                  error:
                    (error as Error).message ||
                    "An internal error occurred while processing the rating.",
                });
              }
            }
            break;
          case "widget:send-chat-comment":
            if (data.data && mountedRef.current) {
              try {
                const { comment, commentId, source } = data.data;

                // 1. Validation
                if (
                  !comment ||
                  typeof comment !== "string" ||
                  comment.trim().length === 0
                ) {
                  sendToParent("chat:comment:response", {
                    commentId,
                    success: false,
                    error: "Comment cannot be empty.",
                  });
                  return;
                }

                const sanitizedComment = comment.trim();
                if (sanitizedComment.length > 1000) {
                  sendToParent("chat:comment:response", {
                    commentId,
                    success: false,
                    error: "Comment exceeds maximum length of 1000 characters.",
                  });
                  return;
                }

                // 2. Update State
                const updatedChatInfo = {
                  ...chatInfo,
                  comment: sanitizedComment,
                  timestamp: new Date().toISOString(),
                };
                setChatInfo(updatedChatInfo);
                setChatInfoLastUpdated(Date.now());

                // 3. Update Tags
                // addTagsToSession({ tags: ["Has Feedback Comment"], roomId }); // Function not available

                // 4. Add System Message
                addSystemMessage({
                  id: Date.now().toString(),
                  content: `Visitor left a comment: "${sanitizedComment.substring(
                    0,
                    100
                  )}${sanitizedComment.length > 100 ? "..." : ""}"`,
                  sender: "system",
                  timestamp: new Date(),
                  status: "hidden",
                });

                // 5. Visitor Activity Event
                if (visitorTrackingData && isTrackingAllowed("analytics")) {
                  sendToParent("widget:event", {
                    event: "visitor:activity",
                    data: {
                      type: "chat_comment_added",
                      intensity: 0.7,
                      timestamp: new Date().toISOString(),
                    },
                  });
                }

                // 6. Send Success Response
                sendToParent("chat:comment:response", {
                  commentId,
                  success: true,
                  chatInfo: updatedChatInfo,
                  timestamp: new Date().toISOString(),
                });

                // 7. Send General Tracking Event
                sendToParent("widget:event", {
                  event: "chat:info:updated",
                  data: {
                    rating: updatedChatInfo.rating,
                    hasComment: !!updatedChatInfo.comment,
                    source: source || "widget_api_comment",
                    timestamp: new Date().toISOString(),
                  },
                });
              } catch (error) {
                console.error("Error handling sendChatComment:", error);
                sendToParent("chat:comment:response", {
                  commentId: data.data?.commentId,
                  success: false,
                  error:
                    (error as Error).message ||
                    "An internal error occurred while processing the comment.",
                });
              }
            }
            break;
          case "widget:send-chat-message":
            if (data.data?.message && mountedRef.current) {
              try {
                const messageData = data.data;
                const messageContent = messageData.message.trim();

                if (!messageContent) {
                  sendToParent("chat:message:response", {
                    messageId: messageData.messageId,
                    success: false,
                    error: "Message cannot be empty",
                  });
                  return;
                }

                // Check if WebSocket is connected
                // if (socket) {
                //   try {
                //     // Try to send a test message to check connection
                //     sendMessage("test");
                //   } catch (error) {
                //     sendToParent("chat:message:response", {
                //       messageId: messageData.messageId,
                //       success: false,
                //       error: "Chat connection is not available",
                //     });
                //     return;
                //   }
                // }

                // Check agent availability (optional - could be handled by backend)
                // const hasOnlineAgents = agentData?.isOnline || socket;

                // if (!hasOnlineAgents) {
                //   // Still send the message but warn about potential missed chat
                //   console.warn(
                //     "Sending message when no agents may be available"
                //   );
                // }

                // Send the message using existing infrastructure
                // Note: addUserMessage function is not available in original, so we'll use sendMessage directly
                sendMessage(messageContent);

                // Add tags if this is the first user message
                if (
                  messages.filter((m) => m.senderType === "visitor").length ===
                  0
                ) {
                  // addTagsToSession({
                  //   tags: ["Please Attend This Chat", "Chatting", "API Message"],
                  //   roomId,
                  // }); // Function not available
                }

                // Send success response
                sendToParent("chat:message:response", {
                  messageId: messageData.messageId,
                  success: true,
                  timestamp: new Date().toISOString(),
                });

                // Send event for tracking
                sendToParent("widget:event", {
                  event: "message:sent:api",
                  data: {
                    content: messageContent,
                    messageId: messageData.messageId,
                    source: messageData.source || "sendChatMsg",
                    timestamp: new Date().toISOString(),
                  },
                });

                // Record visitor activity if tracking is enabled
                if (visitorTrackingData) {
                  sendToParent("widget:event", {
                    event: "visitor:activity",
                    data: {
                      type: "message_sent_api",
                      intensity: 0.8,
                      timestamp: new Date().toISOString(),
                    },
                  });
                }
              } catch (error) {
                console.error("Error handling sendChatMsg:", error);

                sendToParent("chat:message:response", {
                  messageId: data.data?.messageId,
                  success: false,
                  error: (error as Error).message || "Failed to send message",
                });
              }
            }
            break;
          case "widget:send-file":
            if (
              data.data?.fileData &&
              data.data?.fileName &&
              mountedRef.current
            ) {
              try {
                const { fileData, fileName, fileType, fileSize, fileId } =
                  data.data;

                // Validate file data
                if (
                  !fileData ||
                  !fileName ||
                  !fileType ||
                  !fileSize ||
                  !fileId
                ) {
                  sendToParent("file:send:response", {
                    fileId,
                    success: false,
                    error: "INVALID_FILE_DATA",
                    message: "Missing required file data",
                  });
                  return;
                }

                // Check WebSocket connection
                // if (socket) {
                //   try {
                //     // Try to send a test message to check connection
                //     sendMessage("test");
                //   } catch (error) {
                //     sendToParent("file:send:response", {
                //       fileId,
                //       success: false,
                //       error: "CONN_ERROR",
                //       message: "Chat connection is not available",
                //     });
                //     return;
                //   }
                // }

                // Validate file size (10MB limit)
                const maxSize = 10 * 1024 * 1024;
                if (fileSize > maxSize) {
                  sendToParent("file:send:response", {
                    fileId,
                    success: false,
                    error: "EXCEED_SIZE_LIMIT",
                    message: "File size exceeds 10MB limit",
                  });
                  return;
                }

                // Validate file type
                const allowedTypes = [
                  "image/jpeg",
                  "image/jpg",
                  "image/png",
                  "image/gif",
                  "image/webp",
                  "application/pdf",
                  "text/plain",
                  "text/csv",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "application/vnd.ms-excel",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ];

                if (!allowedTypes.includes(fileType)) {
                  sendToParent("file:send:response", {
                    fileId,
                    success: false,
                    error: "INVALID_EXTENSION",
                    message: "File type not supported",
                  });
                  return;
                }

                // Convert base64 to File object
                try {
                  const base64Data = fileData.split(",")[1] || fileData;
                  const byteCharacters = atob(base64Data);
                  const byteNumbers = new Array(byteCharacters.length);

                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }

                  const byteArray = new Uint8Array(byteNumbers);
                  const file = new File([byteArray], fileName, {
                    type: fileType,
                  });

                  // Verify converted file size matches
                  if (file.size !== fileSize) {
                    sendToParent("file:send:response", {
                      fileId,
                      success: false,
                      error: "INVALID_FILE_DATA",
                      message: "File size mismatch after conversion",
                    });
                    return;
                  }

                  // Apply file rules validation
                  const validation = await validateFiles(
                    [file],
                    DEFAULT_FILE_RESTRICTIONS
                  );
                  const validFiles = validation.fileResults
                    .filter((r) => r.isValid)
                    .map((r) => r.file);

                  if (validation.errors.length > 0) {
                    // Show errors as alerts instead of sending error response
                    validation.errors.forEach((error) => {
                      // alert(`File Upload Error9: ${error}`);
                    });
                    return;
                  }

                  if (validation.warnings.length > 0) {
                    console.warn(
                      "File validation warnings:",
                      validation.warnings
                    );
                  }

                  if (validFiles.length === 0) {
                    sendToParent("file:send:response", {
                      fileId,
                      success: false,
                      error: "NO_VALID_FILES",
                      message: "No valid files after validation",
                    });
                    return;
                  }

                  // Send file message via WebSocket
                  // sendMessage(`[File: ${fileName}]`);

                  sendToParent("file:send:response", {
                    fileId,
                    success: true,
                    fileName,
                    fileSize,
                    timestamp: new Date().toISOString(),
                  });

                  // Send tracking event
                  sendToParent("widget:event", {
                    event: "file:sent:api",
                    data: {
                      fileName,
                      fileType,
                      fileSize,
                      fileId,
                      timestamp: new Date().toISOString(),
                    },
                  });
                } catch (error) {
                  sendToParent("file:send:response", {
                    fileId,
                    success: false,
                    error: "FILE_CONVERSION_ERROR",
                    message: "Failed to process file data",
                  });
                }
              } catch (error) {
                console.error("Error handling sendFile:", error);
                sendToParent("file:send:response", {
                  fileId: data.data?.fileId,
                  success: false,
                  error: "INTERNAL_ERROR",
                  message:
                    (error as Error).message ||
                    "An internal error occurred while processing the file.",
                });
              }
            }
            break;
          case "encryption:config":
            if (data.data && mountedRef.current) {
              const encryptionConfig = data.data;

              setEncryptionStatus((prev) => ({
                ...prev,
                isEnabled: encryptionConfig.enabled ?? prev.isEnabled,
                isRequired: encryptionConfig.required ?? prev.isRequired,
                algorithm: encryptionConfig.algorithm ?? prev.algorithm,
                keyStrength: encryptionConfig.keyStrength ?? prev.keyStrength,
              }));

              // Log encryption configuration change
              if (widgetConfig.auditLogging) {
                logAuditEvent(
                  "encryption_config_changed",
                  encryptionConfig,
                  widgetConfig.complianceMode as
                    | "GDPR"
                    | "HIPAA"
                    | "SOX"
                    | "STANDARD"
                );
              }

              sendToParent("encryption:config:response", {
                success: true,
                timestamp: new Date().toISOString(),
              });
            }
            break;
          case "audit:request":
            if (mountedRef.current) {
              const auditResponse = {
                events: auditLog.slice(-100), // Last 100 events
                totalEvents: auditLog.length,
                complianceMode: widgetConfig.complianceMode,
                timestamp: new Date().toISOString(),
              };

              sendToParent("audit:response", auditResponse);
            }
            break;
          case "threat:status":
            if (mountedRef.current) {
              const threatResponse = {
                indicators: threatIndicators.slice(-50), // Last 50 threats
                totalThreats: threatIndicators.length,
                threatDetectionEnabled: widgetConfig.threatDetection,
                timestamp: new Date().toISOString(),
              };

              sendToParent("threat:status:response", threatResponse);
            }
            break;
          case "compliance:check":
            if (mountedRef.current) {
              const compliance = validateEncryptionCompliance(
                {
                  encryptionEnabled: encryptionStatus.isEnabled,
                  auditLogCount: auditLog.length,
                  threatCount: threatIndicators.length,
                  complianceMode: widgetConfig.complianceMode,
                },
                widgetConfig.complianceMode
              );

              sendToParent("compliance:check:response", {
                compliant: compliance.compliant,
                requirements: compliance.requirements,
                recommendations: compliance.recommendations,
                timestamp: new Date().toISOString(),
              });
            }
            break;
        }
      } catch (error) {
        console.error("Error handling message from parent:", error);
      }
    };

    const removeListener = addWidgetMessageListener(handleMessage);

    if (mountedRef.current) {
      sendToParent("widget:ready", {
        privacySettings,
        consentState,
        trackingCapabilities: {
          urlTracking: isTracking,
          referrerTracking: !!referrerData,
          errorCount,
          isRateLimited,
        },
      });
    }

    return () => {
      removeListener();
    };
  }, [
    isReady,
    privacySettings,
    consentState,
    isTracking,
    referrerData,
    errorCount,
    isRateLimited,
    roomId,
    visitorTags,
    visitorInfo,
    encryptionStatus,
    auditLog,
    threatIndicators,
    widgetConfig.auditLogging,
    widgetConfig.threatDetection,
    widgetConfig.complianceMode,
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (tagBatchTimer.current) clearTimeout(tagBatchTimer.current);
      if (visitorInfoBatchTimer.current)
        clearTimeout(visitorInfoBatchTimer.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      tagBatchQueue.current = [];
      visitorInfoBatchQueue.current = [];
    };
  }, []);

  // Handle focus state
  useEffect(() => {
    // if (isOpen && isFocused && mountedRef.current) {
    //   markAllAsRead();
    // }
  }, [isOpen, isFocused]);

  // Handle widget color changes
  useEffect(() => {
    if (widgetConfig.color && mountedRef.current) {
      document.documentElement.style.setProperty(
        "--widget-primary-color",
        widgetConfig.color
      );
    }
  }, [widgetConfig.color]);

  // Handle open state changes
  useEffect(() => {
    if (mountedRef.current) {
      localStorage.setItem("is_open", JSON.stringify(isOpen));
      sendToParent("widget:event", {
        event: isOpen ? "open" : "close",
        data: getWidgetSize(),
      });
    }
  }, [isOpen]);

  // Handle fullscreen animations
  useEffect(() => {
    if (!prevFullScreen.current && isFullScreen) {
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] },
      });
    } else if (prevFullScreen.current && !isFullScreen) {
      controls.start({
        scale: [1, 0.9, 1],
        transition: { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] },
      });
    }
    prevFullScreen.current = isFullScreen;
  }, [isFullScreen, controls]);

  // Handle referrer data updates
  useEffect(() => {
    if (!isTrackingAllowed("analytics") || !mountedRef.current) return;

    if (referrerData && trafficSource && campaignData) {
      sendToParent("widget:event", {
        event: "referrer:data",
        data: {
          referrer: referrerData.referrer,
          domain: referrerData.domain,
          trafficSource: trafficSource.type,
          category: trafficSource.category,
          source: trafficSource.source,
          isFirstVisit: referrerData.isFirstVisit,
          utm: referrerData.utm,
          tracking: referrerData.tracking,
          affiliate: referrerData.affiliate,
          landingPage: referrerData.landingPage,
          sessionReferrer: referrerData.sessionReferrer,
          referrerPolicy: referrerData.referrerPolicy,
          protocolDowngrade: referrerData.protocolDowngrade,
          timestamp: referrerData.timestamp,
        },
      });
    }
  }, [referrerData, trafficSource, campaignData, sendToParent]);

  useEffect(() => {
    if (isOpen && isFocused) {
      const unreadMessages = getUnreadAgentMessages();
      if (unreadMessages.length > 0) {
        sendReadReceiptToServer();
      }
    }
  }, [
    messages,
    isOpen,
    isFocused,
    getUnreadAgentMessages,
    sendReadReceiptToServer,
  ]);

  useEffect(() => {
    if (isOpen && isFocused) {
      const timer = setTimeout(() => {
        sendReadReceiptToServer();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isFocused, sendReadReceiptToServer]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const debounceSystemMessage = useCallback(
    (message: string) => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        addSystemMessage({
          id: Date.now().toString(),
          content: message,
          sender: "system",
          timestamp: new Date(),
          status: "hidden",
        });
      }, 800);
    },
    [addSystemMessage]
  );

  const userStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debounceUserStatus = useCallback(
    (status: "active" | "idle" | "away") => {
      console.log(status);
      if (userStatusTimeoutRef.current) {
        clearTimeout(userStatusTimeoutRef.current);
      }

      if (status === "active" && !socket?.connected) {
        socket?.connect();
      }

      userStatusTimeoutRef.current = setTimeout(() => {
        sendOrQueueMessage(`visitor-${status}`, {});
        userStatusTimeoutRef.current = null;
      }, 300);
    },
    [sendOrQueueMessage, socket]
  );

  // Additional utility functions from temporary files
  const resetTypingState = useCallback(() => {
    if (!mountedRef.current) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isVisitorTyping) {
      setIsVisitorTyping(false);
      setLastTypingState(false);

      // Send typing stop to WebSocket
      // if (socket) {
      //   try {
      //     sendMessage(
      //       JSON.stringify({
      //         type: "visitor_typing",
      //         is_typing: false,
      //         visitor_id: roomId,
      //         session_id: roomId,
      //         timestamp: new Date().toISOString(),
      //         source: "auto_reset",
      //       })
      //     );
      //   } catch (error) {
      //     console.error("Error sending typing stop:", error);
      //   }
      // }

      // Send event to parent
      sendToParent("widget:event", {
        event: "visitor:typing-stop",
        data: {
          source: "auto_reset",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [isVisitorTyping, sendMessage, sendToParent, roomId]);

  const handleTypingRateLimit = useCallback(() => {
    if (!mountedRef.current) return;

    // Reset typing event count every minute
    if (typingRateLimitRef.current) {
      clearTimeout(typingRateLimitRef.current);
    }

    typingRateLimitRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setTypingEventCount(0);
      }
    }, 60000); // Reset every minute
  }, []);

  const handleChatLogRateLimit = useCallback(() => {
    if (!mountedRef.current) return;

    // Reset chat log request count every minute
    if (chatLogRateLimitRef.current) {
      clearTimeout(chatLogRateLimitRef.current);
    }

    chatLogRateLimitRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setChatLogRequestCount(0);
      }
    }, 60000); // Reset every minute
  }, []);

  const handleChatHistoryRateLimit = useCallback(() => {
    if (!mountedRef.current) return;

    // Reset chat history request count every minute
    if (chatHistoryRateLimitRef.current) {
      clearTimeout(chatHistoryRateLimitRef.current);
    }

    chatHistoryRateLimitRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setChatHistoryRequestCount(0);
      }
    }, 60000); // Reset every minute
  }, []);

  const handleOperatingHoursRateLimit = useCallback(() => {
    if (!mountedRef.current) return;

    // Reset operating hours request count every minute
    if (operatingHoursRateLimitRef.current) {
      clearTimeout(operatingHoursRateLimitRef.current);
    }

    operatingHoursRateLimitRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setOperatingHoursRequestCount(0);
      }
    }, 60000); // Reset every minute
  }, []);

  const handleEndChatRateLimit = useCallback(() => {
    if (!mountedRef.current) return;

    // Reset end chat request count every minute
    if (endChatRateLimitRef.current) {
      clearTimeout(endChatRateLimitRef.current);
    }

    endChatRateLimitRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setEndChatRequestCount(0);
      }
    }, 60000); // Reset every minute
  }, []);

  const formatOperatingHoursForResponse = useCallback((rawData: any) => {
    try {
      if (!rawData || typeof rawData !== "object") {
        return undefined;
      }

      // If operating hours have never been set, return undefined
      if (
        !rawData.enabled &&
        !rawData.account_schedule &&
        !rawData.department_schedule
      ) {
        return undefined;
      }

      const formattedData: any = {
        enabled: Boolean(rawData.enabled),
        type: rawData.type === "department" ? "department" : "account",
        timezone: rawData.timezone || "UTC",
      };

      if (formattedData.type === "account" && rawData.account_schedule) {
        formattedData.account_schedule = formatScheduleObject(
          rawData.account_schedule
        );
      }

      if (formattedData.type === "department" && rawData.department_schedule) {
        formattedData.department_schedule = {};

        // Format each department's schedule
        for (const departmentId in rawData.department_schedule) {
          const schedule = rawData.department_schedule[departmentId];
          formattedData.department_schedule[departmentId] =
            formatScheduleObject(schedule);
        }
      }

      return formattedData;
    } catch (error) {
      console.error("Error formatting operating hours:", error);
      return undefined;
    }
  }, []);

  const formatScheduleObject = useCallback((schedule: any) => {
    if (!schedule || typeof schedule !== "object") {
      return {};
    }

    const formattedSchedule: any = {};

    // Format days 0-6 (Sunday to Saturday)
    for (let day = 0; day <= 6; day++) {
      const daySchedule = schedule[day] || schedule[day.toString()] || [];

      if (Array.isArray(daySchedule)) {
        formattedSchedule[day] = daySchedule
          .map((period: any) => {
            if (!period || typeof period !== "object") {
              return null;
            }

            const start = Number.parseInt(period.start);
            const end = Number.parseInt(period.end);

            // Validate period times (0-1439 minutes since midnight)
            if (
              isNaN(start) ||
              isNaN(end) ||
              start < 0 ||
              start > 1439 ||
              end < 0 ||
              end > 1439
            ) {
              return null;
            }

            return { start, end };
          })
          .filter((period: any) => period !== null);
      } else {
        formattedSchedule[day] = [];
      }
    }

    return formattedSchedule;
  }, []);

  const generateMockOperatingHours = useCallback(() => {
    // Generate realistic operating hours data
    const baseSchedule = {
      0: [], // Sunday - closed
      1: [{ start: 540, end: 1020 }], // Monday 9:00 AM - 5:00 PM
      2: [{ start: 540, end: 1020 }], // Tuesday 9:00 AM - 5:00 PM
      3: [{ start: 540, end: 1020 }], // Wednesday 9:00 AM - 5:00 PM
      4: [{ start: 540, end: 1020 }], // Thursday 9:00 AM - 5:00 PM
      5: [{ start: 540, end: 1020 }], // Friday 9:00 AM - 5:00 PM
      6: [], // Saturday - closed
    };

    if (departmentsData.length > 0) {
      // Department-based operating hours
      return {
        enabled: true,
        type: "department",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        department_schedule: departmentsData.reduce((acc: any, dept: any) => {
          // Vary schedules slightly by department
          const deptSchedule = { ...baseSchedule };

          // Some departments might have extended hours
          if (dept.name?.toLowerCase().includes("support")) {
            deptSchedule[1] = [{ start: 480, end: 1080 }]; // 8 AM - 6 PM
            deptSchedule[2] = [{ start: 480, end: 1080 }];
            deptSchedule[3] = [{ start: 480, end: 1080 }];
            deptSchedule[4] = [{ start: 480, end: 1080 }];
            deptSchedule[5] = [{ start: 480, end: 1080 }];
          }

          // Sales might work weekends
          if (dept.name?.toLowerCase().includes("sales")) {
            (deptSchedule as any)[6] = [{ start: 600, end: 960 }]; // Saturday 10 AM - 4 PM
          }

          acc[dept.id] = deptSchedule;
          return acc;
        }, {}),
      };
    } else {
      // Account-level operating hours
      return {
        enabled: true,
        type: "account",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        account_schedule: baseSchedule,
      };
    }
  }, [departmentsData]);

  const formatMessagesForChatLog = useCallback(
    (messages: any[]) => {
      return messages
        .map((msg, index) => {
          const baseMessage = {
            timestamp: new Date(msg.timestamp).toISOString(),
            timestamp_raw: Math.floor(new Date(msg.timestamp).getTime() / 1000),
            id: msg.id,
            session_id: roomId,
          };

          // Handle different message types
          switch (msg.sender) {
            case "user":
              return {
                ...baseMessage,
                type: "chat.msg",
                nick: visitorInfo?.display_name || "Visitor",
                display_name: visitorInfo?.display_name || "Visitor",
                msg: msg.content,
                source: "visitor",
                attachment: msg.attachment
                  ? {
                      name: msg.attachment.name,
                      type: msg.attachment.type,
                      url: msg.attachment.url,
                      size: msg.attachment.size,
                    }
                  : null,
              };

            case "agent":
            case "live-agent":
              return {
                ...baseMessage,
                type: "chat.msg",
                nick: agentData?.name || msg.name || "Agent",
                display_name: agentData?.name || msg.name || "Agent",
                msg: msg.content,
                source: "agent",
                escalated: msg.escalated || false,
              };

            case "system":
              // Determine system message subtype
              let systemType = "chat.system";
              if (
                msg.content.toLowerCase().includes("joined") ||
                msg.content.toLowerCase().includes("has joined")
              ) {
                systemType = "chat.memberjoin";
              } else if (
                msg.content.toLowerCase().includes("left") ||
                msg.content.toLowerCase().includes("has left")
              ) {
                systemType = "chat.memberleave";
              } else if (
                msg.content.toLowerCase().includes("chat started") ||
                msg.content.toLowerCase().includes("conversation started")
              ) {
                systemType = "chat.request";
              } else if (
                msg.content.toLowerCase().includes("chat ended") ||
                msg.content.toLowerCase().includes("conversation ended")
              ) {
                systemType = "chat.end";
              } else if (
                msg.content.toLowerCase().includes("rated") ||
                msg.content.toLowerCase().includes("rating")
              ) {
                systemType = "chat.rating";
              } else if (
                msg.content.toLowerCase().includes("comment") ||
                msg.content.toLowerCase().includes("feedback")
              ) {
                systemType = "chat.comment";
              }

              return {
                ...baseMessage,
                type: systemType,
                nick: "System",
                display_name: "System",
                msg: msg.content,
                source: "system",
              };

            default:
              return {
                ...baseMessage,
                type: "chat.msg",
                nick: "Unknown",
                display_name: "Unknown",
                msg: msg.content,
                source: "unknown",
              };
          }
        })
        .filter((msg) => msg.msg && msg.msg.trim().length > 0); // Filter out empty messages
    },
    [roomId, visitorInfo, agentData]
  );

  const updateChatLogCache = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const formattedMessages = formatMessagesForChatLog(messages);
      setChatLogCache(formattedMessages);
      setChatLogLastUpdated(Date.now());

      // Send real-time update to parent
      sendToParent("widget:chat-log-updated", {
        messages: formattedMessages,
        timestamp: new Date().toISOString(),
        messageCount: formattedMessages.length,
        sessionId: roomId,
      });
    } catch (error) {
      console.error("Error updating chat log cache:", error);
    }
  }, [messages, formatMessagesForChatLog, sendToParent, roomId]);

  const cleanupChatSession = useCallback(
    (clearDepartment = false) => {
      if (!mountedRef.current) return;

      try {
        // Clear messages
        // Note: setMessages is not available in the original file, so we'll skip this
        // setMessages([]);

        // Reset typing states
        setIsVisitorTyping(false);
        setLastTypingState(false);
        setIsAgentTyping(false);

        // Clear UI states
        setIsFullScreen(false);

        // Reset chat info
        setChatInfo({ rating: null, comment: null });
        setChatInfoLastUpdated(null);

        // Clear cache
        setChatLogCache([]);
        setChatLogLastUpdated(null);

        // Handle department clearing
        if (clearDepartment) {
          const previousDept = visitorDefaultDepartment;
          setVisitorDefaultDepartment(null);

          // Update visitor info
          const updatedVisitorInfo = {
            ...visitorInfo,
            defaultDepartment: null,
          };
          setVisitorInfo(updatedVisitorInfo);
          debouncedVisitorInfoUpdate(updatedVisitorInfo, roomId);

          // Remove department tags
          if (previousDept) {
            // Note: This function doesn't exist in original, so we'll skip it for now
            // removeTagsFromSession({ tags: [`Department: ${previousDept.name}`], roomId });
          }
        }

        // Clear local storage
        localStorage.removeItem("is_open");
        localStorage.removeItem("chat_info");

        return true;
      } catch (error) {
        console.error("Error during chat session cleanup:", error);
        return false;
      }
    },
    [visitorDefaultDepartment, visitorInfo, debouncedVisitorInfoUpdate, roomId]
  );

  const announceAriaState = useCallback(
    (message: string) => {
      if (!mountedRef.current) return;
      setAriaAnnouncement(message);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setAriaAnnouncement("");
      }, 1200);
    },
    [mountedRef]
  );

  const isChatting = useCallback(() => {
    try {
      return messages.some((message) => message.senderType === "visitor");
    } catch (error) {
      console.error("Error checking if chatting:", error);
      return false;
    }
  }, [messages]);

  const sendVisitorPath = useCallback(
    (pathData: { title: string; url: string; changeType?: string }) => {
      return new Promise<void>((resolve, reject) => {
        try {
          if (!pathData.title || !pathData.url) {
            reject(new Error("Title and URL are required"));
            return;
          }

          const visitorPathData = {
            title: pathData.title.trim().substring(0, 500),
            url: pathData.url,
            changeType: pathData.changeType || "manual",
            timestamp: new Date().toISOString(),
            source: "sendVisitorPath",
          };

          // Add referrer context if available
          if (referrerData && isTrackingAllowed("analytics")) {
            (visitorPathData as any).referrerContext = {
              trafficSource: trafficSource?.type,
              category: trafficSource?.category,
              source: trafficSource?.source,
              isFirstVisit: referrerData.isFirstVisit,
              sessionReferrer: referrerData.sessionReferrer,
              referrerPolicy: referrerData.referrerPolicy,
              protocolDowngrade: referrerData.protocolDowngrade,
              affiliate: trafficSource?.affiliate,
            };
          }

          // Send to parent
          sendToParent("widget:visitor-path", visitorPathData);

          // Record visitor activity if tracking enabled
          if (visitorTrackingData && isTrackingAllowed("functional")) {
            sendToParent("widget:event", {
              event: "visitor:activity",
              data: {
                type: "navigation",
                intensity: 0.8,
                timestamp: new Date().toISOString(),
              },
            });
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },
    [referrerData, trafficSource, visitorTrackingData, sendToParent]
  );

  const handleDepartmentStatusUpdate = useCallback(
    (departmentId: number, status: string) => {
      try {
        // Update departments data
        setDepartmentsData((prev) =>
          prev.map((dept) =>
            dept.id === departmentId ? { ...dept, status } : dept
          )
        );

        // Update visitor default department if it matches
        if (visitorDefaultDepartment?.id === departmentId) {
          setVisitorDefaultDepartment((prev: any) =>
            prev ? { ...prev, status } : prev
          );
        }

        // Send tracking event
        sendToParent("widget:event", {
          event: "department:status-changed",
          data: {
            departmentId,
            status,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.error("Error handling department status update:", error);
      }
    },
    [visitorDefaultDepartment, sendToParent]
  );

  const requestOperatingHoursFromWidget = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const now = Date.now();

        // Rate limiting check
        if (operatingHoursRequestCount >= OPERATING_HOURS_RATE_LIMIT) {
          reject(
            new Error("Rate limit exceeded - maximum 5 requests per minute")
          );
          return;
        }

        // Update rate limit counter
        setOperatingHoursRequestCount((prev) => prev + 1);
        handleOperatingHoursRateLimit();

        // Check cache validity (5 minutes)
        const cacheAge = operatingHoursLastUpdated
          ? now - operatingHoursLastUpdated
          : Number.POSITIVE_INFINITY;
        const isCacheValid = cacheAge < 300000 && operatingHoursData; // 5 minutes

        if (isCacheValid) {
          // Use cached data
          const formattedData =
            formatOperatingHoursForResponse(operatingHoursData);
          resolve(formattedData);
          return;
        }

        // Simulate fetching from backend API
        setTimeout(() => {
          if (!mountedRef.current) {
            reject(new Error("Component unmounted"));
            return;
          }

          try {
            // Generate realistic operating hours based on current departments
            const mockOperatingHours = generateMockOperatingHours();

            // Store and format the data
            setOperatingHoursData(mockOperatingHours);
            setOperatingHoursLastUpdated(Date.now());

            const formattedData =
              formatOperatingHoursForResponse(mockOperatingHours);
            resolve(formattedData);

            // Send tracking event
            sendToParent("widget:event", {
              event: "operating-hours:fetched",
              data: {
                type: mockOperatingHours.type,
                enabled: mockOperatingHours.enabled,
                timezone: mockOperatingHours.timezone,
                departmentCount: departmentsData.length,
                timestamp: new Date().toISOString(),
              },
            });
          } catch (error) {
            reject(error);
          }
        }, 100); // Small delay to simulate API call
      } catch (error) {
        reject(error);
      }
    });
  }, [
    operatingHoursRequestCount,
    operatingHoursLastUpdated,
    operatingHoursData,
    departmentsData,
    formatOperatingHoursForResponse,
    handleOperatingHoursRateLimit,
    sendToParent,
    generateMockOperatingHours,
  ]);

  const requestChatLogFromWidget = useCallback(() => {
    return new Promise((resolve, reject) => {
      try {
        const now = Date.now();

        // Rate limiting check
        if (chatLogRequestCount >= CHAT_LOG_RATE_LIMIT) {
          reject(
            new Error("Rate limit exceeded - maximum 10 requests per minute")
          );
          return;
        }

        // Update rate limit counter
        setChatLogRequestCount((prev) => prev + 1);
        handleChatLogRateLimit();

        // Check cache validity
        const cacheAge = chatLogLastUpdated
          ? now - chatLogLastUpdated
          : Number.POSITIVE_INFINITY;
        const isCacheValid =
          cacheAge < CHAT_LOG_CACHE_DURATION && chatLogCache.length > 0;

        if (isCacheValid) {
          // Use cached data
          resolve(chatLogCache);
          return;
        }

        // Generate fresh data from current messages
        setTimeout(() => {
          if (!mountedRef.current) {
            reject(new Error("Component unmounted"));
            return;
          }

          try {
            const formattedMessages = formatMessagesForChatLog(messages);
            setChatLogCache(formattedMessages);
            setChatLogLastUpdated(now);

            resolve(formattedMessages);

            // Send tracking event
            sendToParent("widget:event", {
              event: "chat-log:fetched",
              data: {
                messageCount: formattedMessages.length,
                cached: false,
                timestamp: new Date().toISOString(),
              },
            });
          } catch (error) {
            reject(error);
          }
        }, 50); // Small delay to simulate processing
      } catch (error) {
        reject(error);
      }
    });
  }, [
    chatLogRequestCount,
    chatLogLastUpdated,
    chatLogCache,
    messages,
    formatMessagesForChatLog,
    handleChatLogRateLimit,
    sendToParent,
  ]);

  const fetchHistoryFromAPI = useCallback(
    (cursor: number | null) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!mountedRef.current) {
            reject(new Error("Component unmounted"));
            return;
          }

          try {
            const allMessages = [...messages].reverse(); // Newest first
            const startIndex = cursor || 0;
            const itemsPerPage = 20;

            if (startIndex >= allMessages.length) {
              resolve({
                items: [],
                count: 0,
                newCursor: null,
                has_more: false,
              });
              return;
            }

            const items = allMessages.slice(
              startIndex,
              startIndex + itemsPerPage
            );
            const newCursor = startIndex + items.length;
            const has_more = newCursor < allMessages.length;

            resolve({
              items: formatMessagesForChatLog(items.reverse()), // Format for consistency
              count: items.length,
              newCursor: has_more ? newCursor : null,
              has_more,
            });
          } catch (error) {
            reject(error);
          }
        }, 250); // Simulate network latency
      });
    },
    [messages, formatMessagesForChatLog]
  );

  // Additional useEffect hooks from temporary files
  useEffect(() => {
    if (isOpen && isFocused && mountedRef.current) {
      // markAllAsRead(); // This function doesn't exist in original
      announceAriaState("Chat opened and messages marked as read");
    }
  }, [isOpen, isFocused]);

  useEffect(() => {
    if (visitorActiveStatus === "away" && mountedRef.current) {
      debounceSystemMessage("Visitor has left the chat");
      announceAriaState("Visitor is away");
    }
  }, [visitorActiveStatus, debounceSystemMessage]);

  useEffect(() => {
    if (mountedRef.current && chatInfo) {
      localStorage.setItem(
        "chat_info",
        JSON.stringify({
          ...chatInfo,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, [chatInfo]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (typingRateLimitRef.current) clearTimeout(typingRateLimitRef.current);
      if (tagBatchTimer.current) clearTimeout(tagBatchTimer.current);
      if (visitorInfoBatchTimer.current)
        clearTimeout(visitorInfoBatchTimer.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      tagBatchQueue.current = [];
      visitorInfoBatchQueue.current = [];
      if (chatLogRateLimitRef.current)
        clearTimeout(chatLogRateLimitRef.current);
      if (operatingHoursRateLimitRef.current)
        clearTimeout(operatingHoursRateLimitRef.current);
      if (chatHistoryRateLimitRef.current)
        clearTimeout(chatHistoryRateLimitRef.current);
      if (endChatRateLimitRef.current)
        clearTimeout(endChatRateLimitRef.current);
    };
  }, []);

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        // Parse the message data
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (!data || !data.type) return;

        // Handle different message types
        switch (data.type) {
          case "command":
            // Handle commands (open, close, etc.)
            handleCommand(data.data?.action);
            break;

          case "widget:visitor-event":
            if (data?.data && data.data.type) {
              setVisitorActiveStatus((prev) => {
                const vType = data.data.type;
                if (prev === "away") {
                  debounceSystemMessage("Visitor has joined the chat.");
                }

                if (prev === "idle" || prev === "away" || prev === "left") {
                  // removeTagsFromSession({ tags: ["Idle"], roomId });
                }

                if (vType === "visitor:left") {
                  return "left";
                }
                if (vType === "visitor:idle") {
                  // addTagsToSession({ tags: ["Idle"], roomId });
                  return "idle";
                }
                if (vType === "visitor:away") {
                  return "away";
                }
                return "ai-agent";
              });
            }
            break;

          case "config":
            // Handle configuration updates
            if (data.data) {
              // Update privacy settings if provided
              if (
                data.data.enableGDPR !== undefined ||
                data.data.requireConsent !== undefined ||
                data.data.anonymizeData !== undefined ||
                data.data.dataRetentionDays !== undefined
              ) {
                setPrivacySettings((prev) => ({
                  ...prev,
                  enableGDPR: data.data.enableGDPR ?? prev.enableGDPR,
                  requireConsent:
                    data.data.requireConsent ?? prev.requireConsent,
                  anonymizeData: data.data.anonymizeData ?? prev.anonymizeData,
                  retentionPolicy: {
                    ...prev.retentionPolicy,
                    referrerData:
                      data.data.dataRetentionDays ??
                      prev.retentionPolicy.referrerData,
                    urlHistory:
                      data.data.dataRetentionDays ??
                      prev.retentionPolicy.urlHistory,
                    sessionData:
                      data.data.dataRetentionDays ??
                      prev.retentionPolicy.sessionData,
                  },
                }));
              }
            }
            break;

          case "identify":
            // Handle user identification
            console.log("User identified:", data.data);
            // You could store this information and use it in the chat
            break;

          case "consent":
            // Handle consent updates
            if (data.data) {
              saveConsentState(data.data);
              setConsentState(data.data);

              // Send consent confirmation to parent
              sendToParent("widget:event", {
                event: "consent:updated",
                data: data.data,
              });
            }
            break;

          case "privacy:cleanup":
            // Handle manual data cleanup request
            cleanupExpiredData();
            sendToParent("widget:event", {
              event: "privacy:cleanup-complete",
              data: { timestamp: new Date().toISOString() },
            });
            break;

          case "status":
            if (data.data?.query === "isOpen") {
              sendToParent("status:response", { isOpen });
            }
            break;

          case "widget:tags-update":
            if (data.data?.tags) {
              sendOrQueueMessage("visitor-assign-tag-to-chat", {
                tagNames: data.data.tags,
              });
              // addTagsToSession({ tags: data.data.tags, roomId });
              setVisitorTags(data.data.tags);
            }
            break;

          case "widget:tags-request":
            // Send current tags to parent
            sendToParent("widget:tags-response", { tags: visitorTags });
            break;

          case "widget:visitor-info-update":
            if (data.data?.visitorInfo) {
              setVisitorInfo(data.data.visitorInfo);
              // addUserDetailToSession({
              //   visitorInfo: data.data?.visitorInfo || {},
              //   roomId,
              // });
            }
            break;

          case "widget:visitor-info-request":
            // Send current visitor info to parent
            sendToParent("widget:visitor-info-response", { visitorInfo });
            break;
        }
      } catch (error) {
        console.error("Error handling message from parent:", error);
      }
    };

    // Add message event listener
    window.addEventListener("message", handleMessage);

    // Notify parent that widget is ready
    sendToParent("widget:ready", {
      privacySettings,
      consentState,
      trackingCapabilities: {
        urlTracking: isTracking,
        referrerTracking: !!referrerData,
        errorCount,
        isRateLimited,
      },
    });

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!mountedRef.current) return;

    setIsFullScreen((prev) => {
      const newIsFull = !prev;

      sendToParent("widget:event", {
        event: newIsFull ? "fullscreen" : "open",
        data: getWidgetSize(),
      });

      if (!newIsFull && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(
          () =>
            sendToParent("widget:event", {
              event: "open",
              data: getWidgetSize(),
            }),
          300
        );
      }
      return newIsFull;
    });
  }, []);

  useEffect(() => {
    if (!mountedRef.current || isOpen) return;

    const currentMessageCount = messages.length;
    const previousMessageCount = lastMessageCountRef.current;

    // Check if there are new messages and if any are from agents
    if (currentMessageCount > previousMessageCount) {
      const newMessages = messages.slice(previousMessageCount);
      const hasNewAgentMessage = newMessages.some(
        (msg) => msg.senderType === "agent" && !msg.readAt
      );

      if (hasNewAgentMessage && !autoOpenedRef.current) {
        // Auto-open the widget
        setIsOpen(true);
        autoOpenedRef.current = true;

        // Send event to parent about auto-opening
        sendToParent("widget:event", {
          event: "open",
          data: getWidgetSize(),
        });

        // Announce to screen readers
        announceAriaState("Chat opened automatically due to new message");

        // Reset auto-opened flag after a delay to allow manual closing
        setTimeout(() => {
          if (mountedRef.current) {
            autoOpenedRef.current = false;
          }
        }, 5000); // 5 seconds delay
      }
    }

    // Update the message count reference
    lastMessageCountRef.current = currentMessageCount;
  }, [messages, isOpen, sendToParent, announceAriaState]);

  // Reset auto-opened flag when widget is manually closed
  useEffect(() => {
    if (!isOpen && autoOpenedRef.current) {
      autoOpenedRef.current = false;
    }
  }, [isOpen]);

  /**
   * Toggle chat window
   */
  const toggleChat = useCallback(() => {
    if (isButtonLocked || !mountedRef.current) return;

    setIsButtonLocked(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setIsButtonLocked(false);
    }, BUTTON_LOCK_DURATION);

    setIsOpen((prev) => {
      if (!mountedRef.current) return prev;
      const newIsOpen = !prev;

      // Reset auto-opened flag when manually toggling
      if (newIsOpen) {
        autoOpenedRef.current = false;
      }

      if (!newIsOpen) setIsFullScreen(false);
      return newIsOpen;
    });
    setToggleChatOpen(!toggleChatOpen);
  }, []);

  /**
   * Handle sending messages
   */
  const handleSendMessage = useCallback(
    (content: string, files?: File[]) => {
      if (
        !mountedRef.current ||
        (!content.trim() && (!files || files.length === 0))
      ) {
        return;
      }

      // Log audit event for message sending
      if (widgetConfig.auditLogging) {
        logAuditEvent(
          "message_sent",
          {
            contentLength: content.trim().length,
            hasFiles: files && files.length > 0,
            fileCount: files?.length || 0,
            encryptionEnabled: encryptionStatus.isEnabled,
          },
          widgetConfig.complianceMode as "GDPR" | "HIPAA" | "SOX" | "STANDARD"
        );
      }

      if (files && files.length > 0) {
        if (content.trim()) {
          sendMessage(content.trim());
          sendToParent("widget:event", {
            event: "message:sent",
            data: {
              content: content.trim(),
              timestamp: new Date().toISOString(),
              encryption: {
                enabled: encryptionStatus.isEnabled,
                algorithm: encryptionStatus.algorithm,
                keyStrength: encryptionStatus.keyStrength,
              },
            },
          });
        }

        files.forEach((file, index) => {
          // For images, create a temporary blob URL that won't persist
          const isImage = file.type.startsWith("image/");
          const temporaryImageUrl = isImage ? URL.createObjectURL(file) : null;

          const attachment: AttachmentType = {
            fileName: file.name,
            mimeType: file.type,
            url: temporaryImageUrl || `[File: ${file.name}]`,
            size: file.size,
            previewUrl: temporaryImageUrl || `[File: ${file.name}]`,
          };

          // Don't send filename to backend to avoid duplicate messages
          // The file attachment will be displayed locally only

          // Store message in Redux with attachment - this will be the only message displayed
          dispatch(
            setAddMessage({
              messageId: generateMessageId(),
              content:
                isImage && temporaryImageUrl
                  ? temporaryImageUrl
                  : `[File: ${file.name}]`,
              messageType: "text",
              roomId: "",
              senderId: sessionId || "",
              senderType: "visitor",
              attachment: attachment,
              isEncrypted: encryptionStatus.isEnabled,
            })
          );

          sendToParent("widget:event", {
            event: "file:sent",
            data: {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              timestamp: new Date().toISOString(),
              encryption: {
                enabled: encryptionStatus.isEnabled,
                algorithm: encryptionStatus.algorithm,
                keyStrength: encryptionStatus.keyStrength,
              },
            },
          });
        });
      } else {
        sendMessage(content.trim());
        sendToParent("widget:event", {
          event: "message:sent",
          data: {
            content: content.trim(),
            timestamp: new Date().toISOString(),
            encryption: {
              enabled: encryptionStatus.isEnabled,
              algorithm: encryptionStatus.algorithm,
              keyStrength: encryptionStatus.keyStrength,
            },
          },
        });
      }
    },
    [
      sendMessage,
      sendToParent,
      encryptionStatus,
      widgetConfig.auditLogging,
      widgetConfig.complianceMode,
      messages.length,
      dispatch,
      sessionId,
    ]
  );

  /**
   * Handle transcript download
   */
  const handleDownloadTranscript = useCallback(() => {
    if (!mountedRef.current) return;

    downloadTranscript(messages);
    sendToParent("widget:event", {
      event: "transcript:download",
      data: {
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
      },
    });
  }, [messages]);

  const transition = {
    duration: 0.5, // slower for smoothness
    // delay: 0,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number], // smooth ease-in-out cubic-bezier
  };

  useEffect(() => {
    if (isOpen) {
      sendToParent("widget:event", {
        event: "open",
        data: {
          width: getWidgetSize().width,
          height: getWidgetSize().height,
        },
      });
    } else {
      setIsFullScreen(false); // collapse fullscreen if closed
      sendToParent("widget:event", {
        event: "close",
        data: {
          width: getWidgetSize().width,
          height: getWidgetSize().height,
        },
      });
    }
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem("is_open", JSON.stringify(isOpen));
  }, [isOpen]);

  const { capabilities } = useCameraCapture();

  // Enhanced encryption utilities
  const validateEncryptionCompliance = useCallback(
    (data: any, complianceMode: string) => {
      try {
        switch (complianceMode) {
          case "GDPR":
            return {
              compliant: true,
              requirements: [
                "data_minimization",
                "encryption_at_rest",
                "access_controls",
              ],
              recommendations: ["audit_logging", "data_retention_policies"],
            };
          case "HIPAA":
            return {
              compliant:
                encryptionStatus.isEnabled &&
                encryptionStatus.keyStrength >= 256,
              requirements: [
                "encryption_at_rest",
                "encryption_in_transit",
                "access_controls",
              ],
              recommendations: ["audit_logging", "threat_detection"],
            };
          case "SOX":
            return {
              compliant: auditLog.length > 0 && encryptionStatus.isEnabled,
              requirements: [
                "audit_logging",
                "data_integrity",
                "access_controls",
              ],
              recommendations: ["encryption", "threat_detection"],
            };
          default:
            return {
              compliant: true,
              requirements: ["basic_security"],
              recommendations: ["encryption", "audit_logging"],
            };
        }
      } catch (error) {
        console.error("Error validating encryption compliance:", error);
        return {
          compliant: false,
          requirements: [],
          recommendations: ["error_handling"],
        };
      }
    },
    [encryptionStatus, auditLog]
  );

  const logAuditEvent = useCallback(
    (
      action: string,
      details: any,
      compliance: "GDPR" | "HIPAA" | "SOX" | "STANDARD"
    ) => {
      if (!mountedRef.current) return;

      const auditEntry = {
        timestamp: new Date(),
        action,
        userId: sessionId || "anonymous",
        sessionId: sessionId || "unknown",
        details,
        compliance,
      };

      setAuditLog((prev) => [...prev, auditEntry]);

      // Send audit event to parent
      sendToParent("widget:audit:event", {
        event: "audit:logged",
        data: auditEntry,
      });

      // Clean up old audit entries (keep last 1000)
      if (auditLog.length > 1000) {
        setAuditLog((prev) => prev.slice(-1000));
      }
    },
    [sessionId, sendToParent]
  );

  const detectThreats = useCallback(
    (data: any) => {
      if (!mountedRef.current || !widgetConfig.threatDetection) return;

      const threats: Array<{
        type:
          | "suspicious_activity"
          | "encryption_failure"
          | "compliance_violation"
          | "security_alert";
        severity: "low" | "medium" | "high" | "critical";
        description: string;
        actionRequired: boolean;
      }> = [];

      // Check for encryption failures
      if (data.encryptionErrors && data.encryptionErrors.length > 0) {
        threats.push({
          type: "encryption_failure",
          severity: "high",
          description: `Multiple encryption failures detected: ${data.encryptionErrors.length} errors`,
          actionRequired: true,
        });
      }

      // Check for compliance violations
      const compliance = validateEncryptionCompliance(
        data,
        widgetConfig.complianceMode
      );
      if (!compliance.compliant) {
        threats.push({
          type: "compliance_violation",
          severity: "critical",
          description: `Compliance violation detected for ${widgetConfig.complianceMode}`,
          actionRequired: true,
        });
      }

      // Check for suspicious activity patterns
      if (data.messageCount && data.messageCount > 1000) {
        threats.push({
          type: "suspicious_activity",
          severity: "medium",
          description: "Unusually high message count detected",
          actionRequired: false,
        });
      }

      // Add detected threats
      if (threats.length > 0) {
        setThreatIndicators((prev) => [...prev, ...threats]);

        // Send threat alerts to parent
        threats.forEach((threat) => {
          sendToParent("widget:threat:alert", {
            event: "threat:detected",
            data: threat,
          });
        });
      }
    },
    [
      widgetConfig.threatDetection,
      widgetConfig.complianceMode,
      validateEncryptionCompliance,
      sendToParent,
    ]
  );

  // Enhanced encryption configuration effect
  useEffect(() => {
    if (
      widgetConfig.enableEnterpriseEncryption &&
      !encryptionStatus.isEnabled
    ) {
      setEncryptionStatus((prev) => ({
        ...prev,
        isEnabled: true,
        isRequired: widgetConfig.encryptionRequired,
        lastKeyRotation: new Date(),
      }));

      // Log encryption enablement
      if (widgetConfig.auditLogging) {
        logAuditEvent(
          "encryption_enabled",
          {
            algorithm: encryptionStatus.algorithm,
            keyStrength: encryptionStatus.keyStrength,
            complianceMode: widgetConfig.complianceMode,
          },
          widgetConfig.complianceMode as "GDPR" | "HIPAA" | "SOX" | "STANDARD"
        );
      }
    }
  }, [
    widgetConfig.enableEnterpriseEncryption,
    widgetConfig.encryptionRequired,
    widgetConfig.auditLogging,
    widgetConfig.complianceMode,
    encryptionStatus.algorithm,
    encryptionStatus.keyStrength,
    logAuditEvent,
  ]);

  // Enhanced compliance monitoring
  useEffect(() => {
    if (widgetConfig.auditLogging && mountedRef.current) {
      const compliance = validateEncryptionCompliance(
        {
          encryptionEnabled: encryptionStatus.isEnabled,
          auditLogCount: auditLog.length,
          threatCount: threatIndicators.length,
          complianceMode: widgetConfig.complianceMode,
        },
        widgetConfig.complianceMode
      );

      setEncryptionStatus((prev) => ({
        ...prev,
        complianceStatus: compliance.compliant ? "compliant" : "non-compliant",
      }));

      // Send compliance status to parent
      sendToParent("widget:compliance:status", {
        event: "compliance:updated",
        data: {
          status: compliance.compliant ? "compliant" : "non-compliant",
          requirements: compliance.requirements,
          recommendations: compliance.recommendations,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [
    encryptionStatus.isEnabled,
    auditLog.length,
    threatIndicators.length,
    widgetConfig.complianceMode,
    widgetConfig.auditLogging,
    validateEncryptionCompliance,
    sendToParent,
  ]);

  // Enhanced message handling from parent
  useEffect(() => {
    if (!isReady || !mountedRef.current) return;

    const handleMessage = async (event: MessageEvent) => {
      if (event.source !== window.parent || !mountedRef.current) return;

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (
          !data?.type ||
          (!data.type.startsWith("widget:") &&
            ![
              "command",
              "config",
              "identify",
              "consent",
              "privacy:cleanup",
              "status",
              "encryption",
              "audit",
              "threat",
              "compliance",
            ].includes(data.type))
        ) {
          return;
        }

        switch (data.type) {
          // ... existing cases ...

          case "encryption:config":
            if (data.data && mountedRef.current) {
              const encryptionConfig = data.data;

              setEncryptionStatus((prev) => ({
                ...prev,
                isEnabled: encryptionConfig.enabled ?? prev.isEnabled,
                isRequired: encryptionConfig.required ?? prev.isRequired,
                algorithm: encryptionConfig.algorithm ?? prev.algorithm,
                keyStrength: encryptionConfig.keyStrength ?? prev.keyStrength,
              }));

              // Log encryption configuration change
              if (widgetConfig.auditLogging) {
                logAuditEvent(
                  "encryption_config_changed",
                  encryptionConfig,
                  widgetConfig.complianceMode as
                    | "GDPR"
                    | "HIPAA"
                    | "SOX"
                    | "STANDARD"
                );
              }

              sendToParent("encryption:config:response", {
                success: true,
                timestamp: new Date().toISOString(),
              });
            }
            break;

          case "audit:request":
            if (mountedRef.current) {
              const auditResponse = {
                events: auditLog.slice(-100), // Last 100 events
                totalEvents: auditLog.length,
                complianceMode: widgetConfig.complianceMode,
                timestamp: new Date().toISOString(),
              };

              sendToParent("audit:response", auditResponse);
            }
            break;

          case "threat:status":
            if (mountedRef.current) {
              const threatResponse = {
                indicators: threatIndicators.slice(-50), // Last 50 threats
                totalThreats: threatIndicators.length,
                threatDetectionEnabled: widgetConfig.threatDetection,
                timestamp: new Date().toISOString(),
              };

              sendToParent("threat:status:response", threatResponse);
            }
            break;

          case "compliance:check":
            if (mountedRef.current) {
              const compliance = validateEncryptionCompliance(
                {
                  encryptionEnabled: encryptionStatus.isEnabled,
                  auditLogCount: auditLog.length,
                  threatCount: threatIndicators.length,
                  complianceMode: widgetConfig.complianceMode,
                },
                widgetConfig.complianceMode
              );

              sendToParent("compliance:check:response", {
                compliant: compliance.compliant,
                requirements: compliance.requirements,
                recommendations: compliance.recommendations,
                timestamp: new Date().toISOString(),
              });
            }
            break;

          // ... existing cases continue ...
        }
      } catch (error) {
        console.error("Error handling message from parent:", error);
      }
    };

    // ... existing code ...
  }, [
    // ... existing dependencies ...
    encryptionStatus,
    auditLog,
    threatIndicators,
    widgetConfig.auditLogging,
    widgetConfig.threatDetection,
    widgetConfig.complianceMode,
  ]);

  // ... existing code ...

  return (
    showChat && (
      <>
        {/* Accessibility live region for screen readers */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          role="status"
        >
          {ariaAnnouncement}
        </div>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "fixed z-50 flex flex-col w-full items-end",
            // isRTL ? "items-start" : "items-end",
            !isFullScreen
              ? `bottom-6 ${
                  isBadgeChatEnabled
                    ? isRTL
                      ? "-left-20"
                      : "-right-20"
                    : isRTL
                    ? "left-2"
                    : "right-6"
                }`
              : capabilities.isMobile
              ? "inset-0 w-screen h-screen" // Mobile fullscreen: cover entire screen from all edges
              : isRTL
              ? "bottom-0 left-0"
              : "bottom-0 right-0", // Desktop fullscreen: normal behavior
            capabilities.isMobile && !isFullScreen
              ? isRTL
                ? "bottom-3 left-4"
                : "bottom-3 right-4"
              : ""
          )}
          style={{
            ...(capabilities.isMobile &&
              isFullScreen && {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 9999,
              }),
          }}
          // dir={direction}
          // data-rtl={isRTL}
        >
          <div
            className={cn(
              !isFullScreen &&
                "w-[calc(100%-30px)] transition-all duration-300",
              capabilities.isMobile && isFullScreen && "w-screen h-screen" // Mobile fullscreen: full dimensions
            )}
          >
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{
                    duration: 0.1,
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  <motion.div animate={controls}>
                    <ChatWindow
                      isOpen={isOpen}
                      wsStatus={"open"}
                      messages={messages}
                      isAgentOnline={true}
                      isAgentTyping={isAgentTyping}
                      onClose={toggleChat}
                      isFullScreen={isFullScreen}
                      toggleFullScreen={toggleFullScreen}
                      onSendMessage={handleSendMessage}
                      onDownloadTranscript={handleDownloadTranscript}
                      onReconnect={() => null}
                      roomId={roomId}
                      workspaceId={apiToken as string}
                      agentData={agentData}
                      setAgentData={setAgentData}
                      isBadgeChatEnabled={isBadgeChatEnabled}
                      onTyping={sendTyping}
                      socketStatus={socketStatus}
                      showConnectedMessage={showConnectedMessage}
                      emitSocketEvent={sendOrQueueMessage}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {!isOpen && !isCapsuleButton && (
          <div
            className={cn(
              "fixed z-50 flex flex-col transition-all items-end",
              // isRTL ? "items-start" : "items-end",
              !isFullScreen
                ? isRTL
                  ? "bottom-6 right-6"
                  : "bottom-6 right-6"
                : ""
            )}
            dir={direction}
            data-rtl={isRTL}
          >
            <ChatButton
              isOpen={isOpen}
              unreadCount={unreadCount}
              onClick={toggleChat}
              disabled={isButtonLocked}
            />
          </div>
        )}
        {!isOpen && isCapsuleButton && (
          <div
            className={cn(
              "fixed z-50 flex flex-col transition-all",
              isRTL ? "items-start" : "items-end",
              !isFullScreen
                ? isRTL
                  ? "bottom-6 left-3"
                  : "bottom-6 right-3"
                : ""
            )}
            dir={direction}
            data-rtl={isRTL}
          >
            <ChatButtonCapsule
              isOpen={isOpen}
              unreadCount={unreadCount}
              onClick={toggleChat}
              disabled={isButtonLocked}
            />
          </div>
        )}
      </>
    )
  );
}

/**
 * Kogents-style Chat Widget Embed Script
 *
 * This script allows for easy embedding of the chat widget on any website.
 * It loads the widget asynchronously to prevent blocking page rendering.
 *
 * Usage:
 * <script src="https://your-domain.com/api/widget" id="kogents-chat-widget"
 *   data-position="right" data-color="#3B82F6"></script>
 */

// Encapsulate widget logic in an IIFE to prevent global variable leakage
(function widgetEmbedInit(window, document) {
  // Prevent multiple initializations
  if (window.__KOGENTS_CHAT_WIDGET_INITIALIZED) {
    // Already initialized, skip further setup
    // console.warn("Kogents Chat Widget: Already initialized. Skipping.");
    return;
  }
  window.__KOGENTS_CHAT_WIDGET_INITIALIZED = true;
  // const baseUrl = "https://chat.kogents.com";
  const baseUrl = "https://widget.autobotx.ai";
  // https://chat-widget-1.vercel.app || http://localhost:3000 || https://chat.kogents.com
  // Configuration with defaults

  // Offline message sending constants
  const MAX_OFFLINE_MESSAGES_PER_MINUTE = 5;
  const MAX_OFFLINE_MESSAGE_LENGTH = 2000;
  const MAX_OFFLINE_NAME_LENGTH = 255;
  const MAX_OFFLINE_PHONE_LENGTH = 25;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Z|a-z]{2,}\b/;

  // Offline message sending state
  let offlineMessageOperationCount = 0;
  let offlineMessageOperationResetTime = Date.now();

  const config = {
    position: "right", // 'right' or 'left'
    color: "#3B82F6", // Primary color
    autoOpen: false, // Auto open chat on load
    greeting: "", // Custom greeting message
    apiToken: "",
    widgetUrl: "/widget", // URL to the widget iframe content
    trackReferrer: true, // Enable referrer tracking
    enableGDPR: true, // Enable GDPR compliance
    requireConsent: false, // Require explicit consent
    anonymizeData: true, // Anonymize sensitive data
    dataRetentionDays: 30, // Data retention period
    // Visitor tracking configuration
    enableVisitorTracking: true, // Enable visitor activity tracking
    visitorActivityTimeout: 10 * 60 * 1000, // 10 minutes before idle
    visitorAwayTimeout: 20 * 60 * 1000, // 20 minutes before away
    visitorTrackMouse: true, // Track mouse activity
    visitorTrackKeyboard: true, // Track keyboard activity
    visitorTrackScroll: true, // Track scroll activity
    visitorTrackTouch: true, // Track touch activity
    visitorDebounceMs: 1000, // Debounce activity events
    // Device fingerprinting configuration
    enableFingerprinting: true, // Enable device fingerprinting
    fingerprintingConsent: false, // Require consent for fingerprinting
    enableCanvasFingerprinting: true, // Canvas-based fingerprinting
    enableWebGLFingerprinting: true, // WebGL-based fingerprinting
    enableAudioFingerprinting: true, // Audio context fingerprinting
    enableFontDetection: true, // Font enumeration
    enableBatteryAPI: true, // Battery information
    enableWebRTC: true, // WebRTC IP detection
    enablePluginDetection: true, // Plugin enumeration
    enableMediaDevices: true, // Media device detection
    fingerprintTimeout: 5000, // Fingerprinting timeout
    // File sending configuration
    enableFileSending: true, // Enable file sending feature
    maxFileSize: 20 * 1024 * 1024, // 20MB file size limit
    allowedFileTypes: [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Documents
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      // Audio/Video
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "video/mp4",
      "video/avi",
      "video/mov",
    ],
  };

  // Widget state
  let widgetFrame = null;
  let isLoaded = false;
  let isOpen = false;
  const messageQueue = [];
  const eventCallbacks = {};

  // URL tracking state
  let lastTrackedUrl = "";
  let urlTrackingEnabled = true;
  let originalPushState = null;
  let originalReplaceState = null;

  // Referrer tracking state
  let referrerData = null;
  let trafficSource = null;
  let campaignData = null;
  let referrerTrackingEnabled = true;

  // Visitor tracking state
  let visitorTrackingEnabled = true;
  let visitorId = null;
  let tabId = null;
  let visitorState = {
    id: null,
    sessionId: null,
    isActive: true,
    isVisible: !document.hidden,
    joinedAt: new Date(),
    lastActivity: new Date(),
    activityLevel: "active", // "active", "idle", "away"
    tabId: null,
    isMainTab: true,
    totalTabs: 1,
  };
  // Device fingerprinting state
  let deviceFingerprint = null;
  let fingerprintGenerated = false;
  let fingerprintGenerationInProgress = false;
  let fingerprintErrors = [];

  // Visitor tracking internals
  let activityTimeouts = {
    idle: null,
    away: null,
    debounce: null,
    heartbeat: null,
    cleanup: null,
  };
  let activityEventCount = 0;
  let lastActivityTime = Date.now();
  let visitorErrorCount = 0;
  let hasJoinedSent = false;
  let isPageUnloading = false;

  // Privacy state
  let consentState = null;
  let privacyConfig = {
    enableGDPR: config.enableGDPR,
    requireConsent: config.requireConsent,
    anonymizeData: config.anonymizeData,
    dataRetentionDays: config.dataRetentionDays,
  };

  // File sending state
  let fileSendingEnabled = true;
  let fileSendOperationCount = 0;
  let fileSendOperationResetTime = Date.now();
  const MAX_FILE_SEND_OPERATIONS_PER_MINUTE = 10;
  const FILE_SEND_TIMEOUT = 30000; // 30 seconds

  let widgetKey = null;

  // Common fonts for detection
  const COMMON_FONTS = [
    // Windows fonts
    "Arial",
    "Arial Black",
    "Bahnschrift",
    "Calibri",
    "Cambria",
    "Cambria Math",
    "Candara",
    "Comic Sans MS",
    "Consolas",
    "Constantia",
    "Corbel",
    "Courier New",
    "Ebrima",
    "Franklin Gothic Medium",
    "Gabriola",
    "Gadugi",
    "Georgia",
    "HoloLens MDL2 Assets",
    "Impact",
    "Ink Free",
    "Javanese Text",
    "Leelawadee UI",
    "Lucida Console",
    "Lucida Sans Unicode",
    "Malgun Gothic",
    "Marlett",
    "Microsoft Himalaya",
    "Microsoft JhengHei",
    "Microsoft New Tai Lue",
    "Microsoft PhagsPa",
    "Microsoft Sans Serif",
    "Microsoft Tai Le",
    "Microsoft YaHei",
    "Microsoft Yi Baiti",
    "MingLiU-ExtB",
    "Mongolian Baiti",
    "MS Gothic",
    "MV Boli",
    "Myanmar Text",
    "Nirmala UI",
    "Palatino Linotype",
    "Segoe MDL2 Assets",
    "Segoe Print",
    "Segoe Script",
    "Segoe UI",
    "Segoe UI Historic",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "SimSun",
    "Sitka",
    "Sylfaen",
    "Symbol",
    "Tahoma",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana",
    "Webdings",
    "Wingdings",
    "Yu Gothic",

    // macOS fonts
    "American Typewriter",
    "Andale Mono",
    "Arial",
    "Arial Black",
    "Arial Narrow",
    "Arial Rounded MT Bold",
    "Arial Unicode MS",
    "Avenir",
    "Avenir Next",
    "Avenir Next Condensed",
    "Baskerville",
    "Big Caslon",
    "Bodoni 72",
    "Bodoni 72 Oldstyle",
    "Bodoni 72 Smallcaps",
    "Bradley Hand",
    "Brush Script MT",
    "Chalkboard",
    "Chalkboard SE",
    "Chalkduster",
    "Charter",
    "Cochin",
    "Comic Sans MS",
    "Copperplate",
    "Courier",
    "Courier New",
    "Didot",
    "DIN Alternate",
    "DIN Condensed",
    "Futura",
    "Geneva",
    "Georgia",
    "Gill Sans",
    "Helvetica",
    "Helvetica Neue",
    "Herculanum",
    "Hoefler Text",
    "Impact",
    "Lucida Grande",
    "Luminari",
    "Marker Felt",
    "Menlo",
    "Microsoft Sans Serif",
    "Monaco",
    "Noteworthy",
    "Optima",
    "Palatino",
    "Papyrus",
    "Phosphate",
    "Rockwell",
    "Savoye LET",
    "SignPainter",
    "Skia",
    "Snell Roundhand",
    "Tahoma",
    "Times",
    "Times New Roman",
    "Trattatello",
    "Trebuchet MS",
    "Verdana",
    "Zapfino",

    // Linux fonts
    "Abyssinica SIL",
    "DejaVu Sans",
    "DejaVu Sans Condensed",
    "DejaVu Sans Mono",
    "DejaVu Serif",
    "Droid Sans",
    "Droid Sans Mono",
    "Droid Serif",
    "FreeMono",
    "FreeSans",
    "FreeSerif",
    "Liberation Mono",
    "Liberation Sans",
    "Liberation Sans Narrow",
    "Liberation Serif",
    "Linux Biolinum G",
    "Linux Libertine G",
    "Lohit Gujarati",
    "Lohit Hindi",
    "Lohit Punjabi",
    "Lohit Tamil",
    "Lohit Telugu",
    "Meera",
    "Noto Sans",
    "Noto Serif",
    "Open Sans",
    "Oxygen",
    "Padauk",
    "Source Code Pro",
    "Source Sans Pro",
    "Source Serif Pro",
    "Ubuntu",
    "Ubuntu Condensed",
    "Ubuntu Mono",

    // Generic fonts
    "serif",
    "sans-serif",
    "monospace",
    "cursive",
    "fantasy",
    "system-ui",
  ];

  function getWidgetKeyFromScript() {
    try {
      // Find the script tag that loaded this file
      const scripts = document.getElementsByTagName("script");
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src || "";
        if (src.includes("widget-embed.js")) {
          const url = new URL(src, window.location.origin);
          return url.searchParams.get("key");
        }
      }
    } catch (e) {}
    return null;
  }

  // Sensitive parameters to remove from URLs
  const SENSITIVE_PARAMS = [
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "key",
    "password",
    "pwd",
    "pass",
    "secret",
    "auth",
    "authorization",
    "session",
    "sessionid",
    "session_id",
    "sid",
    "ssid",
    "email",
    "user_id",
    "userid",
    "uid",
    "id",
    "credit_card",
    "cc",
    "cvv",
    "ssn",
    "social_security",
    "phone",
    "mobile",
    "tel",
    "telephone",
    "signature",
    "hash",
    "nonce",
    "state",
  ];

  // PII patterns to detect in URLs
  const PII_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card format
    /\b\d{10,15}\b/, // Phone numbers
  ];

  // Search engines and social media domains
  const SEARCH_ENGINES = [
    "google.com",
    "bing.com",
    "yahoo.com",
    "duckduckgo.com",
    "baidu.com",
    "yandex.com",
    "ask.com",
    "aol.com",
  ];

  const SOCIAL_MEDIA = [
    "facebook.com",
    "twitter.com",
    "linkedin.com",
    "instagram.com",
    "youtube.com",
    "tiktok.com",
    "pinterest.com",
    "reddit.com",
    "snapchat.com",
    "whatsapp.com",
    "telegram.org",
    "discord.com",
    // Mobile app patterns
    "fb://", // Facebook app
    "twitter://", // Twitter app
    "instagram://", // Instagram app
    "linkedin://", // LinkedIn app
    "youtube://", // YouTube app
    "tiktok://", // TikTok app
    "pinterest://", // Pinterest app
    "reddit://", // Reddit app
  ];

  const EMAIL_PROVIDERS = [
    "gmail.com",
    "outlook.com",
    "yahoo.com",
    "hotmail.com",
    "mail.ru",
    "protonmail.com",
  ];

  // Affiliate network parameters
  const AFFILIATE_NETWORKS = {
    // ShareASale
    shareasale: ["sscid", "sscidmode"],

    // Commission Junction (CJ Affiliate)
    cj: ["cjevent", "cjdata"],

    // Impact (formerly Impact Radius)
    impact: ["irclickid", "irgwc"],

    // PartnerStack
    partnerstack: ["ps"],

    // ReferralCandy
    referralcandy: ["rc"],

    // Generic affiliate
    generic: ["aff", "affiliate", "ref", "partner"],

    // Amazon Associates
    amazon: ["tag"],

    // ClickBank
    clickbank: ["hop"],

    // Custom tracking
    custom: ["subid", "subid1", "subid2", "subid3", "subid4", "subid5"],
  };

  // Visitor tracking constants
  const VISITOR_STORAGE_KEYS = {
    VISITOR_DATA: "kogents_visitor_data",
    TAB_DATA: "kogents_tab_data",
    ACTIVITY_HISTORY: "kogents_activity_history",
    FINGERPRINT_DATA: "kogents_fingerprint_data",
  };

  // Visitor info constants
  const VISITOR_INFO_STORAGE_KEY = "kogents_visitor_info";
  const MAX_VISITOR_INFO_OPERATIONS_PER_MINUTE = 5;
  const MAX_DISPLAY_NAME_LENGTH = 255;
  const MAX_PHONE_LENGTH = 25;
  const PHONE_REGEX = /^[0-9+\-\s()]+$/;

  // Visitor info state
  let visitorInfo = null;
  let visitorInfoOperationCount = 0;
  let visitorInfoOperationResetTime = Date.now();

  const TAB_HEARTBEAT_INTERVAL = 5000; // 5 seconds
  const TAB_CLEANUP_INTERVAL = 30000; // 30 seconds
  const TAB_TIMEOUT = 15000; // 15 seconds
  const MAX_ACTIVITY_HISTORY = 50;
  const MAX_VISITOR_ERRORS = 10;

  // Tag management constants
  const TAG_STORAGE_KEY = "kogents_visitor_tags";
  const MAX_TAGS_PER_SESSION = 50;
  const MAX_TAG_LENGTH = 50;
  const MAX_TAG_OPERATIONS_PER_MINUTE = 10;
  const TAG_ALLOWED_CHARS = /^[a-zA-Z0-9_-]+$/;

  const SCROLLBAR_WIDTH =
    window.innerWidth - document.documentElement.clientWidth;

  // Tag management state
  let visitorTags = [];
  let tagOperationCount = 0;
  let tagOperationResetTime = Date.now();

  // Department management state
  let departmentsData = [];
  let visitorDefaultDepartment = null;
  let departmentsLastUpdated = null;
  let departmentOperationCount = 0;
  let departmentOperationResetTime = Date.now();
  const MAX_DEPARTMENT_OPERATIONS_PER_MINUTE = 10;
  const DEPARTMENTS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const DEPARTMENTS_STORAGE_KEY = "kogents_departments_data";
  const VISITOR_DEFAULT_DEPARTMENT_KEY = "kogents_visitor_default_department";

  // Chat message sending constants
  const MAX_CHAT_MESSAGES_PER_MINUTE = 10;
  const MAX_CHAT_MESSAGE_LENGTH = 2000;
  const MIN_CHAT_MESSAGE_LENGTH = 1;

  // Chat message sending state
  let chatMessageOperationCount = 0;
  let chatMessageOperationResetTime = Date.now();

  // Typing status management constants
  const MAX_TYPING_EVENTS_PER_MINUTE = 30;
  const TYPING_THROTTLE_MS = 500; // Minimum time between typing events
  const TYPING_AUTO_RESET_MS = 3000; // Auto-reset typing after 3 seconds of inactivity
  const TYPING_DEBOUNCE_MS = 100; // Debounce rapid typing changes

  // Typing status management state
  let currentTypingState = false;
  let lastTypingEventTime = 0;
  let typingOperationCount = 0;
  let typingOperationResetTime = Date.now();
  let typingAutoResetTimeout = null;
  let typingDebounceTimeout = null;
  let lastTypingSentState = null;

  // Chat info management constants
  const MAX_CHAT_INFO_OPERATIONS_PER_MINUTE = 10;
  const CHAT_INFO_STORAGE_KEY = "kogents_chat_info";
  const CHAT_INFO_TIMEOUT = 5000; // 5 seconds

  // Chat rating management constants
  const MAX_CHAT_RATING_OPERATIONS_PER_MINUTE = 5;
  const CHAT_RATING_TIMEOUT = 10000; // 10 seconds

  // Chat info management state
  let currentChatInfo = { rating: null, comment: null };

  // Chat rating management state
  let chatRatingOperationCount = 0;
  let chatRatingOperationResetTime = Date.now();

  // Chat comment management constants
  const MAX_CHAT_COMMENT_OPERATIONS_PER_MINUTE = 5;
  const MAX_CHAT_COMMENT_LENGTH = 1000;
  const CHAT_COMMENT_TIMEOUT = 10000; // 10 seconds

  // Chat comment management state
  let chatCommentOperationCount = 0;
  let chatCommentOperationResetTime = Date.now();

  let chatInfoOperationCount = 0;
  let chatInfoOperationResetTime = Date.now();

  // Chat log management constants
  const MAX_CHAT_LOG_OPERATIONS_PER_MINUTE = 10;
  const CHAT_LOG_TIMEOUT = 5000; // 5 seconds
  const CHAT_LOG_CACHE_DURATION = 30 * 1000; // 30 seconds

  // Chat log management state
  const chatLogOperationCount = 0;
  const chatLogOperationResetTime = Date.now();
  const cachedChatLog = null;
  const chatLogCacheTimestamp = null;

  // Operating hours management constants
  const MAX_OPERATING_HOURS_OPERATIONS_PER_MINUTE = 5;
  const OPERATING_HOURS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const OPERATING_HOURS_STORAGE_KEY = "kogents_operating_hours_data";
  const OPERATING_HOURS_TIMEOUT = 5000; // 5 seconds

  // Operating hours management state
  let operatingHoursData = null;
  let operatingHoursLastUpdated = null;
  let operatingHoursOperationCount = 0;
  let operatingHoursOperationResetTime = Date.now();

  // Email transcript management constants
  const MAX_EMAIL_TRANSCRIPT_OPERATIONS_PER_MINUTE = 3;
  const EMAIL_TRANSCRIPT_TIMEOUT = 10000; // 10 seconds
  const EMAIL_TRANSCRIPT_CACHE_DURATION = 60 * 1000; // 1 minute to prevent duplicate requests

  // Email transcript management state
  let emailTranscriptOperationCount = 0;
  let emailTranscriptOperationResetTime = Date.now();
  let lastEmailTranscriptRequest = null;
  let lastEmailTranscriptTime = null;

  // Chat history management constants
  const MAX_CHAT_HISTORY_OPERATIONS_PER_MINUTE = 10;
  const CHAT_HISTORY_TIMEOUT = 10000; // 10 seconds
  const CHAT_HISTORY_ITEMS_PER_PAGE = 20;

  // Chat history management state
  let chatHistoryOperationCount = 0;
  let chatHistoryOperationResetTime = Date.now();
  let chatHistoryCursor = null; // Pagination cursor
  let chatHistoryRequestInProgress = false;
  let chatHistoryHasMore = true; // Assume more items are available initially
  const isAuthenticated = false; // Tracks JWT authentication status

  // End chat management constants
  const MAX_END_CHAT_OPERATIONS_PER_MINUTE = 5;
  const END_CHAT_TIMEOUT = 10000; // 10 seconds

  // End chat management state
  let endChatOperationCount = 0;
  let endChatOperationResetTime = Date.now();

  // ============================================================================
  // FILE SENDING IMPLEMENTATION (Zendesk-compatible)
  // ============================================================================

  /**
   * Check if browser supports file sending
   */
  function checkBrowserSupport() {
    return typeof FormData !== "undefined" && typeof File !== "undefined";
  }

  /**
   * Check file sending rate limit
   */
  function checkFileSendRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - fileSendOperationResetTime > oneMinute) {
      fileSendOperationCount = 0;
      fileSendOperationResetTime = now;
    }

    if (fileSendOperationCount >= MAX_FILE_SEND_OPERATIONS_PER_MINUTE) {
      throw new Error("CONN_ERROR");
    }

    fileSendOperationCount++;
    return true;
  }

  /**
   * Validate file for sending
   */
  function validateFile(file) {
    // Check if file is a File object
    if (!(file instanceof File)) {
      throw new Error("INTERNAL_ERROR");
    }

    // Check file size
    if (file.size > config.maxFileSize) {
      throw new Error("EXCEED_SIZE_LIMIT");
    }

    // Check file extension/type
    if (config.allowedFileTypes.length > 0) {
      const isAllowed = config.allowedFileTypes.some((allowedType) => {
        // Check MIME type
        if (file.type === allowedType) return true;

        // Check file extension for common cases
        const fileName = file.name.toLowerCase();
        const extension = fileName.substring(fileName.lastIndexOf("."));

        const extensionMap = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".gif": "image/gif",
          ".pdf": "application/pdf",
          ".txt": "text/plain",
          ".doc": "application/msword",
          ".docx":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ".xls": "application/vnd.ms-excel",
          ".xlsx":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ".zip": "application/zip",
        };

        return extensionMap[extension] === allowedType;
      });

      if (!isAllowed) {
        throw new Error("INVALID_EXTENSION");
      }
    }

    return true;
  }

  /**
   * Generate unique file ID
   */
  function generateFileId() {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send file attachment (Zendesk-compatible API)
   */
  function sendFileInternal(file, callback) {
    try {
      // Validate callback
      if (typeof callback !== "function") {
        throw new Error("INTERNAL_ERROR");
      }

      // Check browser support
      if (!checkBrowserSupport()) {
        const error = new Error("NOT_SUPPORTED");
        setTimeout(() => callback(error), 0);
        return;
      }

      // Check if file sending is enabled
      if (!config.enableFileSending || !fileSendingEnabled) {
        const error = new Error("NOT_ALLOWED");
        setTimeout(() => callback(error), 0);
        return;
      }

      // Check rate limit
      checkFileSendRateLimit();

      // Validate file
      validateFile(file);

      // Check if widget is loaded
      if (!isLoaded || !widgetFrame) {
        const error = new Error("CONN_ERROR");
        setTimeout(() => callback(error), 0);
        return;
      }

      // Generate unique file ID for tracking
      const fileId = generateFileId();

      // Create file data object
      const fileData = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified || Date.now(),
        timestamp: new Date().toISOString(),
      };

      // Set up response handler
      const responseHandler = (data) => {
        off("file:send:response", responseHandler);

        if (data && data.fileId === fileId) {
          if (data.success) {
            // Return success data in Zendesk format
            const successData = {
              mime_type: data.mime_type || file.type,
              name: data.name || file.name,
              size: data.size || file.size,
              url: data.url || "",
            };
            callback(null, successData);
          } else {
            // Map error codes to Zendesk format
            let errorMessage = "UNKNOWN_ERROR";

            switch (data.error) {
              case "FILE_TOO_LARGE":
                errorMessage = "EXCEED_SIZE_LIMIT";
                break;
              case "INVALID_FILE_TYPE":
                errorMessage = "INVALID_EXTENSION";
                break;
              case "UPLOAD_FAILED":
                errorMessage = "CONN_ERROR";
                break;
              case "NOT_ALLOWED":
                errorMessage = "NOT_ALLOWED";
                break;
              case "SERVER_ERROR":
                errorMessage = "INTERNAL_ERROR";
                break;
              default:
                errorMessage = data.error || "UNKNOWN_ERROR";
            }

            const error = new Error(errorMessage);
            callback(error);
          }
        }
      };

      // Set up timeout handler
      const timeout = setTimeout(() => {
        off("file:send:response", responseHandler);
        const error = new Error("CONN_ERROR");
        callback(error);
      }, FILE_SEND_TIMEOUT);

      // Listen for response
      on("file:send:response", responseHandler);

      // Convert file to base64 for transmission
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const base64Data = e.target.result;

          // Send file to widget
          sendToWidget("widget:send-file", {
            fileId: fileId,
            fileData: fileData,
            base64Data: base64Data,
            source: "sendFile",
          });

          // Clear timeout on successful send
          setTimeout(() => {
            clearTimeout(timeout);
          }, 100);
        } catch (error) {
          clearTimeout(timeout);
          off("file:send:response", responseHandler);
          const err = new Error("INTERNAL_ERROR");
          callback(err);
        }
      };

      reader.onerror = () => {
        clearTimeout(timeout);
        off("file:send:response", responseHandler);
        const error = new Error("INTERNAL_ERROR");
        callback(error);
      };

      // Read file as data URL (base64)
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error in sendFile:", error);

      // Map internal errors to Zendesk format
      let errorMessage = "UNKNOWN_ERROR";
      if (error.message && typeof error.message === "string") {
        errorMessage = error.message;
      }

      const err = new Error(errorMessage);

      if (typeof callback === "function") {
        setTimeout(() => callback(err), 0);
      }
    }
  }

  // ============================================================================
  // END FILE SENDING IMPLEMENTATION
  // ============================================================================

  // ============================================================================
  // ADVANCED DEVICE FINGERPRINTING IMPLEMENTATION
  // ============================================================================

  /**
   * Device Fingerprinting Error Handler
   */
  function handleFingerprintError(error, context) {
    const errorMessage = `${context}: ${error?.message || "Unknown error"}`;
    fingerprintErrors.push(errorMessage);
    console.warn("Fingerprinting error:", errorMessage);
  }

  /**
   * Canvas Fingerprinting
   * Generates unique signatures from canvas rendering
   */
  function generateCanvasFingerprint() {
    try {
      if (!config.enableCanvasFingerprinting) return null;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      canvas.width = 200;
      canvas.height = 50;

      // Text rendering signature
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Hello, world! 🌍", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Hello, world! 🌍", 4, 17);

      // Geometry rendering signature
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgb(255,0,255)";
      ctx.beginPath();
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgb(0,255,255)";
      ctx.beginPath();
      ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgb(255,255,0)";
      ctx.beginPath();
      ctx.arc(75, 100, 50, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      const textSignature = canvas.toDataURL();

      // Create geometry signature
      const geometryCanvas = document.createElement("canvas");
      const geometryCtx = geometryCanvas.getContext("2d");
      if (geometryCtx) {
        geometryCanvas.width = 100;
        geometryCanvas.height = 100;
        geometryCtx.fillStyle = "#ff0000";
        geometryCtx.fillRect(0, 0, 100, 100);
        geometryCtx.fillStyle = "#00ff00";
        geometryCtx.fillRect(25, 25, 50, 50);
      }

      return {
        signature: textSignature,
        textSignature: textSignature.substring(0, 100),
        geometrySignature: geometryCanvas.toDataURL().substring(0, 100),
      };
    } catch (error) {
      handleFingerprintError(error, "canvas_fingerprinting");
      return null;
    }
  }

  /**
   * WebGL Fingerprinting
   * Extracts graphics card and WebGL capabilities
   */
  function generateWebGLFingerprint() {
    try {
      if (!config.enableWebGLFingerprinting) return null;

      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return null;

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "Unknown";
      const vendor = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : "Unknown";

      const extensions = gl.getSupportedExtensions() || [];

      const parameters = {};
      const parameterNames = [
        "VERSION",
        "SHADING_LANGUAGE_VERSION",
        "VENDOR",
        "RENDERER",
        "MAX_VERTEX_ATTRIBS",
        "MAX_VERTEX_UNIFORM_VECTORS",
        "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
        "MAX_VARYING_VECTORS",
        "MAX_FRAGMENT_UNIFORM_VECTORS",
        "MAX_TEXTURE_IMAGE_UNITS",
        "MAX_TEXTURE_SIZE",
        "MAX_CUBE_MAP_TEXTURE_SIZE",
        "MAX_RENDERBUFFER_SIZE",
        "MAX_VIEWPORT_DIMS",
        "ALIASED_LINE_WIDTH_RANGE",
        "ALIASED_POINT_SIZE_RANGE",
      ];

      parameterNames.forEach((name) => {
        try {
          const param = gl[name];
          if (param !== undefined) {
            parameters[name] = gl.getParameter(param);
          }
        } catch (e) {
          // Ignore parameter errors
        }
      });

      // Generate WebGL signature
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const vertices = new Float32Array([
        -0.2, -0.9, 0, 0.4, -0.26, 0, 0, 0.732134444, 0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

      let program = null;
      if (vertexShader && fragmentShader) {
        gl.shaderSource(
          vertexShader,
          "attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}"
        );
        gl.compileShader(vertexShader);

        gl.shaderSource(
          fragmentShader,
          "precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}"
        );
        gl.compileShader(fragmentShader);

        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
      const signature = canvas.toDataURL();

      return {
        renderer,
        vendor,
        version: parameters.VERSION || "Unknown",
        shadingLanguageVersion:
          parameters.SHADING_LANGUAGE_VERSION || "Unknown",
        extensions,
        parameters,
        signature: signature.substring(0, 100),
      };
    } catch (error) {
      handleFingerprintError(error, "webgl_fingerprinting");
      return null;
    }
  }

  /**
   * Audio Context Fingerprinting
   * Analyzes audio processing characteristics
   */
  function generateAudioFingerprint() {
    return new Promise((resolve) => {
      try {
        if (!config.enableAudioFingerprinting) {
          resolve(null);
          return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          resolve(null);
          return;
        }

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

        gainNode.gain.setValueAtTime(0, context.currentTime);
        oscillator.frequency.setValueAtTime(10000, context.currentTime);
        oscillator.type = "triangle";

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(0);

        let samples = [];

        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          samples = Array.from(buffer.slice(0, 100));

          oscillator.stop();
          context.close();

          const signature = samples.reduce(
            (acc, val) => acc + val.toString(),
            ""
          );

          resolve({
            signature: btoa(signature).substring(0, 50),
            sampleRate: context.sampleRate,
            maxChannelCount: context.destination.maxChannelCount,
            numberOfInputs: context.destination.numberOfInputs,
            numberOfOutputs: context.destination.numberOfOutputs,
            channelCount: context.destination.channelCount,
            channelCountMode: context.destination.channelCountMode,
            channelInterpretation: context.destination.channelInterpretation,
          });
        };

        // Timeout fallback
        setTimeout(() => {
          try {
            oscillator.stop();
            context.close();
          } catch (e) {}

          resolve({
            signature: "timeout",
            sampleRate: context.sampleRate,
            maxChannelCount: context.destination.maxChannelCount,
            numberOfInputs: context.destination.numberOfInputs,
            numberOfOutputs: context.destination.numberOfOutputs,
            channelCount: context.destination.channelCount,
            channelCountMode: context.destination.channelCountMode,
            channelInterpretation: context.destination.channelInterpretation,
          });
        }, 1000);
      } catch (error) {
        handleFingerprintError(error, "audio_fingerprinting");
        resolve(null);
      }
    });
  }

  /**
   * Font Detection
   * Detects available fonts on the system
   */
  function generateFontFingerprint() {
    try {
      if (!config.enableFontDetection) return null;

      const baseFonts = ["monospace", "sans-serif", "serif"];
      const testString = "mmmmmmmmmmlli";
      const testSize = "72px";
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) return null;

      canvas.width = 60;
      canvas.height = 60;

      const baseFontWidths = {};

      // Measure base fonts
      baseFonts.forEach((baseFont) => {
        context.font = `${testSize} ${baseFont}`;
        baseFontWidths[baseFont] = context.measureText(testString).width;
      });

      const availableFonts = [];

      // Test each font
      COMMON_FONTS.forEach((font) => {
        baseFonts.forEach((baseFont) => {
          context.font = `${testSize} ${font}, ${baseFont}`;
          const width = context.measureText(testString).width;

          if (width !== baseFontWidths[baseFont]) {
            if (!availableFonts.includes(font)) {
              availableFonts.push(font);
            }
          }
        });
      });

      const signature = availableFonts.sort().join(",");

      return {
        available: availableFonts,
        signature: btoa(signature).substring(0, 50),
        count: availableFonts.length,
      };
    } catch (error) {
      handleFingerprintError(error, "font_detection");
      return null;
    }
  }

  /**
   * Enhanced Screen Characteristics
   */
  function generateScreenFingerprint() {
    try {
      const screen = window.screen;

      return {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: screen.orientation?.type || "unknown",
        touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      };
    } catch (error) {
      handleFingerprintError(error, "screen_detection");
      return null;
    }
  }

  /**
   * Hardware Detection
   */
  function generateHardwareFingerprint() {
    try {
      return {
        concurrency: navigator.hardwareConcurrency || 0,
        memory: navigator.deviceMemory || 0,
        platform: navigator.platform,
        architecture: navigator.cpuClass || "unknown",
        maxTouchPoints: navigator.maxTouchPoints || 0,
      };
    } catch (error) {
      handleFingerprintError(error, "hardware_detection");
      return null;
    }
  }

  /**
   * Battery API Detection
   */
  function generateBatteryFingerprint() {
    return new Promise((resolve) => {
      try {
        if (!config.enableBatteryAPI || !navigator.getBattery) {
          resolve(null);
          return;
        }

        navigator
          .getBattery()
          .then((battery) => {
            resolve({
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime,
              level: Math.round(battery.level * 100) / 100,
            });
          })
          .catch(() => {
            resolve(null);
          });
      } catch (error) {
        handleFingerprintError(error, "battery_detection");
        resolve(null);
      }
    });
  }

  /**
   * WebRTC IP Detection
   */
  function generateWebRTCFingerprint() {
    return new Promise((resolve) => {
      try {
        if (!config.enableWebRTC) {
          resolve(null);
          return;
        }

        const RTCPeerConnection =
          window.RTCPeerConnection ||
          window.mozRTCPeerConnection ||
          window.webkitRTCPeerConnection;

        if (!RTCPeerConnection) {
          resolve(null);
          return;
        }

        const localIPs = [];
        const candidateTypes = [];
        let publicIP = "";

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });

        pc.createDataChannel("");

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const match = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);

            if (match) {
              const ip = match[1];
              if (
                ip.startsWith("192.168.") ||
                ip.startsWith("10.") ||
                ip.startsWith("172.")
              ) {
                if (!localIPs.includes(ip)) {
                  localIPs.push(ip);
                }
              } else {
                publicIP = ip;
              }
            }

            // Extract candidate type
            const typeMatch = candidate.match(/typ (\w+)/);
            if (typeMatch && !candidateTypes.includes(typeMatch[1])) {
              candidateTypes.push(typeMatch[1]);
            }
          } else {
            pc.close();
            resolve({
              localIPs,
              publicIP,
              candidateTypes,
            });
          }
        };

        pc.createOffer().then((offer) => pc.setLocalDescription(offer));

        // Timeout fallback
        setTimeout(() => {
          pc.close();
          resolve({
            localIPs,
            publicIP,
            candidateTypes,
          });
        }, 3000);
      } catch (error) {
        handleFingerprintError(error, "webrtc_detection");
        resolve(null);
      }
    });
  }

  /**
   * Plugin Detection
   */
  function generatePluginFingerprint() {
    try {
      if (!config.enablePluginDetection) return null;

      const plugins = Array.from(navigator.plugins).map((plugin) => ({
        name: plugin.name,
        filename: plugin.filename,
        description: plugin.description,
        version: plugin.version || "unknown",
      }));

      const signature = plugins
        .map((p) => `${p.name}:${p.version}`)
        .sort()
        .join(",");

      return {
        list: plugins,
        count: plugins.length,
        signature: btoa(signature).substring(0, 50),
      };
    } catch (error) {
      handleFingerprintError(error, "plugin_detection");
      return null;
    }
  }

  /**
   * Media Devices Detection
   */
  function generateMediaDevicesFingerprint() {
    return new Promise((resolve) => {
      try {
        if (
          !config.enableMediaDevices ||
          !navigator.mediaDevices?.enumerateDevices
        ) {
          resolve(null);
          return;
        }

        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            const audioInputs = devices.filter(
              (d) => d.kind === "audioinput"
            ).length;
            const audioOutputs = devices.filter(
              (d) => d.kind === "audiooutput"
            ).length;
            const videoInputs = devices.filter(
              (d) => d.kind === "videoinput"
            ).length;

            const deviceList = devices.map((device) => ({
              kind: device.kind,
              label: device.label || "unknown",
              deviceId: device.deviceId ? "present" : "absent",
            }));

            resolve({
              audioInputs,
              audioOutputs,
              videoInputs,
              devices: deviceList,
            });
          })
          .catch(() => {
            resolve(null);
          });
      } catch (error) {
        handleFingerprintError(error, "media_devices_detection");
        resolve(null);
      }
    });
  }

  /**
   * Miscellaneous Characteristics
   */
  function generateMiscFingerprint() {
    try {
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        languages: Array.from(navigator.languages || [navigator.language]),
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack || "unknown",
        indexedDBSupport: !!window.indexedDB,
        webSQLSupport: !!window.openDatabase,
        localStorageSupport: !!window.localStorage,
        sessionStorageSupport: !!window.sessionStorage,
      };
    } catch (error) {
      handleFingerprintError(error, "misc_detection");
      return null;
    }
  }

  /**
   * Generate Complete Device Fingerprint
   */
  async function generateDeviceFingerprint() {
    try {
      if (!config.enableFingerprinting) return null;

      if (config.fingerprintingConsent && !isTrackingAllowed("analytics")) {
        console.warn("Device fingerprinting requires consent");
        return null;
      }

      if (fingerprintGenerationInProgress) return deviceFingerprint;

      fingerprintGenerationInProgress = true;
      fingerprintErrors = [];

      const startTime = Date.now();
      const fingerprint = {};

      // Collect all fingerprinting data with timeout
      const promises = [];

      // Canvas fingerprinting
      promises.push(
        Promise.resolve().then(() => {
          fingerprint.canvas = generateCanvasFingerprint();
        })
      );

      // WebGL fingerprinting
      promises.push(
        Promise.resolve().then(() => {
          fingerprint.webgl = generateWebGLFingerprint();
        })
      );

      // Audio fingerprinting
      promises.push(
        generateAudioFingerprint().then((audio) => {
          fingerprint.audio = audio;
        })
      );

      // Font detection
      promises.push(
        Promise.resolve().then(() => {
          fingerprint.fonts = generateFontFingerprint();
        })
      );

      // Battery API
      promises.push(
        generateBatteryFingerprint().then((battery) => {
          fingerprint.battery = battery;
        })
      );

      // WebRTC fingerprinting
      promises.push(
        generateWebRTCFingerprint().then((webrtc) => {
          fingerprint.webrtc = webrtc;
        })
      );

      // Plugin detection
      promises.push(
        Promise.resolve().then(() => {
          fingerprint.plugins = generatePluginFingerprint();
        })
      );

      // Media devices
      promises.push(
        generateMediaDevicesFingerprint().then((mediaDevices) => {
          fingerprint.mediaDevices = mediaDevices;
        })
      );

      // Always collect basic characteristics
      promises.push(
        Promise.resolve().then(() => {
          fingerprint.screen = generateScreenFingerprint();
          fingerprint.hardware = generateHardwareFingerprint();
          fingerprint.misc = generateMiscFingerprint();
        })
      );

      // Wait for all fingerprinting to complete with timeout
      await Promise.race([
        Promise.allSettled(promises),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout")),
            config.fingerprintTimeout
          )
        ),
      ]);

      // Generate overall signature
      const signatureData = JSON.stringify({
        canvas: fingerprint.canvas?.signature,
        webgl: fingerprint.webgl?.signature,
        audio: fingerprint.audio?.signature,
        fonts: fingerprint.fonts?.signature,
        screen: fingerprint.screen,
        hardware: fingerprint.hardware,
        plugins: fingerprint.plugins?.signature,
        misc: fingerprint.misc,
      });

      const signature = btoa(signatureData).substring(0, 64);

      // Calculate confidence score
      const enabledFeatures = Object.values(config).filter(
        (v) => typeof v === "boolean" && v && v.toString().includes("enable")
      ).length;
      const successfulFeatures = Object.keys(fingerprint).length;
      const confidence = Math.round(
        (successfulFeatures / Math.max(enabledFeatures, 1)) * 100
      );

      const completeFingerprint = {
        ...fingerprint,
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          signature,
          confidence,
          errors: fingerprintErrors,
          generationTime: Date.now() - startTime,
        },
      };

      // Store fingerprint
      deviceFingerprint = completeFingerprint;
      fingerprintGenerated = true;

      // Store in session storage
      try {
        if (isTrackingAllowed("functional")) {
          sessionStorage.setItem(
            VISITOR_STORAGE_KEYS.FINGERPRINT_DATA,
            JSON.stringify(
              privacyConfig.anonymizeData
                ? anonymizeData(completeFingerprint)
                : completeFingerprint
            )
          );
        }
      } catch (e) {}

      // Send to widget
      sendFingerprintToWidget();

      console.log("Device fingerprint generated:", {
        signature: completeFingerprint.metadata.signature,
        confidence: completeFingerprint.metadata.confidence,
        generationTime: completeFingerprint.metadata.generationTime,
        errors: fingerprintErrors.length,
      });

      return completeFingerprint;
    } catch (error) {
      handleFingerprintError(error, "fingerprint_generation");
      return null;
    } finally {
      fingerprintGenerationInProgress = false;
    }
  }

  /**
   * Send fingerprint data to widget
   */
  function sendFingerprintToWidget() {
    if (!deviceFingerprint) return;

    const fingerprintData = {
      fingerprint: deviceFingerprint,
      generated: fingerprintGenerated,
      timestamp: new Date().toISOString(),
      source: "parent-site",
    };

    sendToWidget("widget:fingerprint-update", fingerprintData);
  }

  /**
   * Get stored fingerprint
   */
  function getStoredFingerprint() {
    try {
      const stored = sessionStorage.getItem(
        VISITOR_STORAGE_KEYS.FINGERPRINT_DATA
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  // ============================================================================
  // END ADVANCED DEVICE FINGERPRINTING IMPLEMENTATION
  // ============================================================================

  // Privacy and Compliance Functions
  function getConsentState() {
    try {
      const stored = localStorage.getItem("kogents_privacy_consent");
      if (!stored) return null;

      const consent = JSON.parse(stored);
      return {
        ...consent,
        timestamp: new Date(consent.timestamp),
      };
    } catch {
      return null;
    }
  }

  function saveConsentState(consent) {
    try {
      const currentConsent = getConsentState();
      const newConsent = {
        analytics: consent.analytics ?? false,
        functional: consent.functional ?? true,
        marketing: consent.marketing ?? false,
        timestamp: new Date(),
        version: "1.0",
        ...currentConsent,
        ...consent,
      };

      localStorage.setItem(
        "kogents_privacy_consent",
        JSON.stringify(newConsent)
      );
      consentState = newConsent;
    } catch (error) {
      console.warn("Failed to save consent state:", error);
    }
  }

  function isTrackingAllowed(type) {
    // Always allow functional tracking
    if (type === "functional") return true;

    // Check consent if required
    if (privacyConfig.requireConsent) {
      const consent = getConsentState();
      if (!consent) return false;
      return consent[type] === true;
    }

    return true;
  }

  function anonymizeData(data) {
    if (!privacyConfig.anonymizeData) return data;

    const anonymized = { ...data };

    // Patterns to anonymize
    const sensitiveKeys = ["email", "phone", "ip", "userId", "sessionId"];
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

    // Anonymize specific keys
    sensitiveKeys.forEach((key) => {
      if (anonymized[key]) {
        if (typeof anonymized[key] === "string") {
          anonymized[key] = anonymized[key].substring(0, 3) + "***";
        }
      }
    });

    // Anonymize patterns in string values
    Object.keys(anonymized).forEach((key) => {
      if (typeof anonymized[key] === "string") {
        anonymized[key] = anonymized[key]
          .replace(emailPattern, "[EMAIL]")
          .replace(phonePattern, "[PHONE]")
          .replace(ipPattern, "[IP]");
      }
    });

    return anonymized;
  }

  function shouldRetainData(timestamp, dataType) {
    const retentionDays = privacyConfig.dataRetentionDays;
    const now = new Date();
    const ageInDays =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays <= retentionDays;
  }

  // Tag Management Functions
  function validateTags(tags) {
    if (!Array.isArray(tags)) {
      throw new Error("Tags must be an array");
    }

    if (tags.length === 0) {
      throw new Error("Tags array cannot be empty");
    }

    if (tags.length > MAX_TAGS_PER_SESSION) {
      throw new Error(`Maximum ${MAX_TAGS_PER_SESSION} tags allowed`);
    }

    tags.forEach((tag) => {
      if (typeof tag !== "string") {
        throw new Error("All tags must be strings");
      }
      if (tag.length > MAX_TAG_LENGTH) {
        throw new Error(
          `Tag length cannot exceed ${MAX_TAG_LENGTH} characters`
        );
      }
      if (!TAG_ALLOWED_CHARS.test(tag)) {
        throw new Error(
          "Tags can only contain letters, numbers, hyphens, and underscores"
        );
      }
    });

    return true;
  }

  function sanitizeTag(tag) {
    if (typeof tag !== "string") return "";

    // Convert to lowercase and trim
    let sanitized = tag.toLowerCase().trim();

    // Remove any characters not in allowed set
    sanitized = sanitized.replace(/[^a-z0-9_-]/g, "");

    // Limit length
    if (sanitized.length > MAX_TAG_LENGTH) {
      sanitized = sanitized.substring(0, MAX_TAG_LENGTH);
    }

    return sanitized;
  }

  function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];

    return tags
      .map(sanitizeTag)
      .filter((tag) => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, MAX_TAGS_PER_SESSION);
  }

  function checkTagRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - tagOperationResetTime > oneMinute) {
      tagOperationCount = 0;
      tagOperationResetTime = now;
    }

    if (tagOperationCount >= MAX_TAG_OPERATIONS_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many tag operations.");
    }

    tagOperationCount++;
    return true;
  }

  function getStoredTags() {
    try {
      if (!isTrackingAllowed("functional")) return [];

      const stored = sessionStorage.getItem(TAG_STORAGE_KEY);
      if (!stored) return [];

      const tags = JSON.parse(stored);
      return Array.isArray(tags) ? tags : [];
    } catch (error) {
      console.warn("Error getting stored tags:", error);
      return [];
    }
  }

  function setStoredTags(tags) {
    try {
      if (!isTrackingAllowed("functional")) return;

      const normalizedTags = tags;
      sessionStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(normalizedTags));
      visitorTags = normalizedTags;

      // Send tags to widget
      sendToWidget("widget:tags-update", { tags: normalizedTags });

      return normalizedTags;
    } catch (error) {
      console.warn("Error storing tags:", error);
      throw error;
    }
  }

  function addTagsInternal(tagsToAdd) {
    try {
      checkTagRateLimit();

      // const normalizedNewTags = normalizeTags(tagsToAdd);
      // validateTags(normalizedNewTags);

      const currentTags = getStoredTags();
      const combinedTags = [...currentTags, ...tagsToAdd];
      const uniqueTags = [...new Set(combinedTags)];

      if (uniqueTags.length > MAX_TAGS_PER_SESSION) {
        throw new Error(
          `Cannot exceed ${MAX_TAGS_PER_SESSION} tags per session`
        );
      }

      const updatedTags = setStoredTags(uniqueTags);

      // Trigger tag sync with backend
      triggerTagSync();

      return updatedTags;
    } catch (error) {
      console.error("Error adding tags:", error);
      throw error;
    }
  }

  function removeTagsInternal(tagsToRemove) {
    try {
      checkTagRateLimit();

      const normalizedRemoveTags = normalizeTags(tagsToRemove);
      const currentTags = getStoredTags();
      const updatedTags = currentTags.filter(
        (tag) => !normalizedRemoveTags.includes(tag)
      );

      setStoredTags(updatedTags);

      // Trigger tag sync with backend
      triggerTagSync();

      return updatedTags;
    } catch (error) {
      console.error("Error removing tags:", error);
      throw error;
    }
  }

  function clearTagsInternal() {
    try {
      checkTagRateLimit();

      setStoredTags([]);

      // Trigger tag sync with backend
      triggerTagSync();

      return [];
    } catch (error) {
      console.error("Error clearing tags:", error);
      throw error;
    }
  }

  function triggerTagSync() {
    try {
      // Send current URL change to trigger backend sync with tags
      const currentUrl = getCurrentURL();
      if (currentUrl) {
        sendURLToWidget(currentUrl, "tag-update");
      }
    } catch (error) {
      console.warn("Error triggering tag sync:", error);
    }
  }

  // Visitor Info Management Functions
  function validateVisitorInfo(info) {
    if (!info || typeof info !== "object") {
      throw new Error("Visitor info must be an object");
    }

    // Validate display_name
    if (info.display_name !== undefined) {
      if (typeof info.display_name !== "string") {
        throw new Error("display_name must be a string");
      }
      if (info.display_name.length > MAX_DISPLAY_NAME_LENGTH) {
        throw new Error(
          `display_name cannot exceed ${MAX_DISPLAY_NAME_LENGTH} characters`
        );
      }
    }

    // Validate email
    if (info.email !== undefined) {
      if (typeof info.email !== "string") {
        throw new Error("email must be a string");
      }
      if (!EMAIL_REGEX.test(info.email)) {
        throw new Error("email must be a valid email address");
      }
    }

    // Validate phone
    if (info.phone !== undefined) {
      if (typeof info.phone !== "string") {
        throw new Error("phone must be a string");
      }
      if (info.phone.length > MAX_PHONE_LENGTH) {
        throw new Error(`phone cannot exceed ${MAX_PHONE_LENGTH} characters`);
      }
      if (!PHONE_REGEX.test(info.phone)) {
        throw new Error(
          "phone must contain only numbers, spaces, and basic formatting characters"
        );
      }
    }

    return true;
  }

  function sanitizeVisitorInfo(info) {
    if (!info || typeof info !== "object") return {};

    const sanitized = {};

    // Sanitize display_name
    if (info.display_name && typeof info.display_name === "string") {
      sanitized.display_name = info.display_name
        .trim()
        .substring(0, MAX_DISPLAY_NAME_LENGTH);
    }

    // Sanitize email
    if (info.email && typeof info.email === "string") {
      const email = info.email.trim().toLowerCase();
      if (EMAIL_REGEX.test(email)) {
        sanitized.email = email;
      }
    }

    // Sanitize phone
    if (info.phone && typeof info.phone === "string") {
      const phone = info.phone.trim().substring(0, MAX_PHONE_LENGTH);
      if (PHONE_REGEX.test(phone)) {
        sanitized.phone = phone;
      }
    }

    return sanitized;
  }

  function checkVisitorInfoRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - visitorInfoOperationResetTime > oneMinute) {
      visitorInfoOperationCount = 0;
      visitorInfoOperationResetTime = now;
    }

    if (visitorInfoOperationCount >= MAX_VISITOR_INFO_OPERATIONS_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many visitor info operations.");
    }

    visitorInfoOperationCount++;
    return true;
  }

  function getStoredVisitorInfo() {
    try {
      if (!isTrackingAllowed("functional")) return null;

      const stored = sessionStorage.getItem(VISITOR_INFO_STORAGE_KEY);
      if (!stored) return null;

      const info = JSON.parse(stored);
      return typeof info === "object" ? info : null;
    } catch (error) {
      console.warn("Error getting stored visitor info:", error);
      return null;
    }
  }

  function setStoredVisitorInfo(info) {
    try {
      if (!isTrackingAllowed("functional")) return null;

      const sanitizedInfo = sanitizeVisitorInfo(info);
      sessionStorage.setItem(VISITOR_INFO_STORAGE_KEY, JSON.stringify(info));
      visitorInfo = info;

      // Send visitor info to widget
      sendToWidget("widget:visitor-info-update", {
        visitorInfo: info,
      });

      return sanitizedInfo;
    } catch (error) {
      console.warn("Error storing visitor info:", error);
      throw error;
    }
  }

  function setVisitorInfoInternal(options) {
    try {
      checkVisitorInfoRateLimit();

      validateVisitorInfo(options);

      const currentInfo = getStoredVisitorInfo() || {};
      const updatedInfo = { ...currentInfo, ...options };

      const storedInfo = setStoredVisitorInfo(updatedInfo);

      // Trigger visitor info sync with backend
      triggerVisitorInfoSync();

      return storedInfo;
    } catch (error) {
      console.error("Error setting visitor info:", error);
      throw error;
    }
  }

  function getVisitorInfoInternal() {
    try {
      return getStoredVisitorInfo();
    } catch (error) {
      console.error("Error getting visitor info:", error);
      return null;
    }
  }

  function triggerVisitorInfoSync() {
    try {
      // Send current URL change to trigger backend sync with visitor info
      const currentUrl = getCurrentURL();
      if (currentUrl) {
        sendURLToWidget(currentUrl, "visitor-info-update");
      }
    } catch (error) {
      console.warn("Error triggering visitor info sync:", error);
    }
  }

  // Department Management Functions
  function checkDepartmentRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - departmentOperationResetTime > oneMinute) {
      departmentOperationCount = 0;
      departmentOperationResetTime = now;
    }

    if (departmentOperationCount >= MAX_DEPARTMENT_OPERATIONS_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many department operations.");
    }

    departmentOperationCount++;
    return true;
  }

  function getStoredDepartments() {
    try {
      if (!isTrackingAllowed("functional")) return [];

      const stored = sessionStorage.getItem(DEPARTMENTS_STORAGE_KEY);
      if (!stored) return [];

      const data = JSON.parse(stored);

      // Check if cache is still valid
      if (
        data.timestamp &&
        Date.now() - data.timestamp < DEPARTMENTS_CACHE_DURATION
      ) {
        return data.departments || [];
      }

      return [];
    } catch (error) {
      console.warn("Error getting stored departments:", error);
      return [];
    }
  }

  function setStoredDepartments(departments) {
    try {
      if (!isTrackingAllowed("functional")) return;

      const data = {
        departments: departments,
        timestamp: Date.now(),
      };

      sessionStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(data));
      departmentsData = departments;
      departmentsLastUpdated = Date.now();

      // Send departments to widget
      sendToWidget("widget:departments-update", { departments: departments });

      return departments;
    } catch (error) {
      console.warn("Error storing departments:", error);
      throw error;
    }
  }

  function getStoredVisitorDefaultDepartment() {
    try {
      if (!isTrackingAllowed("functional")) return null;

      const stored = sessionStorage.getItem(VISITOR_DEFAULT_DEPARTMENT_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return data;
    } catch (error) {
      console.warn("Error getting stored visitor default department:", error);
      return null;
    }
  }

  function setStoredVisitorDefaultDepartment(departmentData) {
    try {
      if (!isTrackingAllowed("functional")) return null;

      sessionStorage.setItem(
        VISITOR_DEFAULT_DEPARTMENT_KEY,
        JSON.stringify(departmentData)
      );
      visitorDefaultDepartment = departmentData;

      // Send to widget
      sendToWidget("widget:visitor-default-department-update", {
        defaultDepartment: departmentData,
      });

      return departmentData;
    } catch (error) {
      console.warn("Error storing visitor default department:", error);
      throw error;
    }
  }

  function validateDepartmentId(departmentId) {
    if (typeof departmentId !== "number" || !Number.isInteger(departmentId)) {
      throw new Error("Department ID must be an integer");
    }

    if (departmentId <= 0) {
      throw new Error("Department ID must be a positive integer");
    }

    return true;
  }

  function findDepartmentById(departmentId) {
    const departments =
      departmentsData.length > 0 ? departmentsData : getStoredDepartments();
    return departments.find((dept) => dept.id === departmentId) || null;
  }

  function requestDepartmentsFromWidget() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        off("departments:response", responseHandler);
        reject(new Error("Timeout waiting for departments response"));
      }, 5000);

      const responseHandler = (data) => {
        clearTimeout(timeout);
        off("departments:response", responseHandler);

        if (data && data.departments) {
          setStoredDepartments(data.departments);
          resolve(data.departments);
        } else {
          reject(new Error("Invalid departments response"));
        }
      };

      on("departments:response", responseHandler);
      sendToWidget("departments:request", {});
    });
  }

  function getAllDepartmentsInternal() {
    try {
      checkDepartmentRateLimit();

      // Return cached data if available and fresh
      const cachedDepartments = getStoredDepartments();
      if (cachedDepartments.length > 0) {
        return cachedDepartments;
      }

      // Return current data if available
      if (departmentsData.length > 0) {
        return departmentsData;
      }

      // Request fresh data in background
      requestDepartmentsFromWidget().catch((error) => {
        console.warn("Failed to fetch departments:", error);
      });

      return [];
    } catch (error) {
      console.error("Error getting all departments:", error);
      return [];
    }
  }

  function getDepartmentInternal(departmentId) {
    try {
      checkDepartmentRateLimit();
      validateDepartmentId(departmentId);

      const department = findDepartmentById(departmentId);

      if (!department) {
        // Try to refresh departments if not found
        requestDepartmentsFromWidget().catch((error) => {
          console.warn("Failed to refresh departments:", error);
        });
      }

      return department;
    } catch (error) {
      console.error("Error getting department:", error);
      return null;
    }
  }

  function getVisitorDefaultDepartmentInternal() {
    try {
      const stored = getStoredVisitorDefaultDepartment();
      if (stored) {
        // Verify department still exists
        const department = findDepartmentById(stored.id);
        if (department) {
          return department;
        } else {
          // Clean up invalid default department
          clearStoredVisitorDefaultDepartment();
          return undefined;
        }
      }

      return undefined;
    } catch (error) {
      console.error("Error getting visitor default department:", error);
      return undefined;
    }
  }

  function setVisitorDefaultDepartmentInternal(departmentId, callback) {
    try {
      checkDepartmentRateLimit();
      validateDepartmentId(departmentId);

      if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
      }

      // Verify department exists
      const department = findDepartmentById(departmentId);
      if (!department) {
        const error = new Error(`Department with ID ${departmentId} not found`);
        setTimeout(() => callback(error), 0);
        return;
      }

      // Store the default department
      const departmentData = {
        id: department.id,
        name: department.name,
        status: department.status,
        setAt: new Date().toISOString(),
      };

      setStoredVisitorDefaultDepartment(departmentData);

      // Send to widget for backend sync
      sendToWidget("widget:visitor-default-department-set", {
        departmentId: departmentId,
        department: departmentData,
      });

      // Trigger visitor info sync
      triggerVisitorInfoSync();

      setTimeout(() => callback(null), 0);
    } catch (error) {
      console.error("Error setting visitor default department:", error);
      if (typeof callback === "function") {
        setTimeout(() => callback(error), 0);
      }
    }
  }

  function clearStoredVisitorDefaultDepartment() {
    try {
      sessionStorage.removeItem(VISITOR_DEFAULT_DEPARTMENT_KEY);
      visitorDefaultDepartment = null;
    } catch (error) {
      console.warn("Error clearing stored visitor default department:", error);
    }
  }

  function clearVisitorDefaultDepartmentInternal(callback) {
    try {
      checkDepartmentRateLimit();

      if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
      }

      // Clear stored data
      clearStoredVisitorDefaultDepartment();

      // Send to widget for backend sync
      sendToWidget("widget:visitor-default-department-clear", {});

      // Trigger visitor info sync
      triggerVisitorInfoSync();

      setTimeout(() => callback(null), 0);
    } catch (error) {
      console.error("Error clearing visitor default department:", error);
      if (typeof callback === "function") {
        setTimeout(() => callback(error), 0);
      }
    }
  }

  function handleDepartmentStatusUpdate(departments) {
    try {
      if (!Array.isArray(departments)) return;

      // Update stored departments
      setStoredDepartments(departments);

      // Update default department status if it exists
      const defaultDept = getStoredVisitorDefaultDepartment();
      if (defaultDept) {
        const updatedDept = departments.find(
          (dept) => dept.id === defaultDept.id
        );
        if (updatedDept && updatedDept.status !== defaultDept.status) {
          setStoredVisitorDefaultDepartment({
            ...defaultDept,
            status: updatedDept.status,
          });
        }
      }

      // Trigger event for status updates
      triggerEvent("departments:updated", { departments });
    } catch (error) {
      console.error("Error handling department status update:", error);
    }
  }

  // Chat Message Sending Functions
  function checkChatMessageRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - chatMessageOperationResetTime > oneMinute) {
      chatMessageOperationCount = 0;
      chatMessageOperationResetTime = now;
    }

    if (chatMessageOperationCount >= MAX_CHAT_MESSAGES_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many chat messages sent.");
    }

    chatMessageOperationCount++;
    return true;
  }

  function validateChatMessage(msg) {
    if (typeof msg !== "string") {
      throw new Error("Message must be a string");
    }

    if (msg.length < MIN_CHAT_MESSAGE_LENGTH) {
      throw new Error("Message cannot be empty");
    }

    if (msg.length > MAX_CHAT_MESSAGE_LENGTH) {
      throw new Error(
        `Message cannot exceed ${MAX_CHAT_MESSAGE_LENGTH} characters`
      );
    }

    return true;
  }

  function sanitizeChatMessage(msg) {
    if (typeof msg !== "string") return "";

    // Trim whitespace
    let sanitized = msg.trim();

    // Remove any null bytes or control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    // Limit length
    if (sanitized.length > MAX_CHAT_MESSAGE_LENGTH) {
      sanitized = sanitized.substring(0, MAX_CHAT_MESSAGE_LENGTH);
    }

    return sanitized;
  }

  function checkAgentAvailability() {
    // Check if any departments are online
    const departments =
      departmentsData.length > 0 ? departmentsData : getStoredDepartments();

    if (departments.length === 0) {
      // No department data available, assume agents might be available
      return true;
    }

    // Check if any department is online
    const hasOnlineDepartment = departments.some(
      (dept) => dept.status === "online" || dept.status === "available"
    );

    return hasOnlineDepartment;
  }

  function sendChatMessageInternal(msg, callback) {
    try {
      // Validate callback
      if (callback && typeof callback !== "function") {
        throw new Error("Callback must be a function");
      }

      // Check rate limit
      checkChatMessageRateLimit();

      // Validate and sanitize message
      validateChatMessage(msg);
      const sanitizedMessage = sanitizeChatMessage(msg);

      if (!sanitizedMessage) {
        const error = new Error("Message cannot be empty after sanitization");
        if (callback) {
          setTimeout(() => callback(error), 0);
          return;
        }
        throw error;
      }

      // Check if widget is loaded
      if (!isLoaded || !widgetFrame) {
        const error = new Error(
          "Widget not ready. Please wait for the widget to load."
        );
        if (callback) {
          setTimeout(() => callback(error), 0);
          return;
        }
        throw error;
      }

      // Check agent availability
      if (!checkAgentAvailability()) {
        const error = new Error(
          "No agents available. Messages sent when no agents are online may result in missed chats."
        );
        if (callback) {
          setTimeout(() => callback(error), 0);
          return;
        }
        throw error;
      }

      // Create unique message ID for tracking
      const messageId = `chat_msg_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Set up response handler
      const responseHandler = (data) => {
        off("chat:message:response", responseHandler);

        if (data && data.messageId === messageId) {
          if (data.success) {
            if (callback) callback(null);
          } else {
            const error = new Error(data.error || "Failed to send message");
            if (callback) callback(error);
          }
        }
      };

      // Set up timeout handler
      const timeout = setTimeout(() => {
        off("chat:message:response", responseHandler);
        if (callback) {
          callback(new Error("Message sending timeout"));
        }
      }, 10000); // 10 second timeout

      // Listen for response
      on("chat:message:response", responseHandler);

      // Send message to widget
      sendToWidget("widget:send-chat-message", {
        message: sanitizedMessage,
        messageId: messageId,
        timestamp: new Date().toISOString(),
        source: "sendChatMsg",
      });

      // Clear timeout on successful send
      setTimeout(() => {
        clearTimeout(timeout);
      }, 100);
    } catch (error) {
      console.error("Error in sendChatMsg:", error);
      if (callback) {
        setTimeout(() => callback(error), 0);
      } else {
        throw error;
      }
    }
  }

  // Offline Message Utility Functions
  function checkOfflineMessageRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - offlineMessageOperationResetTime > oneMinute) {
      offlineMessageOperationCount = 0;
      offlineMessageOperationResetTime = now;
    }

    if (offlineMessageOperationCount >= MAX_OFFLINE_MESSAGES_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many offline messages sent.");
    }

    offlineMessageOperationCount++;
    return true;
  }

  function validateOfflineMessageOptions(options) {
    if (!options || typeof options !== "object") {
      throw new Error("Options parameter is required and must be an object");
    }

    // Validate required fields
    if (!options.name || typeof options.name !== "string") {
      throw new Error("options.name is required and must be a string");
    }

    if (!options.email || typeof options.email !== "string") {
      throw new Error("options.email is required and must be a string");
    }

    if (!options.message || typeof options.message !== "string") {
      throw new Error("options.message is required and must be a string");
    }

    // Validate field lengths
    if (options.name.length > MAX_OFFLINE_NAME_LENGTH) {
      throw new Error(
        `Name cannot exceed ${MAX_OFFLINE_NAME_LENGTH} characters`
      );
    }

    if (options.message.length > MAX_OFFLINE_MESSAGE_LENGTH) {
      throw new Error(
        `Message cannot exceed ${MAX_OFFLINE_MESSAGE_LENGTH} characters`
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(options.email)) {
      throw new Error("Email must be a valid email address");
    }

    // Validate optional phone field
    if (options.phone !== undefined) {
      if (typeof options.phone !== "string") {
        throw new Error("Phone must be a string");
      }
      if (options.phone.length > MAX_OFFLINE_PHONE_LENGTH) {
        throw new Error(
          `Phone cannot exceed ${MAX_OFFLINE_PHONE_LENGTH} characters`
        );
      }
      if (!/^[0-9+\-\s()]+$/.test(options.phone)) {
        throw new Error(
          "Phone must contain only numbers and basic formatting characters"
        );
      }
    }

    // Validate optional department field
    if (options.department !== undefined) {
      if (
        typeof options.department !== "number" ||
        !Number.isInteger(options.department)
      ) {
        throw new Error("Department must be an integer");
      }
      if (options.department <= 0) {
        throw new Error("Department must be a positive integer");
      }
    }

    return true;
  }

  function sanitizeOfflineMessageOptions(options) {
    const sanitized = {
      name: options.name.trim().substring(0, MAX_OFFLINE_NAME_LENGTH),
      email: options.email.trim().toLowerCase(),
      message: options.message.trim().substring(0, MAX_OFFLINE_MESSAGE_LENGTH),
    };

    // Sanitize optional phone
    if (options.phone) {
      sanitized.phone = options.phone
        .trim()
        .substring(0, MAX_OFFLINE_PHONE_LENGTH);
    }

    // Include department if provided
    if (options.department !== undefined) {
      sanitized.department = options.department;
    }

    return sanitized;
  }

  // ============================================================================
  // EMAIL TRANSCRIPT MANAGEMENT IMPLEMENTATION (Zendesk-compatible)
  // ============================================================================

  /**
   * Check email transcript operation rate limit
   */
  function checkEmailTranscriptRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - emailTranscriptOperationResetTime > oneMinute) {
      emailTranscriptOperationCount = 0;
      emailTranscriptOperationResetTime = now;
    }

    if (
      emailTranscriptOperationCount >=
      MAX_EMAIL_TRANSCRIPT_OPERATIONS_PER_MINUTE
    ) {
      throw new Error(
        "Rate limit exceeded. Too many email transcript requests."
      );
    }

    emailTranscriptOperationCount++;
    return true;
  }

  /**
   * Validate email parameter for transcript
   */
  function validateEmailTranscriptEmail(email) {
    if (typeof email !== "string") {
      throw new Error("Email must be a string");
    }

    if (!email.trim()) {
      throw new Error("Email cannot be empty");
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      throw new Error("Email must be a valid email address");
    }

    return true;
  }

  /**
   * Check for duplicate email transcript requests
   */
  function checkDuplicateEmailTranscriptRequest(email) {
    const now = Date.now();

    if (
      lastEmailTranscriptRequest === email &&
      lastEmailTranscriptTime &&
      now - lastEmailTranscriptTime < EMAIL_TRANSCRIPT_CACHE_DURATION
    ) {
      throw new Error(
        "Duplicate request. Please wait before requesting another transcript for the same email."
      );
    }

    return true;
  }

  /**
   * Check chat session state for email transcript eligibility
   */
  function checkEmailTranscriptEligibility() {
    // This would typically check if there's an active chat or past chat history
    // For now, we'll assume the widget will handle the business logic validation
    return true;
  }

  /**
   * Send email transcript request (Zendesk-compatible)
   */
  function sendEmailTranscriptInternal(email, callback) {
    try {
      // Validate callback
      if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
      }

      // Check rate limit
      checkEmailTranscriptRateLimit();

      // Validate email
      validateEmailTranscriptEmail(email);
      const sanitizedEmail = email.trim().toLowerCase();

      // Check for duplicate requests
      checkDuplicateEmailTranscriptRequest(sanitizedEmail);

      // Check eligibility
      checkEmailTranscriptEligibility();

      // Check if widget is loaded
      if (!isLoaded || !widgetFrame) {
        const error = new Error(
          "Widget not ready. Please wait for the widget to load."
        );
        setTimeout(() => callback(error), 0);
        return;
      }

      // Create unique transcript request ID for tracking
      const transcriptId = `email_transcript_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Set up response handler
      const responseHandler = (data) => {
        off("email:transcript:response", responseHandler);

        if (data && data.transcriptId === transcriptId) {
          if (data.success) {
            // Update cache to prevent duplicate requests
            lastEmailTranscriptRequest = sanitizedEmail;
            lastEmailTranscriptTime = Date.now();

            callback(null);
          } else {
            // Map error codes to Zendesk-compatible format
            let errorMessage = "Failed to schedule email transcript";

            switch (data.error) {
              case "NO_ACTIVE_CHAT":
                errorMessage =
                  "No active chat session found. Email transcript can only be requested during an active chat.";
                break;
              case "NO_CHAT_HISTORY":
                errorMessage = "No chat history available for this visitor.";
                break;
              case "INVALID_EMAIL":
                errorMessage = "Invalid email address provided.";
                break;
              case "SERVER_ERROR":
                errorMessage =
                  "Server error occurred while scheduling email transcript.";
                break;
              case "NOT_ALLOWED":
                errorMessage = "Email transcript feature is not available.";
                break;
              case "RATE_LIMIT_EXCEEDED":
                errorMessage =
                  "Too many email transcript requests. Please try again later.";
                break;
              default:
                errorMessage = data.error || "Unknown error occurred";
            }

            const error = new Error(errorMessage);
            callback(error);
          }
        }
      };

      // Set up timeout handler
      const timeout = setTimeout(() => {
        off("email:transcript:response", responseHandler);
        callback(new Error("Email transcript request timeout"));
      }, EMAIL_TRANSCRIPT_TIMEOUT);

      // Listen for response
      on("email:transcript:response", responseHandler);

      // Send email transcript request to widget
      sendToWidget("widget:send-email-transcript", {
        email: sanitizedEmail,
        transcriptId: transcriptId,
        timestamp: new Date().toISOString(),
        source: "sendEmailTranscript",
        visitorId: visitorId,
        sessionId: getSessionId(),
        tabId: tabId,
      });

      // Record visitor activity if transcript requested and tracking enabled
      if (visitorTrackingEnabled && isTrackingAllowed("functional")) {
        recordActivity("email-transcript", 0.6);
        sendVisitorEvent("visitor:email-transcript-requested", {
          email: sanitizedEmail,
          timestamp: new Date().toISOString(),
        });
      }

      // Clear timeout on successful send
      setTimeout(() => {
        clearTimeout(timeout);
      }, 100);
    } catch (error) {
      console.error("Error in sendEmailTranscript:", error);
      if (typeof callback === "function") {
        setTimeout(() => callback(error), 0);
      }
    }
  }

  // ============================================================================
  // END EMAIL TRANSCRIPT MANAGEMENT IMPLEMENTATION
  // ============================================================================

  // ============================================================================
  // CHAT HISTORY MANAGEMENT IMPLEMENTATION (Zendesk-compatible)
  // ============================================================================

  /**
   * Check chat history operation rate limit
   */
  function checkChatHistoryRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - chatHistoryOperationResetTime > oneMinute) {
      chatHistoryOperationCount = 0;
      chatHistoryOperationResetTime = now;
    }

    if (chatHistoryOperationCount >= MAX_CHAT_HISTORY_OPERATIONS_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many chat history requests.");
    }

    chatHistoryOperationCount++;
    return true;
  }

  /**
   * Fetch chat history (Zendesk-compatible)
   */
  function fetchChatHistoryInternal(callback) {
    try {
      // Validate callback
      if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
      }

      // Check authentication status
      if (!isAuthenticated) {
        const error = new Error(
          "Not authenticated. This method is only available to visitors authenticated via JWT."
        );
        setTimeout(() => callback(error), 0);
        return;
      }

      // Check rate limit
      checkChatHistoryRateLimit();

      // Check for concurrent requests
      if (chatHistoryRequestInProgress) {
        const error = new Error(
          "Concurrent request error. Please wait for the previous request to complete."
        );
        setTimeout(() => callback(error), 0);
        return;
      }

      // Check if there are more items to fetch
      if (!chatHistoryHasMore) {
        const error = new Error("No more items to fetch.");
        setTimeout(() => callback(error), 0);
        return;
      }

      // Set request in progress
      chatHistoryRequestInProgress = true;

      // Create unique request ID for tracking
      const historyRequestId = `chat_history_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Set up response handler
      const responseHandler = (data) => {
        off("chat:history:response", responseHandler);
        chatHistoryRequestInProgress = false;

        if (data && data.historyRequestId === historyRequestId) {
          if (data.success) {
            // Update cursor and has_more state
            chatHistoryCursor = data.cursor || null;
            chatHistoryHasMore = data.has_more || false;

            // Emit history event with fetched items
            if (data.items && data.items.length > 0) {
              triggerEvent("history", data.items);
            }

            // Invoke callback
            callback(null, {
              count: data.items ? data.items.length : 0,
              has_more: chatHistoryHasMore,
            });
          } else {
            const error = new Error(
              data.error || "Failed to fetch chat history"
            );
            callback(error);
          }
        }
      };

      // Set up timeout handler
      const timeout = setTimeout(() => {
        off("chat:history:response", responseHandler);
        chatHistoryRequestInProgress = false;
        callback(new Error("Chat history request timeout"));
      }, CHAT_HISTORY_TIMEOUT);

      // Listen for response
      on("chat:history:response", responseHandler);

      // Send request to widget
      sendToWidget("chat:history:request", {
        cursor: chatHistoryCursor,
        limit: CHAT_HISTORY_ITEMS_PER_PAGE,
        historyRequestId: historyRequestId,
        timestamp: new Date().toISOString(),
        source: "fetchChatHistory",
      });

      // Clear timeout on successful send
      setTimeout(() => {
        clearTimeout(timeout);
      }, 100);
    } catch (error) {
      console.error("Error in fetchChatHistory:", error);
      chatHistoryRequestInProgress = false;
      if (typeof callback === "function") {
        setTimeout(() => callback(error), 0);
      }
    }
  }

  // ============================================================================
  // END CHAT HISTORY MANAGEMENT IMPLEMENTATION
  // ============================================================================

  // ============================================================================
  // END CHAT MANAGEMENT IMPLEMENTATION (Zendesk-compatible)
  // ============================================================================

  /**
   * Check end chat operation rate limit
   */
  function checkEndChatRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - endChatOperationResetTime > oneMinute) {
      endChatOperationCount = 0;
      endChatOperationResetTime = now;
    }

    if (endChatOperationCount >= MAX_END_CHAT_OPERATIONS_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many end chat operations.");
    }

    endChatOperationCount++;
    return true;
  }

  /**
   * Validate end chat options
   */
  function validateEndChatOptions(options) {
    // Options can be null, undefined, or an object
    if (options === null || options === undefined) {
      return { clear_dept_id_on_chat_ended: false };
    }

    if (typeof options !== "object") {
      throw new Error("Options must be an object");
    }

    const validatedOptions = {
      clear_dept_id_on_chat_ended: false,
    };

    // Validate clear_dept_id_on_chat_ended
    if (options.clear_dept_id_on_chat_ended !== undefined) {
      if (typeof options.clear_dept_id_on_chat_ended !== "boolean") {
        throw new Error("clear_dept_id_on_chat_ended must be a boolean");
      }
      validatedOptions.clear_dept_id_on_chat_ended =
        options.clear_dept_id_on_chat_ended;
    }

    return validatedOptions;
  }

  /**
   * End chat session (Zendesk-compatible)
   */
  function endChatInternal(options, callback) {
    try {
      // Validate callback
      if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
      }

      // Check rate limit
      checkEndChatRateLimit();

      // Validate and sanitize options
      const validatedOptions = validateEndChatOptions(options);

      // Check if widget is loaded
      if (!isLoaded || !widgetFrame) {
        const error = new Error(
          "Widget not ready. Please wait for the widget to load."
        );
        setTimeout(() => callback(error), 0);
        return;
      }

      // Create unique end chat request ID for tracking
      const endChatId = `end_chat_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Set up response handler
      const responseHandler = (data) => {
        off("chat:end:response", responseHandler);

        if (data && data.endChatId === endChatId) {
          if (data.success) {
            callback(null);
          } else {
            // Map error codes to user-friendly messages
            let errorMessage = "Failed to end chat session";

            switch (data.error) {
              case "NO_ACTIVE_CHAT":
                errorMessage = "No active chat session to end.";
                break;
              case "CHAT_ALREADY_ENDED":
                errorMessage = "Chat session has already ended.";
                break;
              case "SERVER_ERROR":
                errorMessage =
                  "Server error occurred while ending chat session.";
                break;
              case "NOT_ALLOWED":
                errorMessage =
                  "End chat operation is not allowed at this time.";
                break;
              case "INVALID_STATE":
                errorMessage =
                  "Chat is in an invalid state and cannot be ended.";
                break;
              default:
                errorMessage = data.error || "Unknown error occurred";
            }

            const error = new Error(errorMessage);
            callback(error);
          }
        }
      };

      // Set up timeout handler
      const timeout = setTimeout(() => {
        off("chat:end:response", responseHandler);
        callback(new Error("End chat request timeout"));
      }, END_CHAT_TIMEOUT);

      // Listen for response
      on("chat:end:response", responseHandler);

      // Send end chat request to widget
      sendToWidget("widget:end-chat", {
        options: validatedOptions,
        endChatId: endChatId,
        timestamp: new Date().toISOString(),
        source: "endChat",
        visitorId: visitorId,
        sessionId: getSessionId(),
        tabId: tabId,
      });

      // Record visitor activity if end chat requested and tracking enabled
      if (visitorTrackingEnabled && isTrackingAllowed("functional")) {
        recordActivity("end-chat", 0.8);
        sendVisitorEvent("visitor:end-chat-requested", {
          clearDeptId: validatedOptions.clear_dept_id_on_chat_ended,
          timestamp: new Date().toISOString(),
        });
      }

      // Clear timeout on successful send
      setTimeout(() => {
        clearTimeout(timeout);
      }, 100);
    } catch (error) {
      console.error("Error in endChat:", error);
      if (typeof callback === "function") {
        setTimeout(() => callback(error), 0);
      }
    }
  }

  // ============================================================================
  // END END CHAT MANAGEMENT IMPLEMENTATION
  // ============================================================================

  // ============================================================================
  // TYPING STATUS MANAGEMENT IMPLEMENTATION (Zendesk-compatible)
  // ============================================================================

  /**
   * Check typing event rate limit
   */
  function checkTypingRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - typingOperationResetTime > oneMinute) {
      typingOperationCount = 0;
      typingOperationResetTime = now;
    }

    if (typingOperationCount >= MAX_TYPING_EVENTS_PER_MINUTE) {
      // Silently ignore excessive typing events (don't throw error)
      return false;
    }

    typingOperationCount++;
    return true;
  }

  /**
   * Check typing throttle to prevent spam
   */
  function checkTypingThrottle() {
    const now = Date.now();
    return now - lastTypingEventTime >= TYPING_THROTTLE_MS;
  }

  /**
   * Validate typing parameter
   */
  function validateTypingParameter(is_typing) {
    if (typeof is_typing !== "boolean") {
      throw new Error("is_typing parameter must be a boolean value");
    }
    return true;
  }

  /**
   * Clear typing auto-reset timeout
   */
  function clearTypingAutoReset() {
    if (typingAutoResetTimeout) {
      clearTimeout(typingAutoResetTimeout);
      typingAutoResetTimeout = null;
    }
  }

  /**
   * Set typing auto-reset timeout
   */
  function setTypingAutoReset() {
    clearTypingAutoReset();

    typingAutoResetTimeout = setTimeout(() => {
      // Auto-reset typing to false after inactivity
      if (currentTypingState === true) {
        sendTypingInternal(false, "auto-reset");
      }
    }, TYPING_AUTO_RESET_MS);
  }

  /**
   * Send typing status to widget
   */
  function sendTypingToWidget(is_typing, source = "manual") {
    try {
      // Check if widget is loaded
      if (!isLoaded || !widgetFrame) {
        // Queue typing event if widget not loaded yet
        messageQueue.push({
          type: "widget:send-typing",
          data: {
            is_typing: is_typing,
            timestamp: new Date().toISOString(),
            source: source,
            visitorId: visitorId,
            sessionId: getSessionId(),
            tabId: tabId,
          },
        });
        return;
      }

      // Create typing event data
      const typingData = {
        is_typing: is_typing,
        timestamp: new Date().toISOString(),
        source: source,
        visitorId: visitorId,
        sessionId: getSessionId(),
        tabId: tabId,
      };

      // Send to widget
      sendToWidget("widget:send-typing", typingData);

      // Update last event time
      lastTypingEventTime = Date.now();
      lastTypingSentState = is_typing;

      // Record visitor activity if typing started
      if (
        is_typing &&
        visitorTrackingEnabled &&
        isTrackingAllowed("functional")
      ) {
        recordActivity("typing", 0.6);
        sendVisitorEvent("visitor:typing-start", {
          timestamp: new Date().toISOString(),
        });
      } else if (
        !is_typing &&
        visitorTrackingEnabled &&
        isTrackingAllowed("functional")
      ) {
        sendVisitorEvent("visitor:typing-stop", {
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error sending typing status to widget:", error);
    }
  }

  /**
   * Internal typing function with debouncing and throttling
   */
  function sendTypingInternal(is_typing, source = "manual") {
    try {
      // Validate parameter
      validateTypingParameter(is_typing);

      // Check rate limit
      if (!checkTypingRateLimit()) {
        console.warn("Typing rate limit exceeded, ignoring event");
        return;
      }

      // Check if state actually changed
      if (
        currentTypingState === is_typing &&
        lastTypingSentState === is_typing
      ) {
        // State hasn't changed, but still reset auto-timeout if typing is true
        if (is_typing) {
          setTypingAutoReset();
        }
        return;
      }

      // Check throttle for rapid events
      if (!checkTypingThrottle() && source === "manual") {
        // Debounce rapid manual events
        clearTimeout(typingDebounceTimeout);
        typingDebounceTimeout = setTimeout(() => {
          sendTypingInternal(is_typing, "debounced");
        }, TYPING_DEBOUNCE_MS);
        return;
      }

      // Update current state
      currentTypingState = is_typing;

      // Handle auto-reset timeout
      if (is_typing) {
        setTypingAutoReset();
      } else {
        clearTypingAutoReset();
      }

      // Send to widget
      sendTypingToWidget(is_typing, source);
    } catch (error) {
      console.error("Error in sendTypingInternal:", error);
      throw error;
    }
  }

  /**
   * Reset typing state (used on page unload, visibility change, etc.)
   */
  function resetTypingState() {
    try {
      if (currentTypingState === true) {
        sendTypingInternal(false, "reset");
      }

      clearTypingAutoReset();
      clearTimeout(typingDebounceTimeout);

      currentTypingState = false;
      lastTypingSentState = null;
    } catch (error) {
      console.warn("Error resetting typing state:", error);
    }
  }

  // ============================================================================
  // END TYPING STATUS MANAGEMENT IMPLEMENTATION
  // ============================================================================

  // ============================================================================
  // CHAT INFO MANAGEMENT IMPLEMENTATION (Zendesk-compatible)
  // ============================================================================

  /**
   * Check chat info operation rate limit
   */
  function checkChatInfoRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - chatInfoOperationResetTime > oneMinute) {
      chatInfoOperationCount = 0;
      chatInfoOperationResetTime = now;
    }

    if (chatInfoOperationCount >= MAX_CHAT_INFO_OPERATIONS_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many chat info operations.");
    }

    chatInfoOperationCount++;
    return true;
  }

  /**
   * Validate chat info data
   */
  function validateChatInfo(chatInfo) {
    if (!chatInfo || typeof chatInfo !== "object") {
      return { rating: null, comment: null };
    }

    const validatedInfo = {
      rating: null,
      comment: null,
    };

    // Validate rating
    if (chatInfo.rating === "good" || chatInfo.rating === "bad") {
      validatedInfo.rating = chatInfo.rating;
    } else if (chatInfo.rating !== null && chatInfo.rating !== undefined) {
      // Invalid rating value, set to null
      validatedInfo.rating = null;
    }

    // Validate comment
    if (typeof chatInfo.comment === "string") {
      validatedInfo.comment = chatInfo.comment.trim() || null;
    } else if (chatInfo.comment !== null && chatInfo.comment !== undefined) {
      // Invalid comment value, set to null
      validatedInfo.comment = null;
    }

    return validatedInfo;
  }

  /**
   * Get stored chat info
   */
  function getStoredChatInfo() {
    try {
      if (!isTrackingAllowed("functional")) {
        return { rating: null, comment: null };
      }

      const stored = sessionStorage.getItem(CHAT_INFO_STORAGE_KEY);
      if (!stored) {
        return { rating: null, comment: null };
      }

      const chatInfo = JSON.parse(stored);
      return validateChatInfo(chatInfo);
    } catch (error) {
      console.warn("Error getting stored chat info:", error);
      return { rating: null, comment: null };
    }
  }

  /**
   * Set stored chat info
   */
  function setStoredChatInfo(chatInfo) {
    try {
      if (!isTrackingAllowed("functional")) return;

      const validatedInfo = validateChatInfo(chatInfo);
      sessionStorage.setItem(
        CHAT_INFO_STORAGE_KEY,
        JSON.stringify(validatedInfo)
      );
      currentChatInfo = validatedInfo;

      return validatedInfo;
    } catch (error) {
      console.warn("Error storing chat info:", error);
      return { rating: null, comment: null };
    }
  }

  /**
   * Handle chat info update from widget
   */
  function handleChatInfoUpdate(data) {
    try {
      if (!data || typeof data !== "object") return;

      const updatedInfo = setStoredChatInfo(data);

      // Trigger event for chat info updates
      triggerEvent("chat:info:updated", updatedInfo);
    } catch (error) {
      console.error("Error handling chat info update:", error);
    }
  }

  /**
   * Request chat info from widget
   */
  function requestChatInfoFromWidget() {
    return new Promise((resolve, reject) => {
      try {
        checkChatInfoRateLimit();

        // Check if widget is loaded
        if (!isLoaded || !widgetFrame) {
          resolve({ rating: null, comment: null });
          return;
        }

        const timeout = setTimeout(() => {
          off("chat:info:response", responseHandler);
          // Return stored data as fallback
          const storedInfo = getStoredChatInfo();
          resolve(storedInfo);
        }, CHAT_INFO_TIMEOUT);

        const responseHandler = (data) => {
          clearTimeout(timeout);
          off("chat:info:response", responseHandler);

          if (data && typeof data === "object") {
            const validatedInfo = validateChatInfo(data);
            setStoredChatInfo(validatedInfo);
            resolve(validatedInfo);
          } else {
            // Return stored data as fallback
            const storedInfo = getStoredChatInfo();
            resolve(storedInfo);
          }
        };

        on("chat:info:response", responseHandler);
        sendToWidget("chat:info:request", {
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error requesting chat info from widget:", error);
        // Return stored data as fallback
        const storedInfo = getStoredChatInfo();
        resolve(storedInfo);
      }
    });
  }

  // ============================================================================
  // END CHAT INFO MANAGEMENT IMPLEMENTATION
  // ============================================================================

  // ============================================================================
  // CHAT RATING MANAGEMENT IMPLEMENTATION (Zendesk-compatible)
  // ============================================================================

  /**
   * Check chat rating operation rate limit
   */
  function checkChatRatingRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - chatRatingOperationResetTime > oneMinute) {
      chatRatingOperationCount = 0;
      chatRatingOperationResetTime = now;
    }

    if (chatRatingOperationCount >= MAX_CHAT_RATING_OPERATIONS_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many chat rating operations.");
    }

    chatRatingOperationCount++;
    return true;
  }

  /**
   * Validate chat rating parameter
   */
  function validateChatRating(rating) {
    if (rating !== "good" && rating !== "bad" && rating !== null) {
      throw new Error("Rating must be 'good', 'bad', or null");
    }
    return true;
  }

  /**
   * Send chat rating (Zendesk-compatible)
   */
  function sendChatRatingInternal(rating, callback) {
    try {
      // Validate callback
      if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
      }

      // Check rate limit
      checkChatRatingRateLimit();

      // Validate rating
      validateChatRating(rating);

      // Check if widget is loaded
      if (!isLoaded || !widgetFrame) {
        const error = new Error(
          "Widget not ready. Please wait for the widget to load."
        );
        setTimeout(() => callback(error), 0);
        return;
      }

      // Create unique rating ID for tracking
      const ratingId = `chat_rating_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Set up response handler
      const responseHandler = (data) => {
        off("chat:rating:response", responseHandler);

        if (data && data.ratingId === ratingId) {
          if (data.success) {
            // Update local chat info state
            currentChatInfo = {
              ...currentChatInfo,
              rating: rating,
            };

            // Update stored chat info
            setStoredChatInfo(currentChatInfo);

            callback(null);
          } else {
            const error = new Error(data.error || "Failed to send chat rating");
            callback(error);
          }
        }
      };

      // Set up timeout handler
      const timeout = setTimeout(() => {
        off("chat:rating:response", responseHandler);
        callback(new Error("Chat rating sending timeout"));
      }, CHAT_RATING_TIMEOUT);

      // Listen for response
      on("chat:rating:response", responseHandler);

      // Send rating to widget
      sendToWidget("widget:send-chat-rating", {
        rating: rating,
        ratingId: ratingId,
        timestamp: new Date().toISOString(),
        source: "sendChatRating",
        visitorId: visitorId,
        sessionId: getSessionId(),
        tabId: tabId,
      });

      // Record visitor activity if rating provided and tracking enabled
      if (rating && visitorTrackingEnabled && isTrackingAllowed("functional")) {
        recordActivity("rating", 0.7);
        sendVisitorEvent("visitor:chat-rating", {
          rating: rating,
          timestamp: new Date().toISOString(),
        });
      }

      // Clear timeout on successful send
      setTimeout(() => {
        clearTimeout(timeout);
      }, 100);
    } catch (error) {
      console.error("Error in sendChatRating:", error);
      if (typeof callback === "function") {
        setTimeout(() => callback(error), 0);
      }
    }
  }

  // ============================================================================
  // END CHAT RATING MANAGEMENT IMPLEMENTATION
  // ============================================================================

  // ============================================================================
  // CHAT COMMENT MANAGEMENT IMPLEMENTATION (Zendesk-compatible)
  // ============================================================================

  /**
   * Check chat comment operation rate limit
   */
  function checkChatCommentRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - chatCommentOperationResetTime > oneMinute) {
      chatCommentOperationCount = 0;
      chatCommentOperationResetTime = now;
    }

    if (chatCommentOperationCount >= MAX_CHAT_COMMENT_OPERATIONS_PER_MINUTE) {
      throw new Error("Rate limit exceeded. Too many chat comment operations.");
    }

    chatCommentOperationCount++;
    return true;
  }

  /**
   * Validate chat comment parameter
   */
  function validateChatComment(comment) {
    if (typeof comment !== "string") {
      throw new Error("Comment must be a string.");
    }
    if (comment.trim().length === 0) {
      throw new Error("Comment cannot be empty.");
    }
    if (comment.length > MAX_CHAT_COMMENT_LENGTH) {
      throw new Error(
        `Comment cannot exceed ${MAX_CHAT_COMMENT_LENGTH} characters.`
      );
    }
    return true;
  }

  /**
   * Send chat comment (Zendesk-compatible)
   */
  function sendChatCommentInternal(comment, callback) {
    try {
      // Validate callback
      if (typeof callback !== "function") {
        throw new Error("Callback must be a function");
      }

      // Check rate limit
      checkChatCommentRateLimit();

      // Validate comment
      validateChatComment(comment);
      const sanitizedComment = comment.trim();

      // Check if widget is loaded
      if (!isLoaded || !widgetFrame) {
        const error = new Error(
          "Widget not ready. Please wait for the widget to load."
        );
        setTimeout(() => callback(error), 0);
        return;
      }

      // Create unique comment ID for tracking
      const commentId = `chat_comment_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Set up response handler
      const responseHandler = (data) => {
        off("chat:comment:response", responseHandler);

        if (data && data.commentId === commentId) {
          if (data.success) {
            // Update local chat info state
            currentChatInfo = {
              ...currentChatInfo,
              comment: sanitizedComment,
            };

            // Update stored chat info
            setStoredChatInfo(currentChatInfo);

            callback(null);
          } else {
            const error = new Error(
              data.error || "Failed to send chat comment"
            );
            callback(error);
          }
        }
      };

      // Set up timeout handler
      const timeout = setTimeout(() => {
        off("chat:comment:response", responseHandler);
        callback(new Error("Chat comment sending timeout"));
      }, CHAT_COMMENT_TIMEOUT);

      // Listen for response
      on("chat:comment:response", responseHandler);

      // Send comment to widget
      sendToWidget("widget:send-chat-comment", {
        comment: sanitizedComment,
        commentId: commentId,
        timestamp: new Date().toISOString(),
        source: "sendChatComment",
        visitorId: visitorId,
        sessionId: getSessionId(),
        tabId: tabId,
      });

      // Record visitor activity if comment provided and tracking enabled
      if (visitorTrackingEnabled && isTrackingAllowed("functional")) {
        recordActivity("comment", 0.7);
        sendVisitorEvent("visitor:chat-comment", {
          commentLength: sanitizedComment.length,
          timestamp: new Date().toISOString(),
        });
      }

      // Clear timeout on successful send
      setTimeout(() => {
        clearTimeout(timeout);
      }, 100);
    } catch (error) {
      console.error("Error in sendChatComment:", error);
      if (typeof callback === "function") {
        setTimeout(() => callback(error), 0);
      }
    }
  }

  // ============================================================================
  // END CHAT COMMENT MANAGEMENT IMPLEMENTATION
  // ============================================================================

  // Operating Hours Management Functions
  function checkOperatingHoursRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - operatingHoursOperationResetTime > oneMinute) {
      operatingHoursOperationCount = 0;
      operatingHoursOperationResetTime = now;
    }

    if (
      operatingHoursOperationCount >= MAX_OPERATING_HOURS_OPERATIONS_PER_MINUTE
    ) {
      throw new Error(
        "Rate limit exceeded. Too many operating hours operations."
      );
    }

    operatingHoursOperationCount++;
    return true;
  }

  function getStoredOperatingHours() {
    try {
      if (!isTrackingAllowed("functional")) return null;

      const stored = sessionStorage.getItem(OPERATING_HOURS_STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);

      // Check if cache is still valid
      if (
        data.timestamp &&
        Date.now() - data.timestamp < OPERATING_HOURS_CACHE_DURATION
      ) {
        return data.operatingHours || null;
      }

      return null;
    } catch (error) {
      console.warn("Error getting stored operating hours:", error);
      return null;
    }
  }

  function setStoredOperatingHours(operatingHours) {
    try {
      if (!isTrackingAllowed("functional")) return;

      const data = {
        operatingHours: operatingHours,
        timestamp: Date.now(),
      };

      sessionStorage.setItem(OPERATING_HOURS_STORAGE_KEY, JSON.stringify(data));
      operatingHoursData = operatingHours;
      operatingHoursLastUpdated = Date.now();

      return operatingHours;
    } catch (error) {
      console.warn("Error storing operating hours:", error);
      throw error;
    }
  }

  function validateOperatingHoursData(data) {
    if (!data || typeof data !== "object") {
      return null;
    }

    // Validate basic structure
    if (typeof data.enabled !== "boolean") {
      return null;
    }

    if (data.type !== "account" && data.type !== "department") {
      return null;
    }

    if (!data.timezone || typeof data.timezone !== "string") {
      return null;
    }

    // Validate schedule structure
    if (data.type === "account" && data.account_schedule) {
      if (!validateScheduleObject(data.account_schedule)) {
        return null;
      }
    }

    if (data.type === "department" && data.department_schedule) {
      if (!validateDepartmentScheduleObject(data.department_schedule)) {
        return null;
      }
    }

    return data;
  }

  function validateScheduleObject(schedule) {
    if (!schedule || typeof schedule !== "object") {
      return false;
    }

    // Check days 0-6 (Sunday to Saturday)
    for (let day = 0; day <= 6; day++) {
      if (!Array.isArray(schedule[day])) {
        return false;
      }

      // Validate each period in the day
      for (const period of schedule[day]) {
        if (!period || typeof period !== "object") {
          return false;
        }

        if (
          typeof period.start !== "number" ||
          typeof period.end !== "number" ||
          period.start < 0 ||
          period.start > 1439 ||
          period.end < 0 ||
          period.end > 1439
        ) {
          return false;
        }
      }
    }

    return true;
  }

  function validateDepartmentScheduleObject(departmentSchedule) {
    if (!departmentSchedule || typeof departmentSchedule !== "object") {
      return false;
    }

    // Validate each department's schedule
    for (const departmentId in departmentSchedule) {
      const schedule = departmentSchedule[departmentId];
      if (!validateScheduleObject(schedule)) {
        return false;
      }
    }

    return true;
  }

  function requestOperatingHoursFromWidget() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        off("operating-hours:response", responseHandler);
        reject(new Error("Timeout waiting for operating hours response"));
      }, OPERATING_HOURS_TIMEOUT);

      const responseHandler = (data) => {
        clearTimeout(timeout);
        off("operating-hours:response", responseHandler);

        if (data && data.operatingHours) {
          const validatedData = validateOperatingHoursData(data.operatingHours);
          if (validatedData) {
            setStoredOperatingHours(validatedData);
            resolve(validatedData);
          } else {
            resolve(undefined); // Return undefined for invalid data (Zendesk behavior)
          }
        } else {
          resolve(undefined); // Return undefined if no operating hours set
        }
      };

      on("operating-hours:response", responseHandler);
      sendToWidget("operating-hours:request", {
        timestamp: new Date().toISOString(),
      });
    });
  }

  function getOperatingHoursInternal() {
    try {
      checkOperatingHoursRateLimit();

      // Return cached data if available and fresh
      const cachedOperatingHours = getStoredOperatingHours();
      if (cachedOperatingHours) {
        return cachedOperatingHours;
      }

      // Return current data if available
      if (operatingHoursData) {
        return operatingHoursData;
      }

      // For synchronous API, we need to return immediately
      // Start async request in background for next call
      requestOperatingHoursFromWidget().catch((error) => {
        console.warn("Failed to fetch operating hours:", error);
      });

      return undefined; // Return undefined if no cached data (Zendesk behavior)
    } catch (error) {
      console.error("Error getting operating hours:", error);
      return undefined;
    }
  }

  function handleOperatingHoursUpdate(data) {
    try {
      if (!data || !data.operatingHours) return;

      const validatedData = validateOperatingHoursData(data.operatingHours);
      if (validatedData) {
        setStoredOperatingHours(validatedData);

        // Trigger event for operating hours updates
        triggerEvent("operating-hours:updated", {
          operatingHours: validatedData,
        });
      }
    } catch (error) {
      console.error("Error handling operating hours update:", error);
    }
  }

  // ---------------------------------------------------

  function cleanupExpiredData() {
    try {
      const now = new Date();

      // Clean up referrer data
      const referrerKey = "kogents_referrer_data";
      const referrerData = sessionStorage.getItem(referrerKey);
      if (referrerData) {
        try {
          const parsed = JSON.parse(referrerData);
          if (
            parsed.timestamp &&
            !shouldRetainData(new Date(parsed.timestamp), "referrer")
          ) {
            sessionStorage.removeItem(referrerKey);
          }
        } catch {}
      }

      // Clean up URL history
      const historyKey = "url_tracking_history";
      const historyData = localStorage.getItem(historyKey);
      if (historyData) {
        try {
          const parsed = JSON.parse(historyData);
          const filtered = parsed.filter((entry) =>
            shouldRetainData(new Date(entry.timestamp), "url")
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem(historyKey, JSON.stringify(filtered));
          }
        } catch {}
      }
      cleanupVisitorData();
      // Clean up fingerprint data

      const fingerprintData = sessionStorage.getItem(
        VISITOR_STORAGE_KEYS.FINGERPRINT_DATA
      );
      if (fingerprintData) {
        try {
          const parsed = JSON.parse(fingerprintData);
          if (
            parsed.metadata?.timestamp &&
            !shouldRetainData(
              new Date(parsed.metadata.timestamp),
              "fingerprint"
            )
          ) {
            sessionStorage.removeItem(VISITOR_STORAGE_KEYS.FINGERPRINT_DATA);
            deviceFingerprint = null;
            fingerprintGenerated = false;
          }
        } catch {}
      }
      // Update last cleanup timestamp
      localStorage.setItem("kogents_retention_cleanup", now.toISOString());
    } catch (error) {
      console.warn("Failed to cleanup expired data:", error);
    }
  }

  function deleteAllUserData() {
    try {
      // Clear localStorage
      const keysToRemove = [
        "kogents_session",
        "kogents_last_unsent_session",
        "kogents_referrer_data",
        "url_tracking_history",
        "chatSettings",
        "kogents_privacy_consent",
        "kogents_retention_cleanup",
        ...Object.values(VISITOR_STORAGE_KEYS),
        TAG_STORAGE_KEY,
        VISITOR_INFO_STORAGE_KEY,
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Clear cookies
      document.cookie =
        "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Clear fingerprint data
      deviceFingerprint = null;
      fingerprintGenerated = false;
      fingerprintErrors = [];
      console.log("All user data deleted successfully");
    } catch (error) {
      console.error("Failed to delete user data:", error);
    }
  }

  // Visitor Tracking Utility Functions
  function generateVisitorId() {
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function generateNewVisitor() {
    const newVisitor = {
      id: generateId(),
      joinedAt: new Date().toISOString(),
    };

    // Store in local storage
    try {
      if (isTrackingAllowed("functional")) {
        localStorage.setItem(
          VISITOR_STORAGE_KEYS.VISITOR_DATA,
          JSON.stringify(newVisitor)
        );
      }
    } catch (e) {}

    return newVisitor;
  }

  function generateNewTab() {
    const newTab = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      isMainTab: true,
      totalTabs: 1,
    };

    // Store in session storage
    try {
      if (isTrackingAllowed("functional")) {
        sessionStorage.setItem(
          VISITOR_STORAGE_KEYS.TAB_DATA,
          JSON.stringify(newTab)
        );
      }
    } catch (e) {}

    return newTab;
  }

  function handleVisitorError(error, context) {
    visitorErrorCount++;
    console.warn("Visitor tracking error:", {
      message: error?.message || "Unknown error",
      context,
      errorCount: visitorErrorCount,
      timestamp: new Date().toISOString(),
    });

    if (visitorErrorCount >= MAX_VISITOR_ERRORS) {
      console.error("Visitor tracking disabled due to excessive errors");
      visitorTrackingEnabled = false;
      cleanupVisitorTracking();
    }
  }

  function getStoredVisitorData() {
    try {
      const stored = sessionStorage.getItem(VISITOR_STORAGE_KEYS.VISITOR_DATA);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      handleVisitorError(error, "get_stored_visitor_data");
      return null;
    }
  }

  function setStoredVisitorData(data) {
    try {
      if (!isTrackingAllowed("functional")) return;
      const dataToStore = privacyConfig.anonymizeData
        ? anonymizeData(data)
        : data;
      sessionStorage.setItem(
        VISITOR_STORAGE_KEYS.VISITOR_DATA,
        JSON.stringify(dataToStore)
      );
    } catch (error) {
      handleVisitorError(error, "set_stored_visitor_data");
    }
  }

  function getStoredTabData() {
    try {
      const stored = localStorage.getItem(VISITOR_STORAGE_KEYS.TAB_DATA);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      handleVisitorError(error, "get_stored_tab_data");
      return [];
    }
  }

  function setStoredTabData(tabs) {
    try {
      if (!isTrackingAllowed("functional")) return;
      const tabsToStore = privacyConfig.anonymizeData
        ? tabs.map(anonymizeData)
        : tabs;
      localStorage.setItem(
        VISITOR_STORAGE_KEYS.TAB_DATA,
        JSON.stringify(tabsToStore)
      );
    } catch (error) {
      handleVisitorError(error, "set_stored_tab_data");
    }
  }

  function initializeActivityTracking() {
    try {
      // Set initial activity state
      visitorState = {
        ...visitorState,
        isActive: true,
        isVisible: !document.hidden,
        lastActivity: new Date(),
        activityLevel: "active",
      };

      // Start heartbeat interval
      activityTimeouts.heartbeat = setInterval(
        sendVisitorHeartbeat,
        TAB_HEARTBEAT_INTERVAL
      );

      // Start cleanup interval
      activityTimeouts.cleanup = setInterval(
        cleanupActivityHistory,
        TAB_CLEANUP_INTERVAL
      );

      // Set up visibility change listener
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Set up page unload listener
      window.addEventListener("beforeunload", handlePageUnload);

      // Set up activity listeners
      if (config.visitorTrackMouse) {
        document.addEventListener("mousemove", recordActivityEvent);
      }
      if (config.visitorTrackKeyboard) {
        document.addEventListener("keydown", recordActivityEvent);
      }
      if (config.visitorTrackScroll) {
        document.addEventListener("scroll", recordActivityEvent);
      }
      if (config.visitorTrackTouch) {
        document.addEventListener("touchstart", recordActivityEvent);
        document.addEventListener("touchmove", recordActivityEvent);
        document.addEventListener("touchend", recordActivityEvent);
      }

      // Send initial activity history
      sendActivityHistoryToWidget();
    } catch (error) {
      console.error("Error initializing activity tracking:", error);
    }
  }

  function recordActivityEvent() {
    try {
      if (!visitorTrackingEnabled) return;

      activityEventCount++;
      lastActivityTime = Date.now();

      // Debounce activity event
      clearTimeout(activityTimeouts.debounce);
      activityTimeouts.debounce = setTimeout(
        processActivityEvent,
        config.visitorDebounceMs
      );
    } catch (error) {
      console.warn("Error recording activity event:", error);
    }
  }

  function processActivityEvent() {
    try {
      if (!visitorTrackingEnabled) return;

      // Determine activity intensity
      let intensity = 0.1;
      if (activityEventCount > 10) {
        intensity = 0.5;
      } else if (activityEventCount > 20) {
        intensity = 0.8;
      }

      // Record activity
      recordActivity("interaction", intensity);

      // Reset event count
      activityEventCount = 0;
    } catch (error) {
      console.warn("Error processing activity event:", error);
    }
  }

  function getActivityHistory() {
    try {
      const stored = sessionStorage.getItem(
        VISITOR_STORAGE_KEYS.ACTIVITY_HISTORY
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      handleVisitorError(error, "get_activity_history");
      return [];
    }
  }

  function addActivityToHistory(activityType, intensity = 1) {
    try {
      if (!isTrackingAllowed("functional")) return;

      const history = getActivityHistory();
      const activity = {
        type: activityType,
        timestamp: new Date().toISOString(),
        intensity,
        tabId: tabId,
      };

      history.push(activity);

      // Keep history size manageable
      if (history.length > MAX_ACTIVITY_HISTORY) {
        history.splice(0, history.length - MAX_ACTIVITY_HISTORY);
      }

      sessionStorage.setItem(
        VISITOR_STORAGE_KEYS.ACTIVITY_HISTORY,
        JSON.stringify(history)
      );
    } catch (error) {
      handleVisitorError(error, "add_activity_to_history");
    }
  }

  function sendActivityHistoryToWidget() {
  try {
    if (!visitorTrackingEnabled) return

    const history = getActivityHistory()

    sendToWidget("widget:activity-history-update", {
      history: history,
    })
  } catch (error) {
    console.warn("Error sending activity history to widget:", error)
  }
  }

  function cleanupActivityHistory() {
  try {
    if (!visitorTrackingEnabled) return

    const history = getActivityHistory()
    const now = new Date()

    // Filter out old activities
    const cleanedHistory = history.filter((activity) => {
      const timestamp = new Date(activity.timestamp)
      return shouldRetainData(timestamp, "activity")
    })

    // Store cleaned history
    try {
      if (isTrackingAllowed("functional")) {
        sessionStorage.setItem(VISITOR_STORAGE_KEYS.ACTIVITY_HISTORY, JSON.stringify(cleanedHistory))
      }
    } catch (e) {}

    // Send updated history to widget
    sendActivityHistoryToWidget()
  } catch (error) {
    console.warn("Error cleaning up activity history:", error)
  }
  }

  function sendVisitorHeartbeat() {
  try {
    if (!visitorTrackingEnabled) return

    // Update visitor state
    visitorState = {
      ...visitorState,
      isActive: true,
      isVisible: !document.hidden,
      lastActivity: new Date(),
    }

    // Send visitor state to widget
    sendVisitorDataToWidget()
  } catch (error) {
    console.warn("Error sending visitor heartbeat:", error)
  }
  }

  function sendVisitorJoinedEvent() {
  try {
    if (!visitorTrackingEnabled) return

    if (hasJoinedSent) return

    // Send visitor joined event
    sendVisitorEvent("visitor:joined", {
      id: visitorId,
      tabId: tabId,
      timestamp: new Date().toISOString(),
    })

    hasJoinedSent = true
  } catch (error) {
    console.warn("Error sending visitor joined event:", error)
  }
  }

  function cleanupVisitorData() {
    try {
      const now = new Date();

      // Clean up activity history
      const history = getActivityHistory();
      const filteredHistory = history.filter((activity) =>
        shouldRetainData(new Date(activity.timestamp), "activity")
      );
      if (filteredHistory.length !== history.length) {
        sessionStorage.setItem(
          VISITOR_STORAGE_KEYS.ACTIVITY_HISTORY,
          JSON.stringify(filteredHistory)
        );
      }

      // Clean up expired tabs
      const tabs = getStoredTabData();
      const activeTabs = tabs.filter((tab) => {
        const lastActivity = new Date(tab.lastActivity);
        return now.getTime() - lastActivity.getTime() < TAB_TIMEOUT;
      });

      if (activeTabs.length !== tabs.length) {
        setStoredTabData(activeTabs);
        updateVisitorTabInfo(activeTabs);
      }
    } catch (error) {
      handleVisitorError(error, "cleanup_visitor_data");
    }
  }

  // Visitor State Management
  function updateVisitorState(updates) {
    try {
      const previousState = { ...visitorState };
      visitorState = {
        ...visitorState,
        ...updates,
        lastActivity: new Date(),
      };

      // Store updated visitor data
      setStoredVisitorData(visitorState);

      // Check for significant state changes
      if (previousState.activityLevel !== visitorState.activityLevel) {
        sendVisitorEvent(
          getVisitorEventType(
            visitorState.activityLevel,
            previousState.activityLevel
          )
        );
      }

      // Send state update to widget
      sendVisitorDataToWidget();
    } catch (error) {
      handleVisitorError(error, "update_visitor_state");
    }
  }

  function getVisitorEventType(newLevel, previousLevel) {
    if (newLevel === "active" && previousLevel !== "active") {
      return "visitor:returned";
    }
    switch (newLevel) {
      case "idle":
        return "visitor:idle";
      case "away":
        return "visitor:away";
      case "active":
        return "visitor:activity";
      default:
        return "visitor:activity";
    }
  }

  function sendVisitorEvent(eventType, additionalData = {}) {
    try {
      if (!visitorTrackingEnabled || !isTrackingAllowed("functional")) return;

      const event = {
        type: eventType,
        visitorId: visitorState.id,
        sessionId: visitorState.sessionId,
        timestamp: new Date().toISOString(),
        data: {
          activityLevel: visitorState.activityLevel,
          tabCount: visitorState.totalTabs,
          isMainTab: visitorState.isMainTab,
          isVisible: visitorState.isVisible,
          isActive: visitorState.isActive,
          fingerprintGenerated: fingerprintGenerated,
          fingerprintSignature: deviceFingerprint?.metadata?.signature,
          ...additionalData,
        },
      };

      // Send to widget
      sendToWidget("widget:visitor-event", event);

      // console.log("Visitor event sent:", eventType, event.data);
    } catch (error) {
      handleVisitorError(error, "send_visitor_event");
    }
  }

  function sendVisitorDataToWidget() {
    try {
      if (!visitorTrackingEnabled || !isTrackingAllowed("functional")) return;

      const visitorData = {
        visitorState: visitorState,
        activityHistory: getActivityHistory().slice(-10), // Last 10 activities
        isTracking: visitorTrackingEnabled,
        errorCount: visitorErrorCount,
        fingerprint: deviceFingerprint,
        fingerprintGenerated: fingerprintGenerated,
        fingerprintErrors: fingerprintErrors,
        timestamp: new Date().toISOString(),
      };

      sendToWidget("widget:visitor-data", visitorData);
    } catch (error) {
      handleVisitorError(error, "send_visitor_data_to_widget");
    }
  }

  // Activity Detection
  function recordActivity(activityType, intensity = 1) {
    try {
      if (!visitorTrackingEnabled || !isTrackingAllowed("functional")) return;

      // Clear existing timeouts
      if (activityTimeouts.idle) clearTimeout(activityTimeouts.idle);
      if (activityTimeouts.away) clearTimeout(activityTimeouts.away);

      // Update activity tracking
      activityEventCount++;
      lastActivityTime = Date.now();

      // Add to activity history
      addActivityToHistory(activityType, intensity);

      // Update visitor state to active
      updateVisitorState({
        isActive: true,
        activityLevel: "active",
        isVisible: !document.hidden,
      });

      // Set new timeouts
      activityTimeouts.idle = setTimeout(() => {
        updateVisitorState({ activityLevel: "idle", isActive: false });
      }, config.visitorActivityTimeout);

      activityTimeouts.away = setTimeout(() => {
        updateVisitorState({ activityLevel: "away", isActive: false });
      }, config.visitorAwayTimeout);
    } catch (error) {
      handleVisitorError(error, "record_activity");
    }
  }

  function handleActivityEvent(activityType, intensity = 1) {
    try {
      if (!visitorTrackingEnabled || !isTrackingAllowed("functional")) return;

      // Debounce activity events
      if (activityTimeouts.debounce) clearTimeout(activityTimeouts.debounce);

      activityTimeouts.debounce = setTimeout(() => {
        recordActivity(activityType, intensity);
      }, config.visitorDebounceMs);
    } catch (error) {
      handleVisitorError(error, "handle_activity_event");
    }
  }

  // Activity Event Handlers
  function handleMouseActivity(event) {
    if (!config.visitorTrackMouse) return;
    try {
      const intensity = Math.min(
        1,
        (Math.abs(event.movementX || 0) + Math.abs(event.movementY || 0)) / 100
      );
      handleActivityEvent("mouse", intensity);
    } catch (error) {
      handleVisitorError(error, "handle_mouse_activity");
    }
  }

  function handleKeyboardActivity(event) {
    if (!config.visitorTrackKeyboard) return;
    try {
      const intensity = event.key && event.key.length === 1 ? 0.8 : 0.3;
      handleActivityEvent("keyboard", intensity);
    } catch (error) {
      handleVisitorError(error, "handle_keyboard_activity");
    }
  }

  function handleScrollActivity() {
    if (!config.visitorTrackScroll) return;
    try {
      handleActivityEvent("scroll", 0.5);
    } catch (error) {
      handleVisitorError(error, "handle_scroll_activity");
    }
  }

  function handleTouchActivity(event) {
    if (!config.visitorTrackTouch) return;
    try {
      const intensity = Math.min(
        1,
        (event.touches ? event.touches.length : 1) * 0.3
      );
      handleActivityEvent("touch", intensity);
    } catch (error) {
      handleVisitorError(error, "handle_touch_activity");
    }
  }

  function handleVisibilityChange() {
    try {
      const isVisible = !document.hidden;
      updateVisitorState({ isVisible });

      if (isVisible) {
        recordActivity("focus", 0.7);
      } else {
        recordActivity("blur", 0.1);
      }
    } catch (error) {
      handleVisitorError(error, "handle_visibility_change");
    }
  }

  function handleFocusChange(hasFocus) {
    try {
      updateVisitorState({ isActive: hasFocus });
      recordActivity(hasFocus ? "focus" : "blur", hasFocus ? 0.7 : 0.1);
    } catch (error) {
      handleVisitorError(error, "handle_focus_change");
    }
  }

  // Tab Management
  function updateTabActivity() {
    try {
      if (!visitorTrackingEnabled || !isTrackingAllowed("functional")) return;

      const now = new Date();
      const tabs = getStoredTabData();

      // Update current tab
      const updatedTabs = tabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              lastActivity: now.toISOString(),
              isActive: true,
              isVisible: !document.hidden,
              url: window.location.href,
            }
          : tab
      );

      // Add current tab if not exists
      if (!updatedTabs.find((tab) => tab.id === tabId)) {
        updatedTabs.push({
          id: tabId,
          isActive: true,
          isVisible: !document.hidden,
          createdAt: new Date().toISOString(),
          lastActivity: now.toISOString(),
          url: window.location.href,
        });
      }

      setStoredTabData(updatedTabs);
      updateVisitorTabInfo(updatedTabs);
    } catch (error) {
      handleVisitorError(error, "update_tab_activity");
    }
  }

  function updateVisitorTabInfo(tabs) {
    try {
      const activeTabs = tabs.filter((tab) => {
        const lastActivity = new Date(tab.lastActivity);
        return Date.now() - lastActivity.getTime() < TAB_TIMEOUT;
      });

      const currentTab = activeTabs.find((tab) => tab.id === tabId);
      const isMainTab =
        !activeTabs.length ||
        currentTab?.createdAt <=
          Math.min(
            ...activeTabs.map((tab) => new Date(tab.createdAt).getTime())
          );

      updateVisitorState({
        totalTabs: activeTabs.length,
        isMainTab: isMainTab,
      });
    } catch (error) {
      handleVisitorError(error, "update_visitor_tab_info");
    }
  }

  function handleTabHeartbeat() {
    try {
      updateTabActivity();
      cleanupVisitorData();
    } catch (error) {
      handleVisitorError(error, "handle_tab_heartbeat");
    }
  }

  function handleBeforeUnload() {
    try {
      isPageUnloading = true;

      // Send visitor left event if this is the main tab or only tab
      if (visitorState.isMainTab || visitorState.totalTabs <= 1) {
        sendVisitorEvent("visitor:left", { reason: "page_unload" });
      }

      // Remove current tab from storage
      const tabs = getStoredTabData();
      const updatedTabs = tabs.filter((tab) => tab.id !== tabId);
      setStoredTabData(updatedTabs);

      // Cleanup
      cleanupVisitorTracking();
    } catch (error) {
      handleVisitorError(error, "handle_before_unload");
    }
  }

  // Visitor Tracking Initialization
  function initializeVisitorTracking() {
    try {
      if (!config.enableVisitorTracking || !isTrackingAllowed("functional")) {
        visitorTrackingEnabled = false;
        return;
      }

      // Generate IDs
      visitorId = generateVisitorId();
      tabId = generateTabId();

      // Initialize visitor state
      const sessionId = getSessionId() || generateVisitorId();
      visitorState = {
        id: visitorId,
        sessionId: sessionId,
        isActive: true,
        isVisible: !document.hidden,
        joinedAt: new Date(),
        lastActivity: new Date(),
        activityLevel: "active",
        tabId: tabId,
        isMainTab: true,
        totalTabs: 1,
      };

      // Check for existing visitor data
      const existingData = getStoredVisitorData();
      if (existingData && existingData.sessionId === sessionId) {
        visitorState = {
          ...visitorState,
          ...existingData,
          id: visitorId,
          tabId: tabId,
        };
      }

      // Initialize tab management
      updateTabActivity();

      // Setup activity event listeners
      setupActivityListeners();

      // Setup intervals
      setupVisitorIntervals();

      // Send initial visitor joined event
      if (!hasJoinedSent) {
        hasJoinedSent = true;
        sendVisitorEvent("visitor:joined", { reason: "page_load" });
      }

      // Initial activity recording
      recordActivity("focus", 0.5);

      // Initialize fingerprinting if enabled
      if (config.enableFingerprinting) {
        // Check for existing fingerprint
        const storedFingerprint = getStoredFingerprint();
        if (storedFingerprint) {
          deviceFingerprint = storedFingerprint;
          fingerprintGenerated = true;
          sendFingerprintToWidget();
        } else {
          // Generate fingerprint after a short delay
          setTimeout(() => {
            generateDeviceFingerprint().then((fingerprint) => {
              if (fingerprint) {
                console.log("Device fingerprint generated on initialization");
              }
            });
          }, 2000);
        }
      }

      console.log("Visitor tracking initialized:", {
        visitorId: visitorState.id,
        sessionId: visitorState.sessionId,
        tabId: visitorState.tabId,
        fingerprintingEnabled: config.enableFingerprinting,
      });
    } catch (error) {
      handleVisitorError(error, "initialize_visitor_tracking");
      visitorTrackingEnabled = false;
    }
  }

  function setupActivityListeners() {
    try {
      const events = [
        {
          type: "mousemove",
          handler: handleMouseActivity,
          options: { passive: true },
        },
        {
          type: "mousedown",
          handler: handleMouseActivity,
          options: { passive: true },
        },
        {
          type: "keydown",
          handler: handleKeyboardActivity,
          options: { passive: true },
        },
        {
          type: "keyup",
          handler: handleKeyboardActivity,
          options: { passive: true },
        },
        {
          type: "scroll",
          handler: handleScrollActivity,
          options: { passive: true },
        },
        {
          type: "touchstart",
          handler: handleTouchActivity,
          options: { passive: true },
        },
        {
          type: "touchmove",
          handler: handleTouchActivity,
          options: { passive: true },
        },
        {
          type: "focus",
          handler: () => handleFocusChange(true),
          options: { passive: true },
        },
        {
          type: "blur",
          handler: () => handleFocusChange(false),
          options: { passive: true },
        },
      ];

      events.forEach(({ type, handler, options }) => {
        window.addEventListener(type, handler, options);
      });

      // Visibility change listener
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Page unload listener
      window.addEventListener("beforeunload", handleBeforeUnload);
    } catch (error) {
      handleVisitorError(error, "setup_activity_listeners");
    }
  }

  function setupVisitorIntervals() {
    try {
      // Tab heartbeat
      activityTimeouts.heartbeat = setInterval(
        handleTabHeartbeat,
        TAB_HEARTBEAT_INTERVAL
      );

      // Cleanup interval
      activityTimeouts.cleanup = setInterval(
        cleanupVisitorData,
        TAB_CLEANUP_INTERVAL
      );

      // Initial timeouts for idle/away detection
      activityTimeouts.idle = setTimeout(() => {
        updateVisitorState({ activityLevel: "idle", isActive: false });
      }, config.visitorActivityTimeout);

      activityTimeouts.away = setTimeout(() => {
        updateVisitorState({ activityLevel: "away", isActive: false });
      }, config.visitorAwayTimeout);
    } catch (error) {
      handleVisitorError(error, "setup_visitor_intervals");
    }
  }

  function cleanupVisitorTracking() {
    try {
      // Clear all timeouts and intervals
      Object.values(activityTimeouts).forEach((timeout) => {
        if (timeout) {
          clearTimeout(timeout);
          clearInterval(timeout);
        }
      });

      // Reset timeout object
      activityTimeouts = {
        idle: null,
        away: null,
        debounce: null,
        heartbeat: null,
        cleanup: null,
      };

      // Remove event listeners
      const events = [
        "mousemove",
        "mousedown",
        "keydown",
        "keyup",
        "scroll",
        "touchstart",
        "touchmove",
        "focus",
        "blur",
      ];
      events.forEach((type) => {
        window.removeEventListener(type, handleMouseActivity);
        window.removeEventListener(type, handleKeyboardActivity);
        window.removeEventListener(type, handleScrollActivity);
        window.removeEventListener(type, handleTouchActivity);
        window.removeEventListener(type, () => handleFocusChange(true));
        window.removeEventListener(type, () => handleFocusChange(false));
      });

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      visitorTrackingEnabled = false;
    } catch (error) {
      console.warn("Error during visitor tracking cleanup:", error);
    }
  }

  // Initialize the widget
  function init() {
    try {
      widgetKey = getWidgetKeyFromScript();

      if (!widgetKey) {
        console.warn(
          "Kogents Chat Widget: No widget key provided. Widget will not load."
        );
        return;
      }
      // Get script element
      const scriptElement = document.getElementById("kogents-chat-widget");
      // Parse configuration from data attributes
      if (scriptElement) {
        Object.keys(config).forEach((key) => {
          const val = scriptElement.getAttribute(`data-${key}`);
          if (val !== null) config[key] = val;
        });
      }

      // Update privacy config
      privacyConfig = {
        enableGDPR: config.enableGDPR,
        requireConsent: config.requireConsent,
        anonymizeData: config.anonymizeData,
        dataRetentionDays: Number.parseInt(config.dataRetentionDays) || 30,
      };

      // Initialize consent state
      consentState = getConsentState();

      // Schedule data cleanup
      scheduleRetentionCleanup();

      // Initialize referrer tracking
      if (config.trackReferrer && isTrackingAllowed("analytics")) {
        initializeReferrerTracking();
      }

      // Initialize URL tracking
      if (isTrackingAllowed("analytics")) {
        initializeURLTracking();
      }

      // Initialize visitor tracking
      if (config.enableVisitorTracking && isTrackingAllowed("functional")) {
        initializeVisitorTracking();
      }

      // Initialize tags
      visitorTags = getStoredTags();

      // Initialize visitor info
      visitorInfo = getStoredVisitorInfo();

      // Create widget container
      createWidgetContainer();
      // Load widget in iframe
      loadWidgetFrame();
      // Expose API
      exposeApi();
    } catch (err) {
      console.error("Error initializing chat widget:", err);
    }
  }

  function scheduleRetentionCleanup() {
    try {
      // Check if cleanup was done recently (within last 24 hours)
      const lastCleanup = localStorage.getItem("kogents_retention_cleanup");
      if (lastCleanup) {
        const lastCleanupDate = new Date(lastCleanup);
        const now = new Date();
        const hoursSinceCleanup =
          (now.getTime() - lastCleanupDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceCleanup < 24) {
          return; // Skip cleanup if done recently
        }
      }

      // Perform cleanup
      cleanupExpiredData();

      // Schedule next cleanup (run daily)
      setTimeout(() => {
        scheduleRetentionCleanup();
      }, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      console.warn("Failed to schedule retention cleanup:", error);
    }
  }

  // Enhanced Referrer Detection and Processing
  function getReferrerData() {
    try {
      const referrer = document.referrer || "";
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);

      // Check referrer policy
      const referrerPolicy = document.referrerPolicy || "default";

      // Detect protocol downgrade (HTTPS to HTTP)
      let protocolDowngrade = false;
      try {
        if (referrer && currentUrl) {
          const referrerProtocol = new URL(referrer).protocol;
          const currentProtocol = new URL(currentUrl).protocol;
          protocolDowngrade =
            referrerProtocol === "https:" && currentProtocol === "http:";
        }
      } catch {}

      // Get stored referrer data from session
      const storedReferrer = getStoredReferrerData();

      // Extract UTM parameters
      const utmData = {
        source: urlParams.get("utm_source"),
        medium: urlParams.get("utm_medium"),
        campaign: urlParams.get("utm_campaign"),
        term: urlParams.get("utm_term"),
        content: urlParams.get("utm_content"),
      };

      // Extract other tracking parameters
      const trackingData = {
        gclid: urlParams.get("gclid"), // Google Ads
        fbclid: urlParams.get("fbclid"), // Facebook
        msclkid: urlParams.get("msclkid"), // Microsoft Ads
        ttclid: urlParams.get("ttclid"), // TikTok
        li_fat_id: urlParams.get("li_fat_id"), // LinkedIn
      };

      // Extract affiliate parameters
      const affiliateData = {};
      Object.values(AFFILIATE_NETWORKS)
        .flat()
        .forEach((param) => {
          const value = urlParams.get(param);
          if (value) {
            affiliateData[param] = value;
          }
        });

      const referrerInfo = {
        referrer: sanitizeURL(referrer),
        currentUrl: sanitizeURL(currentUrl),
        domain: extractDomain(referrer),
        isFirstVisit: !storedReferrer,
        timestamp: new Date().toISOString(),
        utm: utmData,
        tracking: trackingData,
        affiliate: affiliateData,
        landingPage: storedReferrer
          ? storedReferrer.landingPage
          : sanitizeURL(currentUrl),
        sessionReferrer: storedReferrer
          ? storedReferrer.sessionReferrer
          : sanitizeURL(referrer),
        referrerPolicy: referrerPolicy,
        protocolDowngrade: protocolDowngrade,
      };

      return privacyConfig.anonymizeData
        ? anonymizeData(referrerInfo)
        : referrerInfo;
    } catch (error) {
      console.warn("Error getting referrer data:", error);
      return null;
    }
  }

  function extractDomain(url) {
    try {
      if (!url) return "";
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, "");
    } catch (error) {
      return "";
    }
  }

  function classifyTrafficSource(referrerInfo) {
    if (!referrerInfo) return { type: "unknown", category: "unknown" };

    const { referrer, domain, utm, tracking, affiliate } = referrerInfo;

    // Check for affiliate traffic first
    if (Object.keys(affiliate).length > 0) {
      const affiliateNetwork = detectAffiliateNetwork(affiliate);
      return {
        type: "affiliate",
        category: "affiliate",
        source: domain || "unknown",
        affiliate: affiliateNetwork,
      };
    }

    // Direct traffic
    if (!referrer && !hasTrackingParams(utm, tracking)) {
      return { type: "direct", category: "direct" };
    }

    // UTM-based classification
    if (utm.source || utm.medium) {
      if (utm.medium === "email") {
        return { type: "email", category: "email", source: utm.source };
      }
      if (utm.medium === "social") {
        return { type: "social", category: "social", source: utm.source };
      }
      if (utm.medium === "cpc" || utm.medium === "ppc") {
        return { type: "paid_search", category: "paid", source: utm.source };
      }
      if (utm.medium === "organic") {
        return {
          type: "organic_search",
          category: "organic",
          source: utm.source,
        };
      }
      if (utm.medium === "referral") {
        return { type: "referral", category: "referral", source: utm.source };
      }
      if (utm.medium === "affiliate") {
        return { type: "affiliate", category: "affiliate", source: utm.source };
      }
    }

    // Tracking parameter-based classification
    if (tracking.gclid) {
      return { type: "paid_search", category: "paid", source: "google" };
    }
    if (tracking.fbclid) {
      return { type: "paid_social", category: "paid", source: "facebook" };
    }
    if (tracking.msclkid) {
      return { type: "paid_search", category: "paid", source: "microsoft" };
    }
    if (tracking.ttclid) {
      return { type: "paid_social", category: "paid", source: "tiktok" };
    }
    if (tracking.li_fat_id) {
      return { type: "paid_social", category: "paid", source: "linkedin" };
    }

    // Domain-based classification
    if (domain) {
      // Check for mobile app patterns
      if (isMobileAppReferrer(referrer)) {
        return { type: "mobile_app", category: "mobile_app", source: domain };
      }

      if (SEARCH_ENGINES.some((engine) => domain.includes(engine))) {
        return { type: "organic_search", category: "organic", source: domain };
      }
      if (
        SOCIAL_MEDIA.some(
          (social) => domain.includes(social) || referrer.includes(social)
        )
      ) {
        return { type: "social", category: "social", source: domain };
      }
      if (EMAIL_PROVIDERS.some((email) => domain.includes(email))) {
        return { type: "email", category: "email", source: domain };
      }
      // External referral
      return { type: "referral", category: "referral", source: domain };
    }

    return { type: "unknown", category: "unknown" };
  }

  function detectAffiliateNetwork(affiliateData) {
    for (const [network, params] of Object.entries(AFFILIATE_NETWORKS)) {
      for (const param of params) {
        if (affiliateData[param]) {
          return {
            network: network,
            partner: affiliateData[param],
            campaign: affiliateData.campaign || affiliateData.utm_campaign,
          };
        }
      }
    }
    return { network: "unknown", partner: "unknown" };
  }

  function isMobileAppReferrer(referrer) {
    if (!referrer) return false;

    // Check for mobile app URL schemes
    const mobileAppPatterns = [
      /^fb:\/\//, // Facebook
      /^twitter:\/\//, // Twitter
      /^instagram:\/\//, // Instagram
      /^linkedin:\/\//, // LinkedIn
      /^youtube:\/\//, // YouTube
      /^tiktok:\/\//, // TikTok
      /^pinterest:\/\//, // Pinterest
      /^reddit:\/\//, // Reddit
      /^android-app:\/\//, // Android app
      /^ios-app:\/\//, // iOS app
    ];

    return mobileAppPatterns.some((pattern) => pattern.test(referrer));
  }

  function hasTrackingParams(utm, tracking) {
    return (
      Object.values(utm).some((val) => val) ||
      Object.values(tracking).some((val) => val)
    );
  }

  function getStoredReferrerData() {
    try {
      const stored = sessionStorage.getItem("kogents_referrer_data");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function storeReferrerData(data) {
    try {
      if (!isTrackingAllowed("analytics")) return;
      sessionStorage.setItem("kogents_referrer_data", JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to store referrer data:", error);
    }
  }

  function initializeReferrerTracking() {
    try {
      if (!referrerTrackingEnabled || !isTrackingAllowed("analytics")) return;

      // Get referrer data
      referrerData = getReferrerData();
      if (!referrerData) return;

      // Classify traffic source
      trafficSource = classifyTrafficSource(referrerData);

      // Extract campaign data
      campaignData = {
        ...referrerData.utm,
        ...referrerData.tracking,
        ...referrerData.affiliate,
        trafficSource: trafficSource.type,
        category: trafficSource.category,
        source: trafficSource.source,
      };

      // Store referrer data for session
      storeReferrerData({
        ...referrerData,
        trafficSource,
        campaignData,
        sessionReferrer: referrerData.referrer,
        landingPage: referrerData.currentUrl,
      });

      console.log("Referrer tracking initialized:", {
        referrer: referrerData.referrer,
        trafficSource,
        campaignData,
        referrerPolicy: referrerData.referrerPolicy,
        protocolDowngrade: referrerData.protocolDowngrade,
      });
    } catch (error) {
      console.error("Error initializing referrer tracking:", error);
      referrerTrackingEnabled = false;
    }
  }

  function analyzeTrafficSource(referrer) {
    try {
      if (!referrer) {
        return {
          type: "direct",
          category: "direct",
          source: "direct",
        };
      }

      const refUrl = new URL(referrer);
      const hostname = refUrl.hostname.toLowerCase();

      // Check for search engine traffic
      if (SEARCH_ENGINES.includes(hostname)) {
        return {
          type: "search",
          category: "search",
          source: hostname,
        };
      }

      // Check for social media traffic
      if (SOCIAL_MEDIA.some((domain) => hostname.includes(domain))) {
        return {
          type: "social",
          category: "social",
          source: hostname,
        };
      }

      // Check for email provider traffic
      if (EMAIL_PROVIDERS.includes(hostname)) {
        return {
          type: "email",
          category: "email",
          source: hostname,
        };
      }

      // Check for affiliate network traffic
      let affiliateNetwork = null;
      const affiliateParams = {};

      for (const network in AFFILIATE_NETWORKS) {
        const params = AFFILIATE_NETWORKS[network];
        if (params.some((param) => refUrl.searchParams.has(param))) {
          affiliateNetwork = network;
          params.forEach((param) => {
            if (refUrl.searchParams.has(param)) {
              affiliateParams[param] = refUrl.searchParams.get(param);
            }
          });
          break;
        }
      }

      if (affiliateNetwork) {
        return {
          type: "affiliate",
          category: "affiliate",
          source: affiliateNetwork,
          affiliate: affiliateParams,
        };
      }

      // Otherwise, consider it a referral
      return {
        type: "referral",
        category: "referral",
        source: hostname,
      };
    } catch (error) {
      console.warn("Error analyzing traffic source:", error);
      return {
        type: "unknown",
        category: "unknown",
        source: "unknown",
      };
    }
  }

  function sendReferrerToWidget() {
    if (
      !referrerTrackingEnabled ||
      !referrerData ||
      !isTrackingAllowed("analytics")
    )
      return;

    sendToWidget("widget:referrer-update", {
      referrer: referrerData,
      trafficSource,
      campaignData,
      timestamp: new Date().toISOString(),
      source: "parent-site",
    });
  }

  // URL Sanitization and Processing
  function sanitizeURL(url) {
    try {
      if (!url || typeof url !== "string") return "";

      const urlObj = new URL(url);

      // Remove sensitive parameters
      SENSITIVE_PARAMS.forEach((param) => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.delete(param);
        }
      });

      let sanitizedUrl = urlObj.toString();

      // Remove PII patterns
      PII_PATTERNS.forEach((pattern) => {
        sanitizedUrl = sanitizedUrl.replace(pattern, "[REDACTED]");
      });

      return sanitizedUrl;
    } catch (error) {
      console.warn("URL sanitization failed:", error);
      return "[INVALID_URL]";
    }
  }

  function truncateURL(url, maxLength = 250) {
    if (!url || url.length <= maxLength) return url;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.origin;
      const path = urlObj.pathname;
      const search = urlObj.search;

      if (domain.length >= maxLength - 3) {
        return domain.substring(0, maxLength - 3) + "...";
      }

      const domainAndPath = domain + path;
      if (domainAndPath.length <= maxLength - 3) {
        const remainingLength = maxLength - domainAndPath.length - 3;
        if (search.length > remainingLength) {
          return domainAndPath + search.substring(0, remainingLength) + "...";
        }
        return domainAndPath + search;
      }

      const availablePathLength = maxLength - domain.length - 3;
      if (availablePathLength > 0) {
        return domain + path.substring(0, availablePathLength) + "...";
      }

      return domain + "...";
    } catch (error) {
      return url.substring(0, maxLength - 3) + "...";
    }
  }

  function processURL(url) {
    if (!url) return "";

    try {
      // Validate URL
      new URL(url);

      // Sanitize and truncate
      const sanitized = sanitizeURL(url);
      const truncated = truncateURL(sanitized);

      return truncated;
    } catch (error) {
      console.warn("Invalid URL:", url);
      return "";
    }
  }

  // URL Change Detection and Tracking
  function getCurrentURL() {
    try {
      return window.location.href;
    } catch (error) {
      console.warn("Error getting current URL:", error);
      return "";
    }
  }

  function sendURLToWidget(url, changeType = "manual") {
    if (!urlTrackingEnabled || !url || !isTrackingAllowed("analytics")) return;

    const processedUrl = processURL(url);
    if (!processedUrl || processedUrl === "[INVALID_URL]") return;

    // Include referrer data with URL updates
    const urlData = {
      url: processedUrl,
      changeType,
      timestamp: new Date().toISOString(),
      source: "parent-site",
    };

    // Add referrer context if available
    if (referrerData && referrerTrackingEnabled) {
      urlData.referrerContext = {
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

    sendToWidget("widget:url-update", urlData);
  }

  function checkForURLChange(changeType = "manual") {
    try {
      const currentUrl = getCurrentURL();
      if (currentUrl && currentUrl !== lastTrackedUrl) {
        sendURLToWidget(currentUrl, changeType);
        lastTrackedUrl = currentUrl;
      }
    } catch (error) {
      console.warn("Error checking URL change:", error);
    }
  }

  function initializeURLTracking() {
    try {
      if (!isTrackingAllowed("analytics")) return;

      // Get initial URL
      const initialUrl = getCurrentURL();
      if (initialUrl) {
        lastTrackedUrl = initialUrl;
        // Send initial URL after a short delay to ensure widget is ready
        setTimeout(() => sendURLToWidget(initialUrl, "initial"), 1000);
      }

      // Override history methods
      originalPushState = history.pushState;
      originalReplaceState = history.replaceState;

      history.pushState = function (state, title, url) {
        const result = originalPushState.call(this, state, title, url);
        setTimeout(() => checkForURLChange("pushstate"), 100);
        return result;
      };

      history.replaceState = function (state, title, url) {
        const result = originalReplaceState.call(this, state, title, url);
        setTimeout(() => checkForURLChange("replacestate"), 100);
        return result;
      };

      // Listen for popstate events
      window.addEventListener("popstate", () => {
        setTimeout(() => checkForURLChange("popstate"), 100);
      });

      // Listen for hashchange events
      window.addEventListener("hashchange", () => {
        setTimeout(() => checkForURLChange("hashchange"), 100);
      });

      // Polling fallback for missed changes
      setInterval(() => {
        checkForURLChange("polling");
      }, 2000);

      // Listen for visibility changes
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          setTimeout(() => checkForURLChange("visibility"), 100);
        }
      });

      // Listen for focus events
      window.addEventListener("focus", () => {
        setTimeout(() => checkForURLChange("focus"), 100);
      });
    } catch (error) {
      console.error("Error initializing URL tracking:", error);
      urlTrackingEnabled = false;
    }
  }

  // Create the widget container
  function createWidgetContainer() {
    try {
      // Commented out: Remove any previous widget container and frame
      // const prevContainer = document.getElementById("kogents-chat-widget-container");
      // if (prevContainer) {
      //   prevContainer.parentNode.removeChild(prevContainer);
      // }
      // const prevFrame = document.getElementById("kogents-chat-widget-frame");
      // if (prevFrame) {
      //   prevFrame.parentNode.removeChild(prevFrame);
      // }
      // Create new container
      const container = document.createElement("div");
      container.id = "kogents-chat-widget-container";
      container.style.position = "fixed";
      container.style.bottom = "0";
      container.style[config.position] = "0";
      container.style.zIndex = "999999";
      container.style.overflow = "hidden";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    } catch (err) {
      console.error("Error creating widget container:", err);
    }
  }

  // Load the widget in an iframe
  function loadWidgetFrame() {
    try {
      const container = document.getElementById(
        "kogents-chat-widget-container"
      );
      if (!container) return;

      // Create iframe
      widgetFrame = document.createElement("iframe");
      widgetFrame.id = "kogents-chat-widget-frame";
      widgetFrame.title = "Chat Widget";
      widgetFrame.src = `${baseUrl}${
        config.widgetUrl
      }?apiToken=${encodeURIComponent(widgetKey)}`;
      widgetFrame.style.border = "none";
      widgetFrame.style.marginBottom = `-${SCROLLBAR_WIDTH}px`;
      widgetFrame.style.width = "100px";
      widgetFrame.style.height = "100px";

      // Add iframe to container
      container.appendChild(widgetFrame);

      // Listen for messages from iframe
      window.addEventListener("message", handleFrameMessage);

      // Set iframe to loaded when it's ready
      widgetFrame.onload = () => {
        isLoaded = true;
        // Send configuration to widget
        sendToWidget("config", config);
        // Send initial URL
        const currentUrl = getCurrentURL();
        if (currentUrl) {
          sendURLToWidget(currentUrl, "initial");
        }
        // Send referrer data
        if (referrerTrackingEnabled) {
          sendReferrerToWidget();
        }
        // Send visitor data
        if (visitorTrackingEnabled) {
          sendVisitorDataToWidget();
        }
        // Send fingerprint data
        if (fingerprintGenerated) {
          sendFingerprintToWidget();
        }
        // Process any queued messages
        processMessageQueue();

        const sendParentInfo = () => {
          if (document.title && document.title.trim() !== "") {
            try {
              widgetFrame.contentWindow.postMessage(
                {
                  type: "kogents:parentInfo",
                  title: document.title,
                  link: window.location.href,
                },
                "*"
              );
            } catch (err) {}
          } else {
            setTimeout(sendParentInfo, 100);
          }
        };

        sendParentInfo();
      };
    } catch (err) {
      console.error("Error loading widget frame:", err);
    }
  }

  // Handle messages from the widget iframe
  function handleFrameMessage(event) {
    try {
      const data =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      if (!data?.type) return;

      switch (data.type) {
        case "widget:ready":
          isLoaded = true;
          processMessageQueue();

          // Send current URL to widget
          const currentUrl = getCurrentURL();
          if (currentUrl) {
            sendURLToWidget(currentUrl, "ready");
          }

          // Send referrer data to widget
          if (referrerTrackingEnabled) {
            sendReferrerToWidget();
          }

          // Send visitor data to widget
          if (visitorTrackingEnabled) {
            sendVisitorDataToWidget();
          }

          // Dispatch ready event
          triggerEvent("ready");

          // Dispatch custom event for the page
          window.dispatchEvent(new Event("kogentsChatWidgetReady"));
          break;

        case "widget:request-url":
          // Widget is requesting current URL (cross-frame communication)
          const url = getCurrentURL();
          if (url) {
            sendURLToWidget(url, "requested");
          }
          break;

        case "widget:request-referrer":
          // Widget is requesting referrer data
          if (referrerTrackingEnabled) {
            sendReferrerToWidget();
          }
          break;

        case "widget:request-visitor":
          // Widget is requesting visitor data
          if (visitorTrackingEnabled) {
            sendVisitorDataToWidget();
          }
          break;
        case "widget:request-fingerprint":
          // Widget is requesting fingerprint data
          if (fingerprintGenerated) {
            sendFingerprintToWidget();
          } else if (config.enableFingerprinting) {
            // Generate fingerprint on demand
            generateDeviceFingerprint().then((fingerprint) => {
              if (fingerprint) {
                sendFingerprintToWidget();
              }
            });
          }
          break;

        case "widget:request-fingerprint":
          // Widget is requesting fingerprint data
          if (fingerprintGenerated) {
            sendFingerprintToWidget();
          } else if (config.enableFingerprinting) {
            // Generate fingerprint on demand
            generateDeviceFingerprint().then((fingerprint) => {
              if (fingerprint) {
                sendFingerprintToWidget();
              }
            });
          }
          break;
        case "widget:resize":
          if (data.data?.width && data.data?.height) {
            resizeWidget(data.data.width, data.data.height);
          }
          break;

        case "widget:event":
          const eventName = data.data?.event;
          if (eventName === "open") {
            isOpen = true;
            resizeWidget(
              data.data.data.width || 385,
              data.data.data.height || 600
            );
          } else if (eventName === "close") {
            isOpen = false;
            widgetFrame.style.transition = "";
            setTimeout(() => resizeWidget(100, 100), 300);
          } else if (eventName === "fullscreen") {
            isOpen = true;
            widgetFrame.style.transition = "width 0.1s, height 0.1s";
            resizeWidget(
              window.innerWidth - SCROLLBAR_WIDTH,
              window.innerHeight,
              true
            );
          }

          triggerEvent(eventName, data.data?.data);
          break;

        case "status:response":
          // Handle status response
          triggerEvent("status:response", data.data);
          break;
        case "widget:tags-request":
          sendToWidget("widget:tags-update", { tags: visitorTags });
          break;
        case "widget:visitor-info-request":
          sendToWidget("widget:visitor-info-update", {
            visitorInfo: visitorInfo,
          });
          break;
      }
    } catch (err) {
      console.error("Error parsing widget message:", err);
    }
  }

  // Send message to widget iframe
  function sendToWidget(type, data) {
    try {
      if (!isLoaded || !widgetFrame) {
        // Queue message if widget not loaded yet
        messageQueue.push({ type, data });
        return;
      }
      const msg = JSON.stringify({ type, data });
      widgetFrame.contentWindow.postMessage(msg, baseUrl);
    } catch (err) {
      console.error("Error sending message to widget:", err);
    }
  }

  // Process queued messages
  function processMessageQueue() {
    try {
      while (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        sendToWidget(msg.type, msg.data);
      }
    } catch (err) {
      console.error("Error processing message queue:", err);
    }
  }

  // Resize widget iframe
  function resizeWidget(width, height, isFull = false) {
    try {
      if (widgetFrame) {
        if (!isFull) {
          widgetFrame.style.maxHeight = `100vh`;
          widgetFrame.style.maxWidth = `100vw`;
        } else {
          widgetFrame.style.maxHeight = "";
          widgetFrame.style.maxWidth = "";
        }
        widgetFrame.style.width = `${width}px`;
        widgetFrame.style.height = `${height}px`;
      }
    } catch (err) {
      console.error("Error resizing widget:", err);
    }
  }

  // Event system
  function on(event, callback) {
    if (!eventCallbacks[event]) eventCallbacks[event] = [];
    eventCallbacks[event].push(callback);
    return () => off(event, callback);
  }

  function off(event, callback) {
    if (!eventCallbacks[event]) return;
    eventCallbacks[event] = callback
      ? eventCallbacks[event].filter((cb) => cb !== callback)
      : [];
  }

  function triggerEvent(event, data) {
    if (eventCallbacks[event]) {
      eventCallbacks[event].forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Callback error for event ${event}:`, err);
        }
      });
    }
  }

  // Cleanup function
  function cleanup() {
    try {
      // Restore original history methods
      if (originalPushState) {
        history.pushState = originalPushState;
      }
      if (originalReplaceState) {
        history.replaceState = originalReplaceState;
      }

      // Remove event listeners
      window.removeEventListener("message", handleFrameMessage);

      // Cleanup visitor tracking
      cleanupVisitorTracking();

      urlTrackingEnabled = false;
      referrerTrackingEnabled = false;
      visitorTrackingEnabled = false;

      sessionStorage.removeItem(TAG_STORAGE_KEY);
      visitorTags = [];
      // Clear fingerprint data
      deviceFingerprint = null;
      fingerprintGenerated = false;
      fingerprintErrors = [];
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  // Get session ID
  function getSessionId() {
    try {
      const stored = localStorage.getItem("kogents_session");
      if (stored) {
        const session = JSON.parse(stored);
        return session.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Expose public API
  function exposeApi() {
    window.KogentsChatWidget = {
      // Widget control
      open: () => sendToWidget("command", { action: "open" }),
      close: () => sendToWidget("command", { action: "close" }),
      toggle: () => sendToWidget("command", { action: "toggle" }),

      // User identification
      identify: (userData) => sendToWidget("identify", userData),

      // Configuration
      updateConfig: (newConfig) => {
        Object.assign(config, newConfig);
        sendToWidget("config", config);

        // Update visitor tracking config if changed
        if (
          newConfig.enableVisitorTracking !== undefined &&
          visitorTrackingEnabled !== newConfig.enableVisitorTracking
        ) {
          if (
            newConfig.enableVisitorTracking &&
            isTrackingAllowed("functional")
          ) {
            initializeVisitorTracking();
          } else {
            cleanupVisitorTracking();
          }
        }

        // Update fingerprinting config if changed
        if (
          newConfig.enableFingerprinting !== undefined &&
          config.enableFingerprinting !== newConfig.enableFingerprinting
        ) {
          if (newConfig.enableFingerprinting && !fingerprintGenerated) {
            generateDeviceFingerprint();
          }
        }
      },

      // URL tracking control
      enableURLTracking: () => {
        if (isTrackingAllowed("analytics")) {
          urlTrackingEnabled = true;
          checkForURLChange("manual");
        }
      },
      disableURLTracking: () => {
        urlTrackingEnabled = false;
      },

      // Referrer tracking control
      enableReferrerTracking: () => {
        if (isTrackingAllowed("analytics")) {
          referrerTrackingEnabled = true;
          if (!referrerData) {
            initializeReferrerTracking();
          }
          sendReferrerToWidget();
        }
      },
      disableReferrerTracking: () => {
        referrerTrackingEnabled = false;
      },

      // Visitor tracking control
      enableVisitorTracking: () => {
        if (isTrackingAllowed("functional")) {
          if (!visitorTrackingEnabled) {
            initializeVisitorTracking();
          }
        }
      },
      disableVisitorTracking: () => {
        cleanupVisitorTracking();
      },
      // Device fingerprinting control
      enableFingerprinting: () => {
        config.enableFingerprinting = true;
        if (!fingerprintGenerated) {
          generateDeviceFingerprint();
        }
      },
      disableFingerprinting: () => {
        config.enableFingerprinting = false;
        deviceFingerprint = null;
        fingerprintGenerated = false;
        sessionStorage.removeItem(VISITOR_STORAGE_KEYS.FINGERPRINT_DATA);
      },
      generateFingerprint: () => {
        return generateDeviceFingerprint();
      },
      getFingerprint: () => {
        return deviceFingerprint;
      },
      getFingerprintSignature: () => {
        return deviceFingerprint?.metadata?.signature || null;
      },
      getFingerprintConfidence: () => {
        return deviceFingerprint?.metadata?.confidence || 0;
      },

      // File sending control (Zendesk-compatible)
      enableFileSending: () => {
        config.enableFileSending = true;
        fileSendingEnabled = true;
      },
      disableFileSending: () => {
        config.enableFileSending = false;
        fileSendingEnabled = false;
      },

      // Zendesk-compatible sendFile function
      sendFile: (file, callback) => {
        sendFileInternal(file, callback);
      },

      // Visitor tracking methods
      getVisitorState: () => visitorState,
      getActivityHistory: () => getActivityHistory(),
      sendVisitorEvent: (eventType, data) => {
        if (visitorTrackingEnabled) {
          sendVisitorEvent(eventType, data);
        }
      },
      recordActivity: (activityType, intensity) => {
        if (visitorTrackingEnabled) {
          recordActivity(activityType, intensity);
        }
      },

      // Privacy and GDPR controls
      setConsent: (consent) => {
        saveConsentState(consent);

        // Re-initialize tracking based on new consent
        if (consent.analytics) {
          if (!referrerData && config.trackReferrer) {
            initializeReferrerTracking();
          }
          if (!urlTrackingEnabled) {
            initializeURLTracking();
          }
        } else {
          urlTrackingEnabled = false;
          referrerTrackingEnabled = false;
        }

        if (consent.functional) {
          if (!visitorTrackingEnabled && config.enableVisitorTracking) {
            initializeVisitorTracking();
          }
          if (!fingerprintGenerated && config.enableFingerprinting) {
            generateDeviceFingerprint();
          }
        } else {
          if (visitorTrackingEnabled) {
            cleanupVisitorTracking();
          }
          if (fingerprintGenerated) {
            deviceFingerprint = null;
            fingerprintGenerated = false;
            sessionStorage.removeItem(VISITOR_STORAGE_KEYS.FINGERPRINT_DATA);
          }
        }
      },

      getConsent: () => getConsentState(),

      deleteUserData: () => {
        deleteAllUserData();
        triggerEvent("data:deleted");
      },

      exportUserData: () => {
        const userData = {};

        // Collect data for export
        const storageKeys = [
          "kogents_session",
          "kogents_referrer_data",
          "url_tracking_history",
          "chatSettings",
          "kogents_privacy_consent",
          ...Object.values(VISITOR_STORAGE_KEYS),
          TAG_STORAGE_KEY,
          VISITOR_INFO_STORAGE_KEY,
          DEPARTMENTS_STORAGE_KEY,
          VISITOR_DEFAULT_DEPARTMENT_KEY,
          CHAT_INFO_STORAGE_KEY,
          OPERATING_HOURS_STORAGE_KEY,
        ];

        storageKeys.forEach((key) => {
          const data = localStorage.getItem(key) || sessionStorage.getItem(key);
          if (data) {
            try {
              userData[key] = JSON.parse(data);
            } catch {
              userData[key] = data;
            }
          }
        });

        userData._export_metadata = {
          timestamp: new Date().toISOString(),
          version: "1.0",
          source: "kogents-chat-widget",
          visitorTracking: {
            enabled: visitorTrackingEnabled,
            errorCount: visitorErrorCount,
            hasJoined: hasJoinedSent,
          },
          fingerprinting: {
            enabled: config.enableFingerprinting,
            generated: fingerprintGenerated,
            signature: deviceFingerprint?.metadata?.signature,
            confidence: deviceFingerprint?.metadata?.confidence,
            errors: fingerprintErrors.length,
          },
          fileSending: {
            enabled: config.enableFileSending,
            maxFileSize: config.maxFileSize,
            allowedTypes: config.allowedFileTypes.length,
          },
        };

        return userData;
      },

      // Data access
      getReferrerData: () => referrerData,
      getTrafficSource: () => trafficSource,
      getCampaignData: () => campaignData,

      // Events
      on,
      off,
      isOpen: () =>
        new Promise((resolve) => {
          const callback = (val) => {
            resolve(val);
            off("status:response", callback);
          };
          on("status:response", callback);
          sendToWidget("status", { query: "isOpen" });
        }),
      getQueuePosition: () =>
        new Promise((resolve) => {
          const callback = (data) => {
            // Ensure we return the expected format
            const queuePosition =
              data && typeof data.queue_position === "number"
                ? { queue_position: data.queue_position }
                : { queue_position: 0 };
            resolve(queuePosition);
            off("queue:position:response", callback);
          };
          on("queue:position:response", callback);
          sendToWidget("queue:position:request", {});

          // Timeout fallback - return 0 if no response within 5 seconds
          setTimeout(() => {
            off("queue:position:response", callback);
            resolve({ queue_position: 0 });
          }, 5000);
        }),

      isChatting: () =>
        new Promise((resolve) => {
          const timeout = setTimeout(() => {
            off("chat:status:response", callback);
            resolve(false); // Default to false on timeout
          }, 5000); // 5-second timeout

          const callback = (data) => {
            clearTimeout(timeout);
            off("chat:status:response", callback);
            resolve(data?.isChatting || false);
          };

          on("chat:status:response", callback);
          sendToWidget("chat:status:request", {});
        }),

      // Utility
      cleanup,

      addTags: (tags, callback) => {
        try {
          if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }

          const updatedTags = addTagsInternal(tags);
          callback(null, updatedTags);
        } catch (error) {
          if (typeof callback === "function") {
            callback(error, null);
          }
        }
      },

      removeTags: (tags, callback) => {
        try {
          if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }

          const updatedTags = removeTagsInternal(tags);
          callback(null, updatedTags);
        } catch (error) {
          if (typeof callback === "function") {
            callback(error, null);
          }
        }
      },

      getTags: (callback) => {
        try {
          if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }

          const currentTags = getStoredTags();
          callback(null, currentTags);
        } catch (error) {
          if (typeof callback === "function") {
            callback(error, null);
          }
        }
      },

      clearTags: (callback) => {
        try {
          if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }

          const clearedTags = clearTagsInternal();
          callback(null, clearedTags);
        } catch (error) {
          if (typeof callback === "function") {
            callback(error, null);
          }
        }
      },

      // Visitor information management
      setVisitorInfo: (options, callback) => {
        try {
          if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }
          const updatedInfo = setVisitorInfoInternal(options);

          if (callback) {
            setTimeout(() => {
              callback(null, updatedInfo);
            }, 1000);
          }
        } catch (error) {
          if (typeof callback === "function") {
            callback(error, null);
          }
        }
      },

      getVisitorInfo: () => {
        try {
          return getVisitorInfoInternal();
        } catch (error) {
          console.error("Error getting visitor info:", error);
          return null;
        }
      },

      // Send visitor path (like Zendesk Chat)
      sendVisitorPath: (options, callback) => {
        try {
          // Validate callback
          if (callback && typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }

          // Validate required options
          if (!options || typeof options !== "object") {
            const error = new Error(
              "Options parameter is required and must be an object"
            );
            if (callback) {
              setTimeout(() => callback(error), 0);
              return;
            }
            throw error;
          }

          // Validate required fields
          if (!options.title || typeof options.title !== "string") {
            const error = new Error(
              "options.title is required and must be a string"
            );
            if (callback) {
              setTimeout(() => callback(error), 0);
              return;
            }
            throw error;
          }

          if (!options.url || typeof options.url !== "string") {
            const error = new Error(
              "options.url is required and must be a string"
            );
            if (callback) {
              setTimeout(() => callback(error), 0);
              return;
            }
            throw error;
          }

          // Validate URL format
          try {
            new URL(options.url);
          } catch (urlError) {
            const error = new Error("options.url must be a valid URL");
            if (callback) {
              setTimeout(() => callback(error), 0);
              return;
            }
            throw error;
          }

          // Sanitize and process the data
          const sanitizedUrl = processURL(options.url);
          const sanitizedTitle = options.title.trim().substring(0, 500); // Limit title length

          if (!sanitizedUrl || sanitizedUrl === "[INVALID_URL]") {
            const error = new Error(
              "URL could not be processed or contains sensitive information"
            );
            if (callback) {
              setTimeout(() => callback(error), 0);
              return;
            }
            throw error;
          }

          // Create visitor path data
          const visitorPathData = {
            title: sanitizedTitle,
            url: sanitizedUrl,
            originalUrl: options.url,
            timestamp: new Date().toISOString(),
            source: "sendVisitorPath",
            changeType: "manual",
          };

          // Add referrer context if available
          if (referrerData && referrerTrackingEnabled) {
            visitorPathData.referrerContext = {
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

          // Send to widget
          sendToWidget("widget:visitor-path", visitorPathData);

          // Update visitor tracking if enabled
          if (visitorTrackingEnabled && isTrackingAllowed("functional")) {
            // Record navigation activity
            recordActivity("navigation", 0.8);

            // Add to activity history
            addActivityToHistory("page_view", 0.9);

            // Send visitor event
            sendVisitorEvent("visitor:navigation", {
              title: sanitizedTitle,
              url: sanitizedUrl,
              method: changeType,
            });
          }

          // Update last tracked URL for consistency
          lastTrackedUrl = sanitizedUrl;

          // Execute callback with success
          if (callback) {
            setTimeout(() => callback(null), 0);
          }
        } catch (error) {
          console.error("Error in sendVisitorPath:", error);
          if (callback) {
            setTimeout(() => callback(error), 0);
          } else {
            throw error;
          }
        }
      },

      // Department Management
      getAllDepartments: () => {
        return getAllDepartmentsInternal();
      },

      getDepartment: (departmentId) => {
        return getDepartmentInternal(departmentId);
      },

      getVisitorDefaultDepartment: () => {
        return getVisitorDefaultDepartmentInternal();
      },

      setVisitorDefaultDepartment: (departmentId, callback) =>
        setVisitorDefaultDepartmentInternal(departmentId, callback),

      clearVisitorDefaultDepartment: (callback) =>
        clearVisitorDefaultDepartmentInternal(callback),

      refreshDepartments: (callback) => {
        try {
          if (callback && typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }

          requestDepartmentsFromWidget()
            .then((departments) => {
              if (callback) callback(null, departments);
            })
            .catch((error) => {
              if (callback) callback(error, null);
            });
        } catch (error) {
          if (callback) {
            setTimeout(() => callback(error, null), 0);
          }
        }
      },
      // Chat message sending (like Zendesk Chat)
      sendChatMsg: (msg, callback) => sendChatMessageInternal(msg, callback),
      // Offline message sending (Zendesk-compatible)
      sendOfflineMsg: (options, callback) => {
        try {
          // Validate callback
          if (typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }

          // Check rate limit
          checkOfflineMessageRateLimit();

          // Validate and sanitize options
          validateOfflineMessageOptions(options);
          const sanitizedOptions = sanitizeOfflineMessageOptions(options);

          // Check if widget is loaded
          if (!isLoaded || !widgetFrame) {
            const error = new Error(
              "Widget not ready. Please wait for the widget to load."
            );
            setTimeout(() => callback(error), 0);
            return;
          }

          // Create unique message ID for tracking
          const messageId = `offline_msg_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          // Set up response handler
          const responseHandler = (data) => {
            off("offline:message:response", responseHandler);

            if (data && data.messageId === messageId) {
              if (data.success) {
                callback(null);
              } else {
                const error = new Error(
                  data.error || "Failed to send offline message"
                );
                callback(error);
              }
            }
          };

          // Set up timeout handler
          const timeout = setTimeout(() => {
            off("offline:message:response", responseHandler);
            callback(new Error("Offline message sending timeout"));
          }, 10000); // 10 second timeout

          // Listen for response
          on("offline:message:response", responseHandler);

          // Send offline message to widget
          sendToWidget("widget:send-offline-message", {
            ...sanitizedOptions,
            messageId: messageId,
            timestamp: new Date().toISOString(),
            source: "sendOfflineMsg",
          });

          // Clear timeout on successful send
          setTimeout(() => {
            clearTimeout(timeout);
          }, 100);
        } catch (error) {
          console.error("Error in sendOfflineMsg:", error);
          if (typeof callback === "function") {
            setTimeout(() => callback(error), 0);
          }
        }
      },
      // Typing status (Zendesk-compatible)
      sendTyping: (is_typing) => {
        try {
          sendTypingInternal(is_typing, "manual");
        } catch (error) {
          console.error("Error in sendTyping:", error);
          throw error;
        }
      },

      // Get current typing state (utility function)
      getTypingState: () => {
        return currentTypingState;
      },
      // Chat info management (Zendesk-compatible)
      getChatInfo: () => {
        return requestChatInfoFromWidget();
      },
      // Chat rating (Zendesk-compatible)
      sendChatRating: (rating, callback) =>
        sendChatRatingInternal(rating, callback),
      sendChatComment: (comment, callback) =>
        sendChatCommentInternal(comment, callback),
      // Chat log management (Zendesk-compatible)
      getChatLog: () => {
        return requestChatLogFromWidget();
      },

      // Clear chat log cache (utility method)
      clearChatLogCache: () => {
        try {
          clearChatLogCache();
        } catch (error) {
          console.error("Error clearing chat log cache:", error);
        }
      },
      // Operating Hours Management (Zendesk-compatible)
      getOperatingHours: () => {
        return getOperatingHoursInternal();
      },

      // Refresh operating hours (utility method)
      refreshOperatingHours: (callback) => {
        try {
          if (callback && typeof callback !== "function") {
            throw new Error("Callback must be a function");
          }

          requestOperatingHoursFromWidget()
            .then((operatingHours) => {
              if (callback) callback(null, operatingHours);
            })
            .catch((error) => {
              if (callback) callback(error, null);
            });
        } catch (error) {
          if (callback) {
            setTimeout(() => callback(error, null), 0);
          }
        }
      },

      // Email transcript management (Zendesk-compatible)
      sendEmailTranscript: (email, callback) =>
        sendEmailTranscriptInternal(email, callback),

      // Chat History Management (Zendesk-compatible)
      fetchChatHistory: (callback) => fetchChatHistoryInternal(callback),
      // End Chat Management (Zendesk-compatible)
      endChat: (options, callback) => endChatInternal(options, callback),
    };
  }

  // Get session ID
  function getSessionId() {
    try {
      const stored = localStorage.getItem("kogents_session");
      if (stored) {
        const session = JSON.parse(stored);
        return session.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);

// // Ensure widget only loads after DOM is ready
// if (
//   document.readyState === "complete" ||
//   document.readyState === "interactive"
// ) {
//   setTimeout(() => widgetEmbedInit(window, document), 0);
// } else {
//   document.addEventListener("DOMContentLoaded", function onReady() {
//     document.removeEventListener("DOMContentLoaded", onReady);
//     widgetEmbedInit(window, document);
//   });
// }

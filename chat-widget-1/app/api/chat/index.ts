// Dependency readiness check
function dependenciesReady() {
  // Example: check for required env vars or services
  return !!(SOCKET_URL && typeof io === "function");
}

// Per-request scoped chat state (avoid global pollution)
function getChatState(req: any) {
  if (!req.locals) req.locals = {};
  if (!req.locals.chatState) req.locals.chatState = {};
  return req.locals.chatState;
}

// Coordinated rate limiting for multiple widget instances
const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 30;
function isChatRateLimited(req: any, widgetId: any) {
  const chatState = getChatState(req);
  const now = Date.now();
  if (
    !chatState[widgetId] ||
    now - chatState[widgetId].windowStart > CHAT_RATE_LIMIT_WINDOW_MS
  ) {
    chatState[widgetId] = { count: 1, windowStart: now };
    return false;
  }
  chatState[widgetId].count++;
  if (chatState[widgetId].count > CHAT_RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  return false;
}
import { DeviceFingerprint, Message } from "@/types/chat";
import { io } from "socket.io-client";
import { generateDeviceFingerprint } from "@/utils/device-fingerprinting";
import { defaultDataCollectionConfig, UnifiedDataCollector } from "@/utils/unified-data-collector";
import { detectUserIP } from "@/utils/hybrid-ip-detector";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

// Initialize unified data collector
const dataCollector = new UnifiedDataCollector(defaultDataCollectionConfig)


let lastUnsentSessionData: any = null;

let referrerInfoCache: any = null;

let socketConnected = false;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000,
  withCredentials: false,
});

// Coordination locks for requests (per session)
const sessionLocks: Record<string, boolean> = {};

// Listen for localStorage events to synchronize locks across tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key && event.key.startsWith("chat-session-lock:")) {
      const sessionId = event.key.replace("chat-session-lock:", "");
      sessionLocks[sessionId] = event.newValue === "true";
    }
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    socket.disconnect();
  });

  window.addEventListener("offline", () => {
    socket.disconnect();
  });

  window.addEventListener("online", () => {
    if (!socket.connected) {
      socket.connect();
    }
  });

  socket.on("connect", () => {
    socketConnected = true;
    // if (lastUnsentSessionData) {
    //   try {
    //     socket.emit("CreateOrUpdate", lastUnsentSessionData);
    //     lastUnsentSessionData = null;
    //     window.localStorage.removeItem("kogents_last_unsent_session");
    //   } catch (err) {}
    // }
  });
}

export const getUnifiedDeviceInfo = async () => {
  try {
    const sessionId = getSessionId()
    const visitorId = `visitor-${Date.now()}`
    const unifiedInfo = await dataCollector.collectUnifiedUserInfo(sessionId, visitorId)

    return {
      platform: unifiedInfo.device.platform,
      device: unifiedInfo.device.device,
      browser: unifiedInfo.device.browser,
      userAgent: unifiedInfo.device.userAgent,
      deviceType: unifiedInfo.device.deviceType,
    }
  } catch (err) {
    console.error("Error getting unified device info:", err)
    // Fallback to basic detection
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""
    return {
      platform: "Unknown",
      device: "Unknown",
      browser: "Unknown",
      userAgent,
      deviceType: "Desktop",
    }
  }
}

export const getGeoInfo = async () => {
  try {
    const ipResult = await detectUserIP()

    return {
      ip: ipResult.publicIP,
      city: ipResult.geolocation?.city || "",
      region: ipResult.geolocation?.region || "",
      country: ipResult.geolocation?.country || "",
      loc: ipResult.geolocation?.coordinates || "",
      org: ipResult.geolocation?.organization || "",
      hostname: ipResult.geolocation?.hostname || "",
    }
  } catch (err) {
    console.error("Hybrid IP detection failed", err)
    return null
  }
}

// Get parent page info function
export const getParentPageInfo = () => {
  try {
    // Use postMessage value if available and not the iframe's own URL
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      try {
        const parentLocation = window.parent.location
        const parentDocument = window.parent.document
        let parentTitle = parentDocument.title
        if (!parentTitle || parentTitle.trim() === "") {
          const ogTitle = parentDocument.querySelector('meta[property="og:title"]')
          if (ogTitle && ogTitle.getAttribute("content")) {
            parentTitle = ogTitle.getAttribute("content") || ""
          } else {
            const titleTag = parentDocument.querySelector("title")
            if (titleTag && titleTag.textContent) {
              parentTitle = titleTag.textContent
            }
          }
        }
        return {
          link: parentLocation.href,
          title: parentTitle || document.referrer || window.location.href,
        }
      } catch (e) {
        return {
          link: document.referrer || window.location.href,
          title: document.title,
        }
      }
    } else {
      return {
        link: window.location.href,
        title: document.title,
      }
    }
  } catch (err) {
    return {
      link: typeof window !== "undefined" ? window.location.href : "",
      title: typeof document !== "undefined" ? document.title : "",
    }
  }
}

const generateUUID = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const getSessionId = () => {
  try {
    if (typeof window === "undefined") return "";
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith("sessionId=")) {
        return trimmed.substring("sessionId=".length);
      }
    }
    const stored = window.localStorage.getItem("kogents_session");
    if (stored) {
      try {
        const { id, expires } = JSON.parse(stored);
        if (!expires || Date.now() < expires) {
          return id;
        } else {
          window.localStorage.removeItem("kogents_session");
        }
      } catch {}
    }
    const newSessionId = generateUUID();
    setSessionId(newSessionId);
    return newSessionId;
  } catch (err) {
    console.error("Error getting sessionId:", err);
    return "";
  }
};

export const setSessionId = (sessionId: string) => {
  try {
    if (typeof window === "undefined" || !sessionId) return;
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toUTCString();
    document.cookie = `sessionId=${sessionId}; expires=${expires}; path=/; SameSite=Lax`;
    window.localStorage.setItem(
      "kogents_session",
      JSON.stringify({
        id: sessionId,
        expires: Date.now() + 2 * 60 * 60 * 1000,
      })
    );
  } catch (err) {
    console.error("Error setting sessionId:", err);
  }
};

export const getDeviceInfo = () => {
  try {
    const userAgent = navigator.userAgent;
    let platform = "Other";
    let device = "Other";
    // OS detection
    if (/Windows NT/i.test(userAgent)) platform = "Windows";
    else if (/Macintosh|Mac OS X/i.test(userAgent)) platform = "macOS";
    else if (/Android/i.test(userAgent)) platform = "Android";
    else if (/iPhone|iPad|iPod/i.test(userAgent)) platform = "iOS";
    else if (/Linux/i.test(userAgent)) platform = "Linux";
    else if (/CrOS/i.test(userAgent)) platform = "Chrome OS";
    else if (/KaiOS/i.test(userAgent)) platform = "KaiOS";
    // Device detection
    if (/iPhone/i.test(userAgent)) device = "iPhone";
    else if (/iPad/i.test(userAgent)) device = "iPad";
    else if (/iPod/i.test(userAgent)) device = "iPod";
    else if (/Macintosh|Mac OS X/i.test(userAgent)) device = "Mac";
    else if (/Android/i.test(userAgent) && /Mobile/i.test(userAgent))
      device = "Android Phone";
    else if (/Android/i.test(userAgent)) device = "Android Tablet";
    else if (/Windows Phone/i.test(userAgent)) device = "Windows Phone";
    else if (/Windows/i.test(userAgent)) device = "Windows PC";
    else if (/Linux/i.test(userAgent) && /Mobile/i.test(userAgent))
      device = "Linux Phone";
    else if (/Linux/i.test(userAgent)) device = "Linux PC";
    else if (/CrOS/i.test(userAgent)) device = "Chromebook";
    else if (/KaiOS/i.test(userAgent)) device = "KaiOS Device";
    // Browser detection (existing logic)
    let browser = "Unknown";
    // Order matters: check for more specific browsers first
    if (/Edg\//.test(userAgent)) browser = "Edge";
    else if (/OPR\//.test(userAgent) || /Opera/.test(userAgent))
      browser = "Opera";
    else if (/Vivaldi/.test(userAgent)) browser = "Vivaldi";
    else if (/Brave/.test(userAgent)) browser = "Brave";
    else if (
      /Chrome/.test(userAgent) &&
      !/Edg\//.test(userAgent) &&
      !/OPR\//.test(userAgent) &&
      !/Brave/.test(userAgent) &&
      !/Vivaldi/.test(userAgent)
    )
      browser = "Chrome";
    else if (/Firefox/.test(userAgent)) browser = "Firefox";
    else if (
      /Safari/.test(userAgent) &&
      !/Chrome/.test(userAgent) &&
      !/Chromium/.test(userAgent)
    )
      browser = "Safari";
    else if (/Chromium/.test(userAgent)) browser = "Chromium";
    else if (/MSIE|Trident/.test(userAgent)) browser = "Internet Explorer";
    else if (/SamsungBrowser/.test(userAgent)) browser = "Samsung Internet";
    else if (/UCBrowser/.test(userAgent)) browser = "UC Browser";
    else if (/YaBrowser/.test(userAgent)) browser = "Yandex";
    else if (/CriOS/.test(userAgent)) browser = "Chrome iOS";
    else if (/FxiOS/.test(userAgent)) browser = "Firefox iOS";
    else if (/OPiOS/.test(userAgent)) browser = "Opera iOS";
    else if (/Coast/.test(userAgent)) browser = "Opera Coast";
    else if (/Sleipnir/.test(userAgent)) browser = "Sleipnir";
    else if (/Puffin/.test(userAgent)) browser = "Puffin";
    else if (/Maxthon/.test(userAgent)) browser = "Maxthon";
    else if (/QQBrowser/.test(userAgent)) browser = "QQ Browser";
    else if (/Baidu/.test(userAgent)) browser = "Baidu";
    else if (/Sogou/.test(userAgent)) browser = "Sogou";
    else if (/2345Explorer/.test(userAgent)) browser = "2345 Explorer";
    else if (/TheWorld/.test(userAgent)) browser = "TheWorld";
    else if (/XiaoMi/.test(userAgent)) browser = "Mi Browser";
    else if (/Quark/.test(userAgent)) browser = "Quark";
    else if (/Qiyu/.test(userAgent)) browser = "Qiyu";
    else if (/MicroMessenger/.test(userAgent)) browser = "WeChat";
    else if (/AlipayClient/.test(userAgent)) browser = "Alipay";
    else if (/DingTalk/.test(userAgent)) browser = "DingTalk";
    else if (/HuaweiBrowser/.test(userAgent)) browser = "Huawei";
    else if (/MiuiBrowser/.test(userAgent)) browser = "Miui";
    else if (/VivoBrowser/.test(userAgent)) browser = "Vivo";
    else if (/OPPOBrowser/.test(userAgent)) browser = "Oppo";
    else if (/HeyTapBrowser/.test(userAgent)) browser = "HeyTap";
    else if (/Quark/.test(userAgent)) browser = "Quark";
    else if (/360SE/.test(userAgent)) browser = "360 Safe";
    else if (/360EE/.test(userAgent)) browser = "360 Extreme";
    // Device type detection
    let deviceType = "Desktop";
    if (
      /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      )
    ) {
      deviceType =
        /iPad/.test(userAgent) ||
        (navigator.maxTouchPoints &&
          window.screen.width > 767 &&
          window.screen.height > 767)
          ? "Tablet"
          : "Mobile";
    } else if (
      /Tablet|iPad/i.test(userAgent) ||
      (navigator.maxTouchPoints &&
        window.screen.width > 767 &&
        window.screen.height > 767)
    ) {
      deviceType = "Tablet";
    }
    return { platform, device, browser, userAgent, deviceType };
  } catch (err) {
    console.error("Error getting device info:", err);
    return {
      platform: "",
      device: "",
      browser: "",
      userAgent: "",
      deviceType: "",
    };
  }
};

// export const getGeoInfo = async () => {
//   try {
//     const res = await fetch("https://ipinfo.io/json?token=8304a624152bd7");
//     const data = await res.json();
//     return {
//       ip: data.ip,
//       city: data.city,
//       region: data.region,
//       country: data.country,
//       loc: data.loc,
//       org: data.org,
//       hostname: data.hostname,
//     };
//   } catch (err) {
//     console.error("Geo lookup failed", err);
//     return null;
//   }
// };

// Properly declare getChats function
export const getChats = (sessionId: string, callBack: (msgs: any) => void) => {
  // Coordination: prevent duplicate requests for same session
  if (sessionLocks[sessionId] === true) return;
  sessionLocks[sessionId] = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(`chat-session-lock:${sessionId}`, "true");
  }
  try {
    socket.emit("FindOneVisitor", sessionId);
    socket.once(`findOne:${sessionId}`, (response) => {
      try {
        if (response?.data?.chats) {
          const chatsData = {
            ...response.data,
            chats: response.data.chats.map((c: Message) => ({
              ...c,
              timestamp: new Date(c.timestamp),
            })),
          };
          callBack(chatsData);
        } else {
          callBack([]);
        }
      } catch (err) {
        console.error("Error processing chat data:", err);
        callBack([]);
      }
      // Release lock after response
      sessionLocks[sessionId] = false;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`chat-session-lock:${sessionId}`, "false");
      }
    });
    // Release lock after timeout (failsafe)
    setTimeout(() => {
      sessionLocks[sessionId] = false;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`chat-session-lock:${sessionId}`, "false");
      }
    }, 5000);
  } catch (err) {
    console.error("Error getting chats:", err);
    callBack([]);
    sessionLocks[sessionId] = false;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`chat-session-lock:${sessionId}`, "false");
    }
  }
};

// Update getUserInfoAPI to use unified data collection
export const getUserInfoAPI = async (includeFingerprint = false) => {
  try {
    const sessionId = getSessionId()
    const visitorId = `visitor-${Date.now()}`

    // Use unified data collector for comprehensive info
    const config = {
      ...defaultDataCollectionConfig,
      enableFingerprinting: includeFingerprint,
    }

    const collector = new UnifiedDataCollector(config)
    const unifiedInfo = await collector.collectUnifiedUserInfo(sessionId, visitorId)

    return {
      onlineTime: new Date(),
      visits: 0,
      referrer: referrerInfoCache,
      device: unifiedInfo.device.device,
      browser: unifiedInfo.device.browser,
      hostname: unifiedInfo.geolocation.hostname || unifiedInfo.geolocation.organization,
      ipAddress: unifiedInfo.geolocation.ip,
      userAgent: unifiedInfo.device.userAgent,
      platform: unifiedInfo.device.platform,
      deviceType: unifiedInfo.device.deviceType,
      location: {
        countryKey: unifiedInfo.geolocation.countryCode,
        city: unifiedInfo.geolocation.city,
        state: unifiedInfo.geolocation.region,
        country: unifiedInfo.geolocation.country,
      },
      fingerprint: unifiedInfo.fingerprint || undefined,
      fingerprintGenerated: !!unifiedInfo.fingerprint,
      fingerprintSignature: unifiedInfo.fingerprintSignature,
      fingerprintConfidence: unifiedInfo.fingerprintConfidence,
      // Additional unified data
      network: unifiedInfo.network,
      pageInfo: unifiedInfo.pageInfo,
      privacySettings: unifiedInfo.privacySettings,
      metadata: unifiedInfo.metadata,
    }
  } catch (error) {
    console.error("Failed to get unified user info:", error)

    // Fallback to basic info
    const basicDeviceInfo = await getUnifiedDeviceInfo()
    const geo = await getGeoInfo()

    return {
      onlineTime: new Date(),
      visits: 0,
      referrer: referrerInfoCache,
      device: basicDeviceInfo.device,
      browser: basicDeviceInfo.browser,
      hostname: geo?.hostname || geo?.org || "",
      ipAddress: geo?.ip || "",
      userAgent: basicDeviceInfo.userAgent,
      platform: basicDeviceInfo.platform,
      deviceType: basicDeviceInfo.deviceType,
      location: {
        countryKey: geo?.country || "",
        city: geo?.city || "",
        state: geo?.region || "",
        country: geo?.country || "",
      },
    }
  }
}

// Store parent info received via postMessage
let parentPageInfoCache: { link?: string; title?: string } = {};
// Listen for parent postMessage (title/link)
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    // In production, check event.origin!
    let data = event.data;
    // Support both direct object and stringified JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }
    if (
      data &&
      typeof data === "object" &&
      (data.type === "kogents:parentInfo" || data.type === "kogents:parentinfo")
    ) {
      // Only update if the link is not the iframe's own URL
      if (data.link && data.link !== window.location.href)
        parentPageInfoCache.link = data.link;
      if (data.title) parentPageInfoCache.title = data.title;
    }
    // Handle widget:referrer-update
    if (
      data &&
      (data.type === "widget:referrer-update" ||
        data === "widget:referrer-update")
    ) {
      try {
        referrerInfoCache = data.payload || data.data || data;
      } catch (err) {}
    }
  });
}

// export function getParentPageInfo(): { link: string; title: string } {
//   try {
//     // Use postMessage value if available and not the iframe's own URL
//     if (
//       parentPageInfoCache.link &&
//       parentPageInfoCache.link !== window.location.href
//     ) {
//       return {
//         link: parentPageInfoCache.link,
//         title: parentPageInfoCache.title || document.title,
//       };
//     }
//     // If not received, request parent info via postMessage (one-time)
//     if (
//       typeof window !== "undefined" &&
//       window.parent &&
//       window.parent !== window
//     ) {
//       try {
//         window.parent.postMessage(
//           { type: "kogents:parentInfo", request: true },
//           "*"
//         );
//       } catch {}
//     }
//     // Fallback to old logic
//     if (
//       typeof window !== "undefined" &&
//       window.parent &&
//       window.parent !== window
//     ) {
//       try {
//         const parentLocation = window.parent.location;
//         const parentDocument = window.parent.document;
//         let parentTitle = parentDocument.title;
//         if (!parentTitle || parentTitle.trim() === "") {
//           const ogTitle = parentDocument.querySelector(
//             'meta[property="og:title"]'
//           );
//           if (ogTitle && ogTitle.getAttribute("content")) {
//             parentTitle = ogTitle.getAttribute("content") || "";
//           } else {
//             const titleTag = parentDocument.querySelector("title");
//             if (titleTag && titleTag.textContent) {
//               parentTitle = titleTag.textContent;
//             }
//           }
//         }
//         return {
//           link: parentLocation.href,
//           title: parentTitle || document.referrer || window.location.href,
//         };
//       } catch (e) {
//         return {
//           link: document.referrer || window.location.href,
//           title: document.title,
//         };
//       }
//     } else {
//       return {
//         link: window.location.href,
//         title: document.title,
//       };
//     }
//   } catch (err) {
//     return {
//       link: window.location.href,
//       title: document.title,
//     };
//   }
// }

export const addUserDetailToSession = async ({
  visitorInfo,
  roomId,
}: {
  visitorInfo: any;
  roomId: string;
}) => {
  try {
    const payload = {
      visitorInfo,
      sessionId: roomId,
    };
    socket.emit("AddVisitorDetailToSession", payload);
  } catch (err) {
    console.error("Error saving chat socket:", err);
  }
};

export const addTagsToSession = async ({
  tags,
  roomId,
}: {
  tags: string[];
  roomId: string;
}) => {
  try {
    const payload = {
      tags,
      sessionId: roomId,
    };
    socket.emit("AddTagToSession", payload);
  } catch (err) {
    console.error("Error saving chat socket:", err);
  }
};

export const removeTagsFromSession = async ({
  tags,
  roomId,
}: {
  tags: string[];
  roomId: string;
}) => {
  try {
    const payload = {
      tags,
      sessionId: roomId,
    };
    socket.emit("RemoveTagFromSession", payload);
  } catch (err) {
    console.error("Error saving chat socket:", err);
  }
};

// Example API handler for chat requests
export async function chatApiHandler(req: any, res: any) {
  // Ensure dependencies are ready
  if (!dependenciesReady()) {
    res.status(503).send("Chat dependencies not ready");
    return;
  }
  // Get widget instance ID (from headers, query, or body)
  const widgetId =
    req.headers["x-widget-id"] ||
    req.query?.widgetId ||
    req.body?.widgetId ||
    "default";
  if (isChatRateLimited(req, widgetId)) {
    res.status(429).send("Chat rate limit exceeded");
    return;
  }
  // Third-party integration coordination example
  // if (process.env.THIRD_PARTY_ENABLED) {
  //   // Only initialize third-party service if dependencies are ready
  //   // ...integration code...
  // }
  // ...existing saveChatSocket logic can be called here if needed...
}

export const saveChatSocket = async ({
  apiToken,
  roomID,
  messages,
  status,
  userInfo,
  includeFingerprint = false,
}: {
  apiToken: string;
  roomID: string;
  messages: Message[];
  status: string;
  userInfo: any;
  includeFingerprint?: boolean;
}) => {
  // Coordination: prevent duplicate save for same session within 1s
  if (sessionLocks[roomID]) return;
  sessionLocks[roomID] = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(`chat-session-lock:${roomID}`, "true");
  }
  try {
    const isEscalated = messages.some((msg) => msg.escalated === true);
    const viewing = getParentPageInfo();

    // Get enhanced user info with optional fingerprinting
    const enhancedUserInfo = includeFingerprint
      ? await getUserInfoAPI(true)
      : userInfo;

    const sessionData = {
      ...enhancedUserInfo,
      sessionId: roomID,
      name: `#${roomID.slice(0, 8)}`,
      status: isEscalated && status === "ai-agent" ? "escalated" : status,
      viewing,
      workspaceId: apiToken,
      chats: messages.map(({ id, status, type, ...rest }) => ({
        ...rest,
        status: status || "sent",
        type: type || "text",
      })),
      // Include unified data collection metadata
      dataCollection: {
        method: enhancedUserInfo?.metadata?.dataCollectionMethod || "basic",
        timestamp: enhancedUserInfo?.metadata?.collectionTimestamp || new Date().toISOString(),
        sources: {
          geolocation: enhancedUserInfo?.metadata?.geolocationSource || "fallback",
          device: enhancedUserInfo?.metadata?.deviceDataSource || "basic",
          network: enhancedUserInfo?.metadata?.networkDataSource || "basic",
        },
        privacy: enhancedUserInfo?.privacySettings || {
          consentGiven: false,
          dataProcessingAllowed: false,
          fingerprintingAllowed: false,
          anonymized: true,
        },
      },
    };

    setSessionId(roomID);

    if (socket.connected) {
      socket.emit("CreateOrUpdate", sessionData);
      lastUnsentSessionData = null;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("kogents_last_unsent_session");
      }
    } else {
      if (socketConnected) {
        lastUnsentSessionData = sessionData;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "kogents_last_unsent_session",
            JSON.stringify(sessionData)
          );
        }
      }
    }
    // Release lock after 1s
    setTimeout(() => {
      sessionLocks[roomID] = false;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`chat-session-lock:${roomID}`, "false");
      }
    }, 1000);
  } catch (err) {
    console.error("Error saving chat socket:", err);
    sessionLocks[roomID] = false;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`chat-session-lock:${roomID}`, "false");
    }
  }
};

if (typeof window !== "undefined") {
  const unsent = window.localStorage.getItem("kogents_last_unsent_session");
  if (unsent) {
    try {
      lastUnsentSessionData = JSON.parse(unsent);
    } catch {}
  }
}

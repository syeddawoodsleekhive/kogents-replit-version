import { generateDeviceFingerprint } from "@/utils/device-fingerprinting";
import {
  UnifiedDataCollector,
  defaultDataCollectionConfig,
} from "@/utils/unified-data-collector";
import { detectUserIP } from "@/utils/hybrid-ip-detector";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import type { locationType, deviceInfoType } from "@/types/chat";

let referrerInfoCache: any = null;

const parentPageInfoCache: { link?: string; title?: string } = {};

let visitorIdCache = "";

// Initialize unified data collector instance
const dataCollector = new UnifiedDataCollector(defaultDataCollectionConfig);

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

export function getReferrerInfo(): any {
  return referrerInfoCache;
}

export function getParentPageInfo(): { link: string; title: string } {
  return {
    link: parentPageInfoCache.link || "",
    title: parentPageInfoCache.title || "",
  };
}

if (typeof window !== "undefined") {
  FingerprintJS.load().then((fp) => {
    fp.get().then((result) => {
      visitorIdCache = result.visitorId;
    });
  });
}

function generateHexId(): string {
  // Generate a random hex string of 16 characters
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

// export function getVisitorId() {
//   return (visitorIdCache || "").slice(0, 8);
// }

export function getVisitorId() {
  if (typeof window !== "undefined") {
    const storedVisitorId = localStorage.getItem("visitor_id");
    if (storedVisitorId) {
      return storedVisitorId.slice(0, 8);
    }
  }

  const newVisitorId = generateHexId();

  if (typeof window !== "undefined") {
    localStorage.setItem("visitor_id", newVisitorId);
  }

  return newVisitorId.slice(0, 8);
}

export const generateMessageId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getDeviceFingerprint = async () => {
  const fingerprint = await generateDeviceFingerprint(true, {
    enableCanvas: true,
    enableWebGL: true,
    enableAudio: true,
    enableFonts: true,
    enableBattery: true,
    enableWebRTC: true,
    enablePlugins: true,
    enableMediaDevices: true,
    timeout: 5000,
    respectPrivacy: false,
  });

  return fingerprint;
};

// Replace direct NeutrinoAPI call with hybrid IP detection
export const getGeoInfo = async () => {
  try {
    const ipResult = await detectUserIP();
    console.log(ipResult, "ipResult");

    if (ipResult.geolocation) {
      return {
        city: ipResult.geolocation.city,
        country: ipResult.geolocation.country,
        countryKey: ipResult.geolocation.countryCode,
        ip: ipResult.geolocation.ip,
        loc: ipResult.geolocation.coordinates,
        org: ipResult.geolocation.organization,
        postal: ipResult.geolocation.postalCode,
        region: ipResult.geolocation.region,
        timezone: ipResult.geolocation.timezone,
      } as locationType;
    }

    // Fallback to basic IP info
    return {
      city: "",
      country: "",
      countryKey: "",
      ip: ipResult.publicIP,
      loc: "",
      org: "",
      postal: "",
      region: "",
      timezone: "",
    } as locationType;
  } catch (err) {
    console.error("Hybrid IP detection failed", err);
    return null;
  }
};

// Replace duplicate device detection with unified data collector
export const getDeviceInfo = async (): Promise<deviceInfoType> => {
  try {
    const sessionId = `temp-${Date.now()}`;
    const visitorId = getVisitorId();
    const unifiedInfo = await dataCollector.collectUnifiedUserInfo(
      sessionId,
      visitorId
    );

    return {
      platform: unifiedInfo.device.platform,
      device: unifiedInfo.device.device,
      browser: unifiedInfo.device.browser,
      userAgent: unifiedInfo.device.userAgent,
      deviceType: unifiedInfo.device.deviceType,
    };
  } catch (err) {
    console.error("Error getting unified device info:", err);
    // Fallback to basic detection
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "";
    return {
      platform: "Unknown",
      device: "Unknown",
      browser: "Unknown",
      userAgent,
      deviceType: "Desktop",
    };
  }
};

// Add unified user info function for comprehensive data collection
export const getUnifiedUserInfo = async (
  sessionId: string,
  includeFingerprint = false
) => {
  try {
    const visitorId = getVisitorId();
    const config = {
      ...defaultDataCollectionConfig,
      enableFingerprinting: includeFingerprint,
    };

    const collector = new UnifiedDataCollector(config);
    return await collector.collectUnifiedUserInfo(sessionId, visitorId);
  } catch (error) {
    console.error("Failed to collect unified user info:", error);
    return null;
  }
};
export const getPageTrackingData = () => {
  const pageInfo = getParentPageInfo();
  return {
    pageUrl: pageInfo.link,
    pageTitle: pageInfo.title,
    pagePath: new URL(pageInfo.link).pathname,
    pageHash: pageInfo.link.split("#")[1] ?? "",
    pageQuery: pageInfo.link.split("?")[1] ?? "",
  };
};

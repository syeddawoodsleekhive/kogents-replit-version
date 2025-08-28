import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// Simple per-request rate limiting (no global pollution)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // max requests per window

function getRateLimitKey(ip: string) {
  return `rate-limit-${ip}`;
}

function isRateLimited(ip: string, req: any): boolean {
  // Use request-scoped store if available, fallback to global (for local dev)
  if (!req.locals) req.locals = {};
  const key = getRateLimitKey(ip);
  const now = Date.now();
  let store = req.locals[key];
  if (!store || now - store.windowStart > RATE_LIMIT_WINDOW_MS) {
    req.locals[key] = { count: 1, windowStart: now };
    return false;
  }
  store.count++;
  if (store.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  req.locals[key] = store;
  return false;
}

// API endpoint to serve the widget embed script with proper headers
export async function GET(req: any) {
  // Get IP address from request headers (works for most proxies)
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "unknown";
  if (isRateLimited(ip, req)) {
    return new NextResponse("Rate limit exceeded", { status: 429 });
  }
  const embedScriptPath = path.join(process.cwd(), "public", "widget-embed.js");
  try {
    let embedScript = await fs.readFile(embedScriptPath, "utf8");
    // Remove or comment out duplicate script blocks (simple regex for demonstration)
    // Only serve the latest script block, comment out others
    const scriptBlocks = embedScript.split(/\/\*\s*SCRIPT_VERSION_MARKER\s*\*\//g);
    if (scriptBlocks.length > 1) {
      // Only keep the last (latest) block, comment out others
      embedScript = scriptBlocks
        .map((block, idx) =>
          idx === scriptBlocks.length - 1 ? block : `/* Duplicate script block removed */`)
        .join("\n");
    }
    // Ensure client readiness and prevent global pollution: wrap script in IIFE, namespace globals, prefix events
    embedScript = `
    (function(window){
      document.addEventListener('DOMContentLoaded',function(){
        window.WidgetAPI = window.WidgetAPI || {};
        // Widget code runs here
        ${embedScript
          .replace(/window\./g, 'window.WidgetAPI.')
          .replace(/document\.addEventListener\(['"](\w+)['"]/g, "document.addEventListener('widget-$1'")}
        // If your script emits events, prefix them with 'widget-' to avoid conflicts
      });
    })(window);
    `;
    return new NextResponse(embedScript, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving widget embed script:", error);
    return new NextResponse("Error serving widget script", { status: 500 });
  }
}

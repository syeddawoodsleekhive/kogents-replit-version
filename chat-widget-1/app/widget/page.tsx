"use client";
// NOTE: All logic in this widget page is encapsulated in the WidgetPage component. 
// No global variables are set, preventing conflicts with parent page globals.

import { Suspense, useEffect, useRef, useState } from "react";
import ChatWidget from "@/components/chat-widget-embedded";
import { WidgetProvider } from "@/context/widgetContext";

/**
 * WidgetPage
 * This page is loaded in the iframe by the widget embed script
 */
export default function WidgetPage() {
  const [isReady, setIsReady] = useState(false);
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [fadeIn, setFadeIn] = useState(false);

  // Timer reference for ready state checking
  const readyCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Send message to parent frame
  const sendToParent = (type: string, data: any = {}) => {
    if (window.parent && document.readyState === "complete") {
      window.parent.postMessage(JSON.stringify({ type, data }), "*");
    }
  };

  // ARIA announcement helper
  const announceAriaState = (state: string) => {
    sendToParent("widget:aria", { state });
    setAriaAnnouncement(state);
  };

  // --- Event Handlers for Parent Messages ---
  const handleCommand = (command: string) => {
    console.log("Received command:", command);
    announceAriaState(`Widget command: ${command}`);
  };

  const handleConfigUpdate = (config: any) => {
    console.log("Received config update:", config);
    announceAriaState("Widget configuration updated");
  };

  const handleIdentify = (user: any) => {
    console.log("Received user identification:", user);
    announceAriaState("User identified in widget");
  };

  // --- Lifecycle: Initialization ---
  useEffect(() => {
    let isMounted = true;

    function checkReady() {
      if (!isMounted) return;
      if (window.parent && document.readyState === "complete") {
        setIsReady(true);
        setFadeIn(true);
        sendToParent("widget:ready");
        announceAriaState("Widget loaded and ready");
      } else {
        readyCheckRef.current = setTimeout(checkReady, 50);
      }
    }

    checkReady();

    // Handle incoming messages from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!data?.type || !data.type.startsWith("widget:")) return;

        switch (data.type) {
          case "widget:command":
            handleCommand(data.command);
            break;
          case "widget:config":
            handleConfigUpdate(data.config);
            break;
          case "widget:identify":
            handleIdentify(data.user);
            break;
          // case "widget:reset": 
          //   // Future: Handle reset events from parent
          //   break;
        }
      } catch (error) {
        console.error("Error handling message from parent:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      isMounted = false;
      if (readyCheckRef.current) clearTimeout(readyCheckRef.current);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // --- ARIA Announcement Reset ---
  useEffect(() => {
    if (ariaAnnouncement && liveRegionRef.current) {
      const timer = setTimeout(() => {
        setAriaAnnouncement("");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [ariaAnnouncement]);

  if (!isReady) return null;

  return (
    <WidgetProvider>
      {/* 
      // NOTE: Main wrapper for widget (disabled for now to avoid double wrappers)
      // <main
      //   role="main"
      //   aria-label="Chat widget main area"
      //   tabIndex={-1}
      //   className={`h-screen w-screen overflow-hidden transform transition-opacity duration-500 ${
      //     fadeIn ? "opacity-100" : "opacity-0"
      //   }`}
      // >
      */}
        {/* ARIA Live Region (for screen readers) */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(1px, 1px, 1px, 1px)",
          }}
        >
          {ariaAnnouncement}
        </div>

        {/* Chat Section */}
        <section role="region" aria-label="Chat widget" tabIndex={-1}>
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>
        </section>
      {/* </main> */}
    </WidgetProvider>
  );
}



// Extend the Window type to include __kogentsWidgetLoaded and potential widget control functions
declare global {
  interface Window {
    __kogentsWidgetLoaded?: boolean;
    // Add these for robust cleanup/control, even if their methods are not directly called
    kogents?: any;
    KogentsWidget?: any;
  }
}
"use client";

import { useEffect, useCallback, useState } from "react";
import { useUser } from "@/context/UserContext";
import EncryptionDemo from "@/components/encryption-demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TestWidgetPage = () => {
  const { workspace: workSpaceObj } = useUser();
  const workspaceId = workSpaceObj?._id;
  const [activeTab, setActiveTab] = useState("widget");

  // Helper function to hide the widget elements
  const hideWidget = useCallback(() => {
    console.log("Attempting to hide widget elements.");
    const container = document.getElementById("widget-container");
    if (container) {
      container.style.display = 'none'; // Hide our container
    }

    // Attempt to find and hide any common elements created by the widget
    // This is crucial if the widget creates elements outside #widget-container
    // or if its initial display is not tied to #widget-container's display.
    document.querySelectorAll(
      'iframe[src*="kogents"], ' + // Any iframes from kogents
      '[id*="kogents"]:not(#widget-container), ' + // Any element with 'kogents' in ID, but not our container
      '[class*="kogents"]:not(.fixed)' // Any element with 'kogents' in class, excluding our container's class if it uses 'kogents'
    ).forEach((el: Element) => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none';
      }
    });

    // If the widget has an explicit hide API, use it.
    if (typeof window !== "undefined") {
      if (window.kogents && typeof window.kogents.hide === 'function') {
        window.kogents.hide();
      } else if (window.KogentsWidget && typeof window.KogentsWidget.hide === 'function') {
        window.KogentsWidget.hide();
      }
    }
  }, []);

  // Helper function to show the widget elements
  const showWidget = useCallback(() => {
    console.log("Attempting to show widget elements.");
    const container = document.getElementById("widget-container");
    if (container) {
      container.style.display = ''; // Reset display to default (block, flex, etc.)
    }

    document.querySelectorAll(
      'iframe[src*="kogents"], ' +
      '[id*="kogents"]:not(#widget-container), ' +
      '[class*="kogents"]:not(.fixed)'
    ).forEach((el: Element) => {
      if (el instanceof HTMLElement) {
        el.style.display = ''; // Reset display
      }
    });

    // If the widget has an explicit show API, use it.
    if (typeof window !== "undefined") {
      if (window.kogents && typeof window.kogents.show === 'function') {
        window.kogents.show();
      } else if (window.KogentsWidget && typeof window.KogentsWidget.show === 'function') {
        window.KogentsWidget.show();
      }
    }
  }, []);


  useEffect(() => {
    if (!workspaceId) return;
    const container = document.getElementById("widget-container");
    if (!container) {
      console.error("#widget-container not found");
      return;
    }

    // Logic to inject the script only once per session
    if (typeof window !== "undefined" && !window.__kogentsWidgetLoaded) {
      window.__kogentsWidgetLoaded = true; // Set the flag immediately

      console.log("Injecting widget script for the first time.");

      // Ensure a clean slate before injecting script for the very first time
      document.querySelectorAll("iframe[src*='kogents']").forEach((iframe) => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      });
      document.querySelectorAll('[id*="kogents"], [class*="kogents"]')
        .forEach((el) => {
          if (el.id !== "widget-container") {
            if (el.parentNode) el.parentNode.removeChild(el);
          }
        });
      const existing = document.getElementById("kogents-chat-widget");
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

      if ("kogents" in window) {
        try { delete window.kogents; } catch (e) { window.kogents = undefined; }
      }
      if ("KogentsWidget" in window) {
        try { delete window.KogentsWidget; } catch (e) { window.KogentsWidget = undefined; }
      }

      const script = document.createElement("script");
      script.id = "kogents-chat-widget";
      script.src = "https://chat.kogents.com/widget-embed.js";
      script.async = true;
      script.setAttribute("data-apiToken", workspaceId);
      script.setAttribute("data-position", "right");
      script.setAttribute("data-color", "#3B82F6");
      container.appendChild(script);

      script.onload = () => {
        console.log("Widget script loaded and appended to #widget-container");
        // After script loads, ensure it's visible. This handles the very first load.
        showWidget();
      };
      script.onerror = (e) => {
        console.error("Failed to load widget script", e);
        // If script loading fails, reset the flag to allow a retry
        if (typeof window !== "undefined") {
          delete window.__kogentsWidgetLoaded;
        }
      };
    } else {
      // If the component mounts and the widget script is already loaded
      console.log("Widget script already loaded, just ensuring visibility.");
      showWidget();
    }

    // Cleanup on unmount (or when workspaceId changes)
    return () => {
      console.log("Component unmounting or effect re-running, calling hideWidget.");
      hideWidget();
    };
  }, [workspaceId, hideWidget, showWidget]); // Dependencies for useEffect

  return (
    <main className="flex flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Test Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="widget">Widget Test</TabsTrigger>
          <TabsTrigger value="encryption">Encryption Demo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="widget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chat Widget Test</CardTitle>
              <CardDescription>
                Test how your chat widget will appear on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={showWidget} variant="outline">
                  Show Widget
                </Button>
                <Button onClick={hideWidget} variant="outline">
                  Hide Widget
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                The widget content will be injected into or around the container below.
              </p>
              {/* The widget content will be injected into or around this container */}
              <div id="widget-container" className="fixed bottom-6 right-6 z-50"></div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="encryption" className="space-y-6">
          <EncryptionDemo />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default TestWidgetPage;
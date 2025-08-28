"use client";
// NOTE: All logic is encapsulated in the DemoPage component.
// No global variables are set, preventing conflicts with widget globals.

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  //#region --- State ---
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [fadeIn, setFadeIn] = useState(false); // For page-level fade-in animation
  //#endregion

  //#region --- Effects ---
  useEffect(() => {
    // Trigger fade-in on mount
    setFadeIn(true);

    const handleWidgetReady = () => setIsWidgetReady(true);

    if (typeof window !== "undefined") {
      // Listen for widget ready event
      window.addEventListener("kogentsChatWidgetReady", handleWidgetReady);

      // Inject widget script if not already present
      const existingScript = document.getElementById("kogents-chat-widget");
      if (!existingScript && !window.KogentsChatWidget) {
        const script = document.createElement("script");
        script.src = `${
          process.env.NEXT_PUBLIC_WIDGET_URL || "https://your-domain.com"
        }/api/widget`;
        script.id = "kogents-chat-widget";
        script.setAttribute("data-position", "right");
        script.setAttribute("data-color", "#3B82F6");
        document.body.appendChild(script);
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("kogentsChatWidgetReady", handleWidgetReady);
      }
    };
  }, []);
  //#endregion

  //#region --- Widget Control Handlers ---
  const handleOpenWidget = () => {
    if (typeof window !== "undefined" && window.KogentsChatWidget) {
      window.KogentsChatWidget.open();
    }
  };

  const handleCloseWidget = () => {
    if (typeof window !== "undefined" && window.KogentsChatWidget) {
      window.KogentsChatWidget.close();
    }
  };

  const handleToggleWidget = () => {
    if (typeof window !== "undefined" && window.KogentsChatWidget) {
      window.KogentsChatWidget.toggle();
    }
  };

  const handleIdentifyUser = () => {
    if (typeof window !== "undefined" && window.KogentsChatWidget) {
      window.KogentsChatWidget.identify({
        name: "Demo User",
        email: "demo@example.com",
        id: "demo-123",
      });
      alert("User identified as Demo User");
    }
  };

  const handleChangeColor = (color: string) => {
    if (typeof window !== "undefined" && window.KogentsChatWidget) {
      window.KogentsChatWidget.updateConfig({ color });
      alert(
        `Widget color updated to ${color === "#FF5733" ? "orange" : "blue"}`
      );
    }
  };
  //#endregion

  return (
    <div
      className={`p-8 max-w-4xl mx-auto transform transition-all duration-700 ${
        fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-500 hover:underline flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-6">Chat Widget Demo</h1>

      {/* Widget loading state */}
      {!isWidgetReady && (
        <div className="p-4 mb-6 bg-yellow-100 text-yellow-800 rounded animate-pulse">
          Widget is loading... If it doesn't appear, please refresh the page.
        </div>
      )}

      {/* Widget Controls */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Widget Controls</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleOpenWidget}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            disabled={!isWidgetReady}
          >
            Open Widget
          </button>
          <button
            onClick={handleCloseWidget}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
            disabled={!isWidgetReady}
          >
            Close Widget
          </button>
          <button
            onClick={handleToggleWidget}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
            disabled={!isWidgetReady}
          >
            Toggle Widget
          </button>
        </div>
      </div>

      {/* User Identification */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">User Identification</h2>
        <button
          onClick={handleIdentifyUser}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors"
          disabled={!isWidgetReady}
        >
          Identify as Demo User
        </button>
      </div>

      {/* Widget Configuration */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Widget Configuration</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleChangeColor("#FF5733")}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
            disabled={!isWidgetReady}
          >
            Change Color (Orange)
          </button>
          <button
            onClick={() => handleChangeColor("#3B82F6")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            disabled={!isWidgetReady}
          >
            Reset Color (Blue)
          </button>
        </div>
      </div>

      {/* Integration Code */}
      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Integration Code</h2>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
          {`<script 
  src="${
    process.env.NEXT_PUBLIC_WIDGET_URL || "https://your-domain.com"
  }/api/widget" 
  id="kogents-chat-widget"
  data-position="right"
  data-color="#3B82F6"
></script>`}
        </pre>
      </div>

      {/* Event Logging */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Event Logging</h2>
        <p className="mb-2">Open your browser console to see widget events.</p>
        <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
          {`// Example event listener
// NOTE: Used for demo logging purposes only
KogentsChatWidget.on('message:sent', (message) => {
  console.log('Message sent:', message);
});`}
        </pre>
      </div>
    </div>
  );
}

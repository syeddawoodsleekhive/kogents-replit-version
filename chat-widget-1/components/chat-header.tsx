"use client";

import { useWidgetContext } from "@/context/widgetContext";
import { useLiveAnnouncement } from "@/hooks/use-live-announcement";
import { cn } from "@/lib/utils";
import { WebSocketStatus } from "@/types/chat";
import { Bot, ConciergeBell, Maximize, Minimize, Minus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/context/language-context";
import { useEffect, useMemo, useRef, useState } from "react";

interface ChatHeaderProps {
  isOnline: boolean;
  wsStatus: WebSocketStatus;
  onClose: () => void;
  onDownloadTranscript: () => void;
  isChatBadge?: boolean;
  onReconnect?: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  messages: MessagesType[];
  roomId: string;
  agentData: any;
  setAgentData: (data: any) => void;
}

export default function ChatHeader({
  isOnline,
  wsStatus,
  onClose,
  isFullScreen,
  isChatBadge = false,
  toggleFullScreen,
  messages = [],
  roomId,
  agentData,
  setAgentData,
}: ChatHeaderProps) {
  const t = useT();
  const { isRTL, direction } = useLanguage();
  const [headerLabel, setHeaderLabel] = useState<string>(
    t("widget.header.aiAssistant")
  );

  // Accessibility: live announcements
  const { liveRegionRef, announce, announcement } = useLiveAnnouncement(1200);

  // Refs for focus management
  const minimizeBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { widgetSettings } = useWidgetContext();

  const agentIcon = useMemo(
    () => (
      <span
        className="text-[#3b82f6] font-bold motion-reduce animation-optimize"
        style={{
          // color: widgetSettings?.appearance.colors.primary,
          color: "#3b82f6",
          willChange: "color",
        }}
      >
        {agentData ? <ConciergeBell size={18} /> : <Bot size={18} />}
      </span>
    ),
    [agentData]
  );

  /** Determine agent name */
  const agentName =
    agentData && agentData.length
      ? t("widget.header.liveChatSupport")
      : t("widget.header.aiAssistant");

  useEffect(() => {
    if (messages.length && roomId) {
      const lastMsg = messages[messages.length - 1];
      const content = lastMsg.content.toLowerCase();
      if (content.includes("has joined the chat")) {
        setAgentData({
          agent: [
            {
              name: t("widget.header.liveAgent"),
            },
          ],
        });
      } else if (content.includes("left the chat")) {
        setAgentData(null);
      }
    }
  }, [messages, roomId, setAgentData, t]);

  /** Manage focus when toggling fullscreen */
  useEffect(() => {
    if (isFullScreen && minimizeBtnRef.current) {
      minimizeBtnRef.current.focus();
    } else if (!isFullScreen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [isFullScreen]);

  /** Update ARIA label for chat header */
  useEffect(() => {
    setHeaderLabel(
      (wsStatus === "open"
        ? t("widget.header.connected")
        : wsStatus === "connecting"
        ? t("widget.header.connecting")
        : t("widget.header.disconnected")) + (isFullScreen ? ", Fullscreen" : "")
    );
  }, [wsStatus, isFullScreen, t]);

  /** Announce fullscreen state changes */
  useEffect(() => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(() => {
      announce(
        isFullScreen
          ? t("widget.accessibility.fullscreen")
          : t("widget.accessibility.windowed")
      );
    }, 80);
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = null;
      }
    };
  }, [isFullScreen, announce, t]);

  return (
    <div
      className={cn(
        "chat-header flex flex-col motion-reduce animation-optimize",
        !isFullScreen && "rounded-t-lg"
      )}
      aria-label={headerLabel}
      role="banner"
      aria-live="off"
      dir={direction}
      data-rtl={isRTL}
      style={{
        backgroundColor: isChatBadge ? "transparent" : "#3b82f6",
        // backgroundColor: widgetSettings?.appearance.colors.primary,
        borderTopLeftRadius: !isFullScreen
          ? // ? widgetSettings?.appearance.borderRadius
            6
          : "0px",
        borderTopRightRadius: !isFullScreen
          ? // ? widgetSettings?.appearance.borderRadius
            6
          : "0px",
        willChange: "background-color, border-radius",
        ...(isChatBadge && {
          borderTop: "8px solid #3b82f6",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
        }),
      }}
    >
      <div
        className={cn(
          "py-2 px-2.5 flex items-center justify-between relative w-full",
          isChatBadge ? "text-gray-700" : "text-white"
        )}
      >
        {!isChatBadge && (
          <div className="flex items-center">
            {widgetSettings?.appearance.showCompanyLogo && (
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2.5">
                {agentIcon}
              </div>
            )}
            <div>
              <div className="flex gap-2">
                <h3 className="font-medium">{agentName}</h3>
              </div>
              <div className="flex items-center text-xs">
                <div className="text-xs flex items-center">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mr-1.5",
                      isOnline ? "bg-green-400" : "bg-gray-300"
                    )}
                  ></div>
                  <span>{isOnline
                      ? t("widget.header.online")
                      : t("widget.header.offline")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isChatBadge && (
          <div className="text-gray-700 w-full mx-auto leading-none px-3 text-center text-[10px]">
            {t("widget.branding.poweredBy")}
          </div>
        )}

        <div className="flex items-center ml-auto">
          {!isChatBadge && (
            <button
              onClick={() => {
                toggleFullScreen();
              }}
              className="text-white hover:text-gray-200 transition-colors mr-2 cursor-pointer"
              aria-label={t("widget.header.fullscreen")}
              title={t("widget.header.fullscreen")}
              ref={minimizeBtnRef}
              style={{ zIndex: 1000, position: "relative" }}
            >
              {isFullScreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          )}

          {!isChatBadge && (
            <button
              onClick={onClose}
              className={cn(
                "hover:text-gray-200 transition-colors",
                "text-white"
              )}
              aria-label={t("widget.button.close")}
              ref={closeBtnRef}
            >
              <Minus className="h-4 w-4" />
            </button>
          )}

          {isChatBadge && (
            <button
              onClick={onClose}
              className={cn(
                "hover:text-gray-200 transition-colors",
                "text-white hover:text-white border px-1 bg-[#3b82f6] rounded-md"
              )}
              aria-label={t("widget.button.close")}
              ref={closeBtnRef}
            >
              <Minus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live region for announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        style={{
          position: "absolute",
          left: "-9999px",
          height: "1px",
          width: "1px",
          overflow: "hidden",
        }}
      >
        {announcement}
      </div>
    </div>
  );
}

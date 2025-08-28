"use client"

import { renderMarkdown } from "@/lib/renderMarkdown";
import { cn } from "@/lib/utils";
import {
  Bot,
  Check,
  CheckCheck,
  Clock,
  User,
  UserX,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { WidgetAppearanceModel } from "@/types/appearance";
import type { Message } from "@/types/chat";
import { useEffect, useRef, useMemo, useState, JSX } from "react";
import FileAttachment from "./file-attachment";
import { useLanguage } from "@/context/language-context";
import { useT } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface MessageItemProps {
  message: MessagesType;
  widgetSettings: WidgetAppearanceModel;
}

// Loading Message Component with attractive animation
const LoadingMessage = ({
  isAgent,
  widgetSettings,
}: {
  isAgent: boolean;
  widgetSettings: WidgetAppearanceModel;
}) => {
  const t = useT();
  
  return (
    <div className="flex items-center gap-2">
      {isAgent && widgetSettings?.appearance.showAvatar && (
        <div
          className="w-8 h-8 rounded-[2rem] overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: `${widgetSettings?.appearance.colors.primary}20`,
            color: widgetSettings?.appearance.colors.primary,
          }}
        >
          <Bot size={16} data-testid="lucide-bot" />
        </div>
      )}
      <div className="max-w-[80%]">
        {isAgent && <p className="text-gray-400 text-xs mb-1">{t('widget.messages.aiAgent')}</p>}
        <div
          className={cn(
            "rounded-lg p-4 relative overflow-hidden group",
            isAgent
              ? "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
          )}
          style={
            isAgent
              ? {
                  backgroundColor: widgetSettings?.appearance.colors.secondary,
                  color: widgetSettings?.appearance.colors.text,
                }
              : {
                  backgroundColor: widgetSettings?.appearance.colors.primary,
                }
          }
        >
          {/* Enhanced shimmer effect background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>

          <div className="flex items-center gap-4 relative z-10">
            {/* Enhanced animated dots loader with custom timing */}
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 bg-current rounded-full animate-ping"
                style={{ animationDelay: "0ms", animationDuration: "1.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-current rounded-full animate-ping"
                style={{ animationDelay: "400ms", animationDuration: "1.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-current rounded-full animate-ping"
                style={{ animationDelay: "800ms", animationDuration: "1.2s" }}
              ></div>
            </div>

            {/* Loading text with enhanced styling */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-700">
                {t('widget.messages.processingMessage')}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {t('widget.messages.pleaseWait')}
              </span>
            </div>
          </div>

          {/* Subtle progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-b-lg animate-pulse"></div>
        </div>

        {/* Enhanced timestamp with status indicator */}
        <div className="flex items-center justify-end mr-[-0.125rem] mt-2 gap-0.5">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{t('widget.messages.justNow')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MessageItem({
  message,
  widgetSettings,
}: MessageItemProps) {
  const t = useT();
  const isAgent =
    message.senderType === "agent" || message.senderType === "ai-agent";
  const isSystem = message.senderType === "agent-system";
  const isHidden = message.senderType === "visitor-system";
  const isDeliveredToServer = !!message.createdAt;
  const isDelivered = !!message.deliveredAt;
  const isRead = !!message.readAt;
  const isUser = message.senderType === "visitor";
  const isLoading =
    message.content === "processing" ||
    message.content === t('widget.messages.processing');

  const formattedTime =
    message.deliveredAt || message.sentAt
      ? formatTime(new Date(message.deliveredAt || message.sentAt || ""))
      : null;
  
  const { isRTL, direction } = useLanguage();

  const getSystemTagClass = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes("disconnected"))
      return {
        class: "text-gray-600", // bg-gray-200
        icon: <WifiOff size={12} data-testid="lucide-wifi-off" />,
      };
    if (lower.includes("reconnection"))
      return {
        class: "text-gray-600", // bg-gray-200
        icon: <Wifi size={12} data-testid="lucide-wifi" />,
      };
    if (lower.includes("connecting"))
      return {
        class: "text-yellow-800", // bg-yellow-100
        icon: (
          <Wifi size={12} className="animate-pulse" data-testid="lucide-wifi" />
        ),
      };
    if (lower.includes("connected to ai agent"))
      return {
        class: "text-green-800", // bg-green-100
        icon: <Bot size={12} data-testid="lucide-bot" />,
      };
    if (lower.includes("connected"))
      return {
        class: "text-green-800", // bg-green-100
        icon: <Wifi size={12} data-testid="lucide-wifi" />,
      };
    if (lower.includes("left the chat"))
      return {
        class: "text-gray-600", // bg-gray-200
        icon: <UserX size={12} data-testid="lucide-user-x" />,
      };
    if (lower.includes("has joined the chat"))
      return {
        class: "text-green-800", // bg-green-100
        icon: <User size={12} data-testid="lucide-user" />,
      };
    return { class: "text-gray-400", icon: null };
  };

  /** Memoized markdown content */
  const renderedContent = useMemo(() => {
    return message.content ? renderMarkdown(message.content) : "";
  }, [message.content]);

  /** Accessibility */
  const [ariaLabel, setAriaLabel] = useState("");
  const [ariaDescribedBy, setAriaDescribedBy] = useState("");
  const [ariaLiveMsg, setAriaLiveMsg] = useState("");
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  /** Update ARIA labels */
  useEffect(() => {
    const senderLabel = isSystem
      ? "System"
      : isAgent
      ? t('widget.messages.agent')
      : isUser
      ? "User"
      : "Unknown";
    const label = `${senderLabel} message: ${message.content || ""}${
      isUser ? (isRead ? ", read" : ", unread") : ""
    }`;
    const described = `${senderLabel} message at ${formattedTime}${
      isUser ? (isRead ? ", read" : ", unread") : ""
    }`;
    const liveMsg = isUser ? (isRead ? "Message read" : "Message unread") : "";

    setAriaLabel(label);
    setAriaDescribedBy(described);
    setAriaLiveMsg(liveMsg);
    if (liveRegionRef.current) liveRegionRef.current.textContent = liveMsg;
  }, [message.content, isRead, isSystem, isAgent, isUser, formattedTime, t]);

  /** Focus new messages */
  // useEffect(() => {
  //   if (messageRef.current && message?.isNew) {
  //     messageRef.current.focus();
  //   }
  // }, [message?.isNew]);

  /** Make sure container is focusable */
  useEffect(() => {
    if (messageRef.current) messageRef.current.tabIndex = 0;
  }, []);

  if (isHidden) return null;

  // Show loading message for processing states
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex",
          isAgent ? "justify-start" : "justify-end",
          "align-center gap-2"
        )}
        role="listitem"
      >
        <LoadingMessage isAgent={isAgent} widgetSettings={widgetSettings} />
      </div>
    );
  }

  const attachmentData = useMemo(() => {
    if (message.metadata?.attachment) {
      const attachmentData = message.metadata.attachment;
      const previewUrl = attachmentData.isBase64
        ? attachmentData.url
        : `${SITE_URL}${attachmentData.url}`;
      return {
        ...attachmentData,
        url: previewUrl,
        previewUrl,
      };
    }
    return null;
  }, [message.metadata?.attachment, SITE_URL]);

  return (
    <div
      className={cn(
        "flex",
        isAgent ? "justify-start" : isSystem ? "justify-center" : "justify-end",
        "align-center gap-2"
      )}
      role="listitem"
      dir={direction}
      data-rtl={isRTL}
    >
      {isSystem ? (
        <p
          className={cn(
            "flex text-xs rounded-sm items-center text-center gap-1", // py-1 px-2
            getSystemTagClass(message.content).class
          )}
        >
          {getSystemTagClass(message.content).icon}
          {message.content}
        </p>
      ) : (
        <>
          {isAgent && widgetSettings?.appearance.showAvatar && (
            <div
              className="w-8 h-8 rounded-[2rem] overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: `${widgetSettings?.appearance.colors.primary}20`,
                // backgroundColor: `#3b82f6`,
                color: widgetSettings?.appearance.colors.primary,
                // color: "#3b82f6",
              }}
            >
              {message.senderType === "agent" ? (
                <User size={16} data-testid="lucide-user" />
              ) : (
                <Bot size={16} data-testid="lucide-bot" />
              )}
            </div>
          )}
          <div className="max-w-[80%]">
            {isAgent && (
              <p className="text-gray-400 text-xs mb-1">
                {message?.senderName ||
                  message?.user?.name ||
                  `${message?.senderType === "ai-agent" ? "AI" : t('widget.messages.liveAgent')} ${t('widget.messages.agent')}`}
              </p>
            )}
            <div
              className={cn(
                "rounded-lg relative transition-all duration-300 ease-out transform message-content",
                isAgent
                  ? "bg-blue-50 p-3"
                  : message.metadata?.attachment
                  ? "p-0" // No padding for file attachments to use full space
                  : "bg-blue-500 text-white p-3" // Blue background only for text messages
              )}
              style={
                isAgent
                  ? {
                      backgroundColor:
                        widgetSettings?.appearance.colors.secondary,
                      color: widgetSettings?.appearance.colors.text,
                    }
                  : message.metadata?.attachment
                  ? {
                      // No background styling for file attachments
                    }
                  : {
                      backgroundColor:
                        widgetSettings?.appearance.colors.primary,
                    }
              }
            >
              {attachmentData ? (
                <FileAttachment
                  file={attachmentData}
                  isUserMessage={!isAgent}
                />
              ) : null}
              {message.content && (
                <p
                  className={cn(
                    "text-sm message-item",
                    message.senderType === "visitor"
                      ? "user-message"
                      : "agent-message"
                  )}
                  dir={direction}
                  style={{
                    wordBreak: "break-word",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(message.content),
                  }}
                />
              )}
              {/* {imageFiles && (
                <FileAttachment
                  file={imageFiles}
                  isUserMessage={!isAgent}
                />
              )} */}
            </div>
            <div className="flex items-center justify-end mr-[-0.125rem] mt-1 gap-0.5">
              <span
                className={cn(
                  "text-[0.625rem]",
                  isAgent
                    ? "text-gray-500"
                    : message.metadata?.attachment
                    ? "text-gray-600" // Dark text for file attachments
                    : "text-gray-500" // Light text for blue background messages
                )}
              >
                {formattedTime}
              </span>
              {/* {} */}
              {isUser && (
                <span>
                  {!isDeliveredToServer && !isDelivered && !isRead && (
                    <Clock size={11} className="text-gray-500" />
                  )}
                  {isDeliveredToServer && !isDelivered && !isRead && (
                    <Check size={11} className="text-gray-500" />
                  )}
                  {(isDelivered || isRead) && (
                    <CheckCheck
                      size={11}
                      className={`${
                        isRead ? "text-blue-700" : "text-gray-500"
                      }`}
                    />
                  )}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Format timestamp for display */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })?.format(date);
}

"use client";

import { useWidgetContext } from "@/context/widgetContext";
import { cn } from "@/lib/utils";
import { WidgetAppearanceModel } from "@/types/appearance";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import ChatHeader from "./chat-header";
import ChatInput from "./chat-input";
import MessageItem from "./message-item";
import TypingIndicator from "./typing-indicator";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { Button } from "./ui/button";
import { ArrowDown } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/context/language-context";

interface MessageListProps {
  isFullScreen: boolean;
  isOpen: boolean;
  headerOptions: any;
  chatInputOptions: any;
  settings: WidgetAppearanceModel | null;
  userInfoPopup: React.ReactNode;
  onTyping?: (isTyping: boolean) => void;
  onSendMessage: (message: string) => void;
  bottomThreshold?: number;
  layoutThresholds?: Partial<Record<"fullScreen" | "windowed", number>>;
  socketStatus?: "connecting" | "connected" | "disconnected";
  showConnectedMessage?: boolean;
  emitSocketEvent?: (event: string, data: any) => void;
}

export default function MessageList({
  isFullScreen,
  headerOptions,
  isOpen,
  chatInputOptions,
  settings,
  userInfoPopup,
  onTyping,
  onSendMessage,
  bottomThreshold,
  layoutThresholds,
  socketStatus,
  showConnectedMessage,
  emitSocketEvent,
}: MessageListProps) {
  const t = useT();
  const { isRTL, direction } = useLanguage();
  const messages = useSelector(
    (state: RootReducerState) => state.chat.messages
  );

  const agentTypingIndicator = useSelector(
    (state: RootReducerState) => state.chat.isAgentTyping
  );

  /** ------------------ Refs ------------------ */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const lastFocusedMessageRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ariaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /** ------------------ State ------------------ */
  const [ariaLiveMessage, setAriaLiveMessage] = useState<string>("");
  const [tabbableMessages, setTabbableMessages] = useState<HTMLElement[]>([]);

  /** ------------------ Context ------------------ */
  const { widgetSettings } = useWidgetContext();

  // Detect if last message was sent by the user (forces auto-scroll)
  const lastMessageFromUser = useMemo(() => {
    const last = messages[messages.length - 1];
    return last?.senderType === "visitor";
  }, [messages]);

  // Smart auto-scroll management
  const effectiveThreshold = useMemo(() => {
    if (typeof bottomThreshold === "number") return bottomThreshold;
    if (layoutThresholds) {
      if (isFullScreen && typeof layoutThresholds.fullScreen === "number")
        return layoutThresholds.fullScreen;
      if (!isFullScreen && typeof layoutThresholds.windowed === "number")
        return layoutThresholds.windowed;
    }
    return undefined;
  }, [bottomThreshold, layoutThresholds, isFullScreen]);

  const { isAtBottom, newItems, scrollToBottom, resetNewItems } = useAutoScroll(
    {
      containerRef: scrollContainerRef,
      itemsLength: messages.length,
      lastMessageFromUser,
      disableAutoScroll: false,
      bottomThreshold: effectiveThreshold,
    }
  );

  /** ------------------ Effects ------------------ */

  // If panel becomes open, pin to bottom once
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const t = setTimeout(() => scrollToBottom(true), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, scrollToBottom]);

  // Auto-scroll to bottom ONLY when user sends a message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isUserMessage = lastMessage?.senderType === "visitor";

      if (isUserMessage) {
        // Auto-scroll to bottom ONLY for user messages with smooth scrolling
        // Add longer delay for file attachments to ensure they're fully rendered
        const delay = lastMessage?.attachment ? 300 : 100;
        const timer = setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, delay);
        return () => clearTimeout(timer);
      }
      // No auto-scroll for agent messages - user must manually scroll or use the arrow button
    }
  }, [messages.length]);

  // Auto-scroll when typing indicator appears and user is at bottom
  useEffect(() => {
    if (agentTypingIndicator?.isTyping && isAtBottom) {
      // When typing indicator appears and user is at bottom, scroll to show it smoothly
      const timer = setTimeout(() => scrollToBottom(false), 100);
      return () => clearTimeout(timer);
    }
  }, [agentTypingIndicator?.isTyping, isAtBottom, scrollToBottom]);

  // Additional auto-scroll for file attachments to ensure they're fully visible
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isUserFileMessage =
        lastMessage?.senderType === "visitor" && lastMessage?.attachment;

      if (isUserFileMessage) {
        // Force scroll to bottom for file attachments with a longer delay and smooth scrolling
        const timer = setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 500); // Longer delay for file attachments
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length]);

  // When user clicks the "scroll to bottom" control
  const handleScrollToBottom = () => {
    scrollToBottom(true);
    resetNewItems();
  };

  // Update tabbable messages for keyboard navigation
  useEffect(() => {
    if (messageListRef.current) {
      const elements = Array.from(
        messageListRef.current.querySelectorAll<HTMLElement>(
          "[data-message-item], [tabindex]"
        )
      ).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
      );
      setTabbableMessages(elements);
    }
  }, [messages.length, agentTypingIndicator]);

  // Restore focus to last focused message when list changes
  useEffect(() => {
    if (
      lastFocusedMessageRef.current !== null &&
      tabbableMessages.length > lastFocusedMessageRef.current
    ) {
      tabbableMessages[lastFocusedMessageRef.current].focus();
    }
  }, [tabbableMessages]);

  // Announce new messages & typing state (ARIA)
  useEffect(() => {
    let announce = "";
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      announce =
        lastMsg.content ||
        lastMsg.attachment?.fileName ||
        t("widget.messages.newMessage");
    }
    if (agentTypingIndicator)
      announce += announce
        ? `, ${t("widget.messages.typing")}`
        : t("widget.messages.typing");

    if (ariaTimeoutRef.current) clearTimeout(ariaTimeoutRef.current);
    ariaTimeoutRef.current = setTimeout(() => {
      setAriaLiveMessage(announce);
      if (liveRegionRef.current) liveRegionRef.current.textContent = announce;
    }, 120);

    return () => {
      if (ariaTimeoutRef.current) {
        clearTimeout(ariaTimeoutRef.current);
        ariaTimeoutRef.current = null;
      }
    };
  }, [messages, agentTypingIndicator, t]);

  // Announce connection status changes for screen readers
  useEffect(() => {
    if (socketStatus === "connected" && showConnectedMessage) {
      const timer = setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = t(
            "widget.messages.socketConnected"
          );
        }
      }, 100);
      return () => clearTimeout(timer);
    } else if (socketStatus === "disconnected") {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = t("widget.status.connectionLost");
      }
    } else if (socketStatus === "connecting") {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = t("widget.status.connecting");
      }
    }
  }, [socketStatus, showConnectedMessage, t]);

  /** ------------------ Render ------------------ */
  return (
    <div
      className={cn(
        "bg-white shadow-lg flex flex-col relative",
        isOpen
          ? isFullScreen
            ? "w-screen h-screen opacity-100 max-h-[100vh]"
            : "opacity-100 h-[calc(100vh-2rem)] w-[calc(100vw-2rem)]"
          : "pointer-events-none",
        !isFullScreen && "rounded-lg"
      )}
      aria-hidden={!isOpen}
      style={{
        borderRadius: !isFullScreen
          ? // ? widgetSettings?.appearance.borderRadius
            6
          : "0px",
      }}
    >
      <ChatHeader {...headerOptions} />
      {userInfoPopup}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 chat-widget-message-list",
          isRTL ? "text-right" : "text-left"
        )}
        style={{
          // backgroundColor: widgetSettings?.appearance.colors.background,
          backgroundColor: "#ffffff",
        }}
        role="log"
        aria-live="polite"
        aria-label={t("widget.messages.newMessage")}
        dir={direction}
        data-rtl={isRTL}
      >
        <div className="space-y-4">
          {/* Connection Status Display */}
          {/* {socketStatus === 'connecting' && (
            <div className="flex justify-center" role="status" aria-live="polite">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" aria-hidden="true"></div>
                <span>Connecting to chat...</span>
              </div>
            </div>
          )} */}

          {/* {showConnectedMessage && socketStatus === 'connected' && (
            <div className="flex justify-center" role="status" aria-live="polite">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
                <span>Socket connected</span>
              </div>
            </div>
          )} */}

          {/* {socketStatus === 'disconnected' && (
            <div className="flex justify-center" role="status" aria-live="polite">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></div>
                <span>Connection lost</span>
              </div>
            </div>
          )} */}

          {messages.map((message, i) => (
            <div key={i}>
              <MessageItem
                message={message}
                widgetSettings={widgetSettings as WidgetAppearanceModel}
              />
            </div>
          ))}
          {agentTypingIndicator && agentTypingIndicator?.isTyping ? (
            <div
              className="flex justify-start animate-message-fade-in"
              aria-label={
                agentTypingIndicator
                  ? t("widget.messages.typing")
                  : t("widget.messages.typing")
              }
              tabIndex={0}
              role="status"
              style={{ willChange: "opacity" }}
            >
              <TypingIndicator agentTypingIndicator={agentTypingIndicator} />
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
        {/* Floating "scroll to bottom / new messages" control */}
        {!isAtBottom && (
          <div
            className={cn(
              "absolute bottom-36 transform",
              isRTL ? "right-4" : "left-1/2 -translate-x-1/2"
            )}
          >
            <Button
              onClick={handleScrollToBottom}
              size="sm"
              className={cn(
                "shadow-md flex items-center justify-center rounded-full",
                "bg-white hover:bg-white",
                newItems > 0 ? "w-fit h-[30px]" : "w-[30px] h-[30px]"
              )}
              aria-label={
                newItems > 0
                  ? `${t("widget.navigation.scrollToBottom")}, ${newItems} ${t(
                      "widget.navigation.newMessages"
                    )}`
                  : t("widget.navigation.scrollToBottom")
              }
            >
              {newItems > 0 ? (
                <span className="text-xs text-[#3b82f6]">{`${newItems} ${t(
                  "widget.navigation.newMessage"
                )}`}</span>
              ) : (
                <ArrowDown className="h-4 w-4 text-[#3b82f6]" />
              )}
            </Button>
          </div>
        )}
      </div>
      <ChatInput
        {...chatInputOptions}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        emitSocketEvent={emitSocketEvent}
      />
    </div>
  );
}

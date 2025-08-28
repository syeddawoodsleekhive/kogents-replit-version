"use client";
// NOTE: All state in this chat state hook is encapsulated in React hooks.
// No global variables are created or mutated, preventing global variable conflicts.

import { useState, useEffect, useCallback, useRef } from "react";
import type { Message, WebSocketMessage } from "@/types/chat";

type useChatStateType = {
  apiToken: string;
  sessionId: string;
  setAgentData: React.Dispatch<React.SetStateAction<any>>;
  visitorActiveStatus: string;
};

// ----------------- ARIA LIVE REGION STATE MANAGEMENT -----------------
const ariaLiveRegionListeners: ((announcement: string) => void)[] = [];
export function addAriaLiveRegionListener(
  listener: (announcement: string) => void
) {
  ariaLiveRegionListeners.push(listener);
}
export function removeAriaLiveRegionListener(
  listener: (announcement: string) => void
) {
  const idx = ariaLiveRegionListeners.indexOf(listener);
  if (idx !== -1) ariaLiveRegionListeners.splice(idx, 1);
}

// ----------------- HOOK IMPLEMENTATION -----------------
export function useChatState({
  apiToken,
  sessionId,
  setAgentData,
  visitorActiveStatus,
}: useChatStateType) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false); // For UI animations

  // Refs for controlling behavior
  const ariaDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastAriaAnnouncement = useRef<string>("");

  // ----------------- HELPERS -----------------
  const announceAriaState = useCallback((announcement: string) => {
    if (ariaDebounceTimer.current) clearTimeout(ariaDebounceTimer.current);
    if (lastAriaAnnouncement.current !== announcement) {
      ariaDebounceTimer.current = setTimeout(() => {
        ariaLiveRegionListeners.forEach((listener) => listener(announcement));
        lastAriaAnnouncement.current = announcement;
      }, 400);
    }
  }, []);

  const triggerTransition = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300); // Smooth reset
  }, []);

  // ----------------- INITIAL DATA FETCH -----------------
  useEffect(() => {
    announceAriaState("User info loaded");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------- UNREAD COUNT -----------------
  useEffect(() => {
    setUnreadCount(
      messages.filter(
        (msg) =>
          (msg.sender === "agent" || msg.sender === "live-agent") &&
          msg.status !== "read"
      ).length
    );
  }, [messages]);

  // ----------------- MESSAGE OPERATIONS -----------------
  const addSystemMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          id: Date.now().toString(),
          sender: "system",
          timestamp: new Date(),
        },
      ]);
      triggerTransition();
      announceAriaState("System message added");
    },
    [announceAriaState, triggerTransition]
  );

  const addUserMessage = useCallback(
    (
      content: string,
      attachment?: { name: string; type: string; url: string; size: number }
    ): Message => {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: content.trim(),
        sender: "user",
        timestamp: new Date(),
        attachment: attachment ?? undefined, // Ensure it's either object or undefined
        status: "sent",
      };

      setMessages((prev) => [
        ...prev.map((m) =>
          (m.sender === "agent" || m.sender === "live-agent") &&
          m.status !== "read"
            ? { ...m, status: "read" as "read" }
            : m
        ),
        userMessage,
      ]);

      triggerTransition();
      announceAriaState("User message added");
      return userMessage;
    },
    [announceAriaState, triggerTransition]
  );

  const addWebSocketMessage = useCallback(
    (wsMessage: WebSocketMessage): Message => {
      const message: Message = {
        id: Date.now().toString(),
        ...wsMessage,
        timestamp: new Date(),
        attachment: wsMessage.attachment ?? undefined, // Explicitly set undefined if missing
        status:
          wsMessage.sender === "user"
            ? ("sent" as "sent" | "delivered" | "read")
            : ("delivered" as "sent" | "delivered" | "read"), // fallback for non-user messages
      };

      setMessages((prev) => {
        const updatedPrev = prev.map((msg) =>
          msg.sender === "user" && msg.status !== "read"
            ? { ...msg, status: "read" as "read" }
            : msg
        );

        const filteredPrevMsgs = updatedPrev.filter(
          (m) =>
            !(
              m.sender === "system" &&
              m.content.toLowerCase().includes("reconnecting chat.")
            )
        );

        return [...filteredPrevMsgs, message];
      });

      triggerTransition();
      announceAriaState("WebSocket message added");
      return message;
    },
    [announceAriaState, triggerTransition]
  );

  const updateMessageStatus = useCallback(
    (messageId: string, status: "sent" | "delivered" | "read") => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
      );
      triggerTransition();
      announceAriaState(`Message status updated to ${status}`);
    },
    [announceAriaState, triggerTransition]
  );

  const markAllAsRead = useCallback(() => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        (msg.sender === "agent" || msg.sender === "live-agent") &&
        msg.status !== "read"
          ? { ...msg, status: "read" }
          : msg
      )
    );
    triggerTransition();
    announceAriaState("All messages marked as read");
  }, [announceAriaState, triggerTransition]);

  const clearChatHistory = useCallback(() => {
    setMessages([]);
    triggerTransition();
    announceAriaState("Chat history cleared");
  }, [announceAriaState, triggerTransition]);

  // ----------------- RETURN API -----------------
  return {
    messages,
    addUserMessage,
    addWebSocketMessage,
    updateMessageStatus,
    markAllAsRead,
    unreadCount,
    setMessages,
    clearChatHistory,
    addSystemMessage,
    isTransitioning, // For UI animations
  };
}

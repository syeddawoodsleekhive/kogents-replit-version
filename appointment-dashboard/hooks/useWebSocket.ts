"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  type WebSocketService,
  type WebSocketMessage,
  type ConnectionStatus,
  getWebSocketService,
  resetWebSocketService,
} from "@/lib/websocket-service";
import { Message, Visitor } from "@/types/visitor";

interface UseWebSocketOptions {
  roomId?: string;
  agentId?: string;
  agentName?: string;
  autoConnect?: boolean;
  setChatHistory?: React.Dispatch<React.SetStateAction<Message[]>>;
  maximizing?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    roomId = "",
    agentId = "",
    agentName = "",
    autoConnect = true,
    maximizing = false,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    resetWebSocketService();

    if (roomId && agentId && agentName) {
      const ws = getWebSocketService(roomId, agentId, agentName);
      wsRef.current = ws;

      const removeStatusListener = ws.addStatusListener(setStatus);

      const removeMessageListener = ws.addMessageListener((message) => {
        if (message.type === "visitor_typing_start") {
          setIsTyping(true);

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        } else if (message.type === "visitor_typing_end") {
          setIsTyping(false);

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        } else {
          setMessages((prev) => [...prev, message]);
        }
      });

      if (false) {
        console.log(roomId);
        ws.connect(maximizing);
      }

      return () => {
        removeStatusListener();
        removeMessageListener();

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [roomId, agentId, agentName, autoConnect]);

  const sendMessage = useCallback(
    (content: string) => {
      try {
        if (wsRef.current && status == "connected") {
          wsRef.current.sendMessage(content);

          const ourMessage: WebSocketMessage = {
            type: "agent_message",
            payload: {
              content,
              agent_id: agentId,
              agent_name: agentName,
            },
            timestamp: new Date().toISOString(),
            sender: "agent",
            room_id: roomId,
          };

          setMessages((prev) => [...prev, ourMessage]);
          return true;
        }
        return false;
      } catch (error) {
        console.error("WebSocket sendMessage error:", error);
        return false;
      }
    },
    [agentId, agentName, roomId, status]
  );

  const connect = useCallback(() => {
    try {
      if (wsRef.current) {
        wsRef.current.connect();
      }
    } catch (error) {
      console.error("WebSocket connect error:", error);
    }
  }, []);

  const disconnect = useCallback((minimizing: boolean = false, manual: boolean = false) => {
    try {
      if (wsRef.current) {
        wsRef.current.disconnect(minimizing, manual);
      }
    } catch (error) {
      console.error("WebSocket disconnect error:", error);
    }
  }, []);

  const reset = useCallback(() => {
    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      resetWebSocketService();
      wsRef.current = null;
      setMessages([]);
      setStatus("disconnected");
      setIsTyping(false);
    } catch (error) {
      console.error("WebSocket reset error:", error);
    }
  }, []);

  return {
    status,
    messages,
    isTyping,
    sendMessage,
    connect,
    disconnect,
    reset,
  };
};

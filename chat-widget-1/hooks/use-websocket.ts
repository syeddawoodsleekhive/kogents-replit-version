"use client";

import { useWidgetContext } from "@/context/widgetContext";
import { Message, WebSocketStatus } from "@/types/chat";
import { isValidBackendId } from "@/utils/isValidBackendId";
import { useState, useEffect, useCallback, useRef } from "react";

interface UseWebSocketOptions {
  url: string;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sessionId?: string;
  isOpen?: boolean;
}

const socketURL =
  process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "echo.websocket.org";
const MAX_RECONNECTION_ATTEMPTS = 4;

export function useWebSocket({
  url,
  onOpen,
  onClose,
  onMessage,
  onError,
  setMessages,
  sessionId,
  isOpen,
}: UseWebSocketOptions) {
  /** ------------------------------
   *  CONNECTION & STATE TRACKERS
   * ----------------------------- */
  const wsLockKey = sessionId
    ? `ws-connection-lock:${sessionId}`
    : `ws-connection-lock:default`;
  const wsLockRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const hasConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const isOpenRef = useRef(isOpen);
  const [status, setStatus] = useState<WebSocketStatus>("connecting");
  const [isStatusTransitioning, setIsStatusTransitioning] = useState(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Lock WebSocket across tabs
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === wsLockKey)
        wsLockRef.current = event.newValue === "true";
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [wsLockKey]);

  const triggerStatusTransition = useCallback(() => {
    setIsStatusTransitioning(true);
    setTimeout(() => setIsStatusTransitioning(false), 300);
  }, []);

  /** ------------------------------
   *  SYSTEM MESSAGES
   * ----------------------------- */
  const setStatusMessage = useCallback(
    (msg: string) => {
      try {
        setMessages((prev) => {
          const filteredPrev = prev.filter(
            (p) =>
              !(
                p.sender === "system" &&
                (p.content.toLowerCase().includes("connecting") ||
                  p.content.toLowerCase().includes("connection."))
              )
          );

          // Prevent duplicate "Connected to AI Agent"
          if (msg === "Connected to AI Agent" && filteredPrev.length > 0) {
            const sysMsgs = filteredPrev.filter((i) => i.sender === "system");
            if (
              sysMsgs[sysMsgs.length - 1]?.content.includes(
                "Connected to AI Agent"
              )
            ) {
              return filteredPrev;
            }
          }

          return [
            ...filteredPrev,
            {
              id: Date.now().toString(),
              sender: "system",
              content: msg,
              timestamp: new Date(Date.now() - 50),
              type: "status",
            },
          ];
        });
      } catch (err) {
        console.error("Error setting status message:", err);
      }
    },
    [setMessages]
  );

  /** ------------------------------
   *  HEALTH CHECK
   * ----------------------------- */
  async function isWebSocketHealthy(): Promise<boolean> {
    const healthUrl = `https://${socketURL}/healthz`;
    try {
      const res = await fetch(healthUrl, {
        method: "POST",
        cache: "no-store",
        headers: { "X-Health-Token": "kogent_1231" },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** ------------------------------
   *  RECONNECTION LOGIC
   * ----------------------------- */
  const reconnect = useCallback(async () => {
    try {
      if (!navigator.onLine) return;
      const healthy = await isWebSocketHealthy();
      if (healthy) {
        if (reconnectAttemptsRef.current >= MAX_RECONNECTION_ATTEMPTS) {
          console.warn("Max reconnection attempts reached.");
          setStatusMessage("Max reconnection attempts reached.");
          return;
        }
        reconnectAttemptsRef.current += 1;
        console.log(`Reconnecting attempt ${reconnectAttemptsRef.current}...`);
        socketRef.current?.close();
        socketRef.current = null;
        hasConnectedRef.current = false;
        connect();
      } else {
        setTimeout(reconnect, 2500);
      }
    } catch (err) {
      console.error("Error during reconnect:", err);
    }
  }, [setStatusMessage]);

  /** ------------------------------
   *  MAIN CONNECTION HANDLER
   * ----------------------------- */
  const connect = useCallback(async () => {
    if (wsLockRef.current) {
      console.log("WebSocket already active in another tab/session.");
      return;
    }
    wsLockRef.current = true;
    localStorage.setItem(wsLockKey, "true");

    try {
      const healthy = await isWebSocketHealthy();
      if (!healthy) {
        setStatus("error");
        triggerStatusTransition();
        setTimeout(reconnect, 5000);
        wsLockRef.current = false;
        localStorage.setItem(wsLockKey, "false");
        return;
      }

      // Skip if already connected
      if (
        hasConnectedRef.current &&
        socketRef.current &&
        socketRef.current.readyState !== WebSocket.CLOSED &&
        socketRef.current.readyState !== WebSocket.CLOSING
      ) {
        wsLockRef.current = false;
        localStorage.setItem(wsLockKey, "false");
        return;
      }

      socketRef.current?.close();
      setStatus("connecting");
      triggerStatusTransition();

      const socket = new WebSocket(url);

      /** ------------------------------
       *  SOCKET EVENT HANDLERS
       * ----------------------------- */
      socket.onopen = (event) => {
        try {
          console.log("WebSocket connected");
          setStatus("open");

          // Remove temporary network-related system messages after successful reconnection
          setMessages((prev) =>
            prev.filter(
              (p) =>
                !(
                  p.sender === "system" &&
                  (p.content.toLowerCase().includes("network offline") ||
                    p.content.toLowerCase().includes("network restored"))
                )
            )
          );

          hasConnectedRef.current = true;
          reconnectAttemptsRef.current = 0;
          onOpen?.(event);
        } catch (err) {
          console.error("Error in onopen handler:", err);
        }
      };
      // socket.onopen = (event) => {
      //   try {
      //     console.log("WebSocket connected");
      //     setStatus("open");
      //     hasConnectedRef.current = true;
      //     reconnectAttemptsRef.current = 0;
      //     onOpen?.(event);
      //   } catch (err) {
      //     console.error("Error in onopen handler:", err);
      //   }
      // };
      socket.onclose = (event) => {
        console.log("WebSocket closed", event.code, event.reason);
        setStatus("closed");
        triggerStatusTransition();
        onClose?.(event);
        wsLockRef.current = false;
        localStorage.setItem(wsLockKey, "false");
        if (reconnectAttemptsRef.current < MAX_RECONNECTION_ATTEMPTS) {
          setTimeout(reconnect, 2000);
        } else {
          setStatusMessage("Max reconnection attempts reached.");
        }
      };

      socket.onmessage = (event) => {
        try {
          const messageData =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;

          if (
            messageData?.sender === "system" &&
            messageData?.ai_agent_status &&
            isValidBackendId(messageData?.content)
          ) {
            setStatusMessage("Connected to AI Agent");
          }

          // Optional: play notification sound for valid non-system messages
          if (
            messageData?.sender !== "system" &&
            messageData?.status !== "hidden" &&
            audioContext.current
          ) {
            playNotificationSound();
          }

          onMessage?.(event);
        } catch (err) {
          console.error("Error in onmessage handler:", err);
        }
      };

      socket.onerror = (event) => {
        setStatus("error");
        triggerStatusTransition();
        onError?.(event);
      };

      socketRef.current = socket;
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setStatus("error");
      triggerStatusTransition();
      wsLockRef.current = false;
      localStorage.setItem(wsLockKey, "false");
    }
  }, [
    url,
    onOpen,
    onClose,
    onMessage,
    onError,
    reconnect,
    setStatusMessage,
    triggerStatusTransition,
    wsLockKey,
  ]);

  /** ------------------------------
   *  CONNECTION INIT & CLEANUP
   * ----------------------------- */
  useEffect(() => {
    let triedFallback = false;
    function tryConnectWhenContainerExists(attempt = 0) {
      const container = document.getElementById("widget-container");
      if (container && !hasConnectedRef.current) {
        connect();
      } else if (!hasConnectedRef.current) {
        if (attempt < 40)
          setTimeout(() => tryConnectWhenContainerExists(attempt + 1), 50);
        else if (!triedFallback) {
          triedFallback = true;
          connect(); // Fallback: connect anyway
        }
      }
    }
    tryConnectWhenContainerExists();

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        socketRef.current.onopen = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  /** ------------------------------
   *  NETWORK MONITORING
   * ----------------------------- */
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    async function isNetworkReallyOnline() {
      if (!navigator.onLine) return false;
      try {
        await fetch("https://www.google.com/generate_204", {
          method: "GET",
          cache: "no-store",
          mode: "no-cors",
        });
        return true;
      } catch {
        return false;
      }
    }

    function tryReconnectWhenReallyOnline() {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      const poll = async () => {
        if (await isNetworkReallyOnline()) {
          setStatusMessage("Network restored. Reconnecting chat...");
          reconnectAttemptsRef.current = 0;
          reconnect();
        } else {
          reconnectTimeout = setTimeout(poll, 1000);
        }
      };
      poll();
    }

    window.addEventListener("online", tryReconnectWhenReallyOnline);
    window.addEventListener("offline", () =>
      setStatusMessage("Network offline. Waiting for reconnection...")
    );

    return () => {
      window.removeEventListener("online", tryReconnectWhenReallyOnline);
      window.removeEventListener("offline", () => {});
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [reconnect, setStatusMessage]);

  /** ------------------------------
   *  OUTGOING MESSAGE QUEUE
   * ----------------------------- */
  const outgoingQueueRef = useRef<any[]>([]);
  const OUTGOING_QUEUE_KEY = `chat_outgoing_queue_${sessionId || "default"}`;

  const persistOutgoingQueue = useCallback(() => {
    try {
      localStorage.setItem(
        OUTGOING_QUEUE_KEY,
        JSON.stringify(outgoingQueueRef.current)
      );
    } catch (err) {
      console.error("Failed to persist outgoing queue:", err);
    }
  }, [OUTGOING_QUEUE_KEY]);

  const restoreOutgoingQueue = useCallback(() => {
    try {
      const stored = localStorage.getItem(OUTGOING_QUEUE_KEY);
      if (stored) outgoingQueueRef.current = JSON.parse(stored);
    } catch (err) {
      console.error("Failed to restore outgoing queue:", err);
    }
  }, [OUTGOING_QUEUE_KEY]);

  useEffect(() => restoreOutgoingQueue(), [restoreOutgoingQueue, sessionId]);

  const sendOrQueueMessage = useCallback(
    (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(data);
        return true;
      } else {
        outgoingQueueRef.current.push(data);
        persistOutgoingQueue();
        return false;
      }
    },
    [persistOutgoingQueue]
  );

  useEffect(() => {
    if (status === "open" && outgoingQueueRef.current.length > 0) {
      while (outgoingQueueRef.current.length > 0) {
        const msg = outgoingQueueRef.current.shift();
        try {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(msg);
            persistOutgoingQueue();
          } else {
            outgoingQueueRef.current.unshift(msg);
            persistOutgoingQueue();
            break;
          }
        } catch {
          outgoingQueueRef.current.unshift(msg);
          persistOutgoingQueue();
          break;
        }
      }
    }
  }, [status, persistOutgoingQueue]);

  const closeConnection = useCallback(() => {
    try {
      if (socketRef.current) {
        setStatus("closing");
        triggerStatusTransition();
        socketRef.current.close();
      }
    } catch (err) {
      console.error("Error closing WebSocket:", err);
    }
  }, [triggerStatusTransition]);

  /** ------------------------------
   *  SOUND & HAPTIC FEEDBACK
   * ----------------------------- */
  const audioContext = useRef<AudioContext | null>(null);
  const soundEnabled = useRef(true);
  const hapticEnabled = useRef(true);
  const soundVolume = useRef(1);
  const notificationtype = useRef<string>("message");
  const soundTypes = {
    message: "message",
    notification: "notification",
    alert: "alert",
  };

  const { widgetSettings } = useWidgetContext();

  useEffect(() => {
    soundEnabled.current = widgetSettings?.sound.enabled ?? true;
    hapticEnabled.current = widgetSettings?.sound.hapticFeedback ?? true;
    soundVolume.current = widgetSettings?.sound.volume ?? 1;
    notificationtype.current = widgetSettings?.sound.type ?? "message";
  }, [widgetSettings]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled.current || !audioContext.current) return;
    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      // Different sound patterns based on type
      switch (notificationtype.current) {
        case soundTypes.message:
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(
            830,
            audioContext.current.currentTime
          );
          oscillator.frequency.exponentialRampToValueAtTime(
            500,
            audioContext.current.currentTime + 0.1
          );
          gainNode.gain.setValueAtTime(
            soundVolume.current * 0.2,
            audioContext.current.currentTime
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.current.currentTime + 0.2
          );
          break;
        case soundTypes.notification:
          oscillator.type = "triangle";
          oscillator.frequency.setValueAtTime(
            750,
            audioContext.current.currentTime
          );
          oscillator.frequency.exponentialRampToValueAtTime(
            900,
            audioContext.current.currentTime + 0.1
          );
          oscillator.frequency.exponentialRampToValueAtTime(
            700,
            audioContext.current.currentTime + 0.2
          );
          gainNode.gain.setValueAtTime(
            soundVolume.current * 0.15,
            audioContext.current.currentTime
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.current.currentTime + 0.3
          );
          break;
        default:
          oscillator.type = "square";
          oscillator.frequency.setValueAtTime(
            950,
            audioContext.current.currentTime
          );
          gainNode.gain.setValueAtTime(
            soundVolume.current * 0.1,
            audioContext.current.currentTime
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.current.currentTime + 0.15
          );
      }

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      oscillator.start();
      oscillator.stop(audioContext.current.currentTime + 0.3);

      // Optional: Haptic feedback
      if (hapticEnabled.current && "vibrate" in navigator) {
        navigator.vibrate(
          notificationtype.current === soundTypes.notification
            ? [40, 30, 40]
            : 80
        );
      }
    } catch {}
  }, []);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContext.current) {
        try {
          audioContext.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        } catch {}
      }
    };
    window.addEventListener("click", initAudio, { once: true });
    return () => window.removeEventListener("click", initAudio);
  }, []);

  return {
    status,
    isStatusTransitioning,
    sendMessage: sendOrQueueMessage,
    closeConnection,
    reconnect,
  };
}

import {
  setAddMessage,
  setAgentTyping,
  setAllMessages,
  setMessageDelivered,
  setMessageDeliveredToServer,
  setMessageRead,
} from "@/app/api/v2/chat";
import { generateMessageId, getPageTrackingData } from "@/app/api/v2/functions";
import {
  SendMessageDeliveredPayload,
  SendMessagePayload,
  UseVisitorChatSocketProps,
  MessageReadRequest,
} from "@/types/visitorSocket";
import { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { io, Socket } from "socket.io-client";
import { useMessageEncryption } from "./use-message-encryption";
import { cryptoManager } from "@/utils/crypto-manager";
import { FileUploadStatusEvent } from "@/types/chat.v2";

const socketURL = process.env.NEXT_PUBLIC_NEW_SOCKET_URL || "";

export function useVisitorChatSocket({
  sessionId,
  workspaceId,
  departmentId,
  visitorId,
}: UseVisitorChatSocketProps) {
  const socketRef = useRef<Socket | null>(null);

  const dispatch: AppReducerDispatch = useDispatch();

  const ready = !!socketURL && !!sessionId && !!workspaceId && !!visitorId;

  const outgoingQueueRef = useRef<any[]>([]);

  const OUTGOING_QUEUE_KEY = `visitor_chat_outgoing_queue_${
    sessionId || "default"
  }`;

  const { encryptMessage, decryptMessage, isEncryptionEnabled } =
    useMessageEncryption(sessionId || "default");

  // Function to check session key status
  const checkSessionKeyStatus = useCallback(async () => {
    if (sessionId && isEncryptionEnabled) {
      try {
        // This will either return the existing key or generate a new one
        await cryptoManager.generateSessionKey(sessionId);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }, [sessionId, isEncryptionEnabled]);

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
      if (stored) {
        outgoingQueueRef.current = JSON.parse(stored);
      }
    } catch (err) {
      console.error("Failed to restore outgoing queue:", err);
    }
  }, [OUTGOING_QUEUE_KEY]);

  useEffect(() => {
    restoreOutgoingQueue();
  }, [restoreOutgoingQueue, sessionId]);

  // Initialize encryption session key when ready
  useEffect(() => {
    if (ready && isEncryptionEnabled && sessionId) {
      // Check and generate session key
      checkSessionKeyStatus();
    }
  }, [ready, isEncryptionEnabled, sessionId, checkSessionKeyStatus]);

  const sendOrQueueMessage = useCallback(
    (eventName: string, data: any) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(eventName, data);
        return true;
      } else {
        outgoingQueueRef.current.push({ eventName, data });
        persistOutgoingQueue();
        return false;
      }
    },
    [persistOutgoingQueue]
  );

  useEffect(() => {
    if (socketRef.current?.connected && outgoingQueueRef.current.length > 0) {
      while (outgoingQueueRef.current.length > 0) {
        const queuedMessage = outgoingQueueRef.current.shift();
        try {
          if (socketRef.current && socketRef.current.connected) {
            if (queuedMessage.eventName === "visitor-message") {
              dispatch(
                setAddMessage({
                  messageId: queuedMessage.data.messageId,
                  content: queuedMessage.data.message,
                  messageType: "text",
                  roomId: "",
                  senderId: sessionId,
                  senderType: "visitor",
                  isEncrypted: queuedMessage.data.isEncrypted,
                  encryptedData: queuedMessage.data.encryptedData,
                })
              );
            }
            socketRef.current.emit(queuedMessage.eventName, queuedMessage.data);
            persistOutgoingQueue();
          } else {
            outgoingQueueRef.current.unshift(queuedMessage);
            persistOutgoingQueue();
            break;
          }
        } catch (err) {
          outgoingQueueRef.current.unshift(queuedMessage);
          persistOutgoingQueue();
          break;
        }
      }
    }
  }, [socketRef.current?.connected, persistOutgoingQueue, dispatch, sessionId]);

  useEffect(() => {
    if (!ready) return;

    if (socketRef.current) return;

    const socket: Socket = io(`${socketURL}`, {
      transports: ["websocket", "polling"],
      auth: {
        sessionId,
        workspaceId,
        visitorId,
        userType: "visitor",
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("visitor-connected", () => {
      const pageTracking = getPageTrackingData();
      socket.emit("track-visitor-page", pageTracking);
      console.log("Visitor connected");
    });

    socket.on("message-history", (data: MessageHistoryType) => {
      dispatch(setAllMessages(data.messages));

      const undeliveredMessages = data.messages.filter(
        (m) =>
          !m.deliveredAt &&
          (m.senderType === "agent" || m.senderType === "ai-agent")
      );

      if (undeliveredMessages.length > 0) {
        socket.emit("message-delivered", {
          messages: undeliveredMessages.map((m) => ({
            messageId: m.messageId,
            senderId: m.senderId || m.userId,
          })),
          roomId: undeliveredMessages[0].roomId,
        });
      }

      if (outgoingQueueRef.current.length > 0) {
        while (outgoingQueueRef.current.length > 0) {
          const queuedMessage = outgoingQueueRef.current.shift();
          try {
            if (queuedMessage.eventName === "visitor-message") {
              dispatch(
                setAddMessage({
                  messageId: queuedMessage.data.messageId,
                  content: queuedMessage.data.message,
                  messageType: "text",
                  roomId: "",
                  senderId: sessionId,
                  senderType: "visitor",
                  isEncrypted: queuedMessage.data.isEncrypted,
                  encryptedData: queuedMessage.data.encryptedData,
                })
              );
            }
            socket.emit(queuedMessage.eventName, queuedMessage.data);
            persistOutgoingQueue();
          } catch (err) {
            outgoingQueueRef.current.unshift(queuedMessage);
            persistOutgoingQueue();
            break;
          }
        }
      }
    });

    socket.on("new-message", async (data: MessagesType) => {
      try {
        let messageContent = data.content;

        if (data.isEncrypted && data.encryptedData && sessionId) {
          try {
            // Convert the encryptedData to the proper EncryptedMessage type
            const encryptedMessage = {
              encryptedContent: data.encryptedData.encryptedContent,
              metadata: data.encryptedData.metadata,
              messageType: data.encryptedData.messageType as
                | "text"
                | "file"
                | "system",
              originalLength: data.encryptedData.originalLength,
            };
            messageContent = await decryptMessage(encryptedMessage);
          } catch (error) {
            console.error("[v0] Message decryption failed:", error);
            messageContent = "[Encrypted message - decryption failed]";
          }
        }

        const processedMessage: MessagesType = {
          ...data,
          content: messageContent,
          ...(data?.attachment && {
            metadata: {
              attachment: {
                ...data.attachment,
              },
            },
          }),
        };

        if (data.senderType !== "visitor") {
          socket.emit("message-delivered", {
            messages: [
              {
                messageId: data.messageId,
                senderId: data.senderId,
              },
            ],
            roomId: data.roomId,
          });
        }
        dispatch(setAddMessage(processedMessage));
      } catch (error) {
        console.error("[v0] Failed to process incoming message:", error);
        dispatch(setAddMessage(data));
      }
    });

    socket.on("message-ack", (data) => {
      dispatch(setMessageDeliveredToServer(data.messageId));
    });

    socket.on("delivered-to", (data) => {
      dispatch(setMessageDelivered(data.messageId));
    });

    socket.on("messages-read", (data: MessageReadEvent) => {
      dispatch(setMessageRead(data.messageIds, data.readAt));
    });

    socket.on("agent-joined-room", (data) => {
      const systemMessage: MessagesType = {
        messageId: generateMessageId(),
        content: `${data.agentName} has joined the chat`,
        messageType: "text",
        roomId: data.roomId,
        senderId: data.senderId,
        senderType: "agent-system",
      };
      dispatch(setAddMessage(systemMessage));
    });

    socket.on("agent-left-room", (data) => {
      const systemMessage: MessagesType = {
        messageId: generateMessageId(),
        content: `${data.agentName} has left the chat`,
        messageType: "text",
        roomId: data.roomId,
        senderId: data.senderId,
        senderType: "agent-system",
      };
      dispatch(setAddMessage(systemMessage));
    });

    socket.on("typing-indicator", (data: TypingIndicatorPayload) => {
      if (data.clientType === "agent") {
        if (data.isTyping) {
          dispatch(setAgentTyping(data));
        } else {
          dispatch(setAgentTyping(undefined));
        }
      }
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [ready, decryptMessage, sessionId]);

  const sendMessage = useCallback(
    async (message: string) => {
      try {
        let messageContent = message;
        let isEncrypted = false;
        let encryptedData = undefined;

        if (isEncryptionEnabled && sessionId) {
          try {
            // Ensure session key exists and is ready
            // Wait for session key to be available
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
              try {
                // Try to generate/access the session key
                await cryptoManager.generateSessionKey(sessionId);
                break;
              } catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                  throw new Error(
                    `Failed to generate session key after ${maxAttempts} attempts`
                  );
                }
                // Wait a bit before retrying
                await new Promise((resolve) => setTimeout(resolve, 200));
              }
            }

            // Create encryption for future use (console only)
            const encrypted = await encryptMessage(message);

            // Single comprehensive console with all encrypted data information
            console.log(
              `[v0] 🔐 Message Encrypted Successfully (For Future Use)`,
              {
                sessionId: sessionId,
                originalMessage: message,
                originalLength: message.length,
                encryptedContent: encrypted.encryptedContent,
                encryptedLength: encrypted.encryptedContent.length,
                metadata: encrypted.metadata,
                encryptionResult: {
                  keyId: encrypted.metadata.keyId,
                  algorithm: encrypted.metadata.algorithm,
                  iv: encrypted.metadata.iv,
                  authTag: encrypted.metadata.authTag,
                  timestamp: encrypted.metadata.timestamp,
                  version: encrypted.metadata.version,
                },
              }
            );

            // Keep original message for sending (not encrypted)
            messageContent = message;
            isEncrypted = false;
            encryptedData = undefined;
          } catch (error) {
            // Encryption failed, continue with plaintext
            messageContent = message;
            isEncrypted = false;
            encryptedData = undefined;
          }
        }

        const messageObj: SendMessagePayload = {
          messageId: generateMessageId(),
          message: messageContent,
          isEncrypted,
          encryptedData: undefined, // Always undefined since we're not sending encrypted data
        };

        dispatch(
          setAddMessage({
            messageId: messageObj.messageId,
            content: message,
            messageType: "text",
            roomId: "",
            senderId: sessionId,
            senderType: "visitor",
            isEncrypted: false, // Always false since we're not storing encrypted data
            encryptedData: undefined, // Always undefined since we're not storing encrypted data
          })
        );

        sendOrQueueMessage("visitor-message", messageObj);
      } catch (error) {
        console.error("[v0] Failed to send message:", error);
      }
    },
    [sendOrQueueMessage, sessionId, encryptMessage, isEncryptionEnabled]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      sendOrQueueMessage("client-typing", { isTyping });
    },
    [sendOrQueueMessage]
  );

  const sendReadReceipt = useCallback(
    (readReceiptObj: MessageReadRequest) => {
      sendOrQueueMessage("read-receipt", readReceiptObj);

      dispatch(
        setMessageRead(
          readReceiptObj.messages.map((m) => m.messageId),
          new Date().toISOString()
        )
      );
    },
    [sendOrQueueMessage, dispatch]
  );

  const sendMessageDelivered = useCallback(
    (deliveredObj: SendMessageDeliveredPayload) => {
      sendOrQueueMessage("message-delivered", deliveredObj);
    },
    [sendOrQueueMessage]
  );

  // Add file upload status emission
  const emitFileUploadStatus = useCallback(
    (fileStatusEvent: FileUploadStatusEvent) => {
      console.log("Emitting file upload status:", fileStatusEvent);
      sendOrQueueMessage("file-upload-status", fileStatusEvent);
    },
    [sendOrQueueMessage]
  );

  return {
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendMessageDelivered,
    emitFileUploadStatus, // Add this
    sendOrQueueMessage,
    socket: socketRef.current,
  };
}

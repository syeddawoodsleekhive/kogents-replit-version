"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setVisitorQueue } from "@/api/v2/visitor";
import { socketSingleton } from "@/lib/socket-singleton";
import { useChatEvents } from "./useChatEvents";
import {
  addJoinedRoom,
  clearRoomDetails,
  clearUnreadCount,
  handleAgentConnected,
  markMessagesRead,
  removeJoinedRoom,
  removeMinimizedChat,
  setServerTimeOffset,
  setSyncingTime,
  tagUnassignedFromChat,
  tagAssignedToChat,
} from "@/api/v2/chat";

type AgentSocketEvents =
  | "agent-connected"
  | "visitor-message"
  | "client-typing"
  | "join-room"
  | "leave-room"
  | "room-details"
  | "agent-message"
  | "read-receipt"
  | "message-delivered"
  | "invite-agent-to-chat"
  | "accept-chat-invitation"
  | "reject-chat-invitation"
  | "transfer-chat-to-agent"
  | "accept-chat-transfer-request"
  | "reject-chat-transfer-request"
  | "transfer-chat-to-department"
  | "accept-department-transfer-request"
  | "reject-department-transfer-request"
  | "get-visitor-sessions"
  | "typing-indicator"
  | "agent-joined-room"
  | "agent-left-room"
  | "visitor-page-changed"
  | "messages-read"
  | "tag-assigned-to-chat"
  | "tag-unassigned-from-chat";

interface UseAgentSocketProps {
  onEvent?: (event: AgentSocketEvents, data: any) => void;
}

interface QueuedMessage {
  eventName: string;
  data: any;
  timestamp: number;
}

export const useAgentSocket = ({ onEvent }: UseAgentSocketProps) => {
  const [connected, setConnected] = useState(false);
  const outgoingQueueRef = useRef<Record<string, QueuedMessage[]>>({});
  const AGENT_QUEUE_KEY = "agent_chat_outgoing_queue";

  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isTypingRef = useRef<Record<string, boolean>>({});

  const { token, user, workspace } = useSelector(
    (state: RootReducerState) => state.user
  );

  const dispatch: AppReducerDispatch = useDispatch();

  const {
    handleNewMessage,
    handleTypingStart,
    handleTypingStop,
    handleChatActivate,
    handleChatMinimize,
    handleChatMaximize,
    handleRoomDetailsReceived,
    handleMessageAck,
    handleMessageDelivered,
    sendAgentMessage,
    handleAgentJoinedRoom,
    handleAgentLeftRoom,
    handleVisitorLeftRoom,
    handleVisitorPageChanged,
    handleTagAssignedToChat,
    handleTagUnassignedFromChat,
  } = useChatEvents();

  const emitTypingStatus = useCallback((roomId: string, isTyping: boolean) => {
    if (typingTimeoutsRef.current[roomId]) {
      clearTimeout(typingTimeoutsRef.current[roomId]);
    }

    if (isTypingRef.current[roomId] !== isTyping) {
      isTypingRef.current[roomId] = isTyping;

      const typingData = {
        isTyping,
        roomId,
      };

      sendOrQueueMessage("client-typing", typingData);
    }

    if (isTyping) {
      typingTimeoutsRef.current[roomId] = setTimeout(() => {
        emitTypingStatus(roomId, false);
      }, 2000);
    }
  }, []);

  const handleVisitorQueues = useCallback(
    (data: any) => {
      dispatch(setVisitorQueue(data));

      const allQueues = [
        ...(data.active || []),
        ...(data.idle || []),
        ...(data.incoming || []),
        ...(data.currentlyServed || []),
        ...(data.pendingTransfer || []),
        ...(data.pendingInvite || []),
      ];

      allQueues.forEach((visitor: any) => {
        if (
          visitor.messages &&
          Array.isArray(visitor.messages) &&
          visitor.messages.length > 0
        ) {
          const visitorMessages = visitor.messages.filter(
            (msg: any) => msg.senderType === "visitor"
          );

          if (visitorMessages.length > 0) {
            const deliveredPayload = {
              messages: visitorMessages.map((msg: any) => ({
                messageId: msg.id,
                senderId: msg.senderId,
              })),
              roomId: visitor.roomId,
            };

            console.log(
              "Emitting message-delivered for visitor queue messages:",
              deliveredPayload
            );
            sendOrQueueMessage("message-delivered", deliveredPayload);
          }
        }
      });
    },
    [dispatch]
  );

  useEffect(() => {
    return () => {
      Object.values(typingTimeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !workspace?.id || !token) return;

    const config = {
      workspaceId: workspace.id,
      agentId: user.id,
      token,
    };

    const socket = socketSingleton.connect(config);
    if (socket) {
      setConnected(socket.connected);

      socketSingleton.setupDefaultEventHandlers({
        handleAgentConnected: (data: { pastRoomIds: string[] }) => {
          dispatch(handleAgentConnected(data));
          onEvent?.("agent-connected", data);
        },
        handleNewMessage,
        handleTypingStart,
        handleTypingStop,
        handleServerTime,
        handleRoomDetails: (data) => {
          handleRoomDetailsReceived(data.roomDetails);
          onEvent?.("room-details", data.roomDetails);
        },
        handleVisitorQueues,
        handleMessageAck,
        handleMessageDelivered,

        handleMessagesRead: (data: {
          roomId: string;
          messageIds: string[];
        }) => {
          dispatch(markMessagesRead(data));
          onEvent?.("messages-read", data);
        },
        handleTypingIndicator: (data) => {
          const { roomId, clientType, isTyping } = data;
          if (isTyping) {
            handleTypingStart(roomId, clientType as "visitor" | "agent");
          } else {
            handleTypingStop(roomId);
          }
        },
        handleAgentJoinedRoom,
        handleAgentLeftRoom,
        handleVisitorLeftRoom,
        handleVisitorPageChanged,
        handleTagAssignedToChat,
        handleTagUnassignedFromChat,
      });
    }
  }, [
    user?.id,
    workspace?.id,
    handleNewMessage,
    handleTypingStart,
    handleTypingStop,
    handleRoomDetailsReceived,
    handleMessageAck,
    handleMessageDelivered,
    handleAgentJoinedRoom,
    handleAgentLeftRoom,
    handleVisitorLeftRoom,
    handleVisitorPageChanged,
    handleVisitorQueues,
    handleTagAssignedToChat,
    handleTagUnassignedFromChat,
    dispatch,
    onEvent,
  ]);

  const persistOutgoingQueue = useCallback(() => {
    try {
      localStorage.setItem(
        AGENT_QUEUE_KEY,
        JSON.stringify(outgoingQueueRef.current)
      );
    } catch (err) {
      console.error("Failed to persist agent outgoing queue:", err);
    }
  }, []);

  const restoreOutgoingQueue = useCallback(() => {
    try {
      const stored = localStorage.getItem(AGENT_QUEUE_KEY);
      if (stored) {
        outgoingQueueRef.current = JSON.parse(stored);
      }
    } catch (err) {
      console.error("Failed to restore agent outgoing queue:", err);
    }
  }, []);

  useEffect(() => {
    restoreOutgoingQueue();
  }, [restoreOutgoingQueue]);

  const sendOrQueueMessage = useCallback(
    (eventName: string, data: any) => {
      if (socketSingleton.connected) {
        socketSingleton.emit(eventName, data);
        return true;
      } else {
        const roomId = data.roomId || data.visitorId || "general";

        if (!outgoingQueueRef.current[roomId]) {
          outgoingQueueRef.current[roomId] = [];
        }

        outgoingQueueRef.current[roomId].push({
          eventName,
          data,
          timestamp: Date.now(),
        });

        persistOutgoingQueue();
        return false;
      }
    },
    [persistOutgoingQueue]
  );

  const processQueuedMessages = useCallback(() => {
    if (!socketSingleton.connected) return;

    const roomIds = Object.keys(outgoingQueueRef.current);
    let hasProcessedMessages = false;

    roomIds.forEach((roomId) => {
      const roomQueue = outgoingQueueRef.current[roomId];

      while (roomQueue.length > 0) {
        const queuedMessage = roomQueue.shift();
        try {
          if (socketSingleton.connected && queuedMessage) {
            socketSingleton.emit(queuedMessage.eventName, queuedMessage.data);
            hasProcessedMessages = true;
          } else {
            if (queuedMessage) roomQueue.unshift(queuedMessage);
            break;
          }
        } catch (err) {
          console.error("Error processing queued message:", err);
          if (queuedMessage) roomQueue.unshift(queuedMessage);
          break;
        }
      }

      if (roomQueue.length === 0) {
        delete outgoingQueueRef.current[roomId];
      }
    });

    if (hasProcessedMessages) {
      persistOutgoingQueue();
    }
  }, [persistOutgoingQueue]);

  useEffect(() => {
    if (connected) {
      const timer = setTimeout(() => {
        processQueuedMessages();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [connected, processQueuedMessages]);

  const getQueuedMessagesForRoom = useCallback((roomId: string) => {
    return outgoingQueueRef.current[roomId] || [];
  }, []);

  const clearQueuedMessagesForRoom = useCallback(
    (roomId: string) => {
      if (outgoingQueueRef.current[roomId]) {
        delete outgoingQueueRef.current[roomId];
        persistOutgoingQueue();
      }
    },
    [persistOutgoingQueue]
  );

  const getQueuedRoomIds = useCallback(() => {
    return Object.keys(outgoingQueueRef.current);
  }, []);

  const emit = (event: AgentSocketEvents, data: any) => {
    sendOrQueueMessage(event, data);
  };

  const sendMessageDelivered = useCallback(
    (messageId: string, roomId: string) => {
      const deliveredObj = {
        messageId,
        roomId,
      };
      sendOrQueueMessage("message-delivered", deliveredObj);
    },
    [sendOrQueueMessage]
  );

  const getRoomData = useCallback(
    (roomId: string) => {
      sendOrQueueMessage("view-room", { roomId });
    },
    [sendOrQueueMessage]
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      sendOrQueueMessage("join-room", { roomId });
      dispatch(addJoinedRoom(roomId));
      dispatch(clearUnreadCount(roomId));
    },
    [sendOrQueueMessage, dispatch]
  );

  const handleServerTime = useCallback(
    (data: { time: number }) => {
      const clientTime = Date.now();
      const serverTime = new Date(data.time).getTime();
      const offset = serverTime - clientTime;

      dispatch(setServerTimeOffset(offset));
      dispatch(setSyncingTime(false));
    },
    [dispatch]
  );

  const closeRoom = useCallback(
    (roomId: string) => {
      sendOrQueueMessage("close-room", { roomId });
      dispatch(removeMinimizedChat(roomId));
      dispatch(clearRoomDetails(roomId));
    },
    [sendOrQueueMessage]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      sendOrQueueMessage("leave-room", { roomId });
      dispatch(removeJoinedRoom(roomId));
      closeRoom(roomId);
    },
    [sendOrQueueMessage, closeRoom, dispatch]
  );

  const sendMessage = useCallback(
    (roomId: string, message: string) => {
      const messageId = sendAgentMessage(roomId, message, {
        _id: user?.id || "",
        name: user?.name || "",
      });

      sendOrQueueMessage("agent-message", {
        messageId,
        message,
        roomId,
      });

      return messageId;
    },
    [sendAgentMessage, sendOrQueueMessage, user]
  );

  const sendReadReceipts = useCallback(
    (roomId: string, messages: { messageId: string; senderId: string }[]) => {
      if (messages.length === 0) return;

      const readReceiptPayload = {
        roomId,
        messages,
      };

      sendOrQueueMessage("read-receipt", readReceiptPayload);
    },
    [sendOrQueueMessage, user?.id]
  );

  const assignTagToChat = useCallback(
    (roomId: string, tagId: string) => {
      sendOrQueueMessage("agent-assign-tag-to-chat", { roomId, tagId });
    },
    [sendOrQueueMessage]
  );

  const unassignTagFromChat = useCallback(
    (roomId: string, tagId: string) => {
      sendOrQueueMessage("unassign-tag-from-chat", { roomId, tagId });
    },
    [sendOrQueueMessage]
  );

  return {
    socket: socketSingleton.socketInstance,
    connected,
    emit,
    sendAgentMessage,
    sendMessageDelivered,
    joinRoom,
    leaveRoom,
    getQueuedMessagesForRoom,
    clearQueuedMessagesForRoom,
    getQueuedRoomIds,
    getRoomData,
    handleChatActivate,
    handleChatMinimize,
    handleChatMaximize,
    handleRoomDetailsReceived,
    sendOrQueueMessage,
    sendMessage,
    emitTypingStatus,
    sendReadReceipts,
    closeRoom,
    assignTagToChat,
    unassignTagFromChat,
  };
};

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setRoomDetails,
  addChatMessage,
  incrementUnreadCount,
  setTypingState,
  clearTypingState,
  setActiveChat,
  clearUnreadCount,
  addMinimizedChat,
  removeMinimizedChat,
  setChatMessages,
  sendMessage,
  messageAck,
  messageDelivered,
  updateVisitorPageTracking,
  removeJoinedRoom,
  tagAssignedToChat,
  tagUnassignedFromChat,
} from "@/api/v2/chat";

export const useChatEvents = () => {
  const dispatch: AppReducerDispatch = useDispatch();
  const activeChatId = useSelector(
    (state: RootReducerState) => state.chat.activeChatId
  );
  const chatMessages = useSelector(
    (state: RootReducerState) => state.chat.chatMessages
  );
  const unreadCounts = useSelector(
    (state: RootReducerState) => state.chat.unreadCounts
  );
  const typingStates = useSelector(
    (state: RootReducerState) => state.chat.typingStates
  );
  const minimizedChats = useSelector(
    (state: RootReducerState) => state.chat.minimizedChats
  );
  const joinedRooms = useSelector(
    (state: RootReducerState) => state.chat.joinedRooms
  );

  const handleAgentJoinedRoom = useCallback(
    (data: {
      agentName: string;
      roomId: string;
      senderId: string;
      joinedAt: string;
    }) => {
      const systemMessage: MessageType = {
        messageId: "",
        content: `${data.agentName} has joined the chat`,
        messageType: "text",
        roomId: data.roomId,
        senderId: data.senderId,
        senderType: "agent-system",
        createdAt: data.joinedAt,
      };

      dispatch(addChatMessage({ roomId: data.roomId, message: systemMessage }));
    },
    [dispatch]
  );

  const handleVisitorLeftRoom = useCallback(
    (data: {
      roomId: string;
      participantName: string;
      participantId: string;
      disconnectedAt: string;
    }) => {
      const systemMessage: MessageType = {
        messageId: "",
        content: `${data.participantName || "Visitor"} has left the chat`,
        messageType: "text",
        roomId: data.roomId,
        senderId: data.participantId,
        senderType: "visitor-system",
        createdAt: data.disconnectedAt,
      };

      dispatch(addChatMessage({ roomId: data.roomId, message: systemMessage }));
      dispatch(removeJoinedRoom(data.roomId));
    },
    [dispatch]
  );

  const handleAgentLeftRoom = useCallback(
    (data: {
      agentName: string;
      roomId: string;
      senderId: string;
      leftAt: string;
    }) => {
      const systemMessage: MessageType = {
        messageId: "",
        content: `${data.agentName} has left the chat`,
        messageType: "text",
        roomId: data.roomId,
        senderId: data.senderId,
        senderType: "agent-system",
        createdAt: data.leftAt,
      };

      dispatch(addChatMessage({ roomId: data.roomId, message: systemMessage }));
    },
    [dispatch]
  );

  const handleRoomDetailsReceived = useCallback(
    (roomDetails: conversationSessionType) => {
      const roomId = roomDetails.id;

      dispatch(setRoomDetails({ roomId, data: roomDetails }));

      dispatch(setActiveChat(roomId));

      const minimizedChat: MinimizedChat = {
        id: roomId,
        name: `Visitor ${roomDetails.visitorId}`,
        roomId: roomId,
      };

      dispatch(addMinimizedChat(minimizedChat));

      if (roomDetails.messages && roomDetails.messages.length > 0) {
        dispatch(
          setChatMessages({
            roomId,
            messages: roomDetails.messages as MessageType[],
          })
        );
      }

      if (joinedRooms.includes(roomId)) {
        dispatch(clearUnreadCount(roomId));
      }
    },
    [dispatch, joinedRooms]
  );

  const handleNewMessage = useCallback(
    (message: MessageType) => {
      const { roomId } = message;

      dispatch(
        addChatMessage({
          roomId,
          message: {
            ...message,
            ...(message?.attachment && {
              metadata: {
                attachment: {
                  ...message.attachment,
                },
              },
            }),
          },
        })
      );

      if (activeChatId !== roomId) {
        dispatch(incrementUnreadCount(roomId));
      }
    },
    [dispatch, activeChatId]
  );

  const handleTypingStart = useCallback(
    (roomId: string, sender: "visitor" | "agent") => {
      dispatch(setTypingState({ roomId, isTyping: true, sender }));
    },
    [dispatch]
  );

  const handleTypingStop = useCallback(
    (roomId: string) => {
      dispatch(clearTypingState(roomId));
    },
    [dispatch]
  );

  const handleChatActivate = useCallback(
    (roomId: string) => {
      dispatch(setActiveChat(roomId));

      if (joinedRooms.includes(roomId)) {
        dispatch(clearUnreadCount(roomId));
      }
    },
    [dispatch, joinedRooms]
  );

  const handleChatMinimize = useCallback(() => {
    dispatch(setActiveChat(null));
  }, [dispatch]);

  const handleChatMaximize = useCallback(
    (roomId: string) => {
      dispatch(removeMinimizedChat(roomId));
      dispatch(setActiveChat(roomId));
      if (joinedRooms.includes(roomId)) {
        dispatch(clearUnreadCount(roomId));
      }
    },
    [dispatch, joinedRooms]
  );

  const handleMessageAck = useCallback(
    (data: { messageId: string; roomId: string; sentAt: string }) => {
      dispatch(messageAck(data));
    },
    [dispatch]
  );

  const handleMessageDelivered = useCallback(
    (data: { messageId: string; roomId: string; deliveredAt: string }) => {
      dispatch(messageDelivered(data));
    },
    [dispatch]
  );

  const handleTagAssignedToChat = useCallback(
    (data: TagAssignedToChatActionPayloadType) => {
      dispatch(tagAssignedToChat(data));
    },
    [dispatch]
  );

  const handleTagUnassignedFromChat = useCallback(
    (data: TagUnassignedFromChatActionPayloadType) => {
      dispatch(tagUnassignedFromChat(data));
    },
    [dispatch]
  );

  const sendAgentMessage = useCallback(
    (
      roomId: string,
      message: string,
      sender: { _id: string; name: string }
    ) => {
      const messageId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      dispatch(
        sendMessage({
          roomId,
          messageId,
          message,
          senderId: sender._id,
          senderName: sender.name,
          senderType: "agent",
        })
      );

      return messageId;
    },
    [dispatch]
  );

  const handleVisitorPageChanged = useCallback(
    (data: {
      visitorId: string;
      roomId: string;
      visitorName: string | null;
      trackingData: {
        pageTracking: PageTrackingType;
        currentPage: PageTrackingType;
      };
    }) => {
      const { roomId, trackingData } = data;

      // Update the visitor page tracking in the room details
      dispatch(
        updateVisitorPageTracking({
          roomId,
          pageTracking: trackingData.currentPage,
        })
      );
    },
    [dispatch]
  );

  const getUnreadVisitorMessages = useCallback(
    (roomId: string) => {
      const messages = chatMessages[roomId] || [];
      return messages.filter(
        (message) =>
          message.senderType === "visitor" &&
          (!message.readAt || message.readAt === null)
      );
    },
    [chatMessages]
  );

  return {
    activeChatId,
    chatMessages,
    unreadCounts,
    typingStates,
    minimizedChats,

    handleRoomDetailsReceived,
    handleNewMessage,
    handleTypingStart,
    handleTypingStop,
    handleChatActivate,
    handleChatMinimize,
    handleChatMaximize,
    handleMessageAck,
    handleMessageDelivered,
    sendAgentMessage,
    handleAgentJoinedRoom,
    handleAgentLeftRoom,
    handleVisitorLeftRoom,
    handleVisitorPageChanged,
    getUnreadVisitorMessages,
    handleTagAssignedToChat,
    handleTagUnassignedFromChat,
  };
};

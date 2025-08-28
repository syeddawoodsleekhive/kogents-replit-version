import {
  SET_ROOM_DETAILS,
  UPDATE_ROOM_DETAILS,
  CLEAR_ROOM_DETAILS,
  SET_CHAT_MESSAGES,
  ADD_CHAT_MESSAGE,
  UPDATE_CHAT_MESSAGE,
  CLEAR_CHAT_MESSAGES,
  SET_MINIMIZED_CHATS,
  ADD_MINIMIZED_CHAT,
  REMOVE_MINIMIZED_CHAT,
  UPDATE_MINIMIZED_CHAT,
  SET_UNREAD_COUNTS,
  INCREMENT_UNREAD_COUNT,
  DECREMENT_UNREAD_COUNT,
  CLEAR_UNREAD_COUNT,
  SET_TYPING_STATES,
  SET_TYPING_STATE,
  CLEAR_TYPING_STATE,
  SET_ACTIVE_CHAT,
  SEND_MESSAGE,
  MESSAGE_ACK,
  MESSAGE_DELIVERED,
  UPDATE_VISITOR_PAGE_TRACKING,
  SET_JOINED_ROOMS,
  ADD_JOINED_ROOM,
  REMOVE_JOINED_ROOM,
  CLEAR_JOINED_ROOMS,
  MARK_MESSAGES_READ,
  SET_SERVER_TIME_OFFSET,
  SET_SYNCING_TIME,
  ADD_FILE_MESSAGE,
  TAG_ASSIGNED_TO_CHAT,
  TAG_UNASSIGNED_FROM_CHAT,
} from "@/api/v2/chat";

const initialState: ChatReducerStateType = {
  roomDetails: {},
  chatMessages: {},
  minimizedChats: [],
  unreadCounts: {},
  typingStates: {},
  activeChatId: null,
  loading: true,
  joinedRooms: [],
  serverTimeOffset: 0,
  isSyncingTime: false,
};

export const chatReducer = (
  state: ChatReducerStateType = initialState,
  action: ChatReducerActionsType
) => {
  switch (action.type) {
    case SET_ROOM_DETAILS:
      return {
        ...state,
        roomDetails: {
          ...state.roomDetails,
          [action.payload.roomId]: action.payload.data,
        },
        loading: false,
      };

    case UPDATE_ROOM_DETAILS:
      return {
        ...state,
        roomDetails: {
          ...state.roomDetails,
          [action.payload.roomId]: {
            ...state.roomDetails[action.payload.roomId],
            ...action.payload.updates,
          },
        },
      };

    case CLEAR_ROOM_DETAILS:
      const { [action.payload]: removedRoom, ...remainingRoomDetails } =
        state.roomDetails;
      return {
        ...state,
        roomDetails: remainingRoomDetails,
      };

    case SET_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.roomId]: action.payload.messages,
        },
      };

    case ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.roomId]: [
            ...(state.chatMessages[action.payload.roomId] || []),
            action.payload.message,
          ],
        },
      };

    case UPDATE_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.roomId]: (
            state.chatMessages[action.payload.roomId] || []
          ).map((message) =>
            message.messageId === action.payload.messageId
              ? { ...message, ...action.payload.updates }
              : message
          ),
        },
      };

    case CLEAR_CHAT_MESSAGES:
      const { [action.payload]: removedMessages, ...remainingMessages } =
        state.chatMessages;
      return {
        ...state,
        chatMessages: remainingMessages,
      };

    case SET_MINIMIZED_CHATS:
      return {
        ...state,
        minimizedChats: action.payload,
      };

    case ADD_MINIMIZED_CHAT:
      const existingChat = state.minimizedChats.find(
        (chat) =>
          chat.id === action.payload.id || chat.roomId === action.payload.roomId
      );

      if (existingChat) {
        return {
          ...state,
          minimizedChats: state.minimizedChats.map((chat) =>
            chat.id === action.payload.id ||
            chat.roomId === action.payload.roomId
              ? { ...chat, ...action.payload }
              : chat
          ),
        };
      }

      return {
        ...state,
        minimizedChats: [...state.minimizedChats, action.payload],
      };

    case REMOVE_MINIMIZED_CHAT:
      return {
        ...state,
        minimizedChats: state.minimizedChats.filter(
          (chat) => chat.id !== action.payload
        ),
      };

    case UPDATE_MINIMIZED_CHAT:
      return {
        ...state,
        minimizedChats: state.minimizedChats.map((chat) =>
          chat.id === action.payload.id
            ? { ...chat, ...action.payload.updates }
            : chat
        ),
      };

    case SET_UNREAD_COUNTS:
      return {
        ...state,
        unreadCounts: action.payload,
      };

    case INCREMENT_UNREAD_COUNT:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: (state.unreadCounts[action.payload] || 0) + 1,
        },
      };

    case DECREMENT_UNREAD_COUNT:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload]: Math.max(
            0,
            (state.unreadCounts[action.payload] || 0) - 1
          ),
        },
      };

    case CLEAR_UNREAD_COUNT:
      const { [action.payload]: removedUnread, ...remainingUnreadCounts } =
        state.unreadCounts;
      return {
        ...state,
        unreadCounts: remainingUnreadCounts,
      };

    case SET_TYPING_STATES:
      return {
        ...state,
        typingStates: action.payload,
      };

    case SET_TYPING_STATE:
      return {
        ...state,
        typingStates: {
          ...state.typingStates,
          [action.payload.roomId]: {
            isTyping: action.payload.isTyping,
            sender: action.payload.sender,
          },
        },
      };

    case CLEAR_TYPING_STATE:
      const { [action.payload]: removedTyping, ...remainingTypingStates } =
        state.typingStates;
      return {
        ...state,
        typingStates: remainingTypingStates,
      };

    case SET_ACTIVE_CHAT:
      return {
        ...state,
        activeChatId: action.payload,
      };

    case SEND_MESSAGE:
      const newMessage: MessageType = {
        messageId: action.payload.messageId,
        roomId: action.payload.roomId,
        senderId: action.payload.senderId,
        senderType: action.payload.senderType,
        senderName: action.payload.senderName,
        content: action.payload.message,
        createdAt: new Date(
          Date.now() + (state.serverTimeOffset || 0)
        ).toISOString(),
        sentAt: new Date(
          Date.now() + (state.serverTimeOffset || 0)
        ).toISOString(),
        deliveredAt: null,
        readAt: null,
        messageType: "text",
        isLoading: true,
      };

      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.roomId]: [
            ...(state.chatMessages[action.payload.roomId] || []),
            newMessage,
          ],
        },
      };

    case MESSAGE_ACK:
      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.roomId]: (
            state.chatMessages[action.payload.roomId] || []
          ).map((message) =>
            message.messageId === action.payload.messageId
              ? {
                  ...message,
                  sentAt: action.payload.sentAt,
                  createdAt: action.payload.sentAt,
                  status: "sent",
                  isLoading: false,
                }
              : message
          ),
        },
      };

    case MESSAGE_DELIVERED:
      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.roomId]: (
            state.chatMessages[action.payload.roomId] || []
          ).map((message) =>
            message.messageId === action.payload.messageId
              ? {
                  ...message,
                  deliveredAt: action.payload.deliveredAt,
                  status: "delivered",
                }
              : message
          ),
        },
      };

    case MARK_MESSAGES_READ:
      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.roomId]: (
            state.chatMessages[action.payload.roomId] || []
          ).map((message) =>
            action.payload.messageIds.includes(message.messageId)
              ? {
                  ...message,
                  readAt: new Date().toISOString(),
                }
              : message
          ),
        },
      };

    case UPDATE_VISITOR_PAGE_TRACKING:
      const room = state.roomDetails[action.payload.roomId];
      if (room && room.visitorSessionDetails) {
        const currentNavigationPath =
          room.visitorSessionDetails.visitorPageTracking?.navigationPath || [];
        const newPageData = action.payload.pageTracking;

        const updatedNavigationPath = [...currentNavigationPath, newPageData];

        return {
          ...state,
          roomDetails: {
            ...state.roomDetails,
            [action.payload.roomId]: {
              ...room,
              visitorSessionDetails: {
                ...room.visitorSessionDetails,
                visitorPageTracking: {
                  ...room.visitorSessionDetails.visitorPageTracking,
                  ...newPageData,
                  navigationPath: updatedNavigationPath,
                },
              },
            },
          },
        };
      }
      return state;

    case SET_JOINED_ROOMS:
      return {
        ...state,
        joinedRooms: action.payload,
      };

    case ADD_JOINED_ROOM:
      return {
        ...state,
        joinedRooms: state.joinedRooms.includes(action.payload)
          ? state.joinedRooms
          : [...state.joinedRooms, action.payload],
      };

    case REMOVE_JOINED_ROOM:
      return {
        ...state,
        joinedRooms: state.joinedRooms.filter(
          (roomId) => roomId !== action.payload
        ),
      };

    case CLEAR_JOINED_ROOMS:
      return {
        ...state,
        joinedRooms: [],
      };

    case SET_SERVER_TIME_OFFSET:
      return {
        ...state,
        serverTimeOffset: action.payload,
      };

    case SET_SYNCING_TIME:
      return {
        ...state,
        isSyncingTime: action.payload,
      };

    case ADD_FILE_MESSAGE:
      const fileMessage: MessageType = {
        messageId: action.payload.messageId,
        roomId: action.payload.roomId,
        senderId: action.payload.senderId,
        senderType: "agent",
        senderName: action.payload.senderName,
        content: "",
        messageType: "file",
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        deliveredAt: null,
        readAt: null,
        isLoading: true,
        metadata: {
          attachment: action.payload.attachment,
        },
      };

      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.roomId]: [
            ...(state.chatMessages[action.payload.roomId] || []),
            fileMessage,
          ],
        },
      };

    case TAG_ASSIGNED_TO_CHAT:
      const roomWithTag = state.roomDetails[action.payload.roomId];
      if (roomWithTag) {
        let tagsToAdd = [];

        if (action.payload.tag) {
          tagsToAdd.push({
            ...action.payload.tag,
            assignedBy: action.payload.assignedBy,
          });
        } else if (action.payload.tags && Array.isArray(action.payload.tags)) {
          tagsToAdd = action.payload.tags;
        }

        if (tagsToAdd.length > 0) {
          return {
            ...state,
            roomDetails: {
              ...state.roomDetails,
              [action.payload.roomId]: {
                ...roomWithTag,
                tags: [...(roomWithTag.tags || []), ...tagsToAdd],
              },
            },
          };
        }
      }
      return state;

    case TAG_UNASSIGNED_FROM_CHAT:
      const roomWithoutTag = state.roomDetails[action.payload.roomId];
      if (roomWithoutTag) {
        let tagsToRemove = [];

        if (action.payload.tag) {
          tagsToRemove.push(action.payload.tag);
        } else if (action.payload.tags && Array.isArray(action.payload.tags)) {
          tagsToRemove = action.payload.tags;
        }

        if (tagsToRemove.length > 0) {
          const tagIdsToRemove = new Set(tagsToRemove.map((t: Tag) => t.id));
          return {
            ...state,
            roomDetails: {
              ...state.roomDetails,
              [action.payload.roomId]: {
                ...roomWithoutTag,
                tags: (roomWithoutTag.tags || []).filter(
                  (tag) => !tagIdsToRemove.has(tag.id)
                ),
              },
            },
          };
        }
      }
      return state;

    default:
      return state;
  }
};

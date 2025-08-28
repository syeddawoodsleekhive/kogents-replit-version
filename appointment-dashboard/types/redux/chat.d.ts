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
  TAG_ASSIGNED_TO_CHAT,
  TAG_UNASSIGNED_FROM_CHAT,
} from "@/api/v2/chat";

declare global {
  interface ChatReducerStateType {
    roomDetails: Record<string, conversationSessionType>;
    chatMessages: Record<string, MessageType[]>;
    minimizedChats: MinimizedChat[];
    unreadCounts: Record<string, number>;
    typingStates: Record<
      string,
      { isTyping: boolean; sender: "visitor" | "agent" }
    >;
    activeChatId: string | null;
    loading: boolean;
    joinedRooms: string[];
    serverTimeOffset: number;
    isSyncingTime: boolean;
  }

  // Room Details Actions
  interface SetRoomDetailsActionType {
    type: typeof SET_ROOM_DETAILS;
    payload: { roomId: string; data: conversationSessionType };
  }

  interface UpdateRoomDetailsActionType {
    type: typeof UPDATE_ROOM_DETAILS;
    payload: { roomId: string; updates: Partial<conversationSessionType> };
  }

  interface ClearRoomDetailsActionType {
    type: typeof CLEAR_ROOM_DETAILS;
    payload: string;
  }

  // Chat Messages Actions
  interface SetChatMessagesActionType {
    type: typeof SET_CHAT_MESSAGES;
    payload: { roomId: string; messages: MessageType[] };
  }

  interface AddChatMessageActionType {
    type: typeof ADD_CHAT_MESSAGE;
    payload: { roomId: string; message: MessageType };
  }

  interface UpdateChatMessageActionType {
    type: typeof UPDATE_CHAT_MESSAGE;
    payload: {
      roomId: string;
      messageId: string;
      updates: Partial<MessageType>;
    };
  }

  interface ClearChatMessagesActionType {
    type: typeof CLEAR_CHAT_MESSAGES;
    payload: string;
  }

  // Minimized Chats Actions
  interface SetMinimizedChatsActionType {
    type: typeof SET_MINIMIZED_CHATS;
    payload: MinimizedChat[];
  }

  interface AddMinimizedChatActionType {
    type: typeof ADD_MINIMIZED_CHAT;
    payload: MinimizedChat;
  }

  interface RemoveMinimizedChatActionType {
    type: typeof REMOVE_MINIMIZED_CHAT;
    payload: string;
  }

  interface UpdateMinimizedChatActionType {
    type: typeof UPDATE_MINIMIZED_CHAT;
    payload: { id: string; updates: Partial<MinimizedChat> };
  }

  // Unread Counts Actions
  interface SetUnreadCountsActionType {
    type: typeof SET_UNREAD_COUNTS;
    payload: Record<string, number>;
  }

  interface IncrementUnreadCountActionType {
    type: typeof INCREMENT_UNREAD_COUNT;
    payload: string;
  }

  interface DecrementUnreadCountActionType {
    type: typeof DECREMENT_UNREAD_COUNT;
    payload: string;
  }

  interface ClearUnreadCountActionType {
    type: typeof CLEAR_UNREAD_COUNT;
    payload: string;
  }

  // Typing States Actions
  interface SetTypingStatesActionType {
    type: typeof SET_TYPING_STATES;
    payload: Record<string, { isTyping: boolean; sender: "visitor" | "agent" }>;
  }

  interface SetTypingStateActionType {
    type: typeof SET_TYPING_STATE;
    payload: { roomId: string; isTyping: boolean; sender: "visitor" | "agent" };
  }

  interface ClearTypingStateActionType {
    type: typeof CLEAR_TYPING_STATE;
    payload: string;
  }

  // Active Chat Action
  interface SetActiveChatActionType {
    type: typeof SET_ACTIVE_CHAT;
    payload: string | null;
  }

  interface SendMessageType {
    roomId: string;
    messageId: string;
    message: string;
    senderId: string;
    senderName: string;
    senderType: "agent";
  }

  // New Message Actions
  interface SendMessageActionType {
    type: typeof SEND_MESSAGE;
    payload: SendMessageType;
  }

  interface MessageAckActionType {
    type: typeof MESSAGE_ACK;
    payload: {
      roomId: string;
      messageId: string;
      sentAt: string;
    };
  }

  interface MessageDeliveredActionType {
    type: typeof MESSAGE_DELIVERED;
    payload: {
      roomId: string;
      messageId: string;
      deliveredAt: string;
    };
  }

  interface MarkMessagesReadActionType {
    type: typeof MARK_MESSAGES_READ;
    payload: {
      roomId: string;
      messageIds: string[];
    };
  }

  interface UpdateVisitorPageTrackingActionType {
    type: typeof UPDATE_VISITOR_PAGE_TRACKING;
    payload: {
      roomId: string;
      pageTracking: PageTrackingType;
    };
  }

  interface SetJoinedRoomsActionType {
    type: typeof SET_JOINED_ROOMS;
    payload: string[];
  }

  interface AddJoinedRoomActionType {
    type: typeof ADD_JOINED_ROOM;
    payload: string;
  }

  interface RemoveJoinedRoomActionType {
    type: typeof REMOVE_JOINED_ROOM;
    payload: string;
  }

  interface ClearJoinedRoomsActionType {
    type: typeof CLEAR_JOINED_ROOMS;
    payload: any;
  }

  interface SetServerTimeOffsetActionType {
    type: typeof SET_SERVER_TIME_OFFSET;
    payload: number;
  }

  interface SetSyncingTimeActionType {
    type: typeof SET_SYNCING_TIME;
    payload: boolean;
  }

  interface AddFileMessageActionPayloadType {
    roomId: string;
    messageId: string;
    file: File;
    attachment: {
      fileName: string;
      mimeType: string;
      size: number;
      url?: string;
      previewUrl?: string;
      width?: number;
      height?: number;
    };
  }

  interface AddFileMessageActionType {
    type: typeof ADD_FILE_MESSAGE;
    payload: AddFileMessageActionPayloadType;
  }

  // Tag Management Action Payload Types
  interface TagAssignedToChatActionPayloadType {
    roomId: string;
    tag?: Tag;
    tags?: Tag[];
    assignedBy?: string;
    assignedAt?: string;
  }

  interface TagUnassignedFromChatActionPayloadType {
    roomId: string;
    tag?: Tag;
    tags?: Tag[];
    unassignedBy?: string;
    unassignedAt?: string;
  }

  // Tag Management Actions
  interface TagAssignedToChatActionType {
    type: "TAG_ASSIGNED_TO_CHAT";
    payload: TagAssignedToChatActionPayloadType;
  }

  interface TagUnassignedFromChatActionType {
    type: "TAG_UNASSIGNED_FROM_CHAT";
    payload: TagUnassignedFromChatActionPayloadType;
  }

  type ChatReducerActionsType =
    | SetRoomDetailsActionType
    | UpdateRoomDetailsActionType
    | ClearRoomDetailsActionType
    | SetChatMessagesActionType
    | AddChatMessageActionType
    | UpdateChatMessageActionType
    | ClearChatMessagesActionType
    | SetMinimizedChatsActionType
    | AddMinimizedChatActionType
    | RemoveMinimizedChatActionType
    | UpdateMinimizedChatActionType
    | SetUnreadCountsActionType
    | IncrementUnreadCountActionType
    | DecrementUnreadCountActionType
    | ClearUnreadCountActionType
    | SetTypingStatesActionType
    | SetTypingStateActionType
    | ClearTypingStateActionType
    | SetActiveChatActionType
    | SendMessageActionType
    | MessageAckActionType
    | MessageDeliveredActionType
    | UpdateVisitorPageTrackingActionType
    | SetJoinedRoomsActionType
    | AddJoinedRoomActionType
    | RemoveJoinedRoomActionType
    | ClearJoinedRoomsActionType
    | MarkMessagesReadActionType
    | SetServerTimeOffsetActionType
    | SetSyncingTimeActionType
    | AddFileMessageActionType
    | TagAssignedToChatActionType
    | TagUnassignedFromChatActionType;
}

export default global;

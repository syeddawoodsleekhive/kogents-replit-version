export const SET_ROOM_DETAILS = "SET_ROOM_DETAILS";
export const UPDATE_ROOM_DETAILS = "UPDATE_ROOM_DETAILS";
export const CLEAR_ROOM_DETAILS = "CLEAR_ROOM_DETAILS";

// Chat Messages Actions
export const SET_CHAT_MESSAGES = "SET_CHAT_MESSAGES";
export const ADD_CHAT_MESSAGE = "ADD_CHAT_MESSAGE";
export const UPDATE_CHAT_MESSAGE = "UPDATE_CHAT_MESSAGE";
export const CLEAR_CHAT_MESSAGES = "CLEAR_CHAT_MESSAGES";

// Minimized Chats Actions
export const SET_MINIMIZED_CHATS = "SET_MINIMIZED_CHATS";
export const ADD_MINIMIZED_CHAT = "ADD_MINIMIZED_CHAT";
export const REMOVE_MINIMIZED_CHAT = "REMOVE_MINIMIZED_CHAT";
export const UPDATE_MINIMIZED_CHAT = "UPDATE_MINIMIZED_CHAT";

// Unread Counts Actions
export const SET_UNREAD_COUNTS = "SET_UNREAD_COUNTS";
export const INCREMENT_UNREAD_COUNT = "INCREMENT_UNREAD_COUNT";
export const DECREMENT_UNREAD_COUNT = "DECREMENT_UNREAD_COUNT";
export const CLEAR_UNREAD_COUNT = "CLEAR_UNREAD_COUNT";

// Typing States Actions
export const SET_TYPING_STATES = "SET_TYPING_STATES";
export const SET_TYPING_STATE = "SET_TYPING_STATE";
export const CLEAR_TYPING_STATE = "CLEAR_TYPING_STATE";

// Active Chat Action
export const SET_ACTIVE_CHAT = "SET_ACTIVE_CHAT";

// Add new action types
export const SEND_MESSAGE = "SEND_MESSAGE";
export const MESSAGE_ACK = "MESSAGE_ACK";
export const MESSAGE_DELIVERED = "MESSAGE_DELIVERED";
export const UPDATE_VISITOR_PAGE_TRACKING = "UPDATE_VISITOR_PAGE_TRACKING";

// Joined Rooms Actions
export const SET_JOINED_ROOMS = "SET_JOINED_ROOMS";
export const ADD_JOINED_ROOM = "ADD_JOINED_ROOM";
export const REMOVE_JOINED_ROOM = "REMOVE_JOINED_ROOM";
export const CLEAR_JOINED_ROOMS = "CLEAR_JOINED_ROOMS";
export const MARK_MESSAGES_READ = "MARK_MESSAGES_READ";

export const SET_SERVER_TIME_OFFSET = "SET_SERVER_TIME_OFFSET";
export const SET_SYNCING_TIME = "SET_SYNCING_TIME";

export const ADD_FILE_MESSAGE = "ADD_FILE_MESSAGE";

export const TAG_ASSIGNED_TO_CHAT = "TAG_ASSIGNED_TO_CHAT";
export const TAG_UNASSIGNED_FROM_CHAT = "TAG_UNASSIGNED_FROM_CHAT";

// Add new action creators
export const sendMessage = (
  payload: SendMessageType
): SendMessageActionType => ({
  type: SEND_MESSAGE,
  payload,
});

export const messageAck = (payload: {
  roomId: string;
  messageId: string;
  sentAt: string;
}): MessageAckActionType => ({
  type: MESSAGE_ACK,
  payload,
});

export const messageDelivered = (payload: {
  roomId: string;
  messageId: string;
  deliveredAt: string;
}): MessageDeliveredActionType => ({
  type: MESSAGE_DELIVERED,
  payload,
});

export const markMessagesRead = (payload: {
  roomId: string;
  messageIds: string[];
}): MarkMessagesReadActionType => ({
  type: MARK_MESSAGES_READ,
  payload,
});

export const updateVisitorPageTracking = (payload: {
  roomId: string;
  pageTracking: PageTrackingType;
}): UpdateVisitorPageTrackingActionType => ({
  type: UPDATE_VISITOR_PAGE_TRACKING,
  payload,
});

// Room Details Actions
export const setRoomDetails = (payload: {
  roomId: string;
  data: conversationSessionType;
}): SetRoomDetailsActionType => ({
  type: SET_ROOM_DETAILS,
  payload,
});

export const updateRoomDetails = (payload: {
  roomId: string;
  updates: Partial<conversationSessionType>;
}): UpdateRoomDetailsActionType => ({
  type: UPDATE_ROOM_DETAILS,
  payload,
});

export const clearRoomDetails = (
  payload: string
): ClearRoomDetailsActionType => ({
  type: CLEAR_ROOM_DETAILS,
  payload,
});

// Chat Messages Actions
export const setChatMessages = (payload: {
  roomId: string;
  messages: MessageType[];
}): SetChatMessagesActionType => ({
  type: SET_CHAT_MESSAGES,
  payload,
});

export const addChatMessage = (payload: {
  roomId: string;
  message: MessageType;
}): AddChatMessageActionType => ({
  type: ADD_CHAT_MESSAGE,
  payload,
});

export const updateChatMessage = (payload: {
  roomId: string;
  messageId: string;
  updates: Partial<MessageType>;
}): UpdateChatMessageActionType => ({
  type: UPDATE_CHAT_MESSAGE,
  payload,
});

export const clearChatMessages = (
  payload: string
): ClearChatMessagesActionType => ({
  type: CLEAR_CHAT_MESSAGES,
  payload,
});

// Minimized Chats Actions
export const setMinimizedChats = (
  payload: MinimizedChat[]
): SetMinimizedChatsActionType => ({
  type: SET_MINIMIZED_CHATS,
  payload,
});

export const addMinimizedChat = (
  payload: MinimizedChat
): AddMinimizedChatActionType => ({
  type: ADD_MINIMIZED_CHAT,
  payload,
});

export const removeMinimizedChat = (
  payload: string
): RemoveMinimizedChatActionType => ({
  type: REMOVE_MINIMIZED_CHAT,
  payload,
});

export const updateMinimizedChat = (payload: {
  id: string;
  updates: Partial<MinimizedChat>;
}): UpdateMinimizedChatActionType => ({
  type: UPDATE_MINIMIZED_CHAT,
  payload,
});

// Unread Counts Actions
export const setUnreadCounts = (
  payload: Record<string, number>
): SetUnreadCountsActionType => ({
  type: SET_UNREAD_COUNTS,
  payload,
});

export const incrementUnreadCount = (
  payload: string
): IncrementUnreadCountActionType => ({
  type: INCREMENT_UNREAD_COUNT,
  payload,
});

export const decrementUnreadCount = (
  payload: string
): DecrementUnreadCountActionType => ({
  type: DECREMENT_UNREAD_COUNT,
  payload,
});

export const clearUnreadCount = (
  payload: string
): ClearUnreadCountActionType => ({
  type: CLEAR_UNREAD_COUNT,
  payload,
});

// Typing States Actions
export const setTypingStates = (
  payload: Record<string, { isTyping: boolean; sender: "visitor" | "agent" }>
): SetTypingStatesActionType => ({
  type: SET_TYPING_STATES,
  payload,
});

export const setTypingState = (payload: {
  roomId: string;
  isTyping: boolean;
  sender: "visitor" | "agent";
}): SetTypingStateActionType => ({
  type: SET_TYPING_STATE,
  payload,
});

export const clearTypingState = (
  payload: string
): ClearTypingStateActionType => ({
  type: CLEAR_TYPING_STATE,
  payload,
});

// Active Chat Action
export const setActiveChat = (
  payload: string | null
): SetActiveChatActionType => ({
  type: SET_ACTIVE_CHAT,
  payload,
});

// Joined Rooms Actions
export const setJoinedRooms = (
  payload: string[]
): SetJoinedRoomsActionType => ({
  type: SET_JOINED_ROOMS,
  payload,
});

export const addJoinedRoom = (payload: string): AddJoinedRoomActionType => ({
  type: ADD_JOINED_ROOM,
  payload,
});

export const removeJoinedRoom = (
  payload: string
): RemoveJoinedRoomActionType => ({
  type: REMOVE_JOINED_ROOM,
  payload,
});

export const clearJoinedRooms = (): ClearJoinedRoomsActionType => ({
  type: CLEAR_JOINED_ROOMS,
  payload: null,
});

export const setServerTimeOffset = (
  payload: number
): SetServerTimeOffsetActionType => ({
  type: SET_SERVER_TIME_OFFSET,
  payload,
});

export const setSyncingTime = (payload: boolean): SetSyncingTimeActionType => ({
  type: SET_SYNCING_TIME,
  payload,
});

export const addFileMessage = (payload: {
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
  senderId: string;
  senderName: string;
}): AddFileMessageActionType => ({
  type: ADD_FILE_MESSAGE,
  payload,
});

export const handleAgentConnected = (data: { pastRoomIds: string[] }) => {
  return async (
    dispatch: AppReducerDispatch,
    getState: () => RootReducerState
  ) => {
    dispatch(setJoinedRooms(data.pastRoomIds));

    const state = getState();

    data.pastRoomIds.forEach((roomId) => {
      const roomDetails = state.chat.roomDetails[roomId];
      let visitorName = `Visitor ${roomId.slice(0, 8)}`;

      if (roomDetails?.visitorDetails?.name) {
        visitorName = roomDetails.visitorDetails.name;
      } else if (roomDetails?.visitorId) {
        visitorName = `Visitor ${roomDetails.visitorId}`;
      }
      if (visitorName === `Visitor ${roomId.slice(0, 8)}`) {
        const allVisitors = [
          ...state.visitors.active,
          ...state.visitors.idle,
          ...state.visitors.incoming,
          ...state.visitors.currentlyServed,
        ];

        const visitor = allVisitors.find((v) => v.roomId === roomId);
        if (visitor?.name) {
          visitorName = visitor.name;
        }
        if (visitor?.visitorId) {
          visitorName = `Visitor ${visitor.visitorId}`;
        }
      }

      const minimizedChat: MinimizedChat = {
        id: roomId,
        name: visitorName,
        roomId: roomId,
      };

      dispatch(addMinimizedChat(minimizedChat));
    });
  };
};

export const openChat = (roomId: string) => {
  return (dispatch: AppReducerDispatch, getState: () => RootReducerState) => {
    const state = getState();
    const roomDetails = state.chat.roomDetails[roomId];
    const joinedRooms = state.chat.joinedRooms;

    if (joinedRooms.includes(roomId)) {
      dispatch(clearUnreadCount(roomId));
    }

    if (roomDetails) {
      dispatch(setActiveChat(roomId));
      dispatch(
        addMinimizedChat({
          id: roomId,
          name: `Visitor ${roomDetails.visitorId}`,
          roomId: roomId,
        })
      );
    } else {
      return { needsFetch: true, roomId };
    }
  };
};

// Tag Management Action Creators
export const tagAssignedToChat = (
  payload: TagAssignedToChatActionPayloadType
): TagAssignedToChatActionType => ({
  type: TAG_ASSIGNED_TO_CHAT,
  payload,
});

export const tagUnassignedFromChat = (
  payload: TagUnassignedFromChatActionPayloadType
): TagUnassignedFromChatActionType => ({
  type: TAG_UNASSIGNED_FROM_CHAT,
  payload,
});

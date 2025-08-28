export const getChatMessagesForRoom = (
  state: RootReducerState,
  roomId: string
) => state.chat.chatMessages[roomId] || [];

export const getUnreadCountForRoom = (
  state: RootReducerState,
  roomId: string
) => state.chat.unreadCounts[roomId] || 0;

export const getTypingStateForRoom = (
  state: RootReducerState,
  roomId: string
) => state.chat.typingStates[roomId];

export const getActiveChat = (state: RootReducerState) =>
  state.chat.activeChatId;

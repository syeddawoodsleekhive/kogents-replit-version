import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAgentSocket } from "./useAgentSocket";
import { useChatEvents } from "./useChatEvents";
import { markMessagesRead } from "@/api/v2/chat";
import { useWindowFocus } from "./useWindowFocus";

export const useReadReceipts = (roomId: string) => {
  const { sendReadReceipts } = useAgentSocket({});
  const { getUnreadVisitorMessages } = useChatEvents();
  const dispatch: AppReducerDispatch = useDispatch();
  const { isFocused } = useWindowFocus();

  const joinedRooms = useSelector(
    (state: RootReducerState) => state.chat.joinedRooms
  );
  const activeChatId = useSelector(
    (state: RootReducerState) => state.chat.activeChatId
  );

  const isJoined = joinedRooms.includes(roomId);
  const isActive = activeChatId === roomId;

  const sendReadReceiptsForUnread = useCallback(() => {
    if (!isFocused || !isJoined || !isActive) return;

    const unreadMessages = getUnreadVisitorMessages(roomId);

    if (unreadMessages.length > 0) {
      const messages = unreadMessages.map((msg) => ({
        messageId: msg.messageId,
        senderId: msg.senderId,
      }));

      sendReadReceipts(roomId, messages);

      dispatch(
        markMessagesRead({
          roomId,
          messageIds: unreadMessages.map((msg) => msg.messageId),
        })
      );
    }
  }, [
    isFocused,
    isJoined,
    isActive,
    roomId,
    getUnreadVisitorMessages,
    sendReadReceipts,
    dispatch,
  ]);

  useEffect(() => {
    if (isJoined && isActive) {
      const timer = setTimeout(() => {
        sendReadReceiptsForUnread();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isActive, isJoined, isFocused, roomId]);

  return { sendReadReceiptsForUnread };
};

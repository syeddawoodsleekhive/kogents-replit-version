import { useRef } from "react";
import { useNotificationSound } from "@/hooks/usePlaySound";
import { isTabHidden, showNotificationOnce } from "@/utils/notification";
import { soundTypes } from "@/types/sound";

export function useChatNotifier(activeChatId?: string) {
  const initializedMessages = useRef<Set<string>>(new Set());

  const { play } = useNotificationSound();

  const notifyMessage = (
    chatId: string,
    userName: string,
    sender: string,
    timestamp: string | number,
    content: string,
    isVisitorLeft?: boolean
  ) => {
    const messageId = `${chatId}_${sender}_${timestamp}_${content}`;

    if (initializedMessages.current.has(messageId)) return;

    initializedMessages.current.add(messageId);

    const isFromUser = sender === "user" || isVisitorLeft;

    const vistorJoined =
      sender === "system" && content === "You have a new visitor waiting.";

    if (vistorJoined || isFromUser) {
      play(activeChatId === chatId ? soundTypes.message : soundTypes.alert);
    }

    if (isTabHidden() && (vistorJoined || isFromUser)) {
      showNotificationOnce(
        messageId,
        isVisitorLeft
          ? `${userName} has left the chat.`
          : vistorJoined
          ? `${userName} has arrived.`
          : `${userName} sent you a message`,
        {
          body: isVisitorLeft ? `${userName} has left the chat.` : content,
        }
      );
    }
  };

  return { notifyMessage };
}
